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
  MenuItem,
  Alert,
  Skeleton,
  Chip,
  Tooltip,
  Switch,
  FormControlLabel,
  InputAdornment,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlineOutlined,
  SellOutlined,
  TaskAltOutlined,
  BlockOutlined,
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
  MODULE_TABLE_CONTAINER_SX,
  MODULE_TABLE_HEAD_CELL_SX,
  MODULE_TABLE_ROW_SX,
  ModuleDashboardStat,
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

const PRICE_COLUMN_FRAME_WIDTH = 124;
const MULTIPLIER_COLUMN_FRAME_WIDTH = 60;
const PLAN_COLUMN_WIDTH = "17%";
const SLOT_COLUMN_WIDTH = "18%";
const PRICE_COLUMN_WIDTH = "15%";
const MULTIPLIER_COLUMN_WIDTH = "10%";
const FINAL_PRICE_COLUMN_WIDTH = "16%";
const STATUS_COLUMN_WIDTH = "10%";
const ACTIONS_COLUMN_WIDTH = "14%";
const STATUS_TEXT_OFFSET = 1.15;

function preventNumberScroll(event: WheelEvent<HTMLInputElement>) {
  event.currentTarget.blur();
}

function getPricingStatusPillSx(isActive: boolean) {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "flex-start",
    minWidth: 74,
    px: STATUS_TEXT_OFFSET,
    py: 0.4,
    borderRadius: "999px",
    border: `1px solid ${isActive ? "#BEE5C8" : "#D8DEE6"}`,
    background: isActive
      ? "linear-gradient(180deg, rgba(244,252,247,0.995) 0%, rgba(235,249,240,0.985) 100%)"
      : "linear-gradient(180deg, rgba(250,252,254,0.995) 0%, rgba(244,247,251,0.985) 100%)",
    boxSizing: "border-box",
  } as const;
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
  const dialogContentRef = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

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

  useEffect(() => {
    if (apiError) {
      dialogContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [apiError]);

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
      fullScreen={fullScreen}
      maxWidth="xs"
      fullWidth
      PaperProps={{ elevation: 0, sx: MODULE_DIALOG_PAPER_SX }}
    >
      <DialogTitle sx={MODULE_DIALOG_TITLE_SX}>
        {isEdit ? "Edit Pricing Rule" : "Add Pricing Rule"}
      </DialogTitle>

      <DialogContent ref={dialogContentRef} sx={MODULE_DIALOG_CONTENT_SX}>
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
          {isSubmitting ? <CircularProgress size={20} color="inherit" /> : isEdit ? "Save Changes" : "Create Rule"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const theme = useTheme();
  const isMobileTable = useMediaQuery(theme.breakpoints.down("md"));
  const { showToast } = useToast();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"delete" | "toggle" | null>(null);
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

  const handleConfirm = async () => {
    if (!selectedRule || !confirmAction) return;
    setIsActioning(true);
    try {
      if (confirmAction === "toggle") {
        await pricingApi.update(selectedRule._id, {
          multiplier: selectedRule.multiplier,
          isActive: !selectedRule.isActive,
        });
        showToast(selectedRule.isActive ? "Pricing rule deactivated" : "Pricing rule activated");
      } else {
        await pricingApi.delete(selectedRule._id);
        showToast("Pricing rule deleted");
      }
      setConfirmOpen(false);
      fetchAll();
    } catch {
      showToast("Action failed. Please try again.", "error");
    } finally {
      setIsActioning(false);
    }
  };

  const formatCurrency = (n: number) => `Rs.${n.toLocaleString("en-IN")}`;
  const activeRules = rules.filter((rule) => rule.isActive).length;
  const inactiveRules = rules.filter((rule) => !rule.isActive).length;
  const boostedRules = rules.filter((rule) => rule.multiplier > 1).length;
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
          ? "#A13C32"
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
            "linear-gradient(180deg, rgba(255,255,255,0.998) 0%, rgba(252,247,240,0.994) 100%)",
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
                  label="Overall Rules"
                  value={String(rules.length)}
                  helper="All pricing overrides"
                  icon={<SellOutlined sx={{ fontSize: 18 }} />}
                  compact
                />
                <ModuleDashboardStat
                  label="Active"
                  value={String(activeRules)}
                  helper="Currently applied rules"
                  icon={<TaskAltOutlined sx={{ fontSize: 18 }} />}
                  tone="success"
                  compact
                />
                <ModuleDashboardStat
                  label="Inactive"
                  value={String(inactiveRules)}
                  helper="Rules kept off"
                  icon={<BlockOutlined sx={{ fontSize: 18 }} />}
                  tone="warning"
                  compact
                />
                <ModuleDashboardStat
                  label="Boosted Prices"
                  value={String(boostedRules)}
                  helper="Multipliers above 1x"
                  icon={<CheckCircleOutlineOutlined sx={{ fontSize: 18 }} />}
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
          <Box
            sx={{
              minWidth: { xs: "100%", xl: 148 },
              alignSelf: { xs: "stretch", xl: "center" },
            }}
          >
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={() => {
                setEditingRule(null);
                setFormOpen(true);
              }}
              sx={{ px: 1.75, minHeight: 44, alignSelf: { xs: "flex-start", xl: "flex-end" } }}
            >
              Add Rule
            </Button>
          </Box>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          ...MODULE_CARD_SX,
          px: { xs: 1.4, sm: 1.8 },
          py: 1.5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          borderColor: "#E5D7C5",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.999) 0%, rgba(250,243,234,0.996) 100%)",
          boxShadow: "0 16px 30px rgba(36,58,87,0.07), inset 0 1px 0 rgba(255,255,255,0.92)",
        }}
      >
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 800,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: 0.45,
            textAlign: "center",
          }}
        >
          Pricing Logic
        </Typography>

        <Box
          sx={{
            width: "100%",
            maxWidth: 760,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.9,
            flexWrap: "wrap",
            px: { xs: 1.1, sm: 1.35 },
            py: 1.1,
            borderRadius: "16px",
            border: "1px solid #E7D9C8",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.998) 0%, rgba(252,247,241,0.994) 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.92)",
          }}
        >
          {[
            { label: "Base Price", tone: "base" as const },
            { label: "x", tone: "operator" as const },
            { label: "Multiplier", tone: "accent" as const },
            { label: "=", tone: "operator" as const },
            { label: "Final Price", tone: "result" as const },
          ].map((item, index) => (
            <Box
              key={`${item.label}-${index}`}
              sx={{
                px: item.tone === "operator" ? 0.25 : 1.2,
                py: item.tone === "operator" ? 0.1 : 0.78,
                borderRadius: item.tone === "operator" ? 0 : "14px",
                border:
                  item.tone === "operator"
                    ? "none"
                    : `1px solid ${
                        item.tone === "result"
                          ? "#B6D5C0"
                          : item.tone === "accent"
                            ? "#E2BE87"
                            : "#D7C7B4"
                      }`,
                background:
                  item.tone === "operator"
                    ? "transparent"
                    : item.tone === "result"
                      ? "linear-gradient(180deg, rgba(255,255,255,0.999) 0%, rgba(236,248,240,0.995) 100%)"
                      : item.tone === "accent"
                        ? "linear-gradient(180deg, rgba(255,255,255,0.999) 0%, rgba(253,242,223,0.995) 100%)"
                        : "linear-gradient(180deg, rgba(255,255,255,0.999) 0%, rgba(250,244,236,0.995) 100%)",
                boxShadow:
                  item.tone === "operator"
                    ? "none"
                    : item.tone === "result"
                      ? "0 10px 18px rgba(53,101,72,0.06)"
                      : item.tone === "accent"
                        ? "0 10px 18px rgba(163,106,44,0.06)"
                        : "0 10px 18px rgba(36,58,87,0.045)",
              }}
            >
              <Typography
                sx={{
                  fontSize: item.tone === "operator" ? "1rem" : "0.82rem",
                  fontWeight:
                    item.tone === "operator" ? 900 : item.tone === "result" ? 800 : 700,
                  color:
                    item.tone === "result"
                      ? C.green
                      : item.tone === "accent"
                        ? C.amber
                        : item.tone === "base"
                          ? C.navy
                          : C.slate,
                  letterSpacing: item.tone === "operator" ? 0 : 0.15,
                  lineHeight: 1.2,
                }}
              >
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {error ? <ErrorState message={error} onRetry={fetchAll} /> : null}

      <Paper
        elevation={0}
        sx={{
          ...MODULE_CARD_SX,
          overflow: "hidden",
        }}
      >
        <TableContainer
          sx={{ ...MODULE_TABLE_CONTAINER_SX, display: isMobileTable ? "none" : "block" }}
        >
          <Table
            sx={{
              width: "100%",
              tableLayout: { xs: "auto", lg: "fixed" },
              minWidth: { xs: 760, sm: 820, md: 900, lg: "100%" },
            }}
          >
            <TableHead>
              <TableRow
                sx={{
                  background:
                    "linear-gradient(180deg, rgba(252,247,241,0.98) 0%, rgba(247,240,231,0.96) 100%)",
                }}
              >
                {["Plan", "Slot", "Base Price", "Multiplier", "Final Price", "Status", "Actions"].map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      ...MODULE_TABLE_HEAD_CELL_SX,
                      whiteSpace: "nowrap",
                      width:
                        h === "Plan"
                          ? PLAN_COLUMN_WIDTH
                          : h === "Slot"
                            ? SLOT_COLUMN_WIDTH
                          : h === "Multiplier"
                            ? MULTIPLIER_COLUMN_WIDTH
                          : h === "Base Price" || h === "Final Price"
                            ? h === "Base Price"
                              ? PRICE_COLUMN_WIDTH
                              : FINAL_PRICE_COLUMN_WIDTH
                          : h === "Status"
                            ? STATUS_COLUMN_WIDTH
                          : h === "Actions"
                            ? ACTIONS_COLUMN_WIDTH
                            : "auto",
                      textAlign: h === "Actions" ? "center" : "left",
                    }}
                  >
                    {h === "Plan" || h === "Slot" ? (
                      <Box sx={{ width: "100%", textAlign: "center" }}>{h}</Box>
                    ) : h === "Status" ? (
                      <Box
                        sx={{
                          width: "100%",
                          textAlign: "left",
                          pl: STATUS_TEXT_OFFSET,
                          boxSizing: "border-box",
                        }}
                      >
                        {h}
                      </Box>
                    ) : h === "Multiplier" ? (
                      <Box
                        sx={{
                          width: MULTIPLIER_COLUMN_FRAME_WIDTH,
                          maxWidth: "100%",
                          mx: "auto",
                          textAlign: "center",
                        }}
                      >
                        {h}
                      </Box>
                    ) : h === "Base Price" || h === "Final Price" ? (
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
                      <TableCell sx={{ py: 1.6, width: PLAN_COLUMN_WIDTH, textAlign: "center", px: 1 }}>
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
                            {rule.planId.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.6, width: SLOT_COLUMN_WIDTH, textAlign: "center", px: 0.75 }}>
                        <Typography
                          sx={{
                            fontSize: "0.82rem",
                            color: C.slate,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {rule.slotId.label}
                        </Typography>
                        <Typography sx={{ fontSize: "0.72rem", color: C.muted, fontWeight: 600, mt: 0.25 }}>
                          {rule.slotId.startTime} - {rule.slotId.endTime}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.6, textAlign: "center", width: PRICE_COLUMN_WIDTH, px: 0.6 }}>
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
                              {formatCurrency(rule.planId.basePrice)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.6, textAlign: "center", width: MULTIPLIER_COLUMN_WIDTH, px: 0.35 }}>
                        <Box
                          sx={{
                            width: MULTIPLIER_COLUMN_FRAME_WIDTH,
                            maxWidth: "100%",
                            mx: "auto",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Chip
                            label={`${rule.multiplier}x`}
                            size="small"
                            sx={{
                              ...MODULE_NEUTRAL_CHIP_SX,
                              background:
                                "linear-gradient(180deg, rgba(255,255,255,0.995) 0%, rgba(239,245,251,0.985) 100%)",
                              border: "1px solid #C6D6E7",
                              color: C.navy,
                              fontWeight: 800,
                              boxShadow: "0 6px 14px rgba(36,58,87,0.06)",
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.6, textAlign: "center", width: FINAL_PRICE_COLUMN_WIDTH, px: 0.6 }}>
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
                              border: "1px solid #CFE4D5",
                              background:
                                "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(240,248,243,0.97) 100%)",
                              lineHeight: 1,
                              boxSizing: "border-box",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "0.88rem",
                                fontWeight: 800,
                                color: C.green,
                                letterSpacing: 0.01,
                              }}
                            >
                              {formatCurrency(finalPrice)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.6, width: STATUS_COLUMN_WIDTH, px: 0.35, textAlign: "left" }}>
                        <Box sx={{ width: "100%", display: "flex", justifyContent: "flex-start" }}>
                          <Box sx={getPricingStatusPillSx(rule.isActive)}>
                            <Typography
                              sx={{
                                fontSize: "0.88rem",
                                fontWeight: 700,
                                lineHeight: 1,
                                color: rule.isActive ? C.green : C.slate,
                              }}
                            >
                              {rule.isActive ? "Active" : "Inactive"}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.6, textAlign: "center", width: ACTIONS_COLUMN_WIDTH, px: 0.2 }}>
                        <Box sx={{ display: "flex", gap: 0, justifyContent: "center" }}>
                          <Tooltip title="Edit rule">
                            <IconButton
                              size="small"
                              onClick={() => { setEditingRule(rule); setFormOpen(true); }}
                              sx={{ ...getActionIconSx("primary"), p: 0.55 }}
                            >
                              <EditOutlined sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={rule.isActive ? "Deactivate" : "Activate"}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedRule(rule);
                                setConfirmAction("toggle");
                                setConfirmOpen(true);
                              }}
                              sx={{ ...getActionIconSx("toggle"), p: 0.55 }}
                            >
                              {rule.isActive ? (
                                <BlockOutlined sx={{ fontSize: 16 }} />
                              ) : (
                                <TaskAltOutlined sx={{ fontSize: 16 }} />
                              )}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete rule">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedRule(rule);
                                setConfirmAction("delete");
                                setConfirmOpen(true);
                              }}
                              sx={{ ...getActionIconSx("danger"), p: 0.55 }}
                            >
                              <DeleteOutlined sx={{ fontSize: 16 }} />
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

        {isMobileTable ? (
          <Box sx={{ display: "grid", gap: 1.25, p: 1.25 }}>
            {isLoading ? (
              [...Array(4)].map((_, index) => (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{
                    borderRadius: "18px",
                    border: `1px solid ${C.border}`,
                    p: 1.4,
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.995) 0%, rgba(253,250,246,0.988) 100%)",
                  }}
                >
                  <Skeleton height={28} sx={{ mb: 1 }} />
                  <Skeleton height={20} sx={{ mb: 0.7 }} />
                  <Skeleton height={20} sx={{ mb: 0.7 }} />
                  <Skeleton height={20} />
                </Paper>
              ))
            ) : rules.length === 0 ? (
              <EmptyState
                title="No pricing rules created yet"
                subtitle="Add a rule to apply custom pricing for plan and slot combinations."
                actionLabel="Add Rule"
                onAction={() => {
                  setEditingRule(null);
                  setFormOpen(true);
                }}
              />
            ) : (
              rules.map((rule) => {
                const finalPrice = Math.round(rule.planId.basePrice * rule.multiplier);
                return (
                  <Paper key={rule._id} elevation={0} sx={{ ...MODULE_CARD_SX, p: 1.4, opacity: rule.isActive ? 1 : 0.72 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.94rem", color: "#111827" }}>
                          {rule.planId.name}
                        </Typography>
                        <Typography sx={{ mt: 0.35, fontSize: "0.78rem", color: C.slate, fontWeight: 700 }}>
                          {rule.slotId.label}
                        </Typography>
                        <Typography sx={{ mt: 0.24, fontSize: "0.74rem", color: C.muted, fontWeight: 600 }}>
                          {rule.slotId.startTime} - {rule.slotId.endTime}
                        </Typography>
                      </Box>
                      <Box sx={getPricingStatusPillSx(rule.isActive)}>
                        <Typography
                          sx={{
                            fontSize: "0.88rem",
                            fontWeight: 700,
                            lineHeight: 1,
                            color: rule.isActive ? C.green : C.slate,
                          }}
                        >
                          {rule.isActive ? "Active" : "Inactive"}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        mt: 1.1,
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: 1,
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.35 }}>
                          Base Price
                        </Typography>
                        <Typography sx={{ mt: 0.28, fontSize: "0.9rem", fontWeight: 800, color: C.navy }}>
                          {formatCurrency(rule.planId.basePrice)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.35 }}>
                          Multiplier
                        </Typography>
                        <Typography sx={{ mt: 0.28, fontSize: "0.9rem", fontWeight: 800, color: C.navy }}>
                          {rule.multiplier}x
                        </Typography>
                      </Box>
                      <Box sx={{ gridColumn: "1 / -1" }}>
                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.35 }}>
                          Final Price
                        </Typography>
                        <Typography sx={{ mt: 0.28, fontSize: "0.92rem", fontWeight: 800, color: C.green }}>
                          {formatCurrency(finalPrice)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mt: 1.15, display: "flex", justifyContent: "flex-end", gap: 0.45 }}>
                      <Tooltip title="Edit rule">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingRule(rule);
                            setFormOpen(true);
                          }}
                          sx={{ ...getActionIconSx("primary"), p: 0.55 }}
                        >
                          <EditOutlined sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={rule.isActive ? "Deactivate" : "Activate"}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedRule(rule);
                            setConfirmAction("toggle");
                            setConfirmOpen(true);
                          }}
                          sx={{ ...getActionIconSx("toggle"), p: 0.55 }}
                        >
                          {rule.isActive ? <BlockOutlined sx={{ fontSize: 16 }} /> : <TaskAltOutlined sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete rule">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedRule(rule);
                            setConfirmAction("delete");
                            setConfirmOpen(true);
                          }}
                          sx={{ ...getActionIconSx("danger"), p: 0.55 }}
                        >
                          <DeleteOutlined sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>
                );
              })
            )}
          </Box>
        ) : null}
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
        title={
          confirmAction === "delete"
            ? "Delete Pricing Rule"
            : selectedRule?.isActive
              ? "Deactivate Pricing Rule"
              : "Activate Pricing Rule"
        }
        message={
          confirmAction === "delete"
            ? `Delete the pricing rule for "${selectedRule?.planId.name} - ${selectedRule?.slotId.label}"? This cannot be undone.`
            : selectedRule?.isActive
              ? `Deactivating this pricing rule will stop applying the custom multiplier for new pricing checks.`
              : `Activating this pricing rule will apply the custom multiplier again for this plan and slot combination.`
        }
        confirmLabel={
          confirmAction === "delete"
            ? "Delete"
            : selectedRule?.isActive
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
