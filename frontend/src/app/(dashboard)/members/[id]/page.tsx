"use client";

import { useState, useEffect, useCallback, useRef, type WheelEvent } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Skeleton,
  InputAdornment,
  Chip,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  ArrowBackOutlined,
  PaymentOutlined,
  AutorenewOutlined,
  EditOutlined,
  UndoOutlined,
  CalendarTodayOutlined,
  PersonOutlined,
  CreditCardOutlined,
  PersonOffOutlined,
} from "@mui/icons-material";
import { Member, PaymentMethod } from "@/types/member.types";
import { Plan } from "@/types/plan.types";
import { Slot } from "@/types/slot.types";
import { membersApi } from "@/lib/api/members.api";
import { plansApi } from "@/lib/api/plans.api";
import { slotsApi } from "@/lib/api/slots.api";
import { pricingApi } from "@/lib/api/pricing.api";
import { useToast } from "@/context/ToastContext";
import { useNavigationLoading } from "@/context/NavigationLoadingContext";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  MODULE_CARD_SX,
  MODULE_COLORS,
  MODULE_DIALOG_ACTIONS_SX,
  MODULE_DIALOG_CONTENT_SX,
  MODULE_DIALOG_PAPER_SX,
  MODULE_DIALOG_TITLE_SX,
  MODULE_FIELD_SX,
  MODULE_PAGE_SX,
  MODULE_TABLE_CONTAINER_SX,
  MODULE_TABLE_HEAD_CELL_SX,
  ModuleDashboardStat,
} from "@/components/ui/moduleStyles";

const C = {
  navy: MODULE_COLORS.ink, slate: MODULE_COLORS.slate, muted: MODULE_COLORS.muted,
  border: MODULE_COLORS.border, surface: MODULE_COLORS.surface, green: MODULE_COLORS.green, red: MODULE_COLORS.red,
};

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function preventNumberScroll(event: WheelEvent<HTMLInputElement>) {
  event.currentTarget.blur();
}

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
];

