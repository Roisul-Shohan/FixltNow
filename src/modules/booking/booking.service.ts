import httpStatus from "http-status";
import { TCreateBooking } from "./booking.interface";
import { prisma } from "../../lib/prisma";
import AppError from "../../errors/AppErrors";
import { Prisma } from "../../../prisma/generated/prisma/browser";


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

    return tx.booking.findUnique({
      where: {
        id: booking.id,
      },

      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },

        technician: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                profileImage: true,
              },
            },
          },
        },

        service: {
          include: {
            category: true,
          },
        },
      },
    });
  });
};


    

export const BookingService = {
  createBooking,
};