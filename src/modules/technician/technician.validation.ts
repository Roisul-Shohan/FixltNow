import { z } from "zod";

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


export const TechnicianValidation = {
  updateTechnicianProfileSchema,
  updateAvailabilitySchema,
};