import { z } from "zod";
import { BookingStatus } from "@prisma/client";

const updateTechnicianProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),

    phone: z.string().optional(),

    profileImage: z.string().optional(),

    bio: z.string().optional(),

    yearsOfExperience: z.number().int().nonnegative().optional(),
  }),
});

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const updateAvailabilitySchema = z.object({
  body: z.object({
    date: z.string().date(),

    slots: z.array(
      z.object({
        startTime: z.string().regex(timeRegex),
        endTime: z.string().regex(timeRegex),
      })
    ),
  }),
});

const updateBookingStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      BookingStatus.ACCEPTED,
      BookingStatus.DECLINED,
    ]),
  }),
});

export const completeBookingSchema = z.object({
  body: z.object({
    status: z.literal(BookingStatus.COMPLETED),
  }),
});

const updateServiceSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(3).max(100).optional(),

      description: z.string().trim().min(10).optional(),

      hourlyRate: z.coerce.number().positive().optional(),

      location: z.string().trim().optional(),

      categoryId: z.string().uuid().optional(),
      isActive: z.boolean().optional(),
    })
    .refine(
      (data) =>
        Object.keys(data).length > 0,
      {
        message: "At least one field is required.",
      }
    ),
});





export const TechnicianValidation = {
  updateTechnicianProfileSchema,
  updateAvailabilitySchema,
  updateBookingStatusSchema,
  completeBookingSchema,
  updateServiceSchema,
};