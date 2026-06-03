"use client";

import { useState, useEffect } from "react";
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
import PageHeader from "@/components/layout/PageHeader";

// Helper - client side only
function getTodayString() {
  return new Date().toISOString().split("T")[0];
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

  if (isLoadingOptions) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
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

      <PageHeader title="Add Member" subtitle="Create a new membership record" />

      {apiError && (
        <Alert severity="error" sx={{ mb: 3 }}>{apiError}</Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 4 },
          border: "1px solid #E2E8F0",
          boxShadow: "none",
          borderRadius: "12px",
          maxWidth: 800,
        }}
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* Personal Details */}
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, mb: 2 }}>
            Personal Details
          </Typography>

          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register("name")}
                label="Full Name"
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register("mobile")}
                label="Mobile Number"
                fullWidth
                error={!!errors.mobile}
                helperText={errors.mobile?.message}
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
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* Membership Details */}
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, mb: 2 }}>
            Membership Details
          </Typography>

          <Grid container spacing={2.5} sx={{ mb: 4 }}>
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
              />
            </Grid>

            {/* Price info banner */}
            {selectedPlan && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: "#EFF6FF",
                    borderRadius: "8px",
                    border: "1px solid #BFDBFE",
                  }}
                >
                  <Typography sx={{ fontSize: "0.78rem", color: "#1D4ED8", fontWeight: 600 }}>
                    Base price: Rs.{selectedPlan.basePrice.toLocaleString("en-IN")} &nbsp;|&nbsp;
                    Duration: {selectedPlan.durationDays} days
                    {calculatedPrice && calculatedPrice !== selectedPlan.basePrice && (
                      <span> &nbsp;|&nbsp; Pricing rule applied: Rs.{calculatedPrice.toLocaleString("en-IN")}</span>
                    )}
                  </Typography>
                </Box>
              </Grid>
            )}

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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">Rs.</InputAdornment>
                      ),
                    }}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* Notes */}
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, mb: 2 }}>
            Additional Notes
          </Typography>

          <TextField
            {...register("notes")}
            label="Notes (optional)"
            multiline
            rows={3}
            fullWidth
            sx={{ mb: 4 }}
            error={!!errors.notes}
            helperText={errors.notes?.message}
          />

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => router.push("/members")}
              disabled={isSubmitting}
              sx={{ borderRadius: "8px" }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{ minWidth: 140, borderRadius: "8px" }}
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