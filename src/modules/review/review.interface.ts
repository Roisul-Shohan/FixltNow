import { ReviewWhereInput } from "../../../prisma/generated/prisma/models";

export interface TCreateReview {
  bookingId: string;
  rating: number;
  comment?: string;
}

export interface IGetReviews extends ReviewWhereInput{
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";

  searchTerm?: string;

  rating?: number;
}

export interface IServiceReview extends ReviewWhereInput{
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
