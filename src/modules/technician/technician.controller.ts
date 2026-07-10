import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BookingService } from "../booking/booking.service";
import { TechnicianService } from "./technician.service";
import httpStatus from "http-status";



const getAllTechnicians = catchAsync(async (req, res) => {
  const result = await TechnicianService.getAllTechnicians(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Technicians retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getTechnicianById = catchAsync(async (req, res) => {
  const result = await TechnicianService.getTechnicianById(
    req.params?.id as string
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Technician retrieved successfully",
    data: result,
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const result = await TechnicianService.updateProfile(
    req.user?.id as string,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Profile updated successfully",
    data: result,
  });
});


const updateAvailability = catchAsync(async (req, res) => {
  const result = await TechnicianService.updateAvailability(
    req.user?.id as string,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Availability updated successfully",
    data: result,
  });
});

const updateBookingStatus = catchAsync(async (req, res) => {
  const result = await TechnicianService.updateBookingStatus
  (
    req.user?.id as string,
    req.params.id as string,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Booking status updated successfully.",
    data: result,
  });
});

const completeBooking = catchAsync(async (req, res) => {
  const result = await TechnicianService.completeBooking(
    req.user?.id as string,
    req.params.id as string
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Booking marked as completed successfully.",
    data: result,
  });
});


const updateService = catchAsync(async (req, res) => {
  const result = await TechnicianService.updateService(
    req.user?.id as string,
    req.params?.id as string,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Service updated successfully.",
    data: result,
  });
});

const deleteService = catchAsync(async (req, res) => {
  await TechnicianService.deleteService(
    req.user?.id as string ,
    req.params?.id as string
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Service deleted successfully.",
    data: null,
  });
});


export const TechnicianController = {
  getAllTechnicians,
  getTechnicianById,
  updateProfile,
  updateAvailability,
  updateBookingStatus,
  completeBooking,
  updateService,
  deleteService,
};