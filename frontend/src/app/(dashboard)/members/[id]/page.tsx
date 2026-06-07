"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "@mui/material";
import {
  ArrowBackOutlined,
  PaymentOutlined,
  AutorenewOutlined,
  EditOutlined,
  CalendarTodayOutlined,
  PersonOutlined,
  CreditCardOutlined,
} from "@mui/icons-material";
import { Member } from "@/types/member.types";
import { Plan } from "@/types/plan.types";
import { Slot } from "@/types/slot.types";
import { membersApi } from "@/lib/api/members.api";
import { plansApi } from "@/lib/api/plans.api";
import { slotsApi } from "@/lib/api/slots.api";
import { pricingApi } from "@/lib/api/pricing.api";
import { useToast } from "@/context/ToastContext";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/layout/PageHeader";

const C = {
  navy: "#1E3A5F", slate: "#334155", muted: "#64748B",
  border: "#E2E8F0", surface: "#F8FAFC", green: "#15803D", red: "#B91C1C",
};

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
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

function SummaryMetric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "warning" | "danger" }) {
  const color =
    tone === "success" ? C.green :
      tone === "warning" ? C.navy :
        tone === "danger" ? C.red :
          C.slate;

  return (
    <Paper elevation={0} sx={{ p: 1.75, border: `1px solid ${C.border}`, backgroundColor: "#FCFDFE" }}>
      <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.6, fontSize: "1.05rem", fontWeight: 900, color }}>
        {value}
      </Typography>
    </Paper>
  );
}

