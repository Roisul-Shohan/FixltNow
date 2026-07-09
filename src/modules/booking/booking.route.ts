import express from "express";
import { auth } from "../../middlewares/auth";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import validateRequest from "../../middlewares/validateRequest";
import { createBookingSchema } from "./bookingValidation";
import { BookingController } from "./booking.controller";

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
  "/:id",
  auth(UserRole.CUSTOMER),
  BookingController.getBookingById
);

export const BookingRoutes = router;