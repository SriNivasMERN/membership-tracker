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
} from "@mui/material";
import {
  ArrowBackOutlined,
  PaymentOutlined,
  AutorenewOutlined,
  EditOutlined,
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

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
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

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentDate, setPaymentDate] = useState("");

  // Renew / Change Plan form
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

  // Edit form
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

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [plansRes, slotsRes] = await Promise.all([
          plansApi.getAll(),
          slotsApi.getAll(),
        ]);
        setPlans(plansRes.data || []);
        setSlots(slotsRes.data || []);
      } catch {
        // silent
      }
    };
    loadOptions();
  }, []);

  // Auto-open edit modal if ?action=edit in URL - only once
  useEffect(() => {
    if (
      searchParams.get("action") === "edit" &&
      member &&
      activeModal === null &&
      !autoOpenDone
    ) {
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
    const memberIsActive =
      member.status === "active" || member.status === "expiring_soon";
    setIsUpgrade(memberIsActive);

    setRenewPlanId(member.planSnapshot.planId as string);
    setRenewSlotId(member.slotSnapshot.slotId as string);
    setRenewStartDate(today);

    const endDate = addDays(today, member.planSnapshot.durationDays);
    setRenewEndDate(endDate);

    if (memberIsActive) {
      const endDateObj = new Date(member.endDate);
      const todayObj = new Date(today);
      const unusedDays = Math.max(
        0,
        Math.ceil(
          (endDateObj.getTime() - todayObj.getTime()) / (1000 * 60 * 60 * 24)
        )
      );
      const dailyRate = member.finalPrice / member.planSnapshot.durationDays;
      const credit = Math.round(dailyRate * unusedDays);
      setProratedCredit(credit);
      setNewPlanPrice(member.finalPrice);
      const amountDue = Math.max(0, member.finalPrice - credit);
      setRenewFinalPrice(String(member.finalPrice));
      setRenewPayment(String(amountDue));
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
    if (!planId) return;

    const selectedPlan = plans.find((p) => p._id === planId);
    if (selectedPlan && renewStartDate) {
      const endDate = addDays(renewStartDate, selectedPlan.durationDays);
      setRenewEndDate(endDate);
      setRenewFinalPrice(String(selectedPlan.basePrice));
      setNewPlanPrice(selectedPlan.basePrice);
      if (isUpgrade) {
        const amountDue = Math.max(0, selectedPlan.basePrice - proratedCredit);
        setRenewPayment(String(amountDue));
      }
    }

    await recalculatePrice(planId, renewSlotId);
  };

  const handleRenewSlotChange = async (slotId: string) => {
    setRenewSlotId(slotId);
    await recalculatePrice(renewPlanId, slotId);
  };

  const handleRenewStartDateChange = (date: string) => {
    setRenewStartDate(date);
    const selectedPlan = plans.find((p) => p._id === renewPlanId);
    if (selectedPlan && date) {
      setRenewEndDate(addDays(date, selectedPlan.durationDays));
    }
  };

  const recalculatePrice = async (planId: string, slotId: string) => {
    if (!planId || !slotId) return;
    setIsCalculating(true);
    try {
      const response = await pricingApi.calculate(planId, slotId);
      const calculatedPrice = response.data?.finalPrice;
      const selectedPlan = plans.find((p) => p._id === planId);
      const finalCalculated =
        calculatedPrice && calculatedPrice > 0
          ? calculatedPrice
          : selectedPlan?.basePrice ?? 0;

      setNewPlanPrice(finalCalculated);
      setRenewFinalPrice(String(finalCalculated));

      if (isUpgrade) {
        const amountDue = Math.max(0, finalCalculated - proratedCredit);
        setRenewPayment(String(amountDue));
      }
    } catch {
      const selectedPlan = plans.find((p) => p._id === planId);
      const fallback = selectedPlan?.basePrice ?? 0;
      setNewPlanPrice(fallback);
      setRenewFinalPrice(String(fallback));
      if (isUpgrade) {
        setRenewPayment(String(Math.max(0, fallback - proratedCredit)));
      }
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
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setModalError("Enter a valid payment amount");
      return;
    }
    setIsSubmitting(true);
    setModalError(null);
    try {
      await membersApi.addPayment(memberId, {
        amount: parseFloat(paymentAmount),
        paidOn: paymentDate,
        note: paymentNote || undefined,
      });
      showToast("Payment recorded successfully");
      closeModal();
      fetchMember();
    } catch {
      setModalError("Failed to record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenew = async () => {
    if (!renewStartDate) {
      setModalError("Start date is required");
      return;
    }
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
      showToast(isUpgrade ? "Plan changed successfully" : "Membership renewed successfully");
      closeModal();
      fetchMember();
    } catch {
      setModalError("Failed to update membership.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editName || editName.length < 2) {
      setModalError("Name must be at least 2 characters");
      return;
    }
    setIsSubmitting(true);
    setModalError(null);
    try {
      await membersApi.update(memberId, {
        name: editName,
        mobile: editMobile || undefined,
        email: editEmail || undefined,
        notes: editNotes || undefined,
      });
      showToast("Member updated successfully");
      closeModal();
      fetchMember();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setModalError(err.response?.data?.message || "Failed to update member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    `Rs.${amount.toLocaleString("en-IN")}`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={300} sx={{ mb: 3, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={200} sx={{ mb: 3, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error || !member) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackOutlined />}
          onClick={() => router.push("/members")}
          color="inherit"
          size="small"
          sx={{ mb: 2 }}
        >
          Back to Members
        </Button>
        <Alert severity="error">{error || "Member not found."}</Alert>
      </Box>
    );
  }

  const memberIsActive =
    member.status === "active" || member.status === "expiring_soon";

  return (
    <Box>
      <Box sx={{ mb: 1 }}>
        <Button
          startIcon={<ArrowBackOutlined />}
          onClick={() => router.push("/members")}
          color="inherit"
          size="small"
        >
          Back to Members
        </Button>
      </Box>

      <PageHeader
        title={member.name}
        subtitle={`Member since ${formatDate(member.createdAt)}`}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>

          {/* Personal Info */}
          <Paper sx={{ p: 3, mb: 3, border: "1px solid #E2E8F0", boxShadow: "none", borderRadius: "12px" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600}>Personal Information</Typography>
              <Button size="small" startIcon={<EditOutlined />} onClick={openEdit}>Edit</Button>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Full Name</Typography>
                <Typography variant="body2" fontWeight={500}>{member.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Mobile</Typography>
                <Typography variant="body2">{member.mobile}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Email</Typography>
                <Typography variant="body2">{member.email || "-"}</Typography>
              </Grid>
              {member.notes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                  <Typography variant="body2">{member.notes}</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Membership Details */}
          <Paper sx={{ p: 3, mb: 3, border: "1px solid #E2E8F0", boxShadow: "none", borderRadius: "12px" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600}>Membership Details</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <StatusBadge status={member.status} />
                <Button size="small" startIcon={<EditOutlined />} onClick={openRenew}>
                  Change
                </Button>
              </Box>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Plan</Typography>
                <Typography variant="body2" fontWeight={500}>{member.planSnapshot.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {member.planSnapshot.durationDays} days
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Slot</Typography>
                <Typography variant="body2" fontWeight={500}>{member.slotSnapshot.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {member.slotSnapshot.startTime} - {member.slotSnapshot.endTime}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Start Date</Typography>
                <Typography variant="body2">{formatDate(member.startDate)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">End Date</Typography>
                <Typography variant="body2">{formatDate(member.endDate)}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Payment History */}
          <Paper sx={{ p: 3, border: "1px solid #E2E8F0", boxShadow: "none", borderRadius: "12px" }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
              Payment History
            </Typography>
            {member.payments.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No payments recorded yet.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Note</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {member.payments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell>{formatDate(payment.paidOn)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" color="success.main" fontWeight={500}>
                            {formatCurrency(payment.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {payment.note || "-"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>

          {/* Payment Summary */}
          <Paper sx={{ p: 3, mb: 3, border: "1px solid #E2E8F0", boxShadow: "none", borderRadius: "12px" }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
              Payment Summary
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Final Price</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatCurrency(member.finalPrice)}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Total Paid</Typography>
                <Typography variant="body2" fontWeight={600} color="success.main">
                  {formatCurrency(member.paidAmount)}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Pending</Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color={member.pendingAmount > 0 ? "error.main" : "success.main"}
                >
                  {member.pendingAmount > 0
                    ? formatCurrency(member.pendingAmount)
                    : "Fully Paid"}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Actions */}
          <Paper sx={{ p: 3, border: "1px solid #E2E8F0", boxShadow: "none", borderRadius: "12px" }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
              Actions
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Button
                variant="contained"
                startIcon={<PaymentOutlined />}
                fullWidth
                onClick={openPayment}
                disabled={member.pendingAmount <= 0}
              >
                Record Payment
              </Button>
              <Button
                variant="outlined"
                startIcon={<AutorenewOutlined />}
                fullWidth
                onClick={openRenew}
              >
                {memberIsActive ? "Change / Renew Plan" : "Renew Membership"}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Payment Modal */}
      <Dialog
        open={activeModal === "payment"}
        onClose={closeModal}
        maxWidth="xs"
        fullWidth
        PaperProps={{ elevation: 0, sx: { borderRadius: "16px", border: "1px solid #E2E8F0" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pt: 2.5, pb: 1, px: 3 }}>
          Record Payment
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          {modalError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{modalError}</Alert>}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Amount"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
              }}
              helperText={
                member.pendingAmount > 0
                  ? `Pending: ${formatCurrency(member.pendingAmount)}`
                  : ""
              }
            />
            <TextField
              label="Payment Date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Note (optional)"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
          <Button onClick={closeModal} disabled={isSubmitting} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handlePayment} disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "Record Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Renew / Change Plan Modal */}
      <Dialog
        open={activeModal === "renew"}
        onClose={closeModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{ elevation: 0, sx: { borderRadius: "16px", border: "1px solid #E2E8F0" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pt: 2.5, pb: 1, px: 3 }}>
          {isUpgrade ? "Change Plan" : "Renew Membership"}
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          {modalError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{modalError}</Alert>}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>

            {isUpgrade && (
              <Box sx={{ p: 2, backgroundColor: "#EFF6FF", borderRadius: "10px", border: "1px solid #BFDBFE" }}>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#1D4ED8", mb: 0.5 }}>
                  Mid-cycle plan change
                </Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "#1E40AF", fontWeight: 500 }}>
                  Current membership has{" "}
                  {Math.max(
                    0,
                    Math.ceil(
                      (new Date(member.endDate).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )}{" "}
                  unused days. Credit of {formatCurrency(proratedCredit)} has been
                  calculated and deducted from the new plan price. You can override
                  the final amount if needed.
                </Typography>
              </Box>
            )}

            <TextField
              select
              label="Plan"
              value={renewPlanId}
              onChange={(e) => handleRenewPlanChange(e.target.value)}
              fullWidth
            >
              {plans.map((plan) => (
                <MenuItem key={plan._id} value={plan._id}>
                  {plan.name} - {formatCurrency(plan.basePrice)} / {plan.durationDays} days
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Slot"
              value={renewSlotId}
              onChange={(e) => handleRenewSlotChange(e.target.value)}
              fullWidth
            >
              {slots.map((slot) => (
                <MenuItem key={slot._id} value={slot._id}>
                  {slot.label} ({slot.startTime} - {slot.endTime})
                </MenuItem>
              ))}
            </TextField>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={renewStartDate}
                  onChange={(e) => handleRenewStartDateChange(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="End Date"
                  type="date"
                  value={renewEndDate}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  disabled
                  helperText="Auto-calculated from plan duration"
                />
              </Grid>
            </Grid>

            {isUpgrade && newPlanPrice > 0 && (
              <Box sx={{ p: 2, backgroundColor: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151", mb: 1 }}>
                  Price Breakdown
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: "0.78rem", color: "#6B7280" }}>New plan price</Typography>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 600 }}>{formatCurrency(newPlanPrice)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: "0.78rem", color: "#6B7280" }}>Unused days credit</Typography>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "#15803D" }}>
                      - {formatCurrency(proratedCredit)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 0.5 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>Amount due</Typography>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#1D4ED8" }}>
                      {formatCurrency(Math.max(0, newPlanPrice - proratedCredit))}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {isCalculating && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={14} />
                <Typography sx={{ fontSize: "0.75rem", color: "#6B7280" }}>
                  Calculating price...
                </Typography>
              </Box>
            )}

            <TextField
              label="Final Price for this period"
              type="number"
              value={renewFinalPrice}
              onChange={(e) => setRenewFinalPrice(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
              }}
              helperText="Auto-calculated. Override if needed."
            />

            <TextField
              label="Payment collected now (optional)"
              type="number"
              value={renewPayment}
              onChange={(e) => setRenewPayment(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
              }}
              helperText={
                isUpgrade
                  ? "Pre-filled with amount due after credit. Override if needed."
                  : "Leave blank if no payment collected now"
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
          <Button onClick={closeModal} disabled={isSubmitting} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleRenew} disabled={isSubmitting}>
            {isSubmitting
              ? <CircularProgress size={20} color="inherit" />
              : isUpgrade ? "Change Plan" : "Renew"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={activeModal === "edit"}
        onClose={closeModal}
        maxWidth="xs"
        fullWidth
        PaperProps={{ elevation: 0, sx: { borderRadius: "16px", border: "1px solid #E2E8F0" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pt: 2.5, pb: 1, px: 3 }}>
          Edit Member
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          {modalError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{modalError}</Alert>}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Full Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Mobile"
              value={editMobile}
              onChange={(e) => setEditMobile(e.target.value)}
              fullWidth
            />
            <TextField
              label="Email (optional)"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              fullWidth
            />
            <TextField
              label="Notes (optional)"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
          <Button onClick={closeModal} disabled={isSubmitting} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}