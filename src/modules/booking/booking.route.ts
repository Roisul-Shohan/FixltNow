import express from "express";
import { auth } from "../../middlewares/auth.js";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest.js";
import { createBookingSchema } from "./bookingValidation.js";
import { BookingController } from "./booking.controller.js";

const router = express.Router();

router.post(
  "/",
  auth(UserRole.CUSTOMER),
  validateRequest(createBookingSchema),
  BookingController.createBooking
);

router.get(
  "/",
  auth(UserRole.CUSTOMER),
  BookingController.getMyBookings
);

router.get(
  "/me/dashboard",
  auth(UserRole.CUSTOMER),
  BookingController.getMyDashboard
);

router.get(
  "/:id",
  auth(UserRole.CUSTOMER),
  BookingController.getBookingById
);

router.patch(
  "/:id/cancel",
  auth(UserRole.CUSTOMER),
  BookingController.cancelMyBooking
);

export const BookingRoutes = router;