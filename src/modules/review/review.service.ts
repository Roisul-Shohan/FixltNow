import { Prisma } from "../../../prisma/generated/prisma/client";
import { BookingStatus } from "../../../prisma/generated/prisma/enums";
import AppError from "../../errors/AppErrors";
import { prisma } from "../../lib/prisma";
import { buildFilterCondition } from "../../utils/filter";
import { calculatePagination } from "../../utils/pagination";
import { buildSearchCondition } from "../../utils/search";
import { reviewFilterableFields, reviewSearchableFields } from "./review.constant";
import { IGetReviews, IServiceReview, TCreateReview } from "./review.interface";
import httpStatus from "http-status";


const createReview = async (userId:string ,payload : TCreateReview) =>{

    const {rating ,bookingId,comment}=payload;

    const booking = await prisma.booking.findFirst ({
        where :{
            id :bookingId,
            customerId: userId,
        },
        include :{
            review :true,
        }
    });

    if(!booking) {
        throw new AppError(httpStatus.NOT_FOUND,"Booking not found ");
    }

    if(booking.status !== BookingStatus.COMPLETED) {
        throw new AppError(httpStatus.BAD_REQUEST,"You can only review completed booking");
    }

    if(booking.review){
        throw new AppError(httpStatus.BAD_REQUEST, "review already exists");
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) =>{
        
        const review = await tx.review.create({
         data:{
            bookingId,
            customerId : userId,
            technicianId: booking.technicianId,
            serviceId: booking.serviceId,
            rating,
            comment,
           },
        });

        const technicianStats = await tx.review.aggregate({
            where :{
                technicianId : booking.technicianId,
            },
            _avg :{
                rating :true,
            },
            _count :{
                rating :true,
            }
        });

        await tx.technicianProfile.update({
            where: {
                id: booking.technicianId,
            },
            data: {
                averageRating: technicianStats._avg.rating ?? 0,
                totalReviews: technicianStats._count.rating,
            },
        });

        const serviceStats = await tx.review.aggregate({
            where: {
                serviceId: booking.serviceId,
            },
            _avg: {
                rating: true,
            },
            _count: {
                rating: true,
            },
        });

        await tx.service.update({
            where: {
                id: booking.serviceId,
            },
            data: {
                averageRating: serviceStats._avg.rating ?? 0,
                totalReviews: serviceStats._count.rating,
            },
        });

    return review;

    });

    return result ;

} 

const getMyReviews = async(userId : string,query : IGetReviews) =>{

    const {searchTerm, ...filters}=query;

    const {
        page,
        limit,
        skip,
        sortBy,
        sortOrder,
      } = calculatePagination({
        page:query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

    const andConditions = buildFilterCondition(
        filters,
        reviewFilterableFields
    );

    const orCondition = buildSearchCondition(
        searchTerm,
        reviewSearchableFields
    );

    const reviews = await prisma.review.findMany({
        where :{
            AND :[
                ... andConditions,
                orCondition
            ]
        },

        select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,

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

    const total =await prisma.review.count({
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

    data: reviews,
  }; 

    
}

const getServiceReviews = async (serviceId: string,query :IServiceReview) => {
  
    const service = await prisma.service.findUnique({
    where: {
      id: serviceId,
    },
  });

  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, "Service not found.");
  }

   const {
        page,
        limit,
        skip,
        sortBy,
        sortOrder,
      } = calculatePagination({
        page:query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

  const reviews = await prisma.review.findMany({
    where: {
      serviceId,
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
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder
        ? {
            [sortBy]: sortOrder,
          }
        : {
            createdAt: "desc",
          },
  });
   const total = await prisma.review.count({
    where: {serviceId },
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: reviews,
  };

};

const getTechnicianReviews = async (technicianId: string,query :IServiceReview) => {
  
    const technician = await prisma.technicianProfile.findUnique({
        where: {
            id: technicianId,
        },
    });

  if (!technician) {
    throw new AppError(httpStatus.NOT_FOUND, "Technician not found.");
  }

   const {
        page,
        limit,
        skip,
        sortBy,
        sortOrder,
      } = calculatePagination({
        page:query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

  const reviews = await prisma.review.findMany({
    where: {
      technicianId,
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
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder
        ? {
            [sortBy]: sortOrder,
          }
        : {
            createdAt: "desc",
          },
  });

   const total = await prisma.review.count({
    where: {technicianId },
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: reviews,
  };

};



export const ReviewService = {
  createReview,
  getMyReviews,
  getServiceReviews,
  getTechnicianReviews,
};