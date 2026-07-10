import Stripe from "stripe";
import config from "../../config";
import { IGetPayments, TCreatePayment } from "./payment.interface";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import AppError from "../../errors/AppErrors";
import { BookingStatus, PaymentStatus } from "../../../prisma/generated/prisma/enums";
import { currency, paymentFilterableFields, paymentSearchableFields } from "./payment.constant";
import { calculatePagination, getPagination } from "../../utils/pagination";
import { SortOrder } from "../../../prisma/generated/prisma/internal/prismaNamespace";
import { buildFilterCondition } from "../../utils/filter";
import { buildSearchCondition } from "../../utils/search";
import { Prisma } from "../../../prisma/generated/prisma/client";

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

        currency: currency,

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
      const session = event.data.object ;

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
            status: BookingStatus.PAID,
          },
        });
      });

      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;

      await prisma.payment.update({
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

      await prisma.payment.update({
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

const getMyPayments = async (
  customerId: string,
  query: IGetPayments
) => {
  const { searchTerm, ...filters } = query;

  const {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  } = getPagination(query);

  const andConditions = buildFilterCondition(
    filters,
    paymentFilterableFields
  );

  const orCondition = buildSearchCondition(
    searchTerm,
    paymentSearchableFields
  );

  const whereConditions = {
    customerId,
    AND: [...andConditions],
  };

  if (Object.keys(orCondition).length) {
    whereConditions.AND?.push(orCondition);
  }

 const payments = await prisma.payment.findMany({
  where: whereConditions,

  select: {
    id: true,
    amount: true,
    currency: true,
    paymentMethod: true,
    status: true,
    paidAt: true,

    booking: {
      select: {
        id: true,
        bookingDate: true,
        status: true,

        service: {
          select: {
            title: true,
          },
        },

        technician: {
          select: {
            user: {
              select: {
                name: true,
                profileImage: true,
              },
            },
          },
        },
      },
    },
  },

  skip,
  take: limit,

  orderBy: {
    [sortBy]: sortOrder,
  },
});

  const total = await prisma.payment.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },

    data: payments,
  };
};

const getPayentById = async ( userId :string , paymentId : string) =>{

   const payment = await prisma.payment.findFirst({
        where: {
        id: paymentId,
        customerId :userId,
        },

        select: {
        id: true,
        amount: true,
        currency: true,
        paymentMethod: true,
        status: true,
        paidAt: true,
        createdAt: true,

        booking: {
            select: {
            id: true,
            bookingDate: true,
            startTime: true,
            endTime: true,
            hourlyRate: true,
            totalAmount: true,
            customerAddress: true,
            status: true,

            service: {
                select: {
                id: true,
                title: true,
                description: true,
                location: true,
                hourlyRate: true,

                category: {
                    select: {
                    id: true,
                    name: true,
                    },
                },
                },
            },

            technician: {
                select: {
                id: true,
                bio: true,
                yearsOfExperience: true,
                averageRating: true,
                totalReviews: true,

                user: {
                    select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    profileImage: true,
                    },
                },
                },
            },
            },
        },
        },
    });

  if (!payment) {
    throw new AppError( httpStatus.NOT_FOUND, "Payment not found." );
  }

  return payment;
};
    

export const PaymentService = {
  createPaymentSession,
  confirmPayment,
  getMyPayments,
  getPayentById,
};