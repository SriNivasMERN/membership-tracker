"use client";

import { useState, useEffect, useCallback, useRef, type WheelEvent } from "react";
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
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AddOutlined,
  TaskAltOutlined,
  EditOutlined,
  DeleteOutlined,
  SellOutlined,
  TimerOutlined,
  BlockOutlined,
} from "@mui/icons-material";
import { useToast } from "@/context/ToastContext";
import { plansApi } from "@/lib/api/plans.api";
import { Plan, PlanFormData } from "@/types/plan.types";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import {
  MODULE_ACTION_ICON_SX,
  MODULE_CARD_SX,
  MODULE_COLORS,
  MODULE_DIALOG_ACTIONS_SX,
  MODULE_DIALOG_CONTENT_SX,
  MODULE_DIALOG_PAPER_SX,
  MODULE_DIALOG_TITLE_SX,
  MODULE_FIELD_SX,
  MODULE_NEUTRAL_CHIP_SX,
  MODULE_PAGE_SX,
  MODULE_SUCCESS_CHIP_SX,
  MODULE_TABLE_CONTAINER_SX,
  MODULE_TABLE_HEAD_CELL_SX,
  MODULE_TABLE_ROW_SX,
  MODULE_WARNING_CHIP_SX,
  ModuleDashboardStat,
} from "@/components/ui/moduleStyles";

// ─── Empty form state ─────────────────────────────────────────────────────────

const EMPTY_FORM: PlanFormData = {
  name: "",
  durationDays: 30,
  basePrice: 0,
  description: "",
};

const C = {
  navy: MODULE_COLORS.ink,
  slate: MODULE_COLORS.slate,
  muted: MODULE_COLORS.muted,
  border: MODULE_COLORS.border,
  surface: MODULE_COLORS.surface,
  green: MODULE_COLORS.green,
  red: MODULE_COLORS.red,
  amber: MODULE_COLORS.amber,
};

const PRICE_COLUMN_FRAME_WIDTH = 140;
const PLAN_COLUMN_WIDTH = "22%";
const DURATION_COLUMN_WIDTH = "15%";
const PRICE_COLUMN_WIDTH = "21%";
const STATUS_COLUMN_WIDTH = "14%";
const ACTIONS_COLUMN_WIDTH = "14%";

