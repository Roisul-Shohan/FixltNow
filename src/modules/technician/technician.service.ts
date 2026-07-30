import { BookingStatus, PaymentStatus, Prisma } from "@prisma/client";
import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import { buildFilterCondition } from "../../utils/filter.js";
import { calculatePagination, getPagination } from "../../utils/pagination.js";
import { buildSearchCondition } from "../../utils/search.js";
import { validateSlots } from "../availibility/availability.utils.js";
import { AvailabilityService } from "../availibility/availibility.service.js";
import { technicianSearchableFields } from "./technician.constant.js";
import { IGetTechnician, TUpdateAvailability, TUpdateBookingStatus, TUpdateService, TUpdateTechnicianProfile } from "./technician.interface.js";
import httpStatus from 'http-status'
import { formatTime, formatDate } from "../../utils/formatDateTime.js";
import { bookingFilterableFields, bookingSearchableFields } from "../booking/booking.constant.js";


const getAllTechnicians = async (query: IGetTechnician) => {
  const { searchTerm, rating, yearsOfExperience, ...filters } = query;

  const {
    page,
    limit,
    sortBy,
    sortOrder,
    skip,
  } = getPagination(query);

  const andConditions = [];
  const orCondition = buildSearchCondition(searchTerm, technicianSearchableFields);

  if (rating) {
    andConditions.push({
      averageRating: {
        gte: Number(rating),
      },
    });
  }

  if (yearsOfExperience) {
    andConditions.push({
      yearsOfExperience: {
        gte :Number(yearsOfExperience),
      },
    });
  }

const technicians = await prisma.technicianProfile.findMany({
    where :{
        AND :[
            ... andConditions,
            orCondition,
        ]
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profileImage: true,
        },
      },

      service: {
        include: {
          category: true,
        },
      },
    },

    skip,
    take: limit,

    orderBy: {
      [sortBy]: sortOrder,
    },

});

 const total = await prisma.technicianProfile.count({
    where :{
        AND:[
            ... andConditions,
            orCondition
        ]
    }
 });

return {
    meta: {
      page,
      limit,
      total,
    },

    data: technicians,
  };
};

const formatTechnicianBooking = (booking: any) => ({
  ...booking,
  bookingDate: formatDate(booking.bookingDate),
  startTime: formatTime(booking.startTime),
  endTime: formatTime(booking.endTime),
  hourlyRate: booking.hourlyRate?.toString(),
  totalAmount: booking.totalAmount?.toString(),
});

