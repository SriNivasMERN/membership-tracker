import { z } from "zod";

// Time format validation - must be HH:MM format
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createSlotSchema = z
  .object({
    label: z
      .string()
      .min(2, "Label must be at least 2 characters")
      .max(50, "Label cannot exceed 50 characters")
      .trim(),

    startTime: z
      .string()
      .regex(timeRegex, "Start time must be in HH:MM format (e.g. 06:00)"),

    endTime: z
      .string()
      .regex(timeRegex, "End time must be in HH:MM format (e.g. 08:00)"),
  })
  .refine(
    (data) => data.startTime < data.endTime,
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export const updateSlotSchema = z
  .object({
    label: z
      .string()
      .min(2, "Label must be at least 2 characters")
      .max(50, "Label cannot exceed 50 characters")
      .trim()
      .optional(),

    startTime: z
      .string()
      .regex(timeRegex, "Start time must be in HH:MM format")
      .optional(),

    endTime: z
      .string()
      .regex(timeRegex, "End time must be in HH:MM format")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.startTime < data.endTime;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export const toggleSlotSchema = z.object({
  isActive: z.boolean(),
});

export type CreateSlotInput = z.infer<typeof createSlotSchema>;
export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;
export type ToggleSlotInput = z.infer<typeof toggleSlotSchema>;