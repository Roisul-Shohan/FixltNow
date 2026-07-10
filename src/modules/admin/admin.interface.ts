import { Prisma } from "@prisma/client";

export interface Igetuser extends Prisma.UserWhereInput {
    searchTerm?: string
    page?: string
    limit?: string
    sortOrder?: "asc"|"desc"
    sortBy?: string

}

export interface IgetCategory extends Prisma.CategoryWhereInput {
    searchTerm?: string
    page?: string
    limit?: string
    sortOrder?: "asc"|"desc"
    sortBy?: string 
}


export interface ICategory{
    name : string
    description ? : string
}

export type TUpdateCategory = {
  name?: string;
  description?: string;
  isActive?: boolean;
};