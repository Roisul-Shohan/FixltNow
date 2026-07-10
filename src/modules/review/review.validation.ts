import { z } from "zod";

 const createReviewSchema = z.object({
  body: z.object({
    bookingId: z
      .string({
        error: "Booking id is required",
      })
      .uuid("Invalid booking id"),

    rating: z
      .number({
           error: "Rating is required",
      })
      .int("Rating must be an integer")
      .min(1, "Rating must be at least 1")
      .max(5, "Rating cannot be greater than 5"),

    comment: z
      .string()
      .trim()
      .max(500, "Comment cannot exceed 500 characters")
      .optional(),
  }),
});

const updateReviewSchema = z.object({
  body: z
    .object({
      rating: z
        .number()
        .int()
        .min(1)
        .max(5)
        .optional(),

      comment: z
        .string()
        .trim()
        .max(500)
        .optional(),
    })
    .refine(
      (data) => data.rating !== undefined || data.comment !== undefined,
      {
        message: "At least one field must be provided.",
      }
    ),
});



export const ReviewValidation = {
  createReviewSchema,
  updateReviewSchema,
};