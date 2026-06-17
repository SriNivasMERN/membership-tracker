import { z } from "zod";

// ObjectId validation regex
const objectIdRegex = /^[a-f\d]{24}$/i;

export const createMemberSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),

  mobile: z
    .string()
    .min(10, "Mobile number must be at least 10 digits")
    .max(15, "Mobile number cannot exceed 15 digits")
    .regex(/^\d+$/, "Mobile number must contain only digits"),

  email: z
    .string()
    .email("Invalid email format")
    .optional(),

  photo: z
    .string()
    .url("Invalid photo URL")
    .optional(),

  planId: z
    .string()
    .regex(objectIdRegex, "Invalid plan ID"),

  slotId: z
    .string()
    .regex(objectIdRegex, "Invalid slot ID"),

  startDate: z
    .string()
    .min(1, "Start date is required"),

  // finalPrice can be overridden by staff before saving
  finalPrice: z
    .number()
    .min(0, "Final price cannot be negative")
    .optional(),

  // Initial payment at time of creation
  initialPayment: z
    .number()
    .min(0, "Payment cannot be negative")
    .optional(),

  notes: z
    .string()
    .max(500, "Notes cannot exceed 500 characters")
    .optional(),
});

export const updateMemberSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .trim()
    .optional(),

  email: z
    .string()
    .email("Invalid email format")
    .optional(),

  mobile: z
    .string()
    .min(10, "Mobile number must be at least 10 digits")
    .max(15, "Mobile number cannot exceed 15 digits")
    .regex(/^\d+$/, "Mobile number must contain only digits")
    .optional(),

  notes: z
    .string()
    .max(500, "Notes cannot exceed 500 characters")
    .optional(),
});

export const addPaymentSchema = z.object({
  amount: z
    .number()
    .min(1, "Payment amount must be at least 1"),

  paidOn: z
    .string()
    .min(1, "Payment date is required"),

  note: z
    .string()
    .max(200, "Note cannot exceed 200 characters")
    .optional(),
});

export const renewMemberSchema = z.object({
  planId: z
    .string()
    .regex(objectIdRegex, "Invalid plan ID")
    .optional(),

  slotId: z
    .string()
    .regex(objectIdRegex, "Invalid slot ID")
    .optional(),

  startDate: z
    .string()
    .min(1, "Start date is required"),

  finalPrice: z
    .number()
    .min(0, "Final price cannot be negative")
    .optional(),

  initialPayment: z
    .number()
    .min(0, "Payment cannot be negative")
    .optional(),
});

export const endMembershipSchema = z.object({
  effectiveEndDate: z
    .string()
    .min(1, "Effective end date is required"),

  settlementDeduction: z
    .number()
    .min(0, "Settlement deduction cannot be negative")
    .optional(),

  note: z
    .string()
    .max(300, "Note cannot exceed 300 characters")
    .optional(),
});

export const revertEndMembershipSchema = z.object({});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type AddPaymentInput = z.infer<typeof addPaymentSchema>;
export type RenewMemberInput = z.infer<typeof renewMemberSchema>;
export type EndMembershipInput = z.infer<typeof endMembershipSchema>;
export type RevertEndMembershipInput = z.infer<typeof revertEndMembershipSchema>;
