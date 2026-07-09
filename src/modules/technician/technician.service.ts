import AppError from "../../errors/AppErrors";
import { prisma } from "../../lib/prisma";
import { buildFilterCondition } from "../../utils/filter";
import { calculatePagination } from "../../utils/pagination";
import { buildSearchCondition } from "../../utils/search";
import { technicianSearchableFields } from "./technician.constant";
import { IGetTechnician, TUpdateTechnicianProfile } from "./technician.interface";
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

  return technician;
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



export const TechnicianService = {
  getAllTechnicians,
  getTechnicianById,
  updateProfile,
};