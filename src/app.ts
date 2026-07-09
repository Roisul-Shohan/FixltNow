import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { notFound } from "./middlewares/notFound";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import { authRoutes } from "./modules/auth/auth.route";
import { AdminRoutes } from "./modules/admin/admin.route";
import { serviceRouter } from "./modules/service/service.route";
import { TechnicianRoutes } from "./modules/technician/technician.route";
import { CategoryRouter } from "./modules/category/category.route";
import { BookingRoutes } from "./modules/booking/booking.route";
import { PaymentRoutes } from "./modules/payment/payment.router";
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







app.use(notFound);

app.use(globalErrorHandler);



export default app;
