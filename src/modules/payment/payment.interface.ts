import { PaymentStatus } from "../../../prisma/generated/prisma/enums";
import { PaymentWhereInput } from "../../../prisma/generated/prisma/models";

export interface TCreatePayment {
  bookingId: string;
}

export interface IGetPayments extends PaymentWhereInput{
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  searchTerm?: string;
}