import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import { calculatePagination, getPagination } from "../../utils/pagination.js";
import { buildSearchCondition } from "../../utils/search.js";
import { categorySearchableFields } from "./category.constant.js";
import { IGetCategory } from "./category.interface.js";
import httpStatus from "http-status";


const getAllCategories = async (query: IGetCategory) => {
  const { searchTerm } = query;

  const {
    page,
    limit,
    sortBy,
    sortOrder,
    skip,
  } = getPagination(query);

  const orCondition = buildSearchCondition(searchTerm,categorySearchableFields);

  const categories = await prisma.category.findMany({
    where :{
        AND :[
            {
                isActive :true,
            },
            orCondition
        ]
    },
    skip,
    take: limit,

    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.category.count({
    where :{
        AND :[{
            isActive :true,
        },
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

    data: categories,
  };

}

const getCategoryById = async (id : string )=>{

    const category = await prisma.category.findUnique({
   
    where: {
      id,
      isActive: true,
    },

    include: {
      service: {
        where: {
          isActive: true,
        },

        orderBy: {
          createdAt: "desc",
        },

        include: {
          technician: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  profileImage: true,
                  phone: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND,"Category not found" );
  }

  return category;
};


export const CategoryService = {
    getAllCategories,
    getCategoryById
}
