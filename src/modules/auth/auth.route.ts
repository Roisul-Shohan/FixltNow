import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { AuthValidation } from "./auth.validation.js";
import { auth } from "../../middlewares/auth.js";
import { UserRole } from "@prisma/client";

const router = Router();



router.post(
    "/register",
    validateRequest(AuthValidation.registerSchema),
    AuthController.registerUser
);

router.post(
    "/login",
    validateRequest(AuthValidation.loginSchema),
    AuthController.loginUser
)

router.get(
    "/me",
    auth(UserRole.ADMIN,UserRole.CUSTOMER,UserRole.TECHNICIAN),
    AuthController.getMyProfile
)

router.post(
  "/logout",
  auth(UserRole.CUSTOMER, UserRole.TECHNICIAN, UserRole.ADMIN),
  AuthController.logout
);

export const authRoutes =router;