import { Router } from "express";
import {
  registerOwner,
  checkOwnerStatus,
  login,
  logout,
  refreshToken,
} from "./auth.controller";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { registerOwnerSchema, loginSchema } from "./auth.schema";

const router = Router();

// GET /api/auth/owner-status
router.get("/owner-status", checkOwnerStatus);

// POST /api/auth/register-owner
router.post("/register-owner", validate(registerOwnerSchema), registerOwner);

// POST /api/auth/login
router.post("/login", validate(loginSchema), login);

// POST /api/auth/refresh
router.post("/refresh", refreshToken);

// POST /api/auth/logout
router.post("/logout", authenticate, logout);

export default router;