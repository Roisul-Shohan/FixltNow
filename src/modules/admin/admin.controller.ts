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
});

const createCategory = catchAsync (async (req , res )=>{

    const result = await AdminService.createCategory(req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Category created successfully",
        data: result,
    });

});

const getAllCategories = catchAsync(async (req, res) => {
  const result = await AdminService.getAllCategories(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Categories retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const updateCategory = catchAsync(async (req, res) => {
 
  const result = await AdminService.updateCategory(
    req.params?.id as string,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category updated successfully.",
    data: result,
  });
});


export const AdminController = {
  getAllUsers,
  updateUserStatus,
  createCategory,
  getAllCategories,
  updateCategory,
};