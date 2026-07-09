import { z } from "zod";

const createServiceSchema = z.object({
  body: z.object({
    categoryId: z
      .string()
      .uuid({ message: "Category ID must be a valid UUID." }),

    title: z
      .string()
      .min(3, { message: "Title must be at least 3 characters long." }),

    description: z.string().optional(),

    location: z
      .string()
      .min(2, { message: "Location is required." }),

    hourlyRate: z
      .number({
        error: "Hourly rate is required and must be a number.",
      })
      .positive({
        message: "Hourly rate must be greater than 0.",
      }),
  }),
});

export const ServiceValidation = {
  createServiceSchema,
};