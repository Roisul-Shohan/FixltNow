import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { AdminService } from "./admin.service.js";
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

const getAllBookings = catchAsync(async (req, res) => {
  const result = await AdminService.getAllBookings(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Bookings retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getDashboardStats = catchAsync(async (_req, res) => {
  const result = await AdminService.getDashboardStats();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Dashboard stats retrieved successfully",
    data: result,
  });
});

const getAllServicesForAdmin = catchAsync(async (req, res) => {
  const result = await AdminService.getAllServicesForAdmin(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Services retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getAllReviewsForAdmin = catchAsync(async (req, res) => {
  const result = await AdminService.getAllReviewsForAdmin(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Reviews retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});


export const AdminController = {
  getAllUsers,
  updateUserStatus,
  createCategory,
  getAllCategories,
  updateCategory,
  getAllBookings,
  getDashboardStats,
  getAllServicesForAdmin,
  getAllReviewsForAdmin,
};