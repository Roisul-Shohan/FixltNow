import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import validateRequest from "../../middlewares/validateRequest";
import { ReviewValidation } from "./review.validation";
import { ReviewController } from "./review.controller";

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

export const ReviewRouter = router;