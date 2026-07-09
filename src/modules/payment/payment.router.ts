import express from "express";
import { Router } from "express";
import { auth } from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { PaymentValidation } from "./payment.validation";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { PaymentController } from "./payment.controller";

const router =Router();

router.post(
  "/create",
  auth(UserRole.CUSTOMER),
  validateRequest(PaymentValidation.createPaymentSchema),
  PaymentController.createPaymentSession
);

router.post(
  "/confirm",
  express.raw({ type: "application/json" }),
  PaymentController.confirmPayment
);

export const PaymentRoutes = router;