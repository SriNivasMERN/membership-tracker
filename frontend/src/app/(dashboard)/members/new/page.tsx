"use client";

import { useState, useEffect, type WheelEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  InputAdornment,
} from "@mui/material";
import { ArrowBackOutlined } from "@mui/icons-material";
import { Plan } from "@/types/plan.types";
import { Slot } from "@/types/slot.types";
import { plansApi } from "@/lib/api/plans.api";
import { slotsApi } from "@/lib/api/slots.api";
import { pricingApi } from "@/lib/api/pricing.api";
import { membersApi } from "@/lib/api/members.api";
import { useToast } from "@/context/ToastContext";
import {
  MODULE_CARD_SX,
  MODULE_COLORS,
  MODULE_FIELD_SX,
  ModuleInfoStrip,
  MODULE_PAGE_SX,
} from "@/components/ui/moduleStyles";

// Helper - client side only
function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function preventNumberScroll(event: WheelEvent<HTMLInputElement>) {
  event.currentTarget.blur();
}

const createMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  mobile: z
    .string()
    .min(10, "Mobile must be at least 10 digits")
    .max(15, "Mobile too long")
    .regex(/^\d+$/, "Mobile must contain only digits"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  planId: z.string().min(1, "Please select a plan"),
  slotId: z.string().min(1, "Please select a slot"),
  startDate: z.string().min(1, "Start date is required"),
  finalPrice: z.number().min(0, "Price cannot be negative"),
  initialPayment: z.number().min(0, "Payment cannot be negative").optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

type CreateMemberFormData = z.infer<typeof createMemberSchema>;

export default function AddMemberPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateMemberFormData>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: {
      finalPrice: 0,
      initialPayment: 0,
      startDate: getTodayString(), // Default to today
    },
  });

  const selectedPlanId = watch("planId");
  const selectedSlotId = watch("slotId");

  // Load plans and slots on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [plansRes, slotsRes] = await Promise.all([
          plansApi.getActive(),
          slotsApi.getActive(),
        ]);
        setPlans(plansRes.data || []);
        setSlots(slotsRes.data || []);
      } catch {
        setApiError("Failed to load plans and slots.");
      } finally {
        setIsLoadingOptions(false);
      }
    };
    loadOptions();
  }, []);

  // Auto calculate price when plan or slot changes
  useEffect(() => {
    if (!selectedPlanId || !selectedSlotId) return;

    const selectedPlan = plans.find((p) => p._id === selectedPlanId);
    if (!selectedPlan) return;

    const calculatePrice = async () => {
      setIsCalculating(true);
      try {
        // Fixed: use calculate(planId, slotId) not calculatePrice
        const response = await pricingApi.calculate(selectedPlanId, selectedSlotId);
        const price = response.data?.finalPrice || selectedPlan.basePrice;
        setCalculatedPrice(price);
        setValue("finalPrice", price);
      } catch {
        // Fallback to base price if no pricing rule exists
        setValue("finalPrice", selectedPlan.basePrice);
        setCalculatedPrice(selectedPlan.basePrice);
      } finally {
        setIsCalculating(false);
      }
    };

    calculatePrice();
  }, [selectedPlanId, selectedSlotId, plans, setValue]);

  const onSubmit = async (data: CreateMemberFormData) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      await membersApi.create({
        ...data,
        email: data.email || undefined,
        notes: data.notes || undefined,
        initialPayment: data.initialPayment || 0,
      });
      showToast("Member added successfully");
      router.push("/members");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setApiError(err.response?.data?.message || "Failed to create member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPlan = plans.find((p) => p._id === selectedPlanId);
  const selectedSlot = slots.find((s) => s._id === selectedSlotId);

  if (isLoadingOptions) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={MODULE_PAGE_SX}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Button
          startIcon={<ArrowBackOutlined />}
          onClick={() => router.push("/members")}
          color="inherit"
          size="small"
        >
          Back to Members
        </Button>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.45 }}>
        <Typography sx={{ fontSize: "2rem", fontWeight: 800, color: "#111827", lineHeight: 1.15 }}>
          Add Member
        </Typography>
        <Typography sx={{ fontSize: "0.9rem", color: MODULE_COLORS.slate, fontWeight: 600 }}>
          Create a new membership record
        </Typography>
      </Box>

      {apiError && (
        <Alert severity="error" sx={{ mb: 3 }}>{apiError}</Alert>
      )}

      <Paper elevation={0} sx={{ ...MODULE_CARD_SX, p: { xs: 2.25, sm: 3 }, borderRadius: "14px" }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {(selectedPlan || selectedSlot) && (
            <Box sx={{ mb: 2.25 }}>
              <ModuleInfoStrip
                title="Selection Snapshot"
                message={[
                  selectedPlan ? `${selectedPlan.name} | ${selectedPlan.durationDays} days | Rs.${selectedPlan.basePrice.toLocaleString("en-IN")}` : null,
                  selectedSlot ? `${selectedSlot.label} | ${selectedSlot.startTime} - ${selectedSlot.endTime}` : null,
                  calculatedPrice && selectedPlan && calculatedPrice !== selectedPlan.basePrice
                    ? `Pricing rule applied: Rs.${calculatedPrice.toLocaleString("en-IN")}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" | ")}
              />
            </Box>
          )}

          {/* Personal Details */}
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: MODULE_COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5 }}>
            Personal Details
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register("name")}
                label="Full Name"
                fullWidth
                autoFocus
                error={!!errors.name}
                helperText={errors.name?.message}
                sx={MODULE_FIELD_SX}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register("mobile")}
                label="Mobile Number"
                fullWidth
                error={!!errors.mobile}
                helperText={errors.mobile?.message}
                sx={MODULE_FIELD_SX}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register("email")}
                label="Email (optional)"
                type="email"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={MODULE_FIELD_SX}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2.5 }} />

          {/* Membership Details */}
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: MODULE_COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5 }}>
            Membership Details
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="planId"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Membership Plan"
                    fullWidth
                    error={!!errors.planId}
                    helperText={errors.planId?.message}
                    sx={MODULE_FIELD_SX}
                  >
                    {plans.length === 0 ? (
                      <MenuItem disabled>No active plans</MenuItem>
                    ) : (
                      plans.map((plan) => (
                        <MenuItem key={plan._id} value={plan._id}>
                          <Box>
                            <Typography variant="body2">{plan.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {plan.durationDays} days - Rs.{plan.basePrice.toLocaleString("en-IN")}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="slotId"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Time Slot"
                    fullWidth
                    error={!!errors.slotId}
                    helperText={errors.slotId?.message}
                    sx={MODULE_FIELD_SX}
                  >
                    {slots.length === 0 ? (
                      <MenuItem disabled>No active slots</MenuItem>
                    ) : (
                      slots.map((slot) => (
                        <MenuItem key={slot._id} value={slot._id}>
                          <Box>
                            <Typography variant="body2">{slot.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {slot.startTime} - {slot.endTime}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </TextField>
                )}
              />
            </Grid>

            {/* Start date - defaults to today */}
            <Grid item xs={12} sm={6}>
              <TextField
                {...register("startDate")}
                label="Start Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.startDate}
                helperText={errors.startDate?.message || "Defaults to today"}
                sx={MODULE_FIELD_SX}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="finalPrice"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Final Price"
                    type="number"
                    fullWidth
                    error={!!errors.finalPrice}
                    helperText={errors.finalPrice?.message || "Auto-calculated. Override if needed."}
                    sx={MODULE_FIELD_SX}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">Rs.</InputAdornment>
                      ),
                      endAdornment: isCalculating ? (
                        <InputAdornment position="end">
                          <CircularProgress size={16} />
                        </InputAdornment>
                      ) : null,
                    }}
                    inputProps={{ onWheel: preventNumberScroll }}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="initialPayment"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Initial Payment"
                    type="number"
                    fullWidth
                    helperText="Amount paid at registration"
                    sx={MODULE_FIELD_SX}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">Rs.</InputAdornment>
                      ),
                    }}
                    inputProps={{ onWheel: preventNumberScroll }}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2.5 }} />

          {/* Notes */}
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: MODULE_COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5, mb: 1.5 }}>
            Additional Notes
          </Typography>

          <TextField
            {...register("notes")}
            label="Notes (optional)"
            multiline
            rows={3}
            fullWidth
            sx={{ ...MODULE_FIELD_SX, mb: 2.75 }}
            error={!!errors.notes}
            helperText={errors.notes?.message}
          />

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => router.push("/members")}
              disabled={isSubmitting}
              sx={{ borderRadius: "10px" }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{ minWidth: 140, borderRadius: "10px" }}
            >
              {isSubmitting ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "Add Member"
              )}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
