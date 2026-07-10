import { Prisma } from "@prisma/client";

export interface TCreateReview {
  bookingId: string;
  rating: number;
  comment?: string;
}

export interface IGetReviews extends Prisma.ReviewWhereInput {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";

  searchTerm?: string;

  rating?: number;
}

export interface IServiceReview extends Prisma.ReviewWhereInput {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  rating?: number;
}

export interface TUpdateReview {
  rating?: number;
  comment?: string;
}
