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

const updateUserStatus = catchAsync (async (req, res )=>{
    const {id}=req.params;
    const {status}= req.body;

    const updateUser = await AdminService.updateUserStatus(id as string ,status);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User status updated successfully",
        data: updateUser,
    });
})



export const AdminController = {
  getAllUsers,
  updateUserStatus
};