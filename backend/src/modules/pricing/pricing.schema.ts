import { z } from "zod";

export const createPricingRuleSchema = z.object({
  planId: z
    .string()
    .min(1, "Plan is required")
    .regex(/^[a-f\d]{24}$/i, "Invalid plan ID"),

  slotId: z
    .string()
    .min(1, "Slot is required")
    .regex(/^[a-f\d]{24}$/i, "Invalid slot ID"),

  multiplier: z
    .number()
    .min(0.1, "Multiplier must be at least 0.1")
    .max(10, "Multiplier cannot exceed 10"),

  isActive: z.boolean().default(true),
});

export const updatePricingRuleSchema = z.object({
  multiplier: z
    .number()
    .min(0.1, "Multiplier must be at least 0.1")
    .max(10, "Multiplier cannot exceed 10")
    .optional(),

  isActive: z.boolean().optional(),
});

export type CreatePricingRuleInput = z.infer<typeof createPricingRuleSchema>;
export type UpdatePricingRuleInput = z.infer<typeof updatePricingRuleSchema>;