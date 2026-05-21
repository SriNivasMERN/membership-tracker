import { Router } from "express";
import {
  createMember,
  listMembers,
} from "./member.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createMemberSchema } from "./member.schema";

const router = Router();

router.use(authenticate);
router.use(requireRole(["owner", "staff"]));

// GET /api/members
router.get("/", listMembers);

// POST /api/members
router.post("/", validate(createMemberSchema), createMember);

export default router;