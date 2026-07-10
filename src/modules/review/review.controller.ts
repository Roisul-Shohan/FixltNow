import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { ReviewService } from "./review.service.js";
import httpStatus from "http-status";

const createReview = catchAsync(async (req, res) => {

  
  const result = await ReviewService.createReview(
    req.user?.id as string,
    req.body 
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Review submitted successfully.",
    data: result,
  });

});

const getMyReviews = catchAsync(async (req, res) => {
  const result = await ReviewService.getMyReviews(
    req.user?.id as string,
    req.query
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Reviews retrieved successfully.",
    data: result.data,
    meta: result.meta,
  });
});

const getServiceReviews = catchAsync(async (req, res) => {
  const result = await ReviewService.getServiceReviews(req.params.serviceId as string,req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reviews retrieved successfully.",
    meta: result.meta,
    data: result.data,
  });
});


const getTechnicianReviews = catchAsync(async (req, res) => {
  const result = await ReviewService.getTechnicianReviews(req.params.technicianId as string,req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Technician reviews retrieved successfully.",
    meta: result.meta,
    data: result.data,
    
  });
});

const updateReview = catchAsync(async (req, res) => {
  const result = await ReviewService.updateReview(
    req.user?.id as string,
    req.params.id as string,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Review updated successfully.",
    data: result,
  });
});

const deleteReview = catchAsync(async (req, res) => {
  await ReviewService.deleteReview(
    req.user?.id as string,
    req.params?.id as string
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Review deleted successfully.",
    data: null,
  });
});

export const ReviewController = {
  createReview,
  getMyReviews,
  getServiceReviews,
  getTechnicianReviews,
  updateReview,
  deleteReview,
};