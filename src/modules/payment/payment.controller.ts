import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import { PaymentService } from "./payment.service";
import sendResponse from "../../utils/sendResponse";

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

export const PaymentController = {
  createPaymentSession,
  confirmPayment,
};