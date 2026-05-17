import { Router } from "express";
import {
  registerOwner,
  checkOwnerStatus,
  login,
  logout,
} from "./auth.controller";

const router = Router();

// GET /api/auth/owner-status
router.get("/owner-status", checkOwnerStatus);

// POST /api/auth/register-owner
router.post("/register-owner", registerOwner);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/logout
router.post("/logout", logout);

export default router;