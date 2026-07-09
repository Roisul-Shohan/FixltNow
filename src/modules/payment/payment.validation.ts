import { z } from "zod";

const createPaymentSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid(),
  }),
});

export const PaymentValidation = {
  createPaymentSchema,
};