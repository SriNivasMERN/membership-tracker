import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config/env";
import { errorHandler } from "./middleware/error.middleware";
import authRoutes from "./modules/auth/auth.routes";
import settingsRoutes from "./modules/settings/settings.routes";
import planRoutes from "./modules/plans/plan.routes";
import slotRoutes from "./modules/slots/slot.routes";
import pricingRoutes from "./modules/pricing/pricing.routes";
import userRoutes from "./modules/users/user.routes";

const app: Application = express();

app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api/users", userRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    environment: config.nodeEnv,
  });
});

// Error handler - always last
app.use(errorHandler);

export default app;