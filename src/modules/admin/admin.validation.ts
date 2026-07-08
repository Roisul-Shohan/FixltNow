import { z } from "zod";
import { UserStatus } from "../../../prisma/generated/prisma/enums";


const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(UserStatus, {
      error: "Status must be ACTIVE or BLOCKED",
    }),
  }),
});

export const AdminValidation = {
  updateUserStatusSchema,
};