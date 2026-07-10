import { z } from "zod";
import { UserStatus } from "@prisma/client";


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

const updateCategorySchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2)
        .max(100)
        .optional(),

      description: z
        .string()
        .trim()
        .max(500)
        .optional(),

      isActive: z.boolean().optional(),
    })
    .refine(
      (data) =>
        data.name !== undefined ||
        data.description !== undefined ||
        data.isActive !== undefined,
      {
        message: "At least one field must be provided.",
      }
    ),
});


export const AdminValidation = {
  updateUserStatusSchema,
  createCategorySchema,
  updateCategorySchema
};