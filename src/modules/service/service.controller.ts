import catchAsync from "../../utils/catchAsync";
import httpStatus from "http-status";
import sendResponse from "../../utils/sendResponse";
import { ServiceService } from "./service.service";

const createService = catchAsync(async (req, res) => {
  const userId: string = req.user?.id as string;

  const service = await ServiceService.createService({
    userId,
    ...req.body,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Service created successfully",
    data: service,
  });
});



export const ServiceController = {
  createService,
};