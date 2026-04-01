import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import requestLogger from "./middlewares/request_logger.middleware.js";
import errorHandlerMiddleware from "./middlewares/error_handler.middleware.js";
import logger from "./lib/log.js";
import "./jobs/cron.jobs.js";

const app = express();

app.use(requestLogger);
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    next();
  },
);
app.use(express.json());
app.set("view engine", "ejs");

app.use("/api/auth", authRoutes);
app.use("/api/workspace", workspaceRoutes);
app.use("/api/payment", paymentRoutes);

app.use(errorHandlerMiddleware(logger));

export default app;
