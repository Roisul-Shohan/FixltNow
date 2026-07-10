import { get } from "node:http";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BookingService } from "./booking.service";
import httpStatus from "http-status";


const createBooking = catchAsync(async (req, res) => {
  const result = await BookingService.createBooking(
    req.user?.id as string,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Booking created successfully",
    data: result,
  });
});

const getMyBookings = catchAsync(async (req, res) => {
 
  const result = await BookingService.getMyBookings(
    req.user?.id as string,
    req.query
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Bookings retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});


const getBookingById = catchAsync(async (req, res) => {
  const result = await BookingService.getBookingById(
    req.user?.id as string,
    req.params?.id as string
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Booking retrieved successfully",
    data: result,
  });
});


export const BookingController = {
  createBooking,
  getMyBookings,
  getBookingById,
};