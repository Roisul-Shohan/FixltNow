import express from "express";



import { AdminController } from "./admin.controller";
import { auth } from "../../middlewares/auth";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import validateRequest from "../../middlewares/validateRequest";
import { AdminValidation } from "./admin.validation";

const router = express.Router();

router.get(
  "/users",
  auth(UserRole.ADMIN),
  AdminController.getAllUsers
);

router.patch(
  "/users/:id",
  auth(UserRole.ADMIN),
  validateRequest(AdminValidation.updateUserStatusSchema),
  AdminController.updateUserStatus
);

export const AdminRoutes = router;