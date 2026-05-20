import { Router } from "express";
import {
  getAllRules,
  getRuleById,
  createRule,
  updateRule,
  deleteRule,
  calculatePrice,
} from "./pricing.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  createPricingRuleSchema,
  updatePricingRuleSchema,
} from "./pricing.schema";

const router = Router();

router.use(authenticate);

// GET /api/pricing
router.get("/", getAllRules);

// GET /api/pricing/:id
router.get("/:id", getRuleById);

// POST /api/pricing/calculate - price preview
router.post("/calculate", calculatePrice);

// POST /api/pricing - create rule (owner only)
router.post(
  "/",
  requireRole(["owner"]),
  validate(createPricingRuleSchema),
  createRule
);

// PUT /api/pricing/:id - update rule (owner only)
router.put(
  "/:id",
  requireRole(["owner"]),
  validate(updatePricingRuleSchema),
  updateRule
);

// DELETE /api/pricing/:id - delete rule (owner only)
router.delete("/:id", requireRole(["owner"]), deleteRule);

export default router;