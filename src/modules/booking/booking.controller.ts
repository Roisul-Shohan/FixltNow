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

export const BookingController = {
  createBooking,
};