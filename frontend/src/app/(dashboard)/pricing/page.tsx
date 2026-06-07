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
  MenuItem,
  Alert,
  Skeleton,
  Chip,
  Tooltip,
  Switch,
  FormControlLabel,
  InputAdornment,
} from "@mui/material";
import {
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@mui/icons-material";
import { useToast } from "@/context/ToastContext";
import { pricingApi, PricingRuleFormData } from "@/lib/api/pricing.api";
import { plansApi } from "@/lib/api/plans.api";
import { slotsApi } from "@/lib/api/slots.api";
import { Plan } from "@/types/plan.types";
import { Slot } from "@/types/slot.types";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";

// ─── Types for populated pricing rule from backend ────────────────────────────

interface PopulatedPlan {
  _id: string;
  name: string;
  basePrice: number;
  isActive: boolean;
}

interface PopulatedSlot {
  _id: string;
  label: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface PricingRule {
  _id: string;
  planId: PopulatedPlan;
  slotId: PopulatedSlot;
  multiplier: number;
  isActive: boolean;
  createdAt: string;
}

const C = {
  navy: "#1E3A5F",
  slate: "#334155",
  muted: "#64748B",
  border: "#E2E8F0",
  surface: "#F8FAFC",
  green: "#15803D",
  amber: "#92400E",
};

function SummaryStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
}) {
  const styles =
    tone === "success"
      ? { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0", valueColor: C.green }
      : tone === "warning"
        ? { backgroundColor: "#FFFBEB", borderColor: "#FDE68A", valueColor: C.amber }
        : { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE", valueColor: C.navy };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.4,
        borderRadius: "14px",
        border: `1px solid ${styles.borderColor}`,
        backgroundColor: styles.backgroundColor,
        minWidth: 132,
      }}
    >
      <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.45, fontSize: "1.08rem", fontWeight: 900, color: styles.valueColor }}>
        {value}
      </Typography>
    </Paper>
  );
}

// ─── Pricing Rule Form Dialog ─────────────────────────────────────────────────

