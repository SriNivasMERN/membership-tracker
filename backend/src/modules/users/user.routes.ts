import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  getCurrentUser,
  createUser,
  updateUser,
  toggleUserStatus,
} from "./user.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  createUserSchema,
  updateUserSchema,
  toggleUserSchema,
} from "./user.schema";

const router = Router();

router.use(authenticate);

// GET /api/users/me - any logged in user
router.get("/me", getCurrentUser);

// All routes below - owner only
router.use(requireRole(["owner"]));

// GET /api/users
router.get("/", getAllUsers);

// GET /api/users/:id
router.get("/:id", getUserById);

// POST /api/users
router.post("/", validate(createUserSchema), createUser);

// PUT /api/users/:id
router.put("/:id", validate(updateUserSchema), updateUser);

// PATCH /api/users/:id/toggle
router.patch(
  "/:id/toggle",
  validate(toggleUserSchema),
  toggleUserStatus
);

export default router;