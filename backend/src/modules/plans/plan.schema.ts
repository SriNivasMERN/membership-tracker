import { z } from "zod";

export const createPlanSchema = z.object({
  name: z
    .string()
    .min(2, "Plan name must be at least 2 characters")
    .max(100, "Plan name cannot exceed 100 characters")
    .trim(),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  durationDays: z
    .number()
    .int("Duration must be a whole number")
    .min(1, "Duration must be at least 1 day"),

  basePrice: z
    .number()
    .min(0, "Price cannot be negative"),
});

export const updatePlanSchema = createPlanSchema.partial();

export const togglePlanSchema = z.object({
  isActive: z.boolean(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type TogglePlanInput = z.infer<typeof togglePlanSchema>;