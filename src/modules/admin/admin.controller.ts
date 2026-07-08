import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AdminService } from "./admin.service";
import httpStatus from "http-status";


const getAllUsers = catchAsync(async (req, res) => {

    const {meta,data}=await AdminService.getAllUsers(req.query);
   
    sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Users retrieved successfully",
    meta: meta,
    data:data,
  });

});



export const AdminController = {
  getAllUsers,
};