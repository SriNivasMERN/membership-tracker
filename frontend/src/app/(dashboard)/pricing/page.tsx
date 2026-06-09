"use client";

import { useState, useEffect, useCallback, type WheelEvent } from "react";
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
import {
  MODULE_ACTION_ICON_SX,
  MODULE_CARD_SX,
  MODULE_COLORS,
  MODULE_DIALOG_ACTIONS_SX,
  MODULE_DIALOG_CONTENT_SX,
  MODULE_DIALOG_PAPER_SX,
  MODULE_DIALOG_TITLE_SX,
  MODULE_FIELD_SX,
  MODULE_INLINE_PANEL_SX,
  MODULE_NEUTRAL_CHIP_SX,
  MODULE_PAGE_SX,
  MODULE_SUCCESS_CHIP_SX,
  MODULE_TABLE_HEAD_CELL_SX,
  MODULE_TABLE_ROW_SX,
  ModuleSummaryStat,
} from "@/components/ui/moduleStyles";

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
  navy: MODULE_COLORS.ink,
  slate: MODULE_COLORS.slate,
  muted: MODULE_COLORS.muted,
  border: MODULE_COLORS.border,
  surface: MODULE_COLORS.surface,
  green: MODULE_COLORS.green,
  amber: MODULE_COLORS.amber,
};

function preventNumberScroll(event: WheelEvent<HTMLInputElement>) {
  event.currentTarget.blur();
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
      PaperProps={{ elevation: 0, sx: MODULE_DIALOG_PAPER_SX }}
    >
      <DialogTitle sx={MODULE_DIALOG_TITLE_SX}>
        {isEdit ? "Edit Pricing Rule" : "Add Pricing Rule"}
      </DialogTitle>

      <DialogContent sx={MODULE_DIALOG_CONTENT_SX}>
        {apiError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{apiError}</Alert>}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
          {isEdit ? (
            <Box sx={MODULE_INLINE_PANEL_SX}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: C.muted, mb: 0.5, textTransform: "uppercase", letterSpacing: 0.35 }}>
                Plan / Slot
              </Typography>
              <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: C.navy }}>
                {rule?.planId.name} - {rule?.slotId.label}
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: C.slate, mt: 0.35, fontWeight: 600, lineHeight: 1.45 }}>
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
                autoFocus
                error={!!errors.planId}
                helperText={errors.planId}
                fullWidth
                sx={MODULE_FIELD_SX}
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
                sx={MODULE_FIELD_SX}
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
            autoFocus={isEdit}
            error={!!errors.multiplier}
            helperText={errors.multiplier || "Final price = Base price x Multiplier"}
            fullWidth
            sx={MODULE_FIELD_SX}
            InputProps={{
              endAdornment: <InputAdornment position="end">x</InputAdornment>,
            }}
            inputProps={{ step: 0.1, min: 0.1, max: 10, onWheel: preventNumberScroll }}
          />

          {previewPrice !== null && selectedPlan && (
            <Box sx={MODULE_INLINE_PANEL_SX}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.35, mb: 0.45 }}>
                Price Preview
              </Typography>
              <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: C.navy, lineHeight: 1.45 }}>
                Rs.{selectedPlan.basePrice.toLocaleString("en-IN")} x {multiplier} = Rs.{previewPrice.toLocaleString("en-IN")}
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
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: C.slate }}>
                Active
              </Typography>
            }
            sx={{ m: 0, color: C.slate }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={MODULE_DIALOG_ACTIONS_SX}>
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
    <Box sx={MODULE_PAGE_SX}>
      <Box sx={{ display: "flex", alignItems: { xs: "flex-start", lg: "center" }, justifyContent: "space-between", flexDirection: { xs: "column", lg: "row" }, gap: 1.5 }}>
        <Box sx={{ flex: 1, display: "flex", justifyContent: { xs: "flex-start", lg: "center" } }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {!isLoading ? (
              <>
                <ModuleSummaryStat label="Overall Rules" value={String(rules.length)} />
                <ModuleSummaryStat label="Active" value={String(activeRules)} tone="success" />
                <ModuleSummaryStat label="Inactive" value={String(inactiveRules)} tone="warning" />
                <ModuleSummaryStat label="Boosted Prices" value={String(boostedRules)} />
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
          ...MODULE_CARD_SX,
          px: 2,
          py: 1.6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "Base Price", tone: "default" as const },
          { label: "x", tone: "operator" as const },
          { label: "Multiplier", tone: "default" as const },
          { label: "=", tone: "operator" as const },
          { label: "Final Price", tone: "result" as const },
        ].map((item, index) => (
          <Box
            key={`${item.label}-${index}`}
            sx={{
              px: item.tone === "operator" ? 0.4 : 1.25,
              py: item.tone === "operator" ? 0.2 : 0.8,
              borderRadius: item.tone === "operator" ? 0 : "12px",
              border: item.tone === "operator" ? "none" : `1px solid ${item.tone === "result" ? "#D9CCBB" : C.border}`,
              background:
                item.tone === "operator"
                  ? "transparent"
                  : item.tone === "result"
                    ? "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,245,239,0.98) 100%)"
                    : "linear-gradient(180deg, rgba(255,255,255,0.995) 0%, rgba(253,250,246,0.985) 100%)",
              boxShadow: item.tone === "operator" ? "none" : "0 8px 18px rgba(36,58,87,0.05)",
            }}
          >
            <Typography
              sx={{
                fontSize: item.tone === "operator" ? "1rem" : "0.82rem",
                fontWeight: item.tone === "operator" ? 900 : item.tone === "result" ? 800 : 700,
                color: item.tone === "result" ? C.navy : C.slate,
                letterSpacing: item.tone === "operator" ? 0 : 0.15,
                lineHeight: 1.2,
              }}
            >
              {item.label}
            </Typography>
          </Box>
        ))}
      </Paper>

      {error ? <ErrorState message={error} onRetry={fetchAll} /> : null}

      <Paper
        elevation={0}
        sx={{
          ...MODULE_CARD_SX,
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
                      ...MODULE_TABLE_HEAD_CELL_SX,
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
                        ...MODULE_TABLE_ROW_SX,
                        "&:last-child td": { border: 0 },
                        opacity: rule.isActive ? 1 : 0.72,
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
                          sx={MODULE_NEUTRAL_CHIP_SX}
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
                          sx={rule.isActive ? MODULE_SUCCESS_CHIP_SX : MODULE_NEUTRAL_CHIP_SX}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 1.6 }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Edit rule">
                            <IconButton
                              size="small"
                              onClick={() => { setEditingRule(rule); setFormOpen(true); }}
                              sx={MODULE_ACTION_ICON_SX}
                            >
                              <EditOutlined sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete rule">
                            <IconButton
                              size="small"
                              onClick={() => { setSelectedRule(rule); setConfirmOpen(true); }}
                              sx={MODULE_ACTION_ICON_SX}
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
