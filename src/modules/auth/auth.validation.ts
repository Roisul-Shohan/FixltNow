import { z } from "zod";

 const registerSchema = z
  .object({
    body: z.object({
      name: z.string().min(1, "Name is required"),
      email: z.email("Invalid email"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      phone: z.string().optional(),
      profileImage: z.string().optional(),

      role: z.enum(["CUSTOMER", "TECHNICIAN"]),

      bio: z.string().optional(),
      yearsOfExperience: z.coerce.number().optional(),
    }),
  })
  .superRefine((data, ctx) => {
    const body = data.body;

    if (body.role === "TECHNICIAN") {
      if (!body.bio) {
        ctx.addIssue({
          code: "custom",
          path: ["body", "bio"],
          message: "Bio is required for technicians",
        });
      }

      if (body.yearsOfExperience === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["body", "yearsOfExperience"],
          message: "Years of experience is required for technicians",
        });
      }
    }
  });

  const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
 });

const updateMyProfileSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).optional(),
      phone: z.string().optional(),
      profileImage: z.string().optional(),
      bio: z.string().optional(),
      yearsOfExperience: z.coerce.number().int().nonnegative().optional(),
    })
    .refine((b) => Object.keys(b).length > 0, {
      message: "At least one field must be provided",
    }),
});

const refreshTokenSchema = z.object({
    body: z.object({}),
  });

  export const AuthValidation = {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    updateMyProfileSchema,
  }