function getPlanChangeSettlement(member: Member) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(member.startDate);
  startDate.setHours(0, 0, 0, 0);

  const dayMs = 1000 * 60 * 60 * 24;
  const usedDays = Math.min(
    member.planSnapshot.durationDays,
    Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / dayMs) + 1)
  );
  const usedValue = Math.round(
    (member.finalPrice / member.planSnapshot.durationDays) * usedDays
  );
  const totalFundedValue = member.paidAmount + (member.creditBalance || 0);

  return {
    usedDays,
    usedValue,
    totalFundedValue,
    availableCredit: Math.max(0, totalFundedValue - usedValue),
    shortfall: Math.max(0, usedValue - totalFundedValue),
  };
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1, borderBottom: `1px solid ${C.border}`, "&:last-child": { border: 0 } }}>
      <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: C.slate }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function MemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down("md"));
  const isCompactPaymentHistory = useMediaQuery(theme.breakpoints.down("sm"));
  const memberId = params.id as string;
  const { showToast } = useToast();
  const { startNavigation } = useNavigationLoading();
  const paymentDialogContentRef = useRef<HTMLDivElement | null>(null);
  const renewDialogContentRef = useRef<HTMLDivElement | null>(null);
  const editDialogContentRef = useRef<HTMLDivElement | null>(null);
  const endDialogContentRef = useRef<HTMLDivElement | null>(null);
  const revertDialogContentRef = useRef<HTMLDivElement | null>(null);

  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  const [activeModal, setActiveModal] = useState<"payment" | "renew" | "edit" | "end" | "revert" | null>(null);
  const [autoOpenDone, setAutoOpenDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentDate, setPaymentDate] = useState("");

  const [renewPlanId, setRenewPlanId] = useState("");
  const [renewSlotId, setRenewSlotId] = useState("");
  const [renewStartDate, setRenewStartDate] = useState("");
  const [renewEndDate, setRenewEndDate] = useState("");
  const [renewFinalPrice, setRenewFinalPrice] = useState("");
  const [renewPayment, setRenewPayment] = useState("");
  const [renewPaymentMethod, setRenewPaymentMethod] = useState<PaymentMethod | "">("");
  const [proratedCredit, setProratedCredit] = useState(0);
  const [planChangeUsedValue, setPlanChangeUsedValue] = useState(0);
  const [planChangeShortfall, setPlanChangeShortfall] = useState(0);
  const [newPlanPrice, setNewPlanPrice] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isUpgrade, setIsUpgrade] = useState(false);

  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [endDate, setEndDate] = useState("");
  const [settlementDeduction, setSettlementDeduction] = useState("");
  const [endNote, setEndNote] = useState("");

  const navigateTo = (path: string) => {
    startNavigation(path);
    router.push(path);
  };

  const fetchMember = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await membersApi.getById(memberId);
      setMember(response.data || null);
    } catch {
      setError("Failed to load member details.");
    } finally {
      setIsLoading(false);
    }
  }, [memberId]);

  useEffect(() => { fetchMember(); }, [fetchMember]);

  useEffect(() => {
    if (!modalError) return;
    if (activeModal === "payment") paymentDialogContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    if (activeModal === "renew") renewDialogContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    if (activeModal === "edit") editDialogContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    if (activeModal === "end") endDialogContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    if (activeModal === "revert") revertDialogContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [modalError, activeModal]);

  useEffect(() => {
    Promise.all([plansApi.getActive(), slotsApi.getActive()]).then(([p, s]) => {
      setPlans(p.data || []);
      setSlots(s.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (Number(paymentAmount || 0) <= 0) {
      setPaymentMethod("");
    }
  }, [paymentAmount]);

  useEffect(() => {
    if (Number(renewPayment || 0) <= 0) {
      setRenewPaymentMethod("");
    }
  }, [renewPayment]);

  useEffect(() => {
    if (searchParams.get("action") === "edit" && member && activeModal === null && !autoOpenDone) {
      setAutoOpenDone(true);
      openEdit();
    }
  }, [member]);

  const closeModal = () => {
    setActiveModal(null);
    setModalError(null);
    router.replace(`/members/${memberId}`, { scroll: false });
  };

  const openPayment = () => {
    setPaymentAmount("");
    setPaymentMethod("");
    setPaymentNote("");
    setPaymentDate(getTodayString());
    setModalError(null);
    setActiveModal("payment");
  };

  const openRenew = () => {
    if (!member) return;
    const today = getTodayString();
    const memberIsActive = member.status === "active" || member.status === "expiring_soon";
    const existingCredit = member.creditBalance || 0;
    const selectedActivePlan =
      plans.find((plan) => plan._id === (member.planSnapshot.planId as string)) || plans[0];
    const selectedActiveSlot =
      slots.find((slot) => slot._id === (member.slotSnapshot.slotId as string)) || slots[0];
    const reopenPlan = memberIsActive
      ? plans.find((plan) => plan._id === (member.planSnapshot.planId as string))
      : selectedActivePlan;
    const reopenSlot = memberIsActive
      ? slots.find((slot) => slot._id === (member.slotSnapshot.slotId as string))
      : selectedActiveSlot;

    if (!reopenPlan || !reopenSlot) {
      setModalError("At least one active plan and one active slot are required to reopen membership.");
      return;
    }

    setIsUpgrade(memberIsActive);
    setRenewPlanId(reopenPlan._id);
    setRenewSlotId(reopenSlot._id);
    setRenewStartDate(today);
    setRenewEndDate(addDays(today, reopenPlan.durationDays));

    if (memberIsActive) {
      const settlement = getPlanChangeSettlement(member);
      setPlanChangeUsedValue(settlement.usedValue);
      setPlanChangeShortfall(settlement.shortfall);
      setProratedCredit(settlement.availableCredit);
      setNewPlanPrice(member.finalPrice);
      setRenewFinalPrice(String(member.finalPrice));
      setRenewPayment("");
    } else {
      setPlanChangeUsedValue(0);
      setPlanChangeShortfall(0);
      setProratedCredit(existingCredit);
      setNewPlanPrice(reopenPlan.basePrice);
      setRenewFinalPrice(String(reopenPlan.basePrice));
      setRenewPayment("");
    }
    setRenewPaymentMethod("");
    setModalError(null);
    setActiveModal("renew");
  };

  const handleRenewPlanChange = async (planId: string) => {
    setRenewPlanId(planId);
    const selectedPlan = plans.find((p) => p._id === planId);
    if (selectedPlan && renewStartDate) {
      setRenewEndDate(addDays(renewStartDate, selectedPlan.durationDays));
      setRenewFinalPrice(String(selectedPlan.basePrice));
      setNewPlanPrice(selectedPlan.basePrice);
    }
    await recalculatePrice(planId, renewSlotId);
  };

  const handleRenewSlotChange = async (slotId: string) => {
    setRenewSlotId(slotId);
    await recalculatePrice(renewPlanId, slotId);
  };

  const recalculatePrice = async (planId: string, slotId: string) => {
    if (!planId || !slotId) return;
    setIsCalculating(true);
    try {
      const response = await pricingApi.calculate(planId, slotId);
      const calc = response.data?.finalPrice;
      const selectedPlan = plans.find((p) => p._id === planId);
      const final = calc && calc > 0 ? calc : selectedPlan?.basePrice ?? 0;
      setNewPlanPrice(final);
      setRenewFinalPrice(String(final));
    } catch {
      const selectedPlan = plans.find((p) => p._id === planId);
      const fallback = selectedPlan?.basePrice ?? 0;
      setNewPlanPrice(fallback);
      setRenewFinalPrice(String(fallback));
    } finally {
      setIsCalculating(false);
    }
  };

  const openEdit = () => {
    if (!member) return;
    setEditName(member.name);
    setEditMobile(member.mobile);
    setEditEmail(member.email || "");
    setEditNotes(member.notes || "");
    setModalError(null);
    setActiveModal("edit");
  };

  const openEndMembership = () => {
    if (!member) return;
    setEndDate(getTodayString());
    setSettlementDeduction("");
    setEndNote("");
    setModalError(null);
    setActiveModal("end");
  };

  const openRevertEnd = () => {
    setModalError(null);
    setActiveModal("revert");
  };

  const handlePayment = async () => {
    if (!member) return;
    const amount = parseFloat(paymentAmount);
    if (!paymentAmount || amount <= 0) { setModalError("Enter a valid amount"); return; }
    if (amount > member.pendingAmount) { setModalError(`Payment cannot exceed pending amount of ${fmt(member.pendingAmount)}`); return; }
    if (!paymentMethod) { setModalError("Select payment method"); return; }
    setIsSubmitting(true);
    setModalError(null);
    try {
      await membersApi.addPayment(memberId, {
        amount,
        paidOn: paymentDate,
        paymentMethod,
        note: paymentNote || undefined,
      });
      showToast("Payment recorded");
      closeModal();
      fetchMember();
    } catch { setModalError("Failed to record payment."); }
    finally { setIsSubmitting(false); }
  };

  const handleRenew = async () => {
    if (!renewStartDate) { setModalError("Start date is required"); return; }
    const finalPriceValue = renewFinalPrice ? parseFloat(renewFinalPrice) : 0;
    const paymentValue = renewPayment ? parseFloat(renewPayment) : 0;
    const payableAfterCredit = Math.max(
      0,
      finalPriceValue - (isUpgrade ? proratedCredit : 0) + (isUpgrade ? planChangeShortfall : 0)
    );
    if (paymentValue > 0 && !renewPaymentMethod) {
      setModalError("Select payment method");
      return;
    }
    if (renewPayment && paymentValue > payableAfterCredit) {
      setModalError(`Payment cannot exceed payable amount of ${fmt(payableAfterCredit)}`);
      return;
    }
    setIsSubmitting(true);
    setModalError(null);
    try {
      await membersApi.renew(memberId, {
        planId: renewPlanId || undefined,
        slotId: renewSlotId || undefined,
        startDate: renewStartDate,
        finalPrice: finalPriceValue || undefined,
        initialPayment: paymentValue || undefined,
        initialPaymentMethod:
          paymentValue > 0 && renewPaymentMethod ? renewPaymentMethod : undefined,
      });
      showToast(isUpgrade ? "Plan changed" : "Membership renewed");
      closeModal();
      fetchMember();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setModalError(e.response?.data?.message || "Failed to update membership.");
    }
    finally { setIsSubmitting(false); }
  };

  const handleEdit = async () => {
    if (!editName || editName.length < 2) { setModalError("Name must be at least 2 characters"); return; }
    setIsSubmitting(true);
    setModalError(null);
    try {
      await membersApi.update(memberId, { name: editName, mobile: editMobile || undefined, email: editEmail || undefined, notes: editNotes || undefined });
      showToast("Member updated");
      closeModal();
      fetchMember();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setModalError(e.response?.data?.message || "Failed to update.");
    } finally { setIsSubmitting(false); }
  };

  const handleEndMembership = async () => {
    if (!endDate) {
      setModalError("Effective end date is required");
      return;
    }

    const deductionValue = settlementDeduction ? parseFloat(settlementDeduction) : 0;
    if (deductionValue < 0) {
      setModalError("Settlement deduction cannot be negative");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);
    try {
      await membersApi.endMembership(memberId, {
        effectiveEndDate: endDate,
        settlementDeduction: deductionValue || undefined,
        note: endNote || undefined,
      });
      showToast("Membership ended");
      closeModal();
      fetchMember();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setModalError(e.response?.data?.message || "Failed to end membership.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevertEnd = async () => {
    setIsSubmitting(true);
    setModalError(null);
    try {
      await membersApi.revertEndMembership(memberId);
      showToast("Membership end reverted");
      closeModal();
      fetchMember();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setModalError(e.response?.data?.message || "Failed to revert membership end.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmt = (n: number) => `Rs.${n.toLocaleString("en-IN")}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const fmtPaymentMethod = (method?: PaymentMethod) => {
    switch (method) {
      case "cash":
        return "Cash";
      case "upi":
        return "UPI";
      case "card":
        return "Card";
      default:
        return "-";
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: "12px" }} /></Grid>
          <Grid item xs={12} md={4}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: "12px" }} /></Grid>
        </Grid>
      </Box>
    );
  }

  if (error || !member) {
    return (
      <Box>
        <Button startIcon={<ArrowBackOutlined />} onClick={() => navigateTo("/members")} color="inherit" size="small" sx={{ mb: 2 }}>Back</Button>
        <Alert severity="error">{error || "Member not found."}</Alert>
      </Box>
    );
  }

  const memberIsActive = member.status === "active" || member.status === "expiring_soon";
  const memberIsEnded = member.status === "ended";
  const renewFinalPriceValue = renewFinalPrice ? parseFloat(renewFinalPrice) : 0;
  const renewPayableAmount = Math.max(
    0,
    renewFinalPriceValue - (isUpgrade ? proratedCredit : 0) + (isUpgrade ? planChangeShortfall : 0)
  );
  const effectiveEndDateValue = endDate ? new Date(endDate) : new Date();
  effectiveEndDateValue.setHours(0, 0, 0, 0);
  const membershipStartDateValue = new Date(member.startDate);
  membershipStartDateValue.setHours(0, 0, 0, 0);
  const usedDaysForClosure = Math.min(
    member.planSnapshot.durationDays,
    Math.max(
      1,
      Math.floor((effectiveEndDateValue.getTime() - membershipStartDateValue.getTime()) / (1000 * 60 * 60 * 24)) + 1
    )
  );
  const closureUsedValue = Math.round((member.finalPrice / member.planSnapshot.durationDays) * usedDaysForClosure);
  const closureDeductionValue = settlementDeduction ? parseFloat(settlementDeduction) || 0 : 0;
  const closurePaidAndCredit = member.paidAmount + (member.creditBalance || 0);
  const closureRefundableBalance = Math.max(0, closurePaidAndCredit - closureUsedValue - closureDeductionValue);
  const closurePayableBalance = Math.max(0, closureUsedValue + closureDeductionValue - closurePaidAndCredit);
  const endedSettlementLabel = member.membershipClosure
    ? member.membershipClosure.refundableBalance > 0
      ? "Refund Due"
      : member.membershipClosure.payableBalance > 0
        ? "Balance Due"
        : "Settlement"
    : "Payment Due";
  const endedSettlementValue = member.membershipClosure
    ? member.membershipClosure.refundableBalance > 0
      ? fmt(member.membershipClosure.refundableBalance)
      : member.membershipClosure.payableBalance > 0
        ? fmt(member.membershipClosure.payableBalance)
        : "Settled"
    : member.pendingAmount > 0
      ? fmt(member.pendingAmount)
      : "Fully Paid";
  const endedSettlementTone = member.membershipClosure
    ? member.membershipClosure.refundableBalance > 0
      ? "success"
      : member.membershipClosure.payableBalance > 0
        ? "danger"
        : "success"
    : member.pendingAmount > 0
      ? "danger"
      : "success";
  const topSummaryCards = [
    {
      label: "Plan",
      value: member.planSnapshot.name,
      helper: "Current membership plan",
      icon: <PersonOutlined sx={{ fontSize: 18 }} />,
      tone: "default" as const,
    },
    {
      label: endedSettlementLabel,
      value: endedSettlementValue,
      helper:
        endedSettlementLabel === "Refund Due"
          ? "Amount to return"
          : endedSettlementLabel === "Balance Due"
            ? "Amount to collect"
            : endedSettlementLabel === "Settlement"
              ? "Membership settled"
              : "Current payment state",
      icon: <CreditCardOutlined sx={{ fontSize: 18 }} />,
      tone:
        endedSettlementTone === "danger"
          ? ("danger" as const)
          : endedSettlementTone === "success"
            ? ("success" as const)
            : ("default" as const),
    },
    {
      label: "Renewal Date",
      value: member.status === "ended" ? "Not Applicable" : fmtDate(member.endDate),
      helper: member.status === "ended" ? "Membership ended" : "Current validity end",
      icon: <CalendarTodayOutlined sx={{ fontSize: 18 }} />,
      tone: member.status === "ended" ? ("warning" as const) : ("default" as const),
    },
  ];

  return (
    <Box sx={MODULE_PAGE_SX}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.45 }}>
        <Typography sx={{ fontSize: "2rem", fontWeight: 800, color: "#111827", lineHeight: 1.15 }}>
          {member.name}
        </Typography>
        <Typography sx={{ fontSize: "0.92rem", color: C.slate, fontWeight: 600 }}>
          Member since {fmtDate(member.createdAt)}
        </Typography>
      </Box>

      <Box sx={{ mt: -0.5 }}>
        <Button startIcon={<ArrowBackOutlined />} onClick={() => navigateTo("/members")} color="inherit" size="small">
          Back to Members
        </Button>
      </Box>

      <Grid container spacing={2}>
        {topSummaryCards.map((card) => (
          <Grid key={card.label} item xs={12} sm={4}>
            <ModuleDashboardStat {...card} compact />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>

        {/* Left column */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>

            {/* Personal + Membership side by side */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ ...MODULE_CARD_SX, p: 2.1, borderRadius: "12px", height: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PersonOutlined sx={{ fontSize: 16, color: C.muted }} />
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>Personal Details</Typography>
                  </Box>
                  <Button size="small" startIcon={<EditOutlined sx={{ fontSize: 14 }} />} onClick={openEdit} sx={{ fontSize: "0.75rem", fontWeight: 700 }}>Edit</Button>
                </Box>
                <InfoRow label="Mobile" value={member.mobile} />
                <InfoRow label="Email" value={member.email || "-"} />
                {member.notes && <InfoRow label="Notes" value={member.notes} />}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ ...MODULE_CARD_SX, p: 2.1, borderRadius: "12px", height: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarTodayOutlined sx={{ fontSize: 16, color: C.muted }} />
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>Membership Details</Typography>
                  </Box>
                  <Button size="small" startIcon={<EditOutlined sx={{ fontSize: 14 }} />} onClick={openRenew} sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
                    {memberIsEnded ? "Reopen" : "Change"}
                  </Button>
                </Box>
                <InfoRow label="Plan" value={member.planSnapshot.name} />
                <InfoRow label="Duration" value={`${member.planSnapshot.durationDays} days`} />
                <InfoRow label="Slot" value={`${member.slotSnapshot.label} (${member.slotSnapshot.startTime}-${member.slotSnapshot.endTime})`} />
                <InfoRow label="Start" value={fmtDate(member.startDate)} />
                <InfoRow label="End" value={fmtDate(member.endDate)} />
              </Paper>
            </Grid>

            {/* Payment history */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ ...MODULE_CARD_SX, borderRadius: "12px", overflow: "hidden" }}>
                <Box sx={{ px: 2.1, py: 1.45, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 1 }}>
                  <CreditCardOutlined sx={{ fontSize: 16, color: C.muted }} />
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>Payment History</Typography>
                </Box>
                {member.payments.length === 0 ? (
                  <Box sx={{ py: 3, textAlign: "center" }}>
                    <Typography sx={{ fontSize: "0.85rem", color: C.muted, fontWeight: 600 }}>No payments recorded yet</Typography>
                  </Box>
                ) : isCompactPaymentHistory ? (
                  <Box sx={{ p: 1.4, display: "flex", flexDirection: "column", gap: 1.1 }}>
                    {member.payments.map((payment) => (
                      <Box
                        key={payment._id}
                        sx={{
                          ...MODULE_CARD_SX,
                          p: 1.3,
                          borderRadius: "12px",
                          boxShadow: "none",
                          background: "linear-gradient(180deg, rgba(255,255,255,0.995) 0%, rgba(252,248,243,0.98) 100%)",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.1 }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: "0.86rem", color: C.slate, fontWeight: 700 }}>
                              {fmtDate(payment.paidOn)}
                            </Typography>
                            <Typography sx={{ mt: 0.35, fontSize: "0.72rem", color: C.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.45 }}>
                              {fmtPaymentMethod(payment.paymentMethod)}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: "0.92rem", fontWeight: 900, color: C.green, flexShrink: 0 }}>
                            {fmt(payment.amount)}
                          </Typography>
                        </Box>
                        <Typography sx={{ mt: 0.8, fontSize: "0.8rem", color: C.muted, fontWeight: 600, lineHeight: 1.45 }}>
                          {payment.note || "-"}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <TableContainer sx={MODULE_TABLE_CONTAINER_SX}>
                    <Table size="small" sx={{ minWidth: { xs: 460, sm: 500, md: 0 } }}>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: C.surface }}>
                          {["Date", "Amount", "Method", "Note"].map(h => (
                            <TableCell key={h} sx={MODULE_TABLE_HEAD_CELL_SX}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {member.payments.map((payment) => (
                          <TableRow key={payment._id} sx={{ "&:last-child td": { border: 0 } }}>
                            <TableCell sx={{ py: 1.25 }}>
                              <Typography sx={{ fontSize: "0.9rem", color: C.slate, fontWeight: 600 }}>{fmtDate(payment.paidOn)}</Typography>
                            </TableCell>
                            <TableCell sx={{ py: 1.25 }}>
                              <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, color: C.green }}>{fmt(payment.amount)}</Typography>
                            </TableCell>
                            <TableCell sx={{ py: 1.25 }}>
                              <Typography sx={{ fontSize: "0.88rem", color: C.slate, fontWeight: 700 }}>
                                {fmtPaymentMethod(payment.paymentMethod)}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 1.25 }}>
                              <Typography sx={{ fontSize: "0.88rem", color: C.muted, fontWeight: 600 }}>{payment.note || "-"}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Right column */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

            {/* Payment summary */}
            <Paper elevation={0} sx={{ ...MODULE_CARD_SX, p: 2.1, borderRadius: "12px" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PaymentOutlined sx={{ fontSize: 16, color: C.muted }} />
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>Payment Summary</Typography>
                </Box>
                <StatusBadge status={member.status} />
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <InfoRow label="Final Price" value={fmt(member.finalPrice)} />
                <InfoRow label="Total Paid" value={fmt(member.paidAmount)} />
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {member.membershipClosure
                    ? member.membershipClosure.refundableBalance > 0
                      ? "Refund Due"
                      : member.membershipClosure.payableBalance > 0
                        ? "Balance Due"
                        : "Settlement"
                    : "Pending"}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "1.25rem",
                    fontWeight: 900,
                    color: member.membershipClosure
                      ? member.membershipClosure.refundableBalance > 0
                        ? C.green
                        : member.membershipClosure.payableBalance > 0
                          ? "#B91C1C"
                          : C.green
                      : member.pendingAmount > 0
                        ? "#B91C1C"
                        : C.green,
                  }}
                >
                  {member.membershipClosure
                    ? member.membershipClosure.refundableBalance > 0
                      ? fmt(member.membershipClosure.refundableBalance)
                      : member.membershipClosure.payableBalance > 0
                        ? fmt(member.membershipClosure.payableBalance)
                        : "Settled"
                    : member.pendingAmount > 0
                      ? fmt(member.pendingAmount)
                      : "Fully Paid"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mt: 2 }}>
                {memberIsEnded ? (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<UndoOutlined />}
                      fullWidth
                      onClick={openRevertEnd}
                      sx={{ fontWeight: 700, borderRadius: "10px", py: 1.1 }}
                    >
                      Revert End
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<AutorenewOutlined />}
                      fullWidth
                      onClick={openRenew}
                      sx={{ fontWeight: 700, borderRadius: "10px", py: 1.1 }}
                    >
                      Reopen Membership
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      startIcon={<PaymentOutlined />}
                      fullWidth
                      onClick={openPayment}
                      disabled={member.pendingAmount <= 0}
                      sx={{ fontWeight: 700, borderRadius: "10px", py: 1.1 }}
                    >
                      Record Payment
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<AutorenewOutlined />}
                      fullWidth
                      onClick={openRenew}
                      sx={{ fontWeight: 700, borderRadius: "10px", py: 1.1 }}
                    >
                      {memberIsActive ? "Change / Renew Plan" : "Renew Membership"}
                    </Button>
                    <Button
                      variant="text"
                      startIcon={<PersonOffOutlined />}
                      fullWidth
                      onClick={openEndMembership}
                      sx={{ fontWeight: 700, borderRadius: "10px", py: 1.05, color: "#B45309" }}
                    >
                      End Membership
                    </Button>
                  </>
                )}
              </Box>
            </Paper>

            {member.membershipClosure && (
              <Paper elevation={0} sx={{ ...MODULE_CARD_SX, p: 2.1, borderRadius: "12px" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <PersonOffOutlined sx={{ fontSize: 16, color: C.muted }} />
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>
                    Closure Summary
                  </Typography>
                </Box>
                <InfoRow label="Ended On" value={fmtDate(member.membershipClosure.endedOn)} />
                <InfoRow label="Used Value" value={fmt(member.membershipClosure.usedValue)} />
                <InfoRow label="Settlement Deduction" value={fmt(member.membershipClosure.settlementDeduction)} />
                <InfoRow
                  label={member.membershipClosure.refundableBalance > 0 ? "Refund Due" : "Balance Due"}
                  value={fmt(member.membershipClosure.refundableBalance > 0 ? member.membershipClosure.refundableBalance : member.membershipClosure.payableBalance)}
                />
              </Paper>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Payment Modal */}
      <Dialog open={activeModal === "payment"} onClose={closeModal} maxWidth="xs" fullWidth fullScreen={fullScreenDialog}
        PaperProps={{ elevation: 0, sx: MODULE_DIALOG_PAPER_SX }}
      >
        <DialogTitle sx={MODULE_DIALOG_TITLE_SX}>Record Payment</DialogTitle>
        <DialogContent ref={paymentDialogContentRef} sx={MODULE_DIALOG_CONTENT_SX}>
          {modalError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{modalError}</Alert>}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField label="Amount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} fullWidth autoFocus sx={MODULE_FIELD_SX}
              InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
              inputProps={{ min: 1, max: Math.max(member.pendingAmount, 0), onWheel: preventNumberScroll }}
              helperText={member.pendingAmount > 0 ? `Pending: ${fmt(member.pendingAmount)}` : ""} />
            {Number(paymentAmount || 0) > 0 ? (
              <TextField
                select
                label="Payment Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | "")}
                fullWidth
                sx={MODULE_FIELD_SX}
                helperText="Select how this payment was collected"
              >
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            <TextField label="Payment Date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} fullWidth sx={MODULE_FIELD_SX} InputLabelProps={{ shrink: true }} />
            <TextField label="Note (optional)" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} fullWidth multiline rows={2} sx={MODULE_FIELD_SX} />
          </Box>
        </DialogContent>
        <DialogActions sx={MODULE_DIALOG_ACTIONS_SX}>
          <Button onClick={closeModal} disabled={isSubmitting} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handlePayment} disabled={isSubmitting} sx={{ fontWeight: 700 }}>
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "Record Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Renew Modal */}
      <Dialog open={activeModal === "renew"} onClose={closeModal} maxWidth="sm" fullWidth fullScreen={fullScreenDialog}
        PaperProps={{ elevation: 0, sx: MODULE_DIALOG_PAPER_SX }}
      >
        <DialogTitle sx={MODULE_DIALOG_TITLE_SX}>
          {isUpgrade ? "Change Plan" : memberIsEnded ? "Reopen Membership" : "Renew Membership"}
        </DialogTitle>
        <DialogContent ref={renewDialogContentRef} sx={MODULE_DIALOG_CONTENT_SX}>
          {modalError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{modalError}</Alert>}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            {isUpgrade && (
              <Box sx={{ p: 2, backgroundColor: "#EFF6FF", borderRadius: "10px", border: "1px solid #BFDBFE" }}>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: "#1D4ED8", mb: 0.5 }}>Mid-cycle plan change</Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "#1E40AF", fontWeight: 600 }}>
                  Credit is now based on funded value already paid, after settling the portion already used.
                </Typography>
              </Box>
            )}
              <TextField select label="Plan" value={renewPlanId} onChange={(e) => handleRenewPlanChange(e.target.value)} fullWidth autoFocus sx={MODULE_FIELD_SX}>
              {plans.map((plan) => <MenuItem key={plan._id} value={plan._id}>{plan.name} - {fmt(plan.basePrice)} / {plan.durationDays} days</MenuItem>)}
            </TextField>
              <TextField select label="Slot" value={renewSlotId} onChange={(e) => handleRenewSlotChange(e.target.value)} fullWidth sx={MODULE_FIELD_SX}>
              {slots.map((slot) => <MenuItem key={slot._id} value={slot._id}>{slot.label} ({slot.startTime} - {slot.endTime})</MenuItem>)}
            </TextField>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField label="Start Date" type="date" value={renewStartDate} onChange={(e) => { setRenewStartDate(e.target.value); const p = plans.find(pl => pl._id === renewPlanId); if (p) setRenewEndDate(addDays(e.target.value, p.durationDays)); }} fullWidth sx={MODULE_FIELD_SX} InputLabelProps={{ shrink: true }} disabled={isUpgrade} helperText={isUpgrade ? "Plan changes start from today" : undefined} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="End Date" type="date" value={renewEndDate} fullWidth sx={MODULE_FIELD_SX} InputLabelProps={{ shrink: true }} disabled helperText="Auto-calculated" />
              </Grid>
            </Grid>
            {isUpgrade && newPlanPrice > 0 && (
              <Box sx={{ p: 2, backgroundColor: C.surface, borderRadius: "10px", border: `1px solid ${C.border}` }}>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: C.slate, mb: 1 }}>Price Breakdown</Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                  <Typography sx={{ fontSize: "0.78rem", color: C.muted, fontWeight: 600 }}>New plan price</Typography>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{fmt(newPlanPrice)}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                  <Typography sx={{ fontSize: "0.78rem", color: C.muted, fontWeight: 600 }}>Paid + credit balance</Typography>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{fmt(member.paidAmount + (member.creditBalance || 0))}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                  <Typography sx={{ fontSize: "0.78rem", color: C.muted, fontWeight: 600 }}>Used value</Typography>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{fmt(planChangeUsedValue)}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                  <Typography sx={{ fontSize: "0.78rem", color: C.muted, fontWeight: 600 }}>Available credit</Typography>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: C.green }}>- {fmt(proratedCredit)}</Typography>
                </Box>
                {planChangeShortfall > 0 && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                    <Typography sx={{ fontSize: "0.78rem", color: C.muted, fontWeight: 600 }}>Used portion still to settle</Typography>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: C.red }}>{fmt(planChangeShortfall)}</Typography>
                  </Box>
                )}
                <Divider sx={{ my: 0.75 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 800 }}>Amount due</Typography>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: "#1D4ED8" }}>
                    {fmt(Math.max(0, newPlanPrice - proratedCredit + planChangeShortfall))}
                  </Typography>
                </Box>
              </Box>
            )}
            {isCalculating && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={14} />
                <Typography sx={{ fontSize: "0.75rem", color: C.muted, fontWeight: 600 }}>Calculating price...</Typography>
              </Box>
            )}
            <TextField label="Final Price for this period" type="number" value={renewFinalPrice} onChange={(e) => setRenewFinalPrice(e.target.value)} fullWidth sx={MODULE_FIELD_SX}
              InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
              inputProps={{ onWheel: preventNumberScroll }}
              helperText="Auto-calculated. Override if needed." />
            <TextField label="Payment collected now (optional)" type="number" value={renewPayment} onChange={(e) => setRenewPayment(e.target.value)} fullWidth sx={MODULE_FIELD_SX}
              InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
              inputProps={{ min: 0, max: Math.max(renewPayableAmount, 0), onWheel: preventNumberScroll }}
              helperText={isUpgrade ? `Payable after settlement: ${fmt(renewPayableAmount)}` : "Leave blank if no payment now"} />
            {Number(renewPayment || 0) > 0 ? (
              <TextField
                select
                label="Payment Method"
                value={renewPaymentMethod}
                onChange={(e) => setRenewPaymentMethod(e.target.value as PaymentMethod | "")}
                fullWidth
                sx={MODULE_FIELD_SX}
                helperText="Select how the collected amount was paid"
              >
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
          </Box>
        </DialogContent>
        <DialogActions sx={MODULE_DIALOG_ACTIONS_SX}>
          <Button onClick={closeModal} disabled={isSubmitting} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleRenew} disabled={isSubmitting} sx={{ fontWeight: 700 }}>
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : isUpgrade ? "Change Plan" : memberIsEnded ? "Reopen Membership" : "Renew"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={activeModal === "edit"} onClose={closeModal} maxWidth="xs" fullWidth fullScreen={fullScreenDialog}
        PaperProps={{ elevation: 0, sx: MODULE_DIALOG_PAPER_SX }}
      >
        <DialogTitle sx={MODULE_DIALOG_TITLE_SX}>Edit Member</DialogTitle>
        <DialogContent ref={editDialogContentRef} sx={MODULE_DIALOG_CONTENT_SX}>
          {modalError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{modalError}</Alert>}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField label="Full Name" value={editName} onChange={(e) => setEditName(e.target.value)} fullWidth autoFocus sx={MODULE_FIELD_SX} />
            <TextField label="Mobile" value={editMobile} onChange={(e) => setEditMobile(e.target.value)} fullWidth sx={MODULE_FIELD_SX} />
            <TextField label="Email (optional)" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} fullWidth sx={MODULE_FIELD_SX} />
            <TextField label="Notes (optional)" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} fullWidth multiline rows={3} sx={MODULE_FIELD_SX} />
          </Box>
        </DialogContent>
        <DialogActions sx={MODULE_DIALOG_ACTIONS_SX}>
          <Button onClick={closeModal} disabled={isSubmitting} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={isSubmitting} sx={{ fontWeight: 700 }}>
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={activeModal === "end"} onClose={closeModal} maxWidth="sm" fullWidth fullScreen={fullScreenDialog}
        PaperProps={{ elevation: 0, sx: MODULE_DIALOG_PAPER_SX }}
      >
        <DialogTitle sx={MODULE_DIALOG_TITLE_SX}>
          End Membership
        </DialogTitle>
        <DialogContent ref={endDialogContentRef} sx={MODULE_DIALOG_CONTENT_SX}>
          {modalError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{modalError}</Alert>}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Effective End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
              autoFocus
              sx={MODULE_FIELD_SX}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Settlement Deduction"
              type="number"
              value={settlementDeduction}
              onChange={(e) => setSettlementDeduction(e.target.value)}
              fullWidth
              sx={MODULE_FIELD_SX}
              InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
              inputProps={{ min: 0, onWheel: preventNumberScroll }}
              helperText="Optional deduction before final refund or settlement."
            />
            <Paper elevation={0} sx={{ ...MODULE_CARD_SX, p: 2, borderRadius: "12px", backgroundColor: C.surface }}>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: C.slate, mb: 1.25 }}>
                Settlement Preview
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography sx={{ fontSize: "0.82rem", color: C.muted, fontWeight: 600 }}>Plan</Typography>
                  <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 700 }}>{member.planSnapshot.name}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography sx={{ fontSize: "0.82rem", color: C.muted, fontWeight: 600 }}>Used Value</Typography>
                  <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 700 }}>{fmt(closureUsedValue)}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography sx={{ fontSize: "0.82rem", color: C.muted, fontWeight: 600 }}>Paid + Credit Balance</Typography>
                  <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 700 }}>{fmt(closurePaidAndCredit)}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography sx={{ fontSize: "0.82rem", color: C.muted, fontWeight: 600 }}>Settlement Deduction</Typography>
                  <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 700 }}>{fmt(closureDeductionValue)}</Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 800 }}>
                    {closureRefundableBalance > 0 ? "Refund Due" : "Balance Due"}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.9rem",
                      color: closureRefundableBalance > 0 ? C.green : "#B91C1C",
                      fontWeight: 900,
                    }}
                  >
                    {fmt(closureRefundableBalance > 0 ? closureRefundableBalance : closurePayableBalance)}
                  </Typography>
                </Box>
              </Box>
            </Paper>
            <TextField
              label="Notes (optional)"
              value={endNote}
              onChange={(e) => setEndNote(e.target.value)}
              fullWidth
              multiline
              rows={3}
              sx={MODULE_FIELD_SX}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={MODULE_DIALOG_ACTIONS_SX}>
          <Button onClick={closeModal} disabled={isSubmitting} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleEndMembership}
            disabled={isSubmitting}
            sx={{ fontWeight: 700 }}
          >
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "Confirm End Membership"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={activeModal === "revert"} onClose={closeModal} maxWidth="xs" fullWidth fullScreen={fullScreenDialog}
        PaperProps={{ elevation: 0, sx: MODULE_DIALOG_PAPER_SX }}
      >
        <DialogTitle sx={MODULE_DIALOG_TITLE_SX}>Revert End</DialogTitle>
        <DialogContent ref={revertDialogContentRef} sx={MODULE_DIALOG_CONTENT_SX}>
          {modalError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{modalError}</Alert>}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
            <Typography sx={{ fontSize: "0.92rem", color: C.slate, fontWeight: 700 }}>
              Use this only when the membership was ended by mistake.
            </Typography>
            <Typography sx={{ fontSize: "0.85rem", color: C.muted, fontWeight: 600, lineHeight: 1.6 }}>
              This restores the previous membership end date and the credit balance that existed before the membership was ended. The current plan continues without starting a new cycle.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={MODULE_DIALOG_ACTIONS_SX}>
          <Button onClick={closeModal} disabled={isSubmitting} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleRevertEnd} disabled={isSubmitting} sx={{ fontWeight: 700 }}>
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "Confirm Revert"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
