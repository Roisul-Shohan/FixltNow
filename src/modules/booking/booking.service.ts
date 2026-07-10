import httpStatus from "http-status";
import { IGetBookings, TCreateBooking } from "./booking.interface.js";
import { prisma } from "../../lib/prisma.js";
import AppError from "../../errors/AppErrors.js";
import { Prisma } from "@prisma/client";
import { calculatePagination, getPagination } from "../../utils/pagination.js";
import { buildFilterCondition } from "../../utils/filter.js";
import { bookingFilterableFields, bookingSearchableFields } from "./booking.constant.js";
import { buildSearchCondition } from "../../utils/search.js";
import { formatTime, formatDate } from "../../utils/formatDateTime.js";


const timeToMinutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);

  return hour! * 60 + minute!;
};

const minutesToTime = (minutes: number) => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
    2,
    "0"
  )}`;
};

const formatBooking = (booking: {
  id: string;
  bookingDate: Date;
  startTime: Date;
  endTime: Date;
  status: string;
  totalAmount: any;
  service: { id: string; title: string };
  technician: {
    id: string;
    user: { name: string; profileImage: string | null };
  };
}) => {
  const { service, technician, ...rest } = booking;
  return {
    ...rest,
    bookingDate: formatDate(booking.bookingDate),
    startTime: formatTime(booking.startTime),
    endTime: formatTime(booking.endTime),
    totalAmount: booking.totalAmount.toString(),
    service: {
      id: service.id,
      title: service.title,
    },
    technician: {
      id: technician.id,
      name: technician.user.name,
      profileImage: technician.user.profileImage,
    },
  };
};


const createBooking = async (
  customerId: string,
  payload: TCreateBooking
) => {   
    
    const customer = await prisma.user.findUnique({
        where: {
        id: customerId,
        },
    });

    if (!customer) {
        throw new AppError(httpStatus.NOT_FOUND, "Customer not found");
    }

    const service = await prisma.service.findUnique({
        where: {
          id: payload.serviceId,
        },
        include: {
           technician: true,
        },
    });

    if (!service) {
        throw new AppError(httpStatus.NOT_FOUND, "Service not found");
    }

    const bookingDate = new Date(payload.bookingDate);
    bookingDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 6);

    if (bookingDate < today || bookingDate > maxDate) {
        throw new AppError(
        httpStatus.BAD_REQUEST,
        "Booking is allowed only within the next 7 days."
        );
    }

    const availabilities = await prisma.availability.findMany({
        where: {
            technicianId: service.technicianId,
            date: bookingDate,
        },
    });

    const requestedStart = timeToMinutes(payload.startTime);
    const requestedEnd = timeToMinutes(payload.endTime);

    const matchedSlot = availabilities.find((slot) => {
        return (
        timeToMinutes(slot.startTime) <= requestedStart &&
        timeToMinutes(slot.endTime) >= requestedEnd
        );
    });

    if (!matchedSlot) {
        throw new AppError(
        httpStatus.BAD_REQUEST,
        "Selected time slot is unavailable."
        );
    }

    const durationMinutes = requestedEnd - requestedStart;

    if (durationMinutes <= 0) {
        throw new AppError(
        httpStatus.BAD_REQUEST,
        "Invalid booking duration."
        );
    }

    const chargedHours = Math.ceil(durationMinutes / 60);

    const totalAmount = chargedHours * Number(service.hourlyRate);

    const remainingSlots :Prisma.AvailabilityCreateManyInput[] = [];

    const slotStart = timeToMinutes(matchedSlot.startTime);
    const slotEnd = timeToMinutes(matchedSlot.endTime);

    if (requestedStart > slotStart) {
        remainingSlots.push({
        technicianId: service.technicianId,
        date: bookingDate,
        startTime: matchedSlot.startTime,
        endTime: minutesToTime(requestedStart),
        });
    }

    if (requestedEnd < slotEnd) {
        remainingSlots.push({
        technicianId: service.technicianId,
        date: bookingDate,
        startTime: minutesToTime(requestedEnd),
        endTime: matchedSlot.endTime,
        });
    }


    return prisma.$transaction(async (tx) => {

      const booking = await tx.booking.create({
        data: {
            customerId,

            technicianId: service.technicianId,

            serviceId: service.id,

            bookingDate,

            startTime: new Date(`${payload.bookingDate}T${payload.startTime}:00`),

            endTime: new Date(`${payload.bookingDate}T${payload.endTime}:00`),

            hourlyRate: new Prisma.Decimal(service.hourlyRate),

            totalAmount: new Prisma.Decimal(totalAmount),

            customerAddress: payload.customerAddress,
        },
      });

    await tx.availability.delete({
      where: {
        id: matchedSlot.id,
      },
    });

    if (remainingSlots.length > 0) {
      await tx.availability.createMany({
        data: remainingSlots,
      });
    }

    const found = await tx.booking.findUnique({
      where: {
        id: booking.id,
      },

      include: {
        service: {
          select: {
            id: true,
            title: true,
          },
        },

        technician: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    if (!found) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Booking not found after creation"
      );
    }

    return formatBooking(found);
  });
};


const getMyBookings = async (
  customerId: string,
  query: IGetBookings
) => {
  const { searchTerm, ...filters } = query;

  const {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  } = getPagination(query);

   const andConditions = buildFilterCondition(
    filters,
    bookingFilterableFields
  );

  const orCondition = buildSearchCondition(
    searchTerm,
    bookingSearchableFields
  );

   const whereConditions: any = {
    customerId,
    AND: [...andConditions],
  };

  if (orCondition.OR?.length) {
    whereConditions.AND.push(orCondition);
  }

  const bookings = await prisma.booking.findMany({
    where: whereConditions,

    select: {
      id: true,
      bookingDate: true,
      startTime: true,
      endTime: true,
      status: true,
      totalAmount: true,

      service: {
        select: {
          id: true,
          title: true,
        },
      },

      technician: {
        select: {
          id: true,
          user: {
            select: {
              name: true,
              profileImage: true,
            },
          },
        },
      },
    },

    skip,
    take: limit,

    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.booking.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },

    data: bookings.map(formatBooking),
  };
};

const getBookingById = async (
  customerId: string,
  bookingId: string
) => {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      customerId,
    },

    select: {
      id: true,

      bookingDate: true,
      startTime: true,
      endTime: true,

      hourlyRate: true,
      totalAmount: true,

      customerAddress: true,

      status: true,

      createdAt: true,

      service: {
        select: {
          id: true,
          title: true,
          description: true,
          hourlyRate: true,
          location: true,

          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },

      technician: {
        select: {
          id: true,
          bio: true,
          yearsOfExperience: true,
          averageRating: true,
          totalReviews: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              profileImage: true,
            },
          },
        },
      },

      payment: {
        select: {
          id: true,
          amount: true,
          status: true,
          paymentMethod: true,
          currency: true,
          stripePaymentIntentId: true,
          paidAt: true,
          createdAt: true,
        },
      },

      review: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      },
    },
  });

  if (!booking) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Booking not found"
    );
  }

  return booking;
};



    

export const BookingService = {
  createBooking,
  getMyBookings,
  getBookingById,
};