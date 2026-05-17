import { Router } from "express";
import { registerOwner, checkOwnerStatus } from "./auth.controller";

const router = Router();

// GET /api/auth/owner-status
// Public - frontend checks this before showing login or setup screen
router.get("/owner-status", checkOwnerStatus);

// POST /api/auth/register-owner
// Public - only works once, blocked if owner already exists
router.post("/register-owner", registerOwner);

export default router;
