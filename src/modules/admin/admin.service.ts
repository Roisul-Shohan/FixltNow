import { prisma } from "../../lib/prisma";
import { buildFilterCondition } from "../../utils/filter";
import { calculatePagination, getPagination } from "../../utils/pagination";
import { buildSearchCondition } from "../../utils/search";
import { categoryFilterableFields, categorySearchableFields, userFilterableFields, userSearchableFields } from "./admin.constant";
import { ICategory, IgetCategory, Igetuser, TUpdateCategory } from "./admin.interface";
import { UserWhereInput } from "../../../prisma/generated/prisma/models";
import { UserStatus } from "../../../prisma/generated/prisma/enums";
import httpStatus from "http-status";
import AppError from "../../errors/AppErrors";
import { SortOrder } from "../../../prisma/generated/prisma/internal/prismaNamespace";

const getAllUsers = async (query : Igetuser) =>{

    const { searchTerm, ...filters } = query;

    const {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
    } = getPagination(query);

    const andConditions = buildFilterCondition(
        filters, userFilterableFields
    );

    const orCondition = buildSearchCondition(
        searchTerm, userSearchableFields
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
        omit :{
            password : true,
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

const createCategory = async (payload :ICategory) =>{
    
    const existingCategory = await prisma.category.findUnique({
        where :{
            name : payload.name
        }
    });

    if(existingCategory){
        throw new AppError(httpStatus.CONFLICT,"Category already exists");
    }

    const category = await prisma.category.create({
      data: payload,
    });

    return category;
}

const getAllCategories = async ( query :IgetCategory) =>{

    const {searchTerm , isActive,...filters }= query;


    const {
        page,
        limit,
        sortBy,
        sortOrder,
        skip,
    } = getPagination(query);

    const andConditions = buildFilterCondition(filters,categoryFilterableFields);
    const orCondition = buildSearchCondition (searchTerm,categorySearchableFields);
    if (typeof isActive === "string") {
        andConditions.push({
            isActive: isActive === "true",
        });
        } else if (typeof isActive === "boolean") {
        andConditions.push({
            isActive,
        });
    }

    const categories = await prisma.category.findMany({
        where:{
            AND :[
                ... andConditions,
                orCondition
            ]
        },

        skip,
        take : limit,
        orderBy : {
            [sortBy]:sortOrder,
        }
    });

    const total = await prisma.category.count({
        where :{
            AND :[
                ...andConditions,
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

const updateCategory = async (id: string, payload: TUpdateCategory
) => {
  const category = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND,"Category not found.");
  }

  if (payload.name) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: payload.name,
          mode: "insensitive",
        },
        NOT: {
          id,
        },
      },
    });

    if (existingCategory) {
        throw new AppError( httpStatus.BAD_REQUEST, "Category name already exists." );
    }
  }

  const result = await prisma.category.update({
    where: {
      id,
    },
    data: payload,
  });

  return result;
};




export const AdminService = {
  getAllUsers,
  updateUserStatus,
  createCategory,
  getAllCategories,
  updateCategory,
};