const getMyBookings = async (
  userId: string,
  query: Record<string, any>
) => {
  const technicianProfile = await prisma.technicianProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!technicianProfile) {
    throw new AppError(httpStatus.NOT_FOUND, "Technician profile not found");
  }

  const { searchTerm, ...filters } = query;

  const { page, limit, skip, sortBy, sortOrder } = getPagination(query);

  const andConditions = buildFilterCondition(
    filters,
    bookingFilterableFields
  );

  const orCondition = buildSearchCondition(
    searchTerm,
    bookingSearchableFields
  );

  const andList: Prisma.BookingWhereInput[] = [...andConditions];
  if (orCondition.OR?.length) {
    andList.push(orCondition);
  }

  const whereConditions: Prisma.BookingWhereInput = {
    technicianId: technicianProfile.id,
    AND: andList,
  };

  const bookings = await prisma.booking.findMany({
    where: whereConditions,
    select: {
      id: true,
      bookingDate: true,
      startTime: true,
      endTime: true,
      hourlyRate: true,
      totalAmount: true,
      status: true,
      customerAddress: true,
      createdAt: true,
      service: {
        select: {
          id: true,
          title: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profileImage: true,
        },
      },
      payment: {
        select: {
          id: true,
          status: true,
          amount: true,
          paidAt: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await prisma.booking.count({
    where: whereConditions,
  });

  return {
    meta: { page, limit, total },
    data: bookings.map(formatTechnicianBooking),
  };
};

const getMyDashboard = async (userId: string) => {
  const technicianProfile = await prisma.technicianProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      averageRating: true,
      totalReviews: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profileImage: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!technicianProfile) {
    throw new AppError(httpStatus.NOT_FOUND, "Technician profile not found");
  }

  const technicianId = technicianProfile.id;

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    activeServicesCount,
    totalServicesCount,
    bookingStatusGroups,
    totalBookingsCount,
    completedBookingsCount,
    upcomingBookingsCount,
    totalEarningsAgg,
    thisMonthEarningsAgg,
    lastMonthEarningsAgg,
    recentBookings,
    upcomingBookings,
    recentReviews,
  ] = await Promise.all([
    prisma.service.count({ where: { technicianId, isActive: true } }),
    prisma.service.count({ where: { technicianId } }),
    prisma.booking.groupBy({
      by: ["status"],
      where: { technicianId },
      _count: { _all: true },
    }),
    prisma.booking.count({ where: { technicianId } }),
    prisma.booking.count({
      where: { technicianId, status: BookingStatus.COMPLETED },
    }),
    prisma.booking.count({
      where: {
        technicianId,
        status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.PAID] },
        bookingDate: { gte: today },
      },
    }),
    prisma.payment.aggregate({
      where: {
        booking: { technicianId },
        status: PaymentStatus.SUCCEEDED,
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        booking: { technicianId },
        status: PaymentStatus.SUCCEEDED,
        paidAt: { gte: startOfThisMonth },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        booking: { technicianId },
        status: PaymentStatus.SUCCEEDED,
        paidAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { amount: true },
    }),
    prisma.booking.findMany({
      where: { technicianId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        bookingDate: true,
        startTime: true,
        endTime: true,
        status: true,
        totalAmount: true,
        service: { select: { id: true, title: true } },
        customer: { select: { id: true, name: true, profileImage: true } },
      },
    }),
    prisma.booking.findMany({
      where: {
        technicianId,
        status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.PAID] },
        bookingDate: { gte: today },
      },
      orderBy: [{ bookingDate: "asc" }, { startTime: "asc" }],
      take: 5,
      select: {
        id: true,
        bookingDate: true,
        startTime: true,
        endTime: true,
        status: true,
        customerAddress: true,
        service: { select: { id: true, title: true } },
        customer: { select: { id: true, name: true, phone: true } },
      },
    }),
    prisma.review.findMany({
      where: { technicianId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        customer: { select: { id: true, name: true, profileImage: true } },
        service: { select: { id: true, title: true } },
      },
    }),
  ]);

  const bookingStatusBreakdown: Record<string, number> = {};
  for (const g of bookingStatusGroups) {
    bookingStatusBreakdown[g.status] = g._count._all;
  }

  const totalAmount = (agg: { _sum: { amount: any } } | null) =>
    Number(agg?._sum.amount ?? 0);

  const byMonthAgg = await prisma.payment.findMany({
    where: {
      booking: { technicianId },
      status: PaymentStatus.SUCCEEDED,
    },
    select: { paidAt: true, amount: true },
  });

  const monthlyMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, 0);
  }
  for (const p of byMonthAgg) {
    if (!p.paidAt) continue;
    const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, monthlyMap.get(key)! + Number(p.amount));
    }
  }
  const earningsByMonth = Array.from(monthlyMap.entries()).map(([month, amount]) => ({
    month,
    amount,
  }));

  const formatBooking = (b: any) => ({
    ...b,
    bookingDate: formatDate(b.bookingDate),
    startTime: formatTime(b.startTime),
    endTime: formatTime(b.endTime),
    totalAmount: b.totalAmount?.toString(),
  });

  return {
    profile: technicianProfile.user,
    technicianSince: technicianProfile.createdAt,
    summary: {
      totalServices: totalServicesCount,
      activeServices: activeServicesCount,
      totalBookings: totalBookingsCount,
      completedBookings: completedBookingsCount,
      upcomingBookings: upcomingBookingsCount,
      averageRating: technicianProfile.averageRating,
      totalReviews: technicianProfile.totalReviews,
    },
    bookingStatusBreakdown,
    earnings: {
      total: totalAmount(totalEarningsAgg),
      thisMonth: totalAmount(thisMonthEarningsAgg),
      lastMonth: totalAmount(lastMonthEarningsAgg),
      byMonth: earningsByMonth,
    },
    recentBookings: recentBookings.map(formatBooking),
    upcomingBookings: upcomingBookings.map(formatBooking),
    recentReviews,
  };
};