export default function MemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const memberId = params.id as string;
  const { showToast } = useToast();

  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  const [activeModal, setActiveModal] = useState<"payment" | "renew" | "edit" | null>(null);
  const [autoOpenDone, setAutoOpenDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentDate, setPaymentDate] = useState("");

  const [renewPlanId, setRenewPlanId] = useState("");
  const [renewSlotId, setRenewSlotId] = useState("");
  const [renewStartDate, setRenewStartDate] = useState("");
  const [renewEndDate, setRenewEndDate] = useState("");
  const [renewFinalPrice, setRenewFinalPrice] = useState("");
  const [renewPayment, setRenewPayment] = useState("");
  const [proratedCredit, setProratedCredit] = useState(0);
  const [newPlanPrice, setNewPlanPrice] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isUpgrade, setIsUpgrade] = useState(false);

  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNotes, setEditNotes] = useState("");

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
    Promise.all([plansApi.getAll(), slotsApi.getAll()]).then(([p, s]) => {
      setPlans(p.data || []);
      setSlots(s.data || []);
    }).catch(() => {});
  }, []);

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
    setPaymentNote("");
    setPaymentDate(getTodayString());
    setModalError(null);
    setActiveModal("payment");
  };

  const openRenew = () => {
    if (!member) return;
    const today = getTodayString();
    const memberIsActive = member.status === "active" || member.status === "expiring_soon";
    setIsUpgrade(memberIsActive);
    setRenewPlanId(member.planSnapshot.planId as string);
    setRenewSlotId(member.slotSnapshot.slotId as string);
    setRenewStartDate(today);
    setRenewEndDate(addDays(today, member.planSnapshot.durationDays));

    if (memberIsActive) {
      const unusedDays = Math.max(0, Math.ceil((new Date(member.endDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)));
      const credit = Math.round((member.finalPrice / member.planSnapshot.durationDays) * unusedDays);
      setProratedCredit(credit);
      setNewPlanPrice(member.finalPrice);
      setRenewFinalPrice(String(member.finalPrice));
      setRenewPayment(String(Math.max(0, member.finalPrice - credit)));
    } else {
      setProratedCredit(0);
      setNewPlanPrice(member.finalPrice);
      setRenewFinalPrice(String(member.finalPrice));
      setRenewPayment("");
    }
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
      if (isUpgrade) setRenewPayment(String(Math.max(0, selectedPlan.basePrice - proratedCredit)));
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
      if (isUpgrade) setRenewPayment(String(Math.max(0, final - proratedCredit)));
    } catch {
      const selectedPlan = plans.find((p) => p._id === planId);
      const fallback = selectedPlan?.basePrice ?? 0;
      setNewPlanPrice(fallback);
      setRenewFinalPrice(String(fallback));
      if (isUpgrade) setRenewPayment(String(Math.max(0, fallback - proratedCredit)));
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

  const handlePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) { setModalError("Enter a valid amount"); return; }
    setIsSubmitting(true);
    setModalError(null);
    try {
      await membersApi.addPayment(memberId, { amount: parseFloat(paymentAmount), paidOn: paymentDate, note: paymentNote || undefined });
      showToast("Payment recorded");
      closeModal();
      fetchMember();
    } catch { setModalError("Failed to record payment."); }
    finally { setIsSubmitting(false); }
  };

  const handleRenew = async () => {
    if (!renewStartDate) { setModalError("Start date is required"); return; }
    setIsSubmitting(true);
    setModalError(null);
    try {
      await membersApi.renew(memberId, {
        planId: renewPlanId || undefined,
        slotId: renewSlotId || undefined,
        startDate: renewStartDate,
        finalPrice: renewFinalPrice ? parseFloat(renewFinalPrice) : undefined,
        initialPayment: renewPayment ? parseFloat(renewPayment) : undefined,
      });
      showToast(isUpgrade ? "Plan changed" : "Membership renewed");
      closeModal();
      fetchMember();
    } catch { setModalError("Failed to update membership."); }
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

  const fmt = (n: number) => `Rs.${n.toLocaleString("en-IN")}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

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
        <Button startIcon={<ArrowBackOutlined />} onClick={() => router.push("/members")} color="inherit" size="small" sx={{ mb: 2 }}>Back</Button>
        <Alert severity="error">{error || "Member not found."}</Alert>
      </Box>
    );
  }

  const memberIsActive = member.status === "active" || member.status === "expiring_soon";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
      <PageHeader
        title={member.name}
        subtitle={`Member since ${fmtDate(member.createdAt)}. Review membership, record payments, or renew without leaving this page.`}
      />

      <Box sx={{ mt: -1.5 }}>
        <Button startIcon={<ArrowBackOutlined />} onClick={() => router.push("/members")} color="inherit" size="small">
          Back to Members
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryMetric label="Current Status" value={member.status === "expiring_soon" ? "Renewal Due Soon" : member.status === "expired" ? "Expired" : "Active"} tone={member.status === "expired" ? "danger" : member.status === "expiring_soon" ? "warning" : "success"} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryMetric label="Payment Due" value={member.pendingAmount > 0 ? fmt(member.pendingAmount) : "Fully Paid"} tone={member.pendingAmount > 0 ? "danger" : "success"} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryMetric label="Renewal Date" value={fmtDate(member.endDate)} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Paper elevation={0} sx={{ p: 1.75, border: `1px solid ${C.border}`, backgroundColor: "#FCFDFE", height: "100%" }}>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Quick Actions
            </Typography>
            <Box sx={{ mt: 1.1, display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="contained" size="small" startIcon={<PaymentOutlined />} onClick={openPayment} disabled={member.pendingAmount <= 0}>
                Record Payment
              </Button>
              <Button variant="outlined" size="small" startIcon={<AutorenewOutlined />} onClick={openRenew}>
                {memberIsActive ? "Change / Renew" : "Renew"}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2}>

        {/* Left column */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>

            {/* Personal + Membership side by side */}
            <Grid item xs={12} sm={6}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: "12px", border: `1px solid ${C.border}`, height: "100%" }}>
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

            <Grid item xs={12} sm={6}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: "12px", border: `1px solid ${C.border}`, height: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarTodayOutlined sx={{ fontSize: 16, color: C.muted }} />
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>Membership Details</Typography>
                  </Box>
                  <Button size="small" startIcon={<EditOutlined sx={{ fontSize: 14 }} />} onClick={openRenew} sx={{ fontSize: "0.75rem", fontWeight: 700 }}>Change</Button>
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
              <Paper elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <Box sx={{ px: 2.5, py: 1.75, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 1 }}>
                  <CreditCardOutlined sx={{ fontSize: 16, color: C.muted }} />
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>Payment History</Typography>
                </Box>
                {member.payments.length === 0 ? (
                  <Box sx={{ py: 3, textAlign: "center" }}>
                    <Typography sx={{ fontSize: "0.85rem", color: C.muted, fontWeight: 600 }}>No payments recorded yet</Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: C.surface }}>
                          {["Date", "Amount", "Note"].map(h => (
                            <TableCell key={h} sx={{ fontWeight: 800, fontSize: "0.7rem", color: C.slate, py: 1.25, borderBottom: `1px solid ${C.border}`, letterSpacing: 0.5 }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {member.payments.map((payment) => (
                          <TableRow key={payment._id} sx={{ "&:last-child td": { border: 0 } }}>
                            <TableCell sx={{ py: 1.25 }}>
                              <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 600 }}>{fmtDate(payment.paidOn)}</Typography>
                            </TableCell>
                            <TableCell sx={{ py: 1.25 }}>
                              <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: C.green }}>{fmt(payment.amount)}</Typography>
                            </TableCell>
                            <TableCell sx={{ py: 1.25 }}>
                              <Typography sx={{ fontSize: "0.82rem", color: C.muted, fontWeight: 600 }}>{payment.note || "-"}</Typography>
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

        {/* Right column - sticky summary + actions */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

            {/* Payment summary */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "12px", border: `1px solid ${C.border}` }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>Payment Summary</Typography>
                <StatusBadge status={member.status} />
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <InfoRow label="Final Price" value={fmt(member.finalPrice)} />
                <InfoRow label="Total Paid" value={fmt(member.paidAmount)} />
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Pending</Typography>
                <Typography sx={{ fontSize: "1.25rem", fontWeight: 900, color: member.pendingAmount > 0 ? "#B91C1C" : C.green }}>
                  {member.pendingAmount > 0 ? fmt(member.pendingAmount) : "Fully Paid"}
                </Typography>
              </Box>
            </Paper>

            {/* Actions */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "12px", border: `1px solid ${C.border}` }}>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, mb: 0.5 }}>Actions</Typography>
              <Typography sx={{ fontSize: "0.82rem", color: C.muted, fontWeight: 500, mb: 2 }}>
                Use these actions when the member pays, renews, or changes plan.
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Button
                  variant="contained"
                  startIcon={<PaymentOutlined />}
                  fullWidth
                  onClick={openPayment}
                  disabled={member.pendingAmount <= 0}
                  sx={{ fontWeight: 700, borderRadius: "10px", py: 1.25 }}
                >
                  Record Payment
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AutorenewOutlined />}
                  fullWidth
                  onClick={openRenew}
                  sx={{ fontWeight: 700, borderRadius: "10px", py: 1.25 }}
                >
                  {memberIsActive ? "Change / Renew Plan" : "Renew Membership"}
                </Button>
              </Box>
            </Paper>

            {/* Quick stats */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "12px", border: `1px solid ${C.border}` }}>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, mb: 1.5 }}>Quick Info</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: C.muted }}>Total payments</Typography>
                  <Chip label={member.payments.length} size="small" sx={{ fontWeight: 800, fontSize: "0.78rem", backgroundColor: "#EFF6FF", color: C.navy }} />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: C.muted }}>Payment rate</Typography>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: C.slate }}>
                    {member.finalPrice > 0 ? `${Math.round((member.paidAmount / member.finalPrice) * 100)}%` : "0%"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: C.muted }}>Days remaining</Typography>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: memberIsActive ? C.green : "#B91C1C" }}>
                    {Math.max(0, Math.ceil((new Date(member.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* Payment Modal */}
      <Dialog open={activeModal === "payment"} onClose={closeModal} maxWidth="xs" fullWidth
        PaperProps={{ elevation: 0, sx: { borderRadius: "16px", border: `1px solid ${C.border}` } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1rem", pt: 2.5, pb: 1, px: 3 }}>Record Payment</DialogTitle>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          {modalError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{modalError}</Alert>}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField label="Amount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
              helperText={member.pendingAmount > 0 ? `Pending: ${fmt(member.pendingAmount)}` : ""} />
            <TextField label="Payment Date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Note (optional)" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} fullWidth multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
          <Button onClick={closeModal} disabled={isSubmitting} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handlePayment} disabled={isSubmitting} sx={{ fontWeight: 700 }}>
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "Record Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Renew Modal */}
      <Dialog open={activeModal === "renew"} onClose={closeModal} maxWidth="sm" fullWidth
        PaperProps={{ elevation: 0, sx: { borderRadius: "16px", border: `1px solid ${C.border}` } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1rem", pt: 2.5, pb: 1, px: 3 }}>
          {isUpgrade ? "Change Plan" : "Renew Membership"}
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          {modalError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{modalError}</Alert>}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            {isUpgrade && (
              <Box sx={{ p: 2, backgroundColor: "#EFF6FF", borderRadius: "10px", border: "1px solid #BFDBFE" }}>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: "#1D4ED8", mb: 0.5 }}>Mid-cycle plan change</Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "#1E40AF", fontWeight: 600 }}>
                  {Math.max(0, Math.ceil((new Date(member.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} unused days. Credit of {fmt(proratedCredit)} deducted from new plan price.
                </Typography>
              </Box>
            )}
            <TextField select label="Plan" value={renewPlanId} onChange={(e) => handleRenewPlanChange(e.target.value)} fullWidth>
              {plans.map((plan) => <MenuItem key={plan._id} value={plan._id}>{plan.name} - {fmt(plan.basePrice)} / {plan.durationDays} days</MenuItem>)}
            </TextField>
            <TextField select label="Slot" value={renewSlotId} onChange={(e) => handleRenewSlotChange(e.target.value)} fullWidth>
              {slots.map((slot) => <MenuItem key={slot._id} value={slot._id}>{slot.label} ({slot.startTime} - {slot.endTime})</MenuItem>)}
            </TextField>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Start Date" type="date" value={renewStartDate} onChange={(e) => { setRenewStartDate(e.target.value); const p = plans.find(pl => pl._id === renewPlanId); if (p) setRenewEndDate(addDays(e.target.value, p.durationDays)); }} fullWidth InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="End Date" type="date" value={renewEndDate} fullWidth InputLabelProps={{ shrink: true }} disabled helperText="Auto-calculated" />
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
                  <Typography sx={{ fontSize: "0.78rem", color: C.muted, fontWeight: 600 }}>Unused days credit</Typography>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: C.green }}>- {fmt(proratedCredit)}</Typography>
                </Box>
                <Divider sx={{ my: 0.75 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 800 }}>Amount due</Typography>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: "#1D4ED8" }}>{fmt(Math.max(0, newPlanPrice - proratedCredit))}</Typography>
                </Box>
              </Box>
            )}
            {isCalculating && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={14} />
                <Typography sx={{ fontSize: "0.75rem", color: C.muted, fontWeight: 600 }}>Calculating price...</Typography>
              </Box>
            )}
            <TextField label="Final Price for this period" type="number" value={renewFinalPrice} onChange={(e) => setRenewFinalPrice(e.target.value)} fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
              helperText="Auto-calculated. Override if needed." />
            <TextField label="Payment collected now (optional)" type="number" value={renewPayment} onChange={(e) => setRenewPayment(e.target.value)} fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
              helperText={isUpgrade ? "Pre-filled with amount due after credit" : "Leave blank if no payment now"} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
          <Button onClick={closeModal} disabled={isSubmitting} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleRenew} disabled={isSubmitting} sx={{ fontWeight: 700 }}>
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : isUpgrade ? "Change Plan" : "Renew"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={activeModal === "edit"} onClose={closeModal} maxWidth="xs" fullWidth
        PaperProps={{ elevation: 0, sx: { borderRadius: "16px", border: `1px solid ${C.border}` } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1rem", pt: 2.5, pb: 1, px: 3 }}>Edit Member</DialogTitle>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          {modalError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{modalError}</Alert>}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField label="Full Name" value={editName} onChange={(e) => setEditName(e.target.value)} fullWidth autoFocus />
            <TextField label="Mobile" value={editMobile} onChange={(e) => setEditMobile(e.target.value)} fullWidth />
            <TextField label="Email (optional)" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} fullWidth />
            <TextField label="Notes (optional)" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} fullWidth multiline rows={3} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
          <Button onClick={closeModal} disabled={isSubmitting} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={isSubmitting} sx={{ fontWeight: 700 }}>
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
