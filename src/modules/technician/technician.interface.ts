import { TechnicianProfileWhereInput } from "../../../prisma/generated/prisma/models";

export interface IGetTechnician extends TechnicianProfileWhereInput {
  page?: string;
  limit?: string;

  searchTerm?: string;
  rating?: string;

  sortBy?: string;
  sortOrder?: "asc" | "desc";
}