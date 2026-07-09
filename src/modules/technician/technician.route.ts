import express from "express";

import { TechnicianController } from "./technician.controller";

const router = express.Router();

router.get(
  "/",
  TechnicianController.getAllTechnicians
);

router.get(
  "/:id",
  TechnicianController.getTechnicianById
);

export const TechnicianRoutes = router;