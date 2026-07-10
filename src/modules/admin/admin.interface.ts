import { CategoryWhereInput, UserWhereInput } from "../../../prisma/generated/prisma/models";

export interface Igetuser extends UserWhereInput{
    searchTerm?: string
    page?: string
    limit?: string
    sortOrder?: "asc"|"desc"
    sortBy?: string

}

export interface IgetCategory extends CategoryWhereInput{
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