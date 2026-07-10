import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { notFound } from "./middlewares/notFound.js";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import { authRoutes } from "./modules/auth/auth.route.js";
import { AdminRoutes } from "./modules/admin/admin.route.js";
import { serviceRouter } from "./modules/service/service.route.js";
import { TechnicianRoutes } from "./modules/technician/technician.route.js";
import { CategoryRouter } from "./modules/category/category.route.js";
import { BookingRoutes } from "./modules/booking/booking.route.js";
import { PaymentRoutes } from "./modules/payment/payment.router.js";
import { ReviewRouter } from "./modules/review/review.route.js";
const app: Application = express();

app.use(cors());

app.use("/api/payments/confirm", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("Helllo");
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", AdminRoutes);
app.use("/api/services",serviceRouter);
app.use("/api/technicians",TechnicianRoutes);
app.use("/api/categories",CategoryRouter);
app.use("/api/bookings", BookingRoutes);
app.use("/api/payments", PaymentRoutes);
app.use("/api/reviews",ReviewRouter);






app.use(notFound);

app.use(globalErrorHandler);



export default app;
