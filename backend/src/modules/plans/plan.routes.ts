import { Router } from "express";
import {
  getAllPlans,
  getActivePlans,
  getPlanById,
  createPlan,
  updatePlan,
  togglePlanStatus,
  deletePlan,
} from "./plan.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  createPlanSchema,
  updatePlanSchema,
  togglePlanSchema,
} from "./plan.schema";

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/plans - all plans (owner sees all, staff sees active only)
router.get("/", getAllPlans);

// GET /api/plans/active - active plans only (for member creation)
router.get("/active", getActivePlans);

// GET /api/plans/:id - single plan
router.get("/:id", getPlanById);

// POST /api/plans - create plan (owner only)
router.post(
  "/",
  requireRole(["owner"]),
  validate(createPlanSchema),
  createPlan
);

// PUT /api/plans/:id - update plan (owner only)
router.put(
  "/:id",
  requireRole(["owner"]),
  validate(updatePlanSchema),
  updatePlan
);

// PATCH /api/plans/:id/toggle - activate or deactivate (owner only)
router.patch(
  "/:id/toggle",
  requireRole(["owner"]),
  validate(togglePlanSchema),
  togglePlanStatus
);

// DELETE /api/plans/:id - soft delete (owner only)
router.delete("/:id", requireRole(["owner"]), deletePlan);

export default router;