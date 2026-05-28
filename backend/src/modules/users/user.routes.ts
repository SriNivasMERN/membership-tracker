import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  getCurrentUser,
  createUser,
  updateUser,
  toggleUserStatus,
  updateCredentials,
} from "./user.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  createUserSchema,
  updateUserSchema,
  toggleUserSchema,
  updateCredentialsSchema,
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

// PUT /api/users/:id - update name only
router.put("/:id", validate(updateUserSchema), updateUser);

// PATCH /api/users/:id/credentials - update email or password
router.patch(
  "/:id/credentials",
  validate(updateCredentialsSchema),
  updateCredentials
);

// PATCH /api/users/:id/toggle
router.patch(
  "/:id/toggle",
  validate(toggleUserSchema),
  toggleUserStatus
);

export default router;