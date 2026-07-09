import { BookingWhereInput } from "../../../prisma/generated/prisma/models";

export interface TCreateBooking {
  serviceId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  customerAddress: string;
}

export interface IGetBookings extends BookingWhereInput {

  searchTerm?: string;

  "service.title"?: string;

  page?: string;
  limit?:string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  
}