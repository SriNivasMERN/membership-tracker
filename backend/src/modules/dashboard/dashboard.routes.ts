import { Router } from "express";
import {
  getDashboard,
  getMonthlyRevenue,
  getPlanDistribution,
} from "./dashboard.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

// GET /api/dashboard
router.get("/", getDashboard);

// GET /api/dashboard/monthly-revenue
router.get("/monthly-revenue", getMonthlyRevenue);

// GET /api/dashboard/plan-distribution
router.get("/plan-distribution", getPlanDistribution);

export default router;