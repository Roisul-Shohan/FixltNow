import { CategoryWhereInput } from "../../../prisma/generated/prisma/models";

export interface IGetCategory  extends CategoryWhereInput{
  page?: string;
  limit?: string;

  searchTerm?: string;

  sortBy?: string;
  sortOrder?: "asc" | "desc";
}