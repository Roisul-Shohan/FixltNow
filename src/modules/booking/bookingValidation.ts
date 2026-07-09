import z from "zod" ;

export const createBookingSchema = z.object({
  body: z.object({
    serviceId: z.string().uuid(),

    bookingDate: z.string().date(),

    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/),

    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/),

    customerAddress: z.string().min(5),
  }),
});