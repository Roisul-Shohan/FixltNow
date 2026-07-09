import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
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

export const TechnicianController = {
  getAllTechnicians,
  getTechnicianById,
};