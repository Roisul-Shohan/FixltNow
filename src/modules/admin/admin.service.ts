import { prisma } from "../../lib/prisma";
import { buildFilterCondition } from "../../utils/filter";
import { calculatePagination } from "../../utils/pagination";
import { buildSearchCondition } from "../../utils/search";
import { adminFilterableFields, adminSearchableFields } from "./admin.constant";
import { Igetuser } from "./admin.interface";
import { UserWhereInput } from "../../../prisma/generated/prisma/models";

const getAllUsers = async (query : Igetuser) =>{

    const { searchTerm, ...filters } = query;

    const {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
    } = calculatePagination({
       page :query.page,
       limit : query.limit,
       sortBy: query.sortBy,
       sortOrder: query.sortOrder,
       
    });

    const andConditions = buildFilterCondition(
        filters, adminFilterableFields
    );

    const orCondition = buildSearchCondition(
        searchTerm, adminSearchableFields
    );

    const users = await prisma.user.findMany({

        where :{
            AND: [
                ...andConditions,
                orCondition
            ]
        },
        include :{
            technicianProfile :true,
        },

        skip,
        take: limit,
        orderBy: {
            [sortBy] : sortOrder,
        }        

    });

    const total =await prisma.user.count({
          where :{
            AND: [
                ...andConditions,
                orCondition
            ]
        }
    })

    return {
    meta: {
      page,
      limit,
      total,
    },

    data: users,
  };

}

export const AdminService = {
  getAllUsers,
};