const getMyProfile = async (userId: string) => {
  const technician = await prisma.technicianProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profileImage: true,
          role: true,
          status: true,
          createdAt: true,
        },
      },
      service: {
        where: { isActive: true },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!technician) {
    throw new AppError(httpStatus.NOT_FOUND, "Technician profile not found");
  }

  const upcomingBookings = await prisma.booking.count({
    where: {
      technicianId: technician.id,
      status: { in: ["PENDING", "ACCEPTED", "PAID"] },
      bookingDate: { gte: new Date() },
    },
  });

  const totalEarnings = await prisma.payment.aggregate({
    where: {
      booking: {
        technicianId: technician.id,
      },
      status: PaymentStatus.SUCCEEDED,
    },
    _sum: {
      amount: true,
    },
  });

  return {
    ...technician,
    stats: {
      upcomingBookings,
      totalEarnings: totalEarnings._sum.amount ?? 0,
    },
  };
};

const getTechnicianById = async (id: string) => {
  const technician = await prisma.technicianProfile.findUnique({
    where: {
      id,
    },

    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profileImage: true,
        },
      },

      service: {
        where: {
          isActive: true,
        },

        include: {
          category: true,
        },
      },

      review: {
        orderBy: {
          createdAt: "desc",
        },

        include: {
          customer: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });

  if (!technician) {
    throw new AppError(httpStatus.NOT_FOUND, "Technician not found");
  }

  const availability =
  await AvailabilityService.getAvailability(id);


  return {
    technician,
    availability
  };
};

const getMyAvailability = async (userId: string) => {
  const technician = await prisma.technicianProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!technician) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Technician profile not found"
    );
  }

  const availability =
    await AvailabilityService.getAvailability(technician.id);

  // Group slots by date (YYYY-MM-DD) for easier client rendering
  const grouped = availability.reduce<
    Record<string, { startTime: string; endTime: string }[]>
  >((acc, slot) => {
    const key = slot.date.toISOString().split("T")[0]!;
    if (!acc[key]) acc[key] = [];
    acc[key]!.push({
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
    return acc;
  }, {});

  const schedule = Object.entries(grouped)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, slots]) => ({
      date,
      slots,
    }));

  return {
    technicianId: technician.id,
    schedule,
  };
};

const getMyReviews = async (userId: string, query: Record<string, unknown>) => {
  const technician = await prisma.technicianProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!technician) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Technician profile not found"
    );
  }

  const { page, limit, skip, sortBy, sortOrder } = getPagination(query);

  const where: Prisma.ReviewWhereInput = {
    technicianId: technician.id,
  };

  const [reviews, total, aggregate] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        service: {
          select: {
            id: true,
            title: true,
          },
        },
        booking: {
          select: {
            id: true,
            bookingDate: true,
          },
        },
      },
    }),
    prisma.review.count({ where }),
    prisma.review.aggregate({
      where,
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  const meta = {
    page,
    limit,
    total,
  };

  return {
    data: reviews,
    meta,
    stats: {
      averageRating: aggregate._avg.rating ?? 0,
      totalReviews: aggregate._count._all,
    },
  };
};

const updateProfile = async (userId :string ,payload :TUpdateTechnicianProfile)=>{
    
    const {name,phone,profileImage,bio,yearsOfExperience}=payload;

    const technician = await prisma.technicianProfile.findUnique({
        where : {userId}
    });

    if(!technician){
        throw new AppError(httpStatus.NOT_FOUND, "Technician not found");
    }

  const userData: Record<string, any> = {};
  const technicianData: Record<string, any> = {};

  if (name !== undefined) userData.name = name;
  if (phone !== undefined) userData.phone = phone;
  if (profileImage !== undefined)
    userData.profileImage = profileImage;

  if (bio !== undefined)
    technicianData.bio = bio;

  if (yearsOfExperience !== undefined)
    technicianData.yearsOfExperience = yearsOfExperience;

  const result = await prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length > 0) {
      await tx.user.update({
        where: {
          id: userId,
        },
        data: userData,
      });
    }

    if (Object.keys(technicianData).length > 0) {
      await tx.technicianProfile.update({
        where: {
          userId,
        },
        data: technicianData,
      });
    }

    return await tx.technicianProfile.findUnique({
      where: {
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
            role: true,
            status: true,
          },
        },
      },
    });
  });

  return result;

}

