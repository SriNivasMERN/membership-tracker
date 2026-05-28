import { z } from "zod";

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .trim(),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password too long"),

  role: z.enum(["staff"]),
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .trim()
    .optional(),
});

export const toggleUserSchema = z.object({
  isActive: z.boolean(),
});

// NEW - credentials update schema
export const updateCredentialsSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .toLowerCase()
    .optional(),

  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password too long")
    .optional(),
}).refine(
  (data) => data.email || data.newPassword,
  { message: "At least one of email or new password must be provided" }
);

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ToggleUserInput = z.infer<typeof toggleUserSchema>;
export type UpdateCredentialsInput = z.infer<typeof updateCredentialsSchema>;