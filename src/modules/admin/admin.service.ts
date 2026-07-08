import { prisma } from "../../lib/prisma";
import { buildFilterCondition } from "../../utils/filter";
import { calculatePagination } from "../../utils/pagination";
import { buildSearchCondition } from "../../utils/search";
import { adminFilterableFields, adminSearchableFields } from "./admin.constant";
import { Igetuser } from "./admin.interface";
import { UserWhereInput } from "../../../prisma/generated/prisma/models";
import { UserStatus } from "../../../prisma/generated/prisma/enums";
import httpStatus from "http-status";
import AppError from "../../errors/AppErrors";

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

const updateUserStatus = async (
    id :string,
    status : UserStatus
) =>{

    const user = await prisma.user.findUnique({
        where :{id}
    });

    if(!user){
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.role === "ADMIN") {
        throw new AppError(
        httpStatus.BAD_REQUEST,
        "Admin status cannot be changed"
        );
    }

    const updateUser = await prisma.user.update({
        where :{id},
        data :{
            status,
        },
        include:{
            technicianProfile:true
        },
        omit :{
            password:true
        }
    });

    return updateUser;
}

export const AdminService = {
  getAllUsers,
  updateUserStatus,
};