const updateAvailability = async (
  userId: string,
  payload: TUpdateAvailability
) => {

  const technicianProfile = await prisma.technicianProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!technicianProfile) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Technician profile not found"
    );
  }

  const technicianId = technicianProfile.id;

  validateSlots(payload.slots);

  const today = new Date();
  today.setHours(0,0,0,0);

  const selectedDate = new Date(payload.date);
  selectedDate.setHours(0,0,0,0);

  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 6);

  if (
    selectedDate < today ||
    selectedDate > maxDate
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You can update only today and the next 6 days."
    );
  }

  await prisma.$transaction(async (tx) => {

    await tx.availability.deleteMany({
      where: {
        technicianId,
        date: selectedDate,
      },
    });

    if (payload.slots.length === 0) {
      return;
    }

    await tx.availability.createMany({
      data: payload.slots.map((slot) => ({
        technicianId,
        date: selectedDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    });
  });

  return prisma.availability.findMany({
    where: {
      technicianId,
      date: selectedDate,
    },
    orderBy: {
      startTime: "asc",
    },
  });
};

const updateBookingStatus = async (
  technicianUserId: string,
  bookingId: string,
  payload: TUpdateBookingStatus
) => {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      technician: {
        userId: technicianUserId,
      },
    },
    include: {
      payment: true,
    },
  });

  if (!booking) {
    throw new AppError( httpStatus.NOT_FOUND,  "Booking not found." );
  }

  if (booking.status !== "PENDING") {  throw new AppError(  httpStatus.BAD_REQUEST, 
       "Only pending bookings can be updated." );
  }

  const updatedBooking = await prisma.booking.update({
    where: {
      id: booking.id,
    },
    data: {
      status: payload.status,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      service: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return updatedBooking;
};

const completeBooking = async( userId :string , bookingId :string) =>{

   const booking =await prisma.booking.findFirst({
     where :{
      id :bookingId,
      technician :{
        userId
      }
     },
     include :{
      payment : true,
     }
   });

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND,"Booking not found." );
  }

  if (booking.status !== BookingStatus.PAID) {
    throw new AppError(httpStatus.BAD_REQUEST, "Only paid bookings can be marked as completed.");
  }

  if ( !booking.payment || booking.payment.status !== PaymentStatus.SUCCEEDED) {
    throw new AppError(httpStatus.BAD_REQUEST, "Payment has not been completed.");
  }

    const updatedBooking = await prisma.booking.update({
    where: {
      id: booking.id,
    },
    data: {
      status: BookingStatus.COMPLETED,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      service: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return updatedBooking;
};

const updateService = async (userId: string,serviceId: string,payload: TUpdateService
) => {
  const technician = await prisma.technicianProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!technician) {
    throw new AppError( httpStatus.NOT_FOUND,"Technician profile not found.");
  }

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      technicianId: technician.id,
    },
  });

  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, "Service not found." );
  }

  if (payload.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: payload.categoryId,
        isActive: true,
      },
    });

    if (!category) {
      throw new AppError(httpStatus.NOT_FOUND,"Category not found.");
    }
  }

  const result = await prisma.service.update({
    where: {
      id: serviceId,
    },
    data: payload,
    include: {
      category: true,
      technician: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });

  return result;
};

const deleteService = async (userId: string,serviceId: string
) => {
  const technician = await prisma.technicianProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!technician) { 
    throw new AppError(httpStatus.NOT_FOUND, "Technician profile not found."  );
  }

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      technicianId: technician.id,
    },
  });

  if (!service) {
    throw new AppError( httpStatus.NOT_FOUND,"Service not found");
  }

  const bookingExists = await prisma.booking.findFirst({
    where: {
      serviceId,
      status: {
        in: [
          "PENDING",
          "ACCEPTED",
          "PAID",
        ],
      },
    },
  });

  if (bookingExists) {
    throw new AppError(httpStatus.BAD_REQUEST,"Service cannot be deleted because it has active bookings");
  }

  await prisma.service.delete({
    where: {
      id: serviceId,
    },
  });

  return null;
};







export const TechnicianService = {
  getAllTechnicians,
  getMyProfile,
  getMyDashboard,
  getMyAvailability,
  getMyBookings,
  getMyReviews,
  getTechnicianById,
  updateProfile,
  updateAvailability,
  updateBookingStatus,
  completeBooking,
  updateService,
  deleteService
};