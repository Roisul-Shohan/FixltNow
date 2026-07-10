import express from "express";
import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { PaymentValidation } from "./payment.validation.js";
import { UserRole } from "@prisma/client";
import { PaymentController } from "./payment.controller.js";

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

router.get(
  "/",
  auth(UserRole.CUSTOMER),
  PaymentController.getMyPayments
);

router.get(
  "/:id",
  auth(UserRole.CUSTOMER),
  PaymentController.getPaymentById
);

export const PaymentRoutes = router;