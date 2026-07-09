import Stripe from "stripe";
import config from "../../config";
import { TCreatePayment } from "./payment.interface";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import AppError from "../../errors/AppErrors";
import { BookingStatus, PaymentStatus } from "../../../prisma/generated/prisma/enums";
import { currency } from "./payment.constant";

const stripe = new Stripe(config.stripe_secret_key!);

const createPaymentSession = async (
  customerId: string,
  payload: TCreatePayment
) => {
  
  const booking = await prisma.booking.findFirst({
    where: {
      id: payload.bookingId,
      customerId,
    },

    include: {
      service: true,
      customer: true,
    },
  });

  if (!booking) {
    throw new AppError( httpStatus.NOT_FOUND,"Booking not found.");
  }

  if (booking.status !== BookingStatus.ACCEPTED) {
    throw new AppError( httpStatus.BAD_REQUEST, "Booking is not accepted yet.");
  }

  const existingPayment = await prisma.payment.findUnique({
    where: {
      bookingId: booking.id,
    },
  });

  if (existingPayment && existingPayment.status === PaymentStatus.SUCCEEDED ) {
     throw new AppError(httpStatus.BAD_REQUEST,  "This booking has already been paid." );
  }

  let stripeCustomerId = booking.customer.stripeCustomerId;

if (!stripeCustomerId) {
  const stripeCustomer = await stripe.customers.create({
    name: booking.customer.name,
    email: booking.customer.email,
  });

  stripeCustomerId = stripeCustomer.id;

  await prisma.user.update({
    where: {
      id: booking.customer.id,
    },
    data: {
      stripeCustomerId,
    },
  });
}


 const session = await stripe.checkout.sessions.create({
    mode: "payment",

    customer: stripeCustomerId,

    payment_method_types: ["card"],

    line_items: [
      {
        quantity: 1,

        price_data: {
          currency: currency,

          product_data: {
            name: booking.service.title,
            description: booking.service.description ?? "",
          },

          unit_amount:
            Number(booking.totalAmount) * 100,
        },
      },
    ],

    success_url: `${config.client_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

    cancel_url: `${config.client_url}/payment/cancel`,
  });

    if (!existingPayment) {
    await prisma.payment.create({
      data: {
        bookingId: booking.id,

        customerId,

        amount: booking.totalAmount,

        currency: "usd",

        stripeCustomerId: stripeCustomerId,

        stripeCheckoutSessionId: session.id,

        status: PaymentStatus.PENDING,
      },
    });
  } else {
    await prisma.payment.update({
      where: {
        bookingId: booking.id,
      },

      data: {
        stripeCustomerId: stripeCustomerId,
        stripeCheckoutSessionId: session.id,
        status: PaymentStatus.PENDING,
      },
    });
  }

    return {
    checkoutUrl: session.url,
  };

}

const confirmPayment = async (
  rawBody: Buffer,
  signature: string
) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      config.stripe_webhook_secret!
    );
  } catch {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid webhook signature."
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const payment = await prisma.payment.findUnique({
        where: {
          stripeCheckoutSessionId: session.id,
        },
      });

      if (!payment) {
        break;
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent as string
      );

      const charge =
        paymentIntent.latest_charge?.toString() ?? null;

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: PaymentStatus.SUCCEEDED,

            stripePaymentIntentId: paymentIntent.id,

            stripeChargeId: charge,

            paymentMethod:
              paymentIntent.payment_method_types[0],

            paidAt: new Date(),
          },
        });

        await tx.booking.update({
          where: {
            id: payment.bookingId,
          },
          data: {
            status: BookingStatus.COMPLETED,
          },
        });
      });

      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;

      await prisma.payment.updateMany({
        where: {
          stripeCheckoutSessionId: session.id,
        },
        data: {
          status: PaymentStatus.FAILED,
        },
      });

      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent =
        event.data.object as Stripe.PaymentIntent;

      await prisma.payment.updateMany({
        where: {
          stripePaymentIntentId: paymentIntent.id,
        },
        data: {
          status: PaymentStatus.FAILED,
        },
      });

      break;
    }
  }

  return {
    received: true,
  };
};


export const PaymentService = {
  createPaymentSession,
  confirmPayment,
};