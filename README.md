# 🔧 FixltNow — On-Demand Technician Service Backend API

A production-ready REST API for an end-to-end on-demand technician booking platform. Built with Express 5, TypeScript (ESM), Prisma ORM 7 (PostgreSQL), and Stripe for secure online payments.

Base path: `/api`

🔗 **Live API**: [https://fixlit-now.vercel.app](https://fixlit-now.vercel.app)

---

## ✨ Features

- 🔐 **JWT Authentication** with HTTP-only cookies (access + refresh tokens) and role-based authorization (`ADMIN`, `TECHNICIAN`, `CUSTOMER`)
- 🗂️ **Category Management** — Admin-managed service categories
- 🛠️ **Service Catalog** — Technicians create services under categories with hourly rates, location, ratings
- 📅 **Availability & Booking Lifecycle** — `PENDING → ACCEPTED → PAID → COMPLETED` (with `DECLINED` & `CANCELLED` branches)
- 💳 **Stripe Checkout** — Secure checkout sessions + verified webhook handling for service payments
- ⭐ **Reviews & Ratings** — Tied to bookings, services, and technicians (with aggregated `averageRating` / `totalReviews`)
- 👮 **Admin Controls** — List/filter users, update account status (`ACTIVE` / `BLOCKED`), manage categories
- 🛡️ **Global Error Handling** — Prisma-aware (`P2002`, `P2003`, `P2025`, `P1000`, `P1001`) + Zod validation errors + standardized JSON responses
- 🧰 **Query Support** — Pagination, filtering, search across all list endpoints
- ☁️ **Vercel-ready** with `@vercel/node` runtime

---

## 🧱 Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js + TypeScript (ESM) |
| Framework | Express 5.x |
| Database | PostgreSQL via Prisma ORM 7.x (with `@prisma/adapter-pg`) |
| Auth | `jsonwebtoken` + `bcryptjs` + cookies |
| Payments | Stripe SDK + webhooks |
| Validation | `zod` |
| Hosting | Vercel (`@vercel/node`) |

---

## 📂 Project Structure

```
src/
├── app.ts                 # Express app (CORS, routes, error handlers)
├── server.ts              # Server bootstrap + Prisma connection
├── config/
│   └── index.ts           # Env-backed config object
├── lib/
│   └── prisma.ts          # Prisma client (PostgreSQL adapter)
├── errors/
│   └── AppErrors.ts       # Custom AppError class
├── interfaces/
│   └── pagination.ts      # Shared pagination types
├── middlewares/
│   ├── auth.ts                  # JWT verification + role-based guard
│   ├── globalErrorHandler.ts    # Prisma-aware error normalizer
│   ├── notFound.ts              # 404 fallback handler
│   └── validateRequest.ts       # Zod request validator
├── utils/
│   ├── catchAsync.ts             # Async wrapper to forward errors
│   ├── sendResponse.ts           # Standard JSON response envelope
│   ├── pagination.ts             # Page/limit/sort helpers
│   ├── filter.ts                 # Build Prisma filter conditions
│   ├── search.ts                 # Build Prisma search conditions
│   ├── formatDateTime.ts         # Date/time formatting helpers
│   └── createDefaultAvailability.ts  # Default weekly schedule for new technicians
└── modules/
    ├── auth/             # register, login, refresh, me, logout
    │   ├── auth.controller.ts
    │   ├── auth.interface.ts
    │   ├── auth.route.ts
    │   ├── auth.service.ts
    │   └── auth.validation.ts
    ├── admin/            # list users, update status, manage categories
    │   ├── admin.constant.ts
    │   ├── admin.controller.ts
    │   ├── admin.interface.ts
    │   ├── admin.route.ts
    │   ├── admin.service.ts
    │   └── admin.validation.ts
    ├── category/         # Public category browsing
    │   ├── category.constant.ts
    │   ├── category.controller.ts
    │   ├── category.interface.ts
    │   ├── category.route.ts
    │   └── category.service.ts
    ├── service/          # Technician service listings
    │   ├── service.constant.ts
    │   ├── service.controller.ts
    │   ├── service.interface.ts
    │   ├── service.route.ts
    │   ├── service.service.ts
    │   └── service.validation.ts
    ├── technician/       # Technician profile, availability, bookings
    │   ├── technician.constant.ts
    │   ├── technician.controller.ts
    │   ├── technician.interface.ts
    │   ├── technician.route.ts
    │   ├── technician.service.ts
    │   └── technician.validation.ts
    ├── booking/          # Customer booking lifecycle
    │   ├── booking.constant.ts
    │   ├── booking.controller.ts
    │   ├── booking.interface.ts
    │   ├── booking.route.ts
    │   ├── booking.service.ts
    │   └── bookingValidation.ts
    ├── availibility/     # Availability slot helpers
    │   ├── availibility.service.ts
    │   └── availability.utils.ts
    ├── payment/          # Stripe checkout + webhook + history
    │   ├── payment.constant.ts
    │   ├── payment.controller.ts
    │   ├── payment.interface.ts
    │   ├── payment.router.ts
    │   ├── payment.service.ts
    │   └── payment.validation.ts
    └── review/           # per-service reviews
        ├── review.constant.ts
        ├── review.controller.ts
        ├── review.interface.ts
        ├── review.route.ts
        ├── review.service.ts
        └── review.validation.ts

prisma/
├── migrations/           # Applied migration history
└── schema/               # Split Prisma schemas
    ├── schema.prisma     # generator + datasource
    ├── enums.prisma      # UserRole, UserStatus, BookingStatus, PaymentStatus
    ├── user.prisma       # User model
    ├── category.prisma   # Category model
    ├── service.prisma    # Service model
    ├── technicianProfile.prisma  # TechnicianProfile model
    ├── availability.prisma       # Availability model
    ├── booking.prisma    # Booking model
    ├── payment.prisma    # Payment model
    └── review.prisma     # Review model
```

---

## 🌐 API Reference

All endpoints are prefixed with `/api`. Authenticated routes require either:

- the `accessToken` cookie (auto-sent on same-origin), or
- an `Authorization: Bearer <token>` header.

🔑 Roles: **ADMIN** · **TECHNICIAN** · **CUSTOMER**

### 🔓 Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/register` | Public | Register a new user (`CUSTOMER` or `TECHNICIAN`) |
| POST | `/login` | Public | Login, sets `accessToken` & `refreshToken` cookies |
| POST | `/logout` | Any role | Clears auth cookies |
| POST | `/refreshtoken` | Public (cookie) | Issue a new access token |
| GET | `/me` | Any role | Get current user profile |

### 👮 Admin — `/api/admin`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/users` | ADMIN | List users (paginated / filterable via query) |
| PATCH | `/users/:id` | ADMIN | Update user `status` (`ACTIVE` / `BLOCKED`) |
| POST | `/categories` | ADMIN | Create a category |
| GET | `/categories` | ADMIN | List categories (paginated / filterable) |
| PATCH | `/categories/:id` | ADMIN | Update a category |

### 🗂️ Categories — `/api/categories` (Public)

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/` | Public | List categories (search / filter / paginate) |
| GET | `/:id` | Public | Get category by id |

### 🛠️ Services — `/api/services`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/` | TECHNICIAN | Create a service under a category |
| GET | `/` | Public | List services (search / filter / paginate) |

### 🧑‍🔧 Technicians — `/api/technicians`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/` | Public | List technicians (paginated / filterable) |
| GET | `/:id` | Public | Get technician by id |
| PUT | `/profile` | TECHNICIAN | Update technician profile |
| PUT | `/availability` | TECHNICIAN | Update availability slots |
| PATCH | `/bookings/:id` | TECHNICIAN | Update booking status (accept / decline) |
| PATCH | `/bookings/:id/complete` | TECHNICIAN | Mark a booking as completed |
| PATCH | `/services/:id` | TECHNICIAN | Update one of the technician's services |
| DELETE | `/services/:id` | TECHNICIAN | Delete one of the technician's services |

### 📦 Bookings — `/api/bookings`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/` | CUSTOMER | Create a booking for a service |
| GET | `/` | CUSTOMER | List the current customer's bookings |
| GET | `/:id` | CUSTOMER | Get a booking by id |

### 💳 Payments — `/api/payments`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/create` | CUSTOMER | Create a Stripe checkout session for an accepted booking |
| POST | `/confirm` | Stripe (raw) | Stripe webhook receiver (raw body, verified via `STRIPE_WEBHOOK_SECRET`) |
| GET | `/` | CUSTOMER | List the current customer's payments (filterable) |
| GET | `/:id` | CUSTOMER | Get a payment by id |

### ⭐ Reviews — `/api/reviews`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/` | CUSTOMER | Create a review tied to a booking |
| GET | `/my` | CUSTOMER | List the current customer's reviews |
| GET | `/service/:serviceId` | Public | List reviews for a service |
| GET | `/technician/:technicianId` | Public | List reviews for a technician |
| PATCH | `/:id` | CUSTOMER | Update a review |
| DELETE | `/:id` | CUSTOMER | Delete a review |

---

## 🧾 Data Model (Prisma)

- **User** — `id`, `name`, `email`, `password`, `phone`, `profileImage`, `role` (`CUSTOMER` | `TECHNICIAN` | `ADMIN`), `status` (`ACTIVE` | `BLOCKED`), `stripeCustomerId`
- **TechnicianProfile** — `userId`, `bio`, `yearsOfExperience`, `averageRating`, `totalReviews`
- **Category** — `name` (unique), `description`, `isActive`
- **Service** — `technicianId`, `categoryId`, `title`, `description`, `hourlyRate`, `location`, `averageRating`, `totalReviews`, `isActive`
- **Availability** — `technicianId`, `date`, `startTime`, `endTime` (string `HH:mm`)
- **Booking** — `customerId`, `technicianId`, `serviceId`, `bookingDate`, `startTime`, `endTime`, `hourlyRate`, `totalAmount`, `customerAddress`, `status`
- **Payment** — `bookingId` (unique), `customerId`, `amount`, `currency`, `paymentMethod`, `status`, Stripe IDs (`checkoutSessionId`, `paymentIntentId`, `chargeId`), `paidAt`
- **Review** — `bookingId` (unique), `customerId`, `technicianId`, `serviceId`, `rating`, `comment`

**Enums**

- `UserRole`: `CUSTOMER` · `TECHNICIAN` · `ADMIN`
- `UserStatus`: `ACTIVE` · `BLOCKED`
- `BookingStatus`: `PENDING` · `ACCEPTED` · `COMPLETED` · `DECLINED` · `CANCELLED` · `PAID`
- `PaymentStatus`: `PENDING` · `SUCCEEDED` · `FAILED` · `REFUNDED`

---

## 📨 Standard Response Envelope

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Users retrieved successfully",
  "data": { /* payload */ },
  "meta": { "page": 1, "limit": 10, "total": 42 }
}
```

Errors are normalized by `globalErrorHandler` with Prisma-aware mapping:

| Code | HTTP | Meaning |
| --- | --- | --- |
| `P2002` | 400 Bad Request | Duplicate key |
| `P2003` | 400 Bad Request | Foreign key constraint failed |
| `P2025` | 400 Bad Request | Required record not found |
| `P1000` | 401 Unauthorized | DB authentication failed |
| `P1001` | 400 Bad Request | Can't reach database server |

Zod validation failures are returned with a per-field `errors` array.

---

## ⚙️ Environment Variables

Create a `.env` in the project root:

```env
PORT=5000

