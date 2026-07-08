import express from "express";



import { AdminController } from "./admin.controller";
import { auth } from "../../middlewares/auth";
import { UserRole } from "../../../prisma/generated/prisma/enums";

const router = express.Router();

router.get(
  "/users",
  auth(UserRole.ADMIN),
  AdminController.getAllUsers
);

export const AdminRoutes = router;