import { PaymentStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";

export interface TCreatePayment {
  bookingId: string;
}

export interface IGetPayments extends Prisma.PaymentWhereInput {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  searchTerm?: string;
}