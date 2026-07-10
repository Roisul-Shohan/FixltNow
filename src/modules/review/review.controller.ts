import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ReviewService } from "./review.service";
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

export const ReviewController = {
  createReview,
  getMyReviews
};