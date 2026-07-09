import express from "express";

import { TechnicianController } from "./technician.controller";

const router = express.Router();

router.get(
  "/",
  TechnicianController.getAllTechnicians
);

export const TechnicianRoutes = router;