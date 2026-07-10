
import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import { buildFilterCondition } from "../../utils/filter.js";
import { calculatePagination, getPagination } from "../../utils/pagination.js";
import { buildSearchCondition } from "../../utils/search.js";
import { serviceFilterableFields, serviceSearchableFields, MINIMUM_HOURLY_RATE } from "./service.constant.js";
import { ICreateService, IgetService } from "./service.interface.js";
import httpStatus from "http-status";

const createService = async (payload : ICreateService) =>{
    
    const {userId,categoryId,title,description,hourlyRate,location}=payload;

    const technician = await  prisma.technicianProfile.findUnique({
        where:{
            userId 
        }
    });

    if(!technician){
        throw new AppError(httpStatus.NOT_FOUND,"Technician profile not found");
    }

    const category = await prisma.category.findUnique({
        where: {
        id:categoryId,
        },
    });

    if(!category || !category.isActive){
        throw new AppError(httpStatus.NOT_FOUND,"Category not found");
    }

    const existingService = await prisma.service.findFirst({
        where : {
            technicianId :technician.id,
            categoryId,
            title :{
                equals :title,
                mode :"insensitive"
            }
        }
    });


    if(existingService){
        throw new AppError(httpStatus.CONFLICT,"You alrady offer this service")
    }

    if (hourlyRate < MINIMUM_HOURLY_RATE) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Hourly rate must be at least ${MINIMUM_HOURLY_RATE}.`
        );
    }

    const service = await prisma.service.create({
        data :{
            technicianId :technician.id,
            categoryId,
            title,
            description,
            location,
            hourlyRate,
            averageRating: 0,
        },
        include :{
            category :true,
            technician :{
                include :{
                    user :{
                        select :{
                            id :true,
                            name : true ,
                            email : true,
                        }
                    }
                }
            }
        }
    })

return service;

}



const getAllServices = async(query : IgetService) =>{

    const {searchTerm,rating ,... filters}=query;

    const {
            page,
            limit,
            sortBy,
            sortOrder,
            skip,
        } = getPagination(query);

    let andConditions =buildFilterCondition(filters,serviceFilterableFields);
    let orCondition = buildSearchCondition(searchTerm,serviceSearchableFields);

    if (rating) {
        andConditions.push({
            averageRating: {
                gte: Number(rating),
            },
        });
    }

    const services = await prisma.service.findMany({
        where:{
            AND :[
                ... andConditions,
                orCondition
            ]
        },

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
    skip,
    take : limit ,
    orderBy :{
        [sortBy] : sortOrder
    },

    });

    const total = await prisma.service.count({
        where :{
            AND :[
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

    data: services,
  };
};




export const ServiceService = {
  createService,
  getAllServices,
};