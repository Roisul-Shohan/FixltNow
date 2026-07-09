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

export const TechnicianValidation = {
  updateTechnicianProfileSchema,
};