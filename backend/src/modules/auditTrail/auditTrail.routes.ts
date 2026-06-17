import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { listAuditTrail } from "./auditTrail.controller";

const router = Router();

router.use(authenticate);
router.use(requireRole(["owner"]));

router.get("/", listAuditTrail);

export default router;
