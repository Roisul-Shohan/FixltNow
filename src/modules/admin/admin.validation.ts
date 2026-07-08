import { z } from "zod";
import { UserStatus } from "../../../prisma/generated/prisma/enums";


const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(UserStatus, {
      error: "Status must be ACTIVE or BLOCKED",
    }),
  }),
});

const createCategorySchema = z.object({
  body: z.object({
    name: z.string({
      error: "Category name is required",
    }).min(1),

    description: z.string().optional(),
  }),
});

export const AdminValidation = {
  updateUserStatusSchema,
  createCategorySchema,
};