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

export const TechnicianController = {
  getAllTechnicians,
};