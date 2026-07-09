import { Router } from "express";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ServiceValidation } from "./service.validation";
import { ServiceController } from "./service.controller";

const router =Router()


router.post(
  "/",
  auth(UserRole.TECHNICIAN),
  validateRequest(ServiceValidation.createServiceSchema),
  ServiceController.createService
);


export const serviceRouter =router;