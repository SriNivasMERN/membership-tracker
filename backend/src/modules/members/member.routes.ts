import { Router } from "express";
import {
  createMember,
  listMembers,
  getMemberById,
  updateMember,
  deleteMember,
  addPayment,
  renewMember,
} from "./member.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  createMemberSchema,
  updateMemberSchema,
  addPaymentSchema,
  renewMemberSchema,
} from "./member.schema";

const router = Router();

router.use(authenticate);
router.use(requireRole(["owner", "staff"]));

// GET /api/members
router.get("/", listMembers);

// GET /api/members/:id
router.get("/:id", getMemberById);

// POST /api/members
router.post("/", validate(createMemberSchema), createMember);

// PUT /api/members/:id
router.put("/:id", validate(updateMemberSchema), updateMember);

// DELETE /api/members/:id - owner only
router.delete("/:id", requireRole(["owner"]), deleteMember);

// POST /api/members/:id/payment
router.post(
  "/:id/payment",
  validate(addPaymentSchema),
  addPayment
);

// POST /api/members/:id/renew
router.post(
  "/:id/renew",
  validate(renewMemberSchema),
  renewMember
);

export default router;