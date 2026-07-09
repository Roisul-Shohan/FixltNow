import express from "express";

import { TechnicianController } from "./technician.controller";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { TechnicianValidation } from "./technician.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = express.Router();

router.get(
  "/",
  TechnicianController.getAllTechnicians
);

router.get(
  "/:id",
  TechnicianController.getTechnicianById
);

router.put(
  "/profile",
  auth(UserRole.TECHNICIAN),
  validateRequest(
    TechnicianValidation.updateTechnicianProfileSchema
  ),
  TechnicianController.updateProfile
);

router.put(
  "/availability",
  auth(UserRole.TECHNICIAN),
  validateRequest(TechnicianValidation.updateAvailabilitySchema),
  TechnicianController.updateAvailability
);


export const TechnicianRoutes = router;