function preventNumberScroll(event: WheelEvent<HTMLInputElement>) {
  event.currentTarget.blur();
}

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
  const dialogContentRef = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

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

  useEffect(() => {
    if (apiError) {
      dialogContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [apiError]);

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
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth fullScreen={fullScreen}
      PaperProps={{ elevation: 0, sx: MODULE_DIALOG_PAPER_SX }}
    >
      <DialogTitle sx={MODULE_DIALOG_TITLE_SX}>
        {isEdit ? "Edit Plan" : "Add New Plan"}
      </DialogTitle>

      <DialogContent ref={dialogContentRef} sx={MODULE_DIALOG_CONTENT_SX}>
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
            sx={MODULE_FIELD_SX}
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
            inputProps={{ onWheel: preventNumberScroll }}
            sx={MODULE_FIELD_SX}
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
            inputProps={{ onWheel: preventNumberScroll }}
            sx={MODULE_FIELD_SX}
          />

          <TextField
            label="Description (optional)"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder="Brief description of what this plan includes"
            sx={MODULE_FIELD_SX}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={MODULE_DIALOG_ACTIONS_SX}>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={20} color="inherit" /> : isEdit ? "Save Changes" : "Create Plan"}
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
  const pricedPlans = plans.filter((p) => p.basePrice > 0).length;
  const getActionIconSx = (tone: "primary" | "toggle" | "danger") => ({
    ...MODULE_ACTION_ICON_SX,
    color:
      tone === "danger"
        ? "#8A6B65"
        : tone === "toggle"
          ? "#8F5D26"
          : "#667085",
    "&:hover": {
      color:
        tone === "danger"
          ? C.red
          : tone === "toggle"
            ? C.amber
            : C.navy,
      backgroundColor:
        tone === "danger"
          ? "rgba(251,239,234,0.95)"
          : tone === "toggle"
            ? "rgba(252,244,233,0.96)"
            : "rgba(248,242,235,0.96)",
      transform: "translateY(-1px)",
    },
  });

  return (
    <Box sx={MODULE_PAGE_SX}>
      <Paper
        elevation={0}
        sx={{
          ...MODULE_CARD_SX,
          p: { xs: 1.2, sm: 1.35 },
          background:
            "radial-gradient(circle at top left, rgba(240,230,217,0.5) 0%, rgba(255,255,255,0) 30%), linear-gradient(180deg, rgba(255,255,255,0.995) 0%, rgba(252,247,241,0.985) 100%)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "stretch",
            justifyContent: "space-between",
            flexDirection: { xs: "column", xl: "row" },
            gap: 1.1,
          }}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
              gap: 1.1,
            }}
          >
            {!isLoading ? (
              <>
                <ModuleDashboardStat
                  label="Overall Plans"
                  value={String(plans.length)}
                  helper="All configured plans"
                  icon={<SellOutlined sx={{ fontSize: 18 }} />}
                  compact
                />
                <ModuleDashboardStat
                  label="Active"
                  value={String(activePlans)}
                  helper="Currently bookable plans"
                  icon={<TaskAltOutlined sx={{ fontSize: 18 }} />}
                  tone="success"
                  compact
                />
                <ModuleDashboardStat
                  label="Inactive"
                  value={String(inactivePlans)}
                  helper="Hidden from new entries"
                  icon={<BlockOutlined sx={{ fontSize: 18 }} />}
                  tone="warning"
                  compact
                />
                <ModuleDashboardStat
                  label="Priced Plans"
                  value={String(pricedPlans)}
                  helper="Plans with base pricing"
                  icon={<TimerOutlined sx={{ fontSize: 18 }} />}
                  compact
                />
              </>
            ) : (
              <>
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} variant="rounded" height={96} sx={{ borderRadius: "14px" }} />
                ))}
              </>
            )}
          </Box>
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={handleAdd}
            sx={{ px: 1.75, minHeight: 44, minWidth: { xs: "auto", xl: 148 }, alignSelf: { xs: "flex-start", xl: "center" } }}
          >
            Add Plan
          </Button>
        </Box>
      </Paper>

      {error ? <ErrorState message={error} onRetry={fetchPlans} /> : null}

      <Paper
        elevation={0}
        sx={{
          ...MODULE_CARD_SX,
          overflow: "hidden",
        }}
      >
        <TableContainer sx={MODULE_TABLE_CONTAINER_SX}>
          <Table
            sx={{
              width: "100%",
              tableLayout: { xs: "fixed", lg: "auto" },
              minWidth: { xs: 720, sm: 760, md: "100%" },
            }}
          >
            <TableHead>
              <TableRow
                sx={{
                  background:
                    "linear-gradient(180deg, rgba(252,247,241,0.98) 0%, rgba(247,240,231,0.96) 100%)",
                }}
              >
                {["Plan", "Duration", "Base Price", "Status", "Actions"].map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      ...MODULE_TABLE_HEAD_CELL_SX,
                      whiteSpace: "nowrap",
                      width:
                        h === "Plan"
                          ? PLAN_COLUMN_WIDTH
                          : h === "Duration"
                            ? DURATION_COLUMN_WIDTH
                          : h === "Base Price"
                            ? PRICE_COLUMN_WIDTH
                          : h === "Status"
                            ? STATUS_COLUMN_WIDTH
                          : h === "Actions"
                            ? ACTIONS_COLUMN_WIDTH
                            : "auto",
                      textAlign: h === "Actions" ? "center" : "left",
                    }}
                  >
                    {h === "Plan" ? (
                      <Box sx={{ width: "100%", textAlign: "center" }}>{h}</Box>
                    ) : h === "Base Price" ? (
                      <Box
                        sx={{
                          width: PRICE_COLUMN_FRAME_WIDTH,
                          maxWidth: "100%",
                          mx: "auto",
                          textAlign: "left",
                          pl: 1.3,
                          boxSizing: "border-box",
                        }}
                      >
                        {h}
                      </Box>
                    ) : (
                      h
                    )}
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
                  <TableCell colSpan={5} sx={{ border: 0, p: 0 }}>
                    <EmptyState
                      title="No plans created yet"
                      subtitle="Add your first plan to start assigning memberships."
                      actionLabel="Add Plan"
                      onAction={handleAdd}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow
                    key={plan._id}
                    sx={{
                      ...MODULE_TABLE_ROW_SX,
                      "&:last-child td": { border: 0 },
                      opacity: plan.isActive ? 1 : 0.6,
                    }}
                  >
                    <TableCell sx={{ py: 1.6, width: PLAN_COLUMN_WIDTH, textAlign: "center", px: 0.9 }}>
                      <Box
                        sx={{
                          display: "inline-flex",
                          flexDirection: "column",
                          alignItems: "center",
                          minWidth: 0,
                          maxWidth: "100%",
                          mx: "auto",
                          textAlign: "center",
                          boxSizing: "border-box",
                        }}
                      >
                        <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: "#111827" }}>
                          {plan.name}
                        </Typography>
                        {plan.description && (
                          <Typography sx={{ fontSize: "0.74rem", color: C.muted, fontWeight: 600, mt: 0.3 }}>
                            {plan.description}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell sx={{ py: 1.6, width: DURATION_COLUMN_WIDTH, px: 0.85 }}>
                      <Typography
                        sx={{
                          fontSize: "0.95rem",
                          color: C.navy,
                          fontWeight: 700,
                          letterSpacing: 0.01,
                        }}
                      >
                        {plan.durationDays} days
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ py: 1.6, textAlign: "center", width: PRICE_COLUMN_WIDTH, px: 0.8 }}>
                      <Box sx={{ width: PRICE_COLUMN_FRAME_WIDTH, maxWidth: "100%", mx: "auto", textAlign: "left" }}>
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            width: "100%",
                            px: 1,
                            py: 0.45,
                            borderRadius: "999px",
                            border: `1px solid ${C.border}`,
                            background:
                              "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(249,244,237,0.97) 100%)",
                            lineHeight: 1,
                            boxSizing: "border-box",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: "0.88rem",
                              fontWeight: 800,
                              color: "#111827",
                              letterSpacing: 0.01,
                            }}
                          >
                            {formatCurrency(plan.basePrice)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ py: 1.6, width: STATUS_COLUMN_WIDTH, px: 0.7, textAlign: "left" }}>
                      <Chip
                        label={plan.isActive ? "Active" : "Inactive"}
                        size="small"
                        sx={plan.isActive ? MODULE_SUCCESS_CHIP_SX : MODULE_NEUTRAL_CHIP_SX}
                      />
                    </TableCell>

                    <TableCell sx={{ py: 1.6, textAlign: "center", width: ACTIONS_COLUMN_WIDTH, px: 0.35 }}>
                      <Box sx={{ display: "flex", gap: 0.05, justifyContent: "center" }}>
                        <Tooltip title="Edit plan">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(plan)}
                            sx={{ ...getActionIconSx("primary"), p: 0.55 }}
                          >
                            <EditOutlined sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={plan.isActive ? "Deactivate" : "Activate"}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleConfirm(plan)}
                            sx={{ ...getActionIconSx("toggle"), p: 0.55 }}
                          >
                            {plan.isActive ? (
                              <BlockOutlined sx={{ fontSize: 16 }} />
                            ) : (
                              <TaskAltOutlined sx={{ fontSize: 16 }} />
                            )}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete plan">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteConfirm(plan)}
                            sx={{ ...getActionIconSx("danger"), p: 0.55 }}
                          >
                            <DeleteOutlined sx={{ fontSize: 16 }} />
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
