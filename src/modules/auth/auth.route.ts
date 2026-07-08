import { Router } from "express";
import { AuthController } from "./auth.controller";
import validateRequest from "../../middlewares/validateRequest";
import { AuthValidation } from "./auth.validation";
import { auth } from "../../middlewares/auth";
import { UserRole } from "../../../prisma/generated/prisma/enums";

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

export const authRoutes =router;