function PricingFormDialog({
  open,
  rule,
  plans,
  slots,
  onClose,
  onSaved,
}: {
  open: boolean;
  rule: PricingRule | null;
  plans: Plan[];
  slots: Slot[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const isEdit = !!rule;

  const [planId, setPlanId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [multiplier, setMultiplier] = useState("1");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Preview calculated price
  const selectedPlan = plans.find((p) => p._id === planId);
  const previewPrice = selectedPlan && multiplier
    ? Math.round(selectedPlan.basePrice * parseFloat(multiplier || "0"))
    : null;

  useEffect(() => {
    if (open) {
      if (rule) {
        setPlanId(rule.planId._id);
        setSlotId(rule.slotId._id);
        setMultiplier(String(rule.multiplier));
        setIsActive(rule.isActive);
      } else {
        setPlanId("");
        setSlotId("");
        setMultiplier("1");
        setIsActive(true);
      }
      setErrors({});
      setApiError(null);
    }
  }, [open, rule]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!isEdit && !planId) e.planId = "Plan is required";
    if (!isEdit && !slotId) e.slotId = "Slot is required";
    const m = parseFloat(multiplier);
    if (isNaN(m) || m < 0.1) e.multiplier = "Multiplier must be at least 0.1";
    if (m > 10) e.multiplier = "Multiplier cannot exceed 10";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setApiError(null);
    try {
      if (isEdit && rule) {
        await pricingApi.update(rule._id, {
          multiplier: parseFloat(multiplier),
          isActive,
        });
        showToast("Pricing rule updated");
      } else {
        const payload: PricingRuleFormData = {
          planId,
          slotId,
          multiplier: parseFloat(multiplier),
          isActive,
        };
        await pricingApi.create(payload);
        showToast("Pricing rule created");
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ elevation: 0, sx: { borderRadius: "16px", border: "1px solid #E2E8F0" } }}
    >
      <DialogTitle sx={{ pb: 1, pt: 2.5, px: 3, fontWeight: 700, fontSize: "1rem", color: "#111827" }}>
        {isEdit ? "Edit Pricing Rule" : "Add Pricing Rule"}
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 1 }}>
        {apiError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{apiError}</Alert>}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>

          {/* Plan and Slot locked when editing */}
          {isEdit ? (
            <Box sx={{ p: 2, backgroundColor: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#6B7280", mb: 0.5 }}>Plan / Slot</Typography>
              <Typography sx={{ fontSize: "0.88rem", fontWeight: 600, color: "#111827" }}>
                {rule?.planId.name} - {rule?.slotId.label}
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "#9CA3AF", mt: 0.25 }}>
                Plan and slot cannot be changed after creation
              </Typography>
            </Box>
          ) : (
            <>
              <TextField
                select
                label="Plan"
                value={planId}
                onChange={(e) => { setPlanId(e.target.value); if (errors.planId) setErrors((p) => ({ ...p, planId: "" })); }}
                error={!!errors.planId}
                helperText={errors.planId}
                fullWidth
              >
                <MenuItem value="">Select a plan</MenuItem>
                {plans.map((p) => (
                  <MenuItem key={p._id} value={p._id}>
                    {p.name} - Rs.{p.basePrice.toLocaleString("en-IN")}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Slot"
                value={slotId}
                onChange={(e) => { setSlotId(e.target.value); if (errors.slotId) setErrors((p) => ({ ...p, slotId: "" })); }}
                error={!!errors.slotId}
                helperText={errors.slotId}
                fullWidth
              >
                <MenuItem value="">Select a slot</MenuItem>
                {slots.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.label} ({s.startTime} - {s.endTime})
                  </MenuItem>
                ))}
              </TextField>
            </>
          )}

          <TextField
            label="Multiplier"
            type="number"
            value={multiplier}
            onChange={(e) => { setMultiplier(e.target.value); if (errors.multiplier) setErrors((p) => ({ ...p, multiplier: "" })); }}
            error={!!errors.multiplier}
            helperText={errors.multiplier || "Final price = Base price x Multiplier"}
            fullWidth
            InputProps={{
              endAdornment: <InputAdornment position="end">x</InputAdornment>,
            }}
            inputProps={{ step: 0.1, min: 0.1, max: 10 }}
          />

          {/* Live price preview */}
          {previewPrice !== null && selectedPlan && (
            <Box sx={{ p: 1.5, backgroundColor: "#EFF6FF", borderRadius: "10px", border: "1px solid #BFDBFE" }}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#1D4ED8" }}>
                Preview - Rs.{selectedPlan.basePrice.toLocaleString("en-IN")} x {multiplier} = Rs.{previewPrice.toLocaleString("en-IN")}
              </Typography>
            </Box>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 500, color: "#374151" }}>
                Active
              </Typography>
            }
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Rule"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const { showToast } = useToast();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<PricingRule | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [rulesRes, plansRes, slotsRes] = await Promise.all([
        pricingApi.getAll(),
        plansApi.getAll(),
        slotsApi.getAll(),
      ]);
      setRules(rulesRes.data || []);
      setPlans(plansRes.data || []);
      setSlots(slotsRes.data || []);
    } catch {
      setError("Failed to load pricing rules. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async () => {
    if (!selectedRule) return;
    setIsActioning(true);
    try {
      await pricingApi.delete(selectedRule._id);
      showToast("Pricing rule deleted");
      setConfirmOpen(false);
      fetchAll();
    } catch {
      showToast("Delete failed. Please try again.", "error");
    } finally {
      setIsActioning(false);
    }
  };

  const formatCurrency = (n: number) => `Rs.${n.toLocaleString("en-IN")}`;
  const activeRules = rules.filter((rule) => rule.isActive).length;
  const inactiveRules = rules.filter((rule) => !rule.isActive).length;
  const boostedRules = rules.filter((rule) => rule.multiplier > 1).length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
      <Box sx={{ display: "flex", alignItems: { xs: "flex-start", lg: "center" }, justifyContent: "space-between", flexDirection: { xs: "column", lg: "row" }, gap: 1.5 }}>
        <Box sx={{ flex: 1, display: "flex", justifyContent: { xs: "flex-start", lg: "center" } }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {!isLoading ? (
              <>
                <SummaryStat label="Overall Rules" value={String(rules.length)} />
                <SummaryStat label="Active" value={String(activeRules)} tone="success" />
                <SummaryStat label="Inactive" value={String(inactiveRules)} tone="warning" />
                <SummaryStat label="Boosted Prices" value={String(boostedRules)} />
              </>
            ) : (
              <>
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} variant="rounded" width={132} height={74} sx={{ borderRadius: "14px" }} />
                ))}
              </>
            )}
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={() => {
            setEditingRule(null);
            setFormOpen(true);
          }}
          sx={{ px: 1.75, alignSelf: { xs: "flex-start", lg: "center" } }}
        >
          Add Rule
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: "14px",
          border: "1px solid #BFDBFE",
          backgroundColor: "#F8FBFF",
        }}
      >
        <Typography sx={{ fontSize: "0.76rem", color: "#1D4ED8", fontWeight: 800, letterSpacing: 0.45, textTransform: "uppercase", mb: 0.4 }}>
          Pricing Logic
        </Typography>
        <Typography sx={{ fontSize: "0.82rem", color: "#33527A", fontWeight: 600, lineHeight: 1.55 }}>
          Final price = base plan price x multiplier. If no rule exists for a plan and slot combination, the base price is used as-is.
        </Typography>
      </Paper>

      {error ? <ErrorState message={error} onRetry={fetchAll} /> : null}

      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          border: `1px solid ${C.border}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: C.surface }}>
                {["Plan", "Slot", "Base Price", "Multiplier", "Final Price", "Status", "Actions"].map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      color: C.slate,
                      py: 1.45,
                      borderBottom: `1px solid ${C.border}`,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                      <TableCell key={j} sx={{ py: 2 }}><Skeleton height={20} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ border: 0, p: 0 }}>
                    <EmptyState
                      title="No pricing rules created yet"
                      subtitle="Add a rule to apply custom pricing for plan and slot combinations."
                      actionLabel="Add Rule"
                      onAction={() => {
                        setEditingRule(null);
                        setFormOpen(true);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => {
                  const finalPrice = Math.round(rule.planId.basePrice * rule.multiplier);
                  return (
                    <TableRow
                      key={rule._id}
                      sx={{
                        "&:last-child td": { border: 0 },
                        "&:hover": { backgroundColor: "#F8FAFF" },
                        opacity: rule.isActive ? 1 : 0.6,
                      }}
                    >
                      <TableCell sx={{ py: 1.6 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: "#111827" }}>
                          {rule.planId.name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.6 }}>
                        <Typography sx={{ fontSize: "0.85rem", color: C.slate, fontWeight: 700 }}>
                          {rule.slotId.label}
                        </Typography>
                        <Typography sx={{ fontSize: "0.72rem", color: C.muted, fontWeight: 600, mt: 0.25 }}>
                          {rule.slotId.startTime} - {rule.slotId.endTime}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.6 }}>
                        <Typography sx={{ fontSize: "0.85rem", color: C.slate, fontWeight: 700 }}>
                          {formatCurrency(rule.planId.basePrice)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.6 }}>
                        <Chip
                          label={`${rule.multiplier}x`}
                          size="small"
                          sx={{ height: 26, fontSize: "0.74rem", fontWeight: 800, backgroundColor: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 1.6 }}>
                        <Typography sx={{ fontSize: "0.88rem", fontWeight: 800, color: C.green }}>
                          {formatCurrency(finalPrice)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.6 }}>
                        <Chip
                          label={rule.isActive ? "Active" : "Inactive"}
                          size="small"
                          sx={{
                            height: 26, fontSize: "0.72rem", fontWeight: 800,
                            backgroundColor: rule.isActive ? "#F0FDF4" : "#F9FAFB",
                            color: rule.isActive ? C.green : "#6B7280",
                            border: `1px solid ${rule.isActive ? "#BBF7D0" : "#E5E7EB"}`,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 1.6 }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Edit rule">
                            <IconButton
                              size="small"
                              onClick={() => { setEditingRule(rule); setFormOpen(true); }}
                              sx={{ color: "#6B7280", "&:hover": { color: "#1D4ED8", backgroundColor: "#EFF6FF" } }}
                            >
                              <EditOutlined sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete rule">
                            <IconButton
                              size="small"
                              onClick={() => { setSelectedRule(rule); setConfirmOpen(true); }}
                              sx={{ color: "#6B7280", "&:hover": { color: "#DC2626", backgroundColor: "#FEF2F2" } }}
                            >
                              <DeleteOutlined sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <PricingFormDialog
        open={formOpen}
        rule={editingRule}
        plans={plans}
        slots={slots}
        onClose={() => setFormOpen(false)}
        onSaved={fetchAll}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Pricing Rule"
        message={`Delete the pricing rule for "${selectedRule?.planId.name} - ${selectedRule?.slotId.label}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
        isLoading={isActioning}
      />
    </Box>
  );
}
