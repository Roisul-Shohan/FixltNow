import { TechnicianProfileWhereInput } from "../../../prisma/generated/prisma/models";

export interface IGetTechnician extends TechnicianProfileWhereInput {
  page?: string;
  limit?: string;

  searchTerm?: string;
  rating?: string;

  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface TUpdateTechnicianProfile {
  name?: string;
  phone?: string;
  profileImage?: string;

  bio?: string;
  yearsOfExperience?: number;
}

export interface TUpdateAvailability {
  date: string;
  slots: {
    startTime: string;
    endTime: string;
  }[];
}