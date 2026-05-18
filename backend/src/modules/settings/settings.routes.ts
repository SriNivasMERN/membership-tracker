import { Router } from "express";
import {
  getSettings,
  saveSettings,
  updateSettings,
} from "./settings.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  createSettingsSchema,
  updateSettingsSchema,
} from "./settings.schema";

const router = Router();

// All settings routes require authentication
// All settings routes require owner role
router.use(authenticate, requireRole(["owner"]));

// GET /api/settings
router.get("/", getSettings);

// POST /api/settings
router.post("/", validate(createSettingsSchema), saveSettings);

// PUT /api/settings
router.put("/", validate(updateSettingsSchema), updateSettings);

export default router;