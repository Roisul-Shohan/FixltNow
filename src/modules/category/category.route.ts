import { Router } from "express";
import { CategoryController } from "./category.controller";

const router = Router();

router.get(
  "/",
  CategoryController.getAllCategories
);

router.get(
  "/:id",
  CategoryController.getCategoryById
);

export const CategoryRouter = router;