import { Prisma } from "@prisma/client";

export interface IGetCategory  extends Prisma.CategoryWhereInput{
  page?: string;
  limit?: string;

  searchTerm?: string;

  sortBy?: string;
  sortOrder?: "asc" | "desc";
}