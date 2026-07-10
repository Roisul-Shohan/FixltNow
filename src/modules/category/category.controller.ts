import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { CategoryService } from "./category.service.js";
import httpStatus from "http-status";

const getAllCategories = catchAsync(async (req, res) => {
  const result = await CategoryService.getAllCategories(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Categories retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});


const getCategoryById = catchAsync(async (req, res) => {
  const result = await CategoryService.getCategoryById(req.params?.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category retrieved successfully",
    data: result,
  });
});

export const CategoryController = {
    getAllCategories,
    getCategoryById,
}