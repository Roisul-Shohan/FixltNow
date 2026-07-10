import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest.js";
import { ReviewValidation } from "./review.validation.js";
import { ReviewController } from "./review.controller.js";

const router =Router();


router.post(
  "/",
  auth(UserRole.CUSTOMER),
  validateRequest(ReviewValidation.createReviewSchema),
  ReviewController.createReview
);

router.get(
  "/my",
  auth(UserRole.CUSTOMER),
  ReviewController.getMyReviews
);

router.get(
  "/service/:serviceId",
  ReviewController.getServiceReviews
);

router.get(
  "/technician/:technicianId",
  ReviewController.getTechnicianReviews
);

router.patch(
  "/:id",
  auth(UserRole.CUSTOMER),
  validateRequest(ReviewValidation.updateReviewSchema),
  ReviewController.updateReview
);

router.delete(
  "/:id",
  auth(UserRole.CUSTOMER),
  ReviewController.deleteReview
);

export const ReviewRouter = router;