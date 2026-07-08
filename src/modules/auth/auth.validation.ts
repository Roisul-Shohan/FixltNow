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




  export const AuthValidation = {
    registerSchema,
    loginSchema
  }