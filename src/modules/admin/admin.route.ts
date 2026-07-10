import express from "express";



import { AdminController } from "./admin.controller.js";
import { auth } from "../../middlewares/auth.js";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest.js";
import { AdminValidation } from "./admin.validation.js";
import { AdminService } from "./admin.service.js";

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

router.post(
  "/categories",
  auth(UserRole.ADMIN),
  validateRequest(AdminValidation.createCategorySchema),
  AdminController.createCategory
);

router.get(
  "/categories",
  auth(UserRole.ADMIN),
  AdminController.getAllCategories
);

router.patch(
  "/categories/:id",
  auth(UserRole.ADMIN),
  validateRequest(AdminValidation.updateCategorySchema),
  AdminController.updateCategory
);


export const AdminRoutes = router;