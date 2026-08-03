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

export interface IgetBooking extends Prisma.BookingWhereInput {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortOrder?: "asc" | "desc";
  sortBy?: string;
}

export interface IgetService extends Omit<Prisma.ServiceWhereInput, "isActive"> {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortOrder?: "asc" | "desc";
  sortBy?: string;
  // isActive arrives as a string from the query layer; we coerce to boolean
  // inside getAllServicesForAdmin so we don't widen the Prisma type.
  isActive?: string;
}

export interface IgetReview extends Omit<Prisma.ReviewWhereInput, "rating"> {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortOrder?: "asc" | "desc";
  sortBy?: string;
  rating?: string | number;
}