# Postgres
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/fixlitnow

# CORS
CLIENT_URL=http://localhost:3000

# Auth
BCRYPT_SALT_ROUNDS=12
JWT_ACCESS_SECRET=replace-me
JWT_REFRESH_SECRET=replace-me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

> ℹ️ The Prisma datasource is configured in `prisma.config.ts`, which reads `DATABASE_URL` from the environment.

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 20
- A PostgreSQL database (local or hosted)

### Install

```bash
git clone <your-repo-url>
cd fixlitnow
npm install
```

### Configure

```bash
cp .env.example .env   # then fill in your values
```

### Database

```bash
npx prisma migrate dev
npx prisma generate
```

### Run

```bash
# Dev (hot reload)
npm run dev

# Production build
npm run build
npm start
```

The server starts on `PORT` (default `5000`) and connects Prisma before listening.

---

## 📦 Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start dev server with `tsx watch` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the built server: `node dist/server.js` |

---

## ☁️ Deployment (Vercel)

This repo ships with a `vercel.json` that targets `src/server.ts` via `@vercel/node` (TypeScript is transpiled by Vercel at build time):

```json
{
  "version": 2,
  "builds": [{ "src": "src/server.ts", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/server.ts" }]
}
```

Set every env var from `.env` in **Vercel → Project → Settings → Environment Variables**, then push to trigger a build.

> 🔗 **Live API**: [https://fixlit-now.vercel.app](https://fixlit-now.vercel.app)

---

## 🧪 Smoke Test

```bash
curl https://fixlit-now.vercel.app/
# -> Helllo

curl https://fixlit-now.vercel.app/api/categories
# -> { "success": true, "statuscode": 200, "message": "Categories retrieved successfully", "data": [...] }
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/awesome`
3. Commit: `git commit -m "feat: add awesome"`
4. Push & open a PR