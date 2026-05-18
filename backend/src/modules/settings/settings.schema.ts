import { z } from "zod";

const terminologySchema = z.object({
  planLabel: z.string().min(1, "Plan label is required").default("Plan"),
  slotLabel: z.string().min(1, "Slot label is required").default("Slot"),
  memberLabel: z.string().min(1, "Member label is required").default("Member"),
});

export const createSettingsSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name cannot exceed 100 characters")
    .trim(),

  businessType: z.enum([
    "gym",
    "yoga_studio",
    "coaching_center",
    "library",
    "sports_facility",
    "clinic",
    "other",
  ], { errorMap: () => ({ message: "Invalid business type" }) }),

  email: z.string().email("Invalid email format").optional(),
  phone: z.string().min(10, "Invalid phone number").optional(),
  address: z.string().max(200, "Address too long").optional(),
  logoUrl: z.string().url("Invalid logo URL").optional(),

  terminology: terminologySchema.optional(),

  expiryAlertDays: z
    .number()
    .min(1, "Alert days must be at least 1")
    .max(90, "Alert days cannot exceed 90")
    .default(7),
});

export const updateSettingsSchema = createSettingsSchema.partial();

export type CreateSettingsInput = z.infer<typeof createSettingsSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;