import { prisma } from "../../lib/prisma";
import { calculatePagination } from "../../utils/pagination";
import { buildSearchCondition } from "../../utils/search";
import { categorySearchableFields } from "./category.constant";
import { IGetCategory } from "./category.interface";

const getAllCategories = async (query: IGetCategory) => {
  const { searchTerm } = query;

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

export const CategoryService = {
    getAllCategories,
}
