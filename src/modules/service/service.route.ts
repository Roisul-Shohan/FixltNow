import { Router } from "express";
import { UserRole } from "@prisma/client";
import { auth } from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { ServiceValidation } from "./service.validation.js";
import { ServiceController } from "./service.controller.js";

const router =Router()


router.post(
  "/",
  auth(UserRole.TECHNICIAN),
  validateRequest(ServiceValidation.createServiceSchema),
  ServiceController.createService
);

router.get(
  "/",
  ServiceController.getAllServices
);


export const serviceRouter =router;