"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Skeleton,
  Chip,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import {
  EditOutlined,
  DeleteOutlined,
  PowerSettingsNewOutlined,
} from "@mui/icons-material";
import { useToast } from "@/context/ToastContext";
import { plansApi } from "@/lib/api/plans.api";
import { Plan, PlanFormData } from "@/types/plan.types";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PageHeader from "@/components/layout/PageHeader";

// ─── Empty form state ─────────────────────────────────────────────────────────

const EMPTY_FORM: PlanFormData = {
  name: "",
  durationDays: 30,
  basePrice: 0,
  description: "",
};

// ─── Plan Form Dialog ─────────────────────────────────────────────────────────

function PlanFormDialog({
  open,
  plan,
  onClose,
  onSaved,
}: {
  open: boolean;
  plan: Plan | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const isEdit = !!plan;

  const [form, setForm] = useState<PlanFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof PlanFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (open) {
      if (plan) {
        setForm({
          name: plan.name,
          durationDays: plan.durationDays,
          basePrice: plan.basePrice,
          description: plan.description || "",
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
      setApiError(null);
    }
  }, [open, plan]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PlanFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = "Plan name is required";
    if (form.name.trim().length > 100) newErrors.name = "Name must be under 100 characters";
    if (!form.durationDays || form.durationDays < 1) newErrors.durationDays = "Duration must be at least 1 day";
    if (form.durationDays > 365) newErrors.durationDays = "Duration cannot exceed 365 days";
    if (form.basePrice < 0) newErrors.basePrice = "Price cannot be negative";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setApiError(null);
    try {
      const payload: PlanFormData = {
        name: form.name.trim(),
        durationDays: Number(form.durationDays),
        basePrice: Number(form.basePrice),
        description: form.description?.trim() || undefined,
      };
      if (isEdit && plan) {
        await plansApi.update(plan._id, payload);
        showToast("Plan updated successfully");
      } else {
        await plansApi.create(payload);
        showToast("Plan created successfully");
      }
      onSaved();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setApiError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof PlanFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ elevation: 0, sx: { borderRadius: "16px", border: "1px solid #E2E8F0" } }}
    >
      <DialogTitle sx={{ pb: 1, pt: 2.5, px: 3, fontWeight: 700, fontSize: "1rem", color: "#111827" }}>
        {isEdit ? "Edit Plan" : "Add New Plan"}
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 1 }}>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{apiError}</Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
          <TextField
            label="Plan Name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            placeholder="e.g. Monthly Plan, Quarterly Plan"
            autoFocus
          />

          <TextField
            label="Duration"
            type="number"
            value={form.durationDays}
            onChange={(e) => handleChange("durationDays", e.target.value)}
            error={!!errors.durationDays}
            helperText={errors.durationDays || "Number of days the membership is valid"}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Typography variant="caption" color="text.secondary">days</Typography>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Base Price"
            type="number"
            value={form.basePrice}
            onChange={(e) => handleChange("basePrice", e.target.value)}
            error={!!errors.basePrice}
            helperText={errors.basePrice || "Base price before any pricing rule multipliers"}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">Rs.</InputAdornment>
              ),
            }}
          />

          <TextField
            label="Description (optional)"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder="Brief description of what this plan includes"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Plan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const { showToast } = useToast();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"delete" | "toggle" | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await plansApi.getAll();
      setPlans(response.data || []);
    } catch {
      setError("Failed to load plans. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Open add form
  const handleAdd = () => {
    setEditingPlan(null);
    setFormOpen(true);
  };

  // Open edit form
  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormOpen(true);
  };

  // Open toggle confirm
  const handleToggleConfirm = (plan: Plan) => {
    setSelectedPlan(plan);
    setConfirmAction("toggle");
    setConfirmOpen(true);
  };

  // Open delete confirm
  const handleDeleteConfirm = (plan: Plan) => {
    setSelectedPlan(plan);
    setConfirmAction("delete");
    setConfirmOpen(true);
  };

  // Execute confirmed action
  const handleConfirm = async () => {
    if (!selectedPlan || !confirmAction) return;
    setIsActioning(true);
    try {
      if (confirmAction === "toggle") {
        await plansApi.toggle(selectedPlan._id, selectedPlan.isActive);
        showToast(
          selectedPlan.isActive
            ? `${selectedPlan.name} deactivated`
            : `${selectedPlan.name} activated`
        );
      } else {
        await plansApi.delete(selectedPlan._id);
        showToast(`${selectedPlan.name} deleted`);
      }
      setConfirmOpen(false);
      fetchPlans();
    } catch {
      showToast("Action failed. Please try again.", "error");
    } finally {
      setIsActioning(false);
    }
  };

  const formatCurrency = (n: number) => `Rs.${n.toLocaleString("en-IN")}`;

  const activePlans = plans.filter((p) => p.isActive).length;
  const inactivePlans = plans.filter((p) => !p.isActive).length;

  return (
    <Box>
    <PageHeader
        title="Plans"
        subtitle={
            isLoading
            ? "Loading..."
            : `${plans.length} plan${plans.length !== 1 ? "s" : ""} - ${activePlans} active, ${inactivePlans} inactive`
        }
        action={{
            label: "Add Plan",
            onClick: handleAdd,
        }}
        />
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                {["Plan Name", "Duration", "Base Price", "Status", "Actions"].map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      color: "#6B7280",
                      py: 1.5,
                      borderBottom: "1px solid #E2E8F0",
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5].map((j) => (
                      <TableCell key={j} sx={{ py: 2 }}>
                        <Skeleton height={20} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 8, textAlign: "center" }}>
                    <Typography sx={{ fontSize: "0.9rem", color: "#6B7280", fontWeight: 500, mb: 1 }}>
                      No plans created yet
                    </Typography>
                    <Typography sx={{ fontSize: "0.8rem", color: "#9CA3AF" }}>
                      Click Add Plan to create your first membership plan
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow
                    key={plan._id}
                    sx={{
                      "&:last-child td": { border: 0 },
                      "&:hover": { backgroundColor: "#FAFAFA" },
                      opacity: plan.isActive ? 1 : 0.6,
                    }}
                  >
                    <TableCell sx={{ py: 2 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: "0.88rem", color: "#111827" }}>
                        {plan.name}
                      </Typography>
                      {plan.description && (
                        <Typography sx={{ fontSize: "0.75rem", color: "#9CA3AF", fontWeight: 500, mt: 0.25 }}>
                          {plan.description}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ py: 2 }}>
                      <Typography sx={{ fontSize: "0.85rem", color: "#374151", fontWeight: 500 }}>
                        {plan.durationDays} days
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ py: 2 }}>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#111827" }}>
                        {formatCurrency(plan.basePrice)}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ py: 2 }}>
                      <Chip
                        label={plan.isActive ? "Active" : "Inactive"}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          backgroundColor: plan.isActive ? "#F0FDF4" : "#F9FAFB",
                          color: plan.isActive ? "#15803D" : "#6B7280",
                          border: `1px solid ${plan.isActive ? "#BBF7D0" : "#E5E7EB"}`,
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="Edit plan">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(plan)}
                            sx={{ color: "#6B7280", "&:hover": { color: "#1D4ED8", backgroundColor: "#EFF6FF" } }}
                          >
                            <EditOutlined sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={plan.isActive ? "Deactivate" : "Activate"}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleConfirm(plan)}
                            sx={{
                              color: "#6B7280",
                              "&:hover": {
                                color: plan.isActive ? "#B45309" : "#15803D",
                                backgroundColor: plan.isActive ? "#FFFBEB" : "#F0FDF4",
                              },
                            }}
                          >
                            <PowerSettingsNewOutlined sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete plan">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteConfirm(plan)}
                            sx={{ color: "#6B7280", "&:hover": { color: "#DC2626", backgroundColor: "#FEF2F2" } }}
                          >
                            <DeleteOutlined sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Plan Form Dialog */}
      <PlanFormDialog
        open={formOpen}
        plan={editingPlan}
        onClose={() => setFormOpen(false)}
        onSaved={fetchPlans}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title={
          confirmAction === "delete"
            ? "Delete Plan"
            : selectedPlan?.isActive
            ? "Deactivate Plan"
            : "Activate Plan"
        }
        message={
          confirmAction === "delete"
            ? `Are you sure you want to delete "${selectedPlan?.name}"? This cannot be undone.`
            : selectedPlan?.isActive
            ? `Deactivating "${selectedPlan?.name}" will hide it from new member registration. Existing members are not affected.`
            : `Activating "${selectedPlan?.name}" will make it available for new member registration.`
        }
        confirmLabel={
          confirmAction === "delete"
            ? "Delete"
            : selectedPlan?.isActive
            ? "Deactivate"
            : "Activate"
        }
        confirmColor={confirmAction === "delete" ? "error" : "primary"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
        isLoading={isActioning}
      />
    </Box>
  );
}