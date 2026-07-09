
import AppError from "../../errors/AppErrors";
import { prisma } from "../../lib/prisma";
import { ICreateService } from "./service.interface";
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








export const ServiceService = {
  createService,
};