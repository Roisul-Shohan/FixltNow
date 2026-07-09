import { prisma } from "../../lib/prisma";
import { buildFilterCondition } from "../../utils/filter";
import { calculatePagination } from "../../utils/pagination";
import { buildSearchCondition } from "../../utils/search";
import { technicianSearchableFields } from "./technician.constant";
import { IGetTechnician } from "./technician.interface";

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



export const TechnicianService = {
  getAllTechnicians,
};