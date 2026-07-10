import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync.js";
import { PaymentService } from "./payment.service.js";
import sendResponse from "../../utils/sendResponse.js";

const createPaymentSession = catchAsync(async (req, res) => {
  const result = await PaymentService.createPaymentSession(
    req.user?.id as string,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Checkout session created successfully.",
    data: result,
  });
});

const confirmPayment = catchAsync(async (req, res) => {
  const result = await PaymentService.confirmPayment(
    req.body,
    req.headers["stripe-signature"] as string
  );

  res.status(200).json(result);
});

const getMyPayments = catchAsync(async (req, res) => {
  const result = await PaymentService.getMyPayments(
    req.user?.id as string,
    req.query
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payments retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getPaymentById = catchAsync(async (req, res) => {

  const result = await PaymentService.getPayentById
  (
    req.user?.id  as string,
    req.params.id as string,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment retrieved successfully",
    data: result,
  });
});

export const PaymentController = {
  createPaymentSession,
  confirmPayment,
  getMyPayments,
  getPaymentById,
};

