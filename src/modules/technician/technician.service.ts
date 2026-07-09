import { BookingStatus, PaymentStatus } from "../../../prisma/generated/prisma/enums";
import AppError from "../../errors/AppErrors";
import { prisma } from "../../lib/prisma";
import { buildFilterCondition } from "../../utils/filter";
import { calculatePagination } from "../../utils/pagination";
import { buildSearchCondition } from "../../utils/search";
import { validateSlots } from "../availibility/availability.utils";
import { AvailabilityService } from "../availibility/availibility.service";
import { technicianSearchableFields } from "./technician.constant";
import { IGetTechnician, TUpdateAvailability, TUpdateBookingStatus, TUpdateTechnicianProfile } from "./technician.interface";
import httpStatus from 'http-status'


const getAllTechnicians = async (query: IGetTechnician) => {
  const { searchTerm, rating, yearsOfExperience, ...filters } = query;

  const {
    page,
    limit,
    sortBy,
    sortOrder,
    skip,
  } = calculatePagination({
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

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







export const TechnicianService = {
  getAllTechnicians,
  getTechnicianById,
  updateProfile,
  updateAvailability,
  updateBookingStatus,
  completeBooking,
};