import { Router } from "express";
import {
  getAllSlots,
  getActiveSlots,
  getSlotById,
  createSlot,
  updateSlot,
  toggleSlotStatus,
  deleteSlot,
} from "./slot.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  createSlotSchema,
  updateSlotSchema,
  toggleSlotSchema,
} from "./slot.schema";

const router = Router();

router.use(authenticate);

router.get("/", getAllSlots);
router.get("/active", getActiveSlots);
router.get("/:id", getSlotById);

router.post(
  "/",
  requireRole(["owner"]),
  validate(createSlotSchema),
  createSlot
);

router.put(
  "/:id",
  requireRole(["owner"]),
  validate(updateSlotSchema),
  updateSlot
);

router.patch(
  "/:id/toggle",
  requireRole(["owner"]),
  validate(toggleSlotSchema),
  toggleSlotStatus
);

router.delete("/:id", requireRole(["owner"]), deleteSlot);

export default router;