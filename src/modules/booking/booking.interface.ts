import { Prisma } from "@prisma/client";

export interface TCreateBooking {
  serviceId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  customerAddress: string;
}

export interface IGetBookings extends Prisma.BookingWhereInput {

  searchTerm?: string;

  "service.title"?: string;

  page?: string;
  limit?:string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  
}