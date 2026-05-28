"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { useToast } from "@/context/ToastContext";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/layout/PageHeader";

// Called only inside event handlers - never at module level or render time
function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

export default function MemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.id as string;
  const { showToast } = useToast();

  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  const [activeModal, setActiveModal] = useState<"payment" | "renew" | "edit" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentDate, setPaymentDate] = useState("");

  // Renew form
  const [renewPlanId, setRenewPlanId] = useState("");
  const [renewSlotId, setRenewSlotId] = useState("");
  const [renewStartDate, setRenewStartDate] = useState("");
  const [renewPayment, setRenewPayment] = useState("");

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
          plansApi.getActive(),
          slotsApi.getActive(),
        ]);
        setPlans(plansRes.data || []);
        setSlots(slotsRes.data || []);
      } catch {
        // silent - dropdowns stay empty
      }
    };
    loadOptions();
  }, []);

  const closeModal = () => {
    setActiveModal(null);
    setModalError(null);
  };

  // Date is set here - inside a click handler, client-only, no hydration risk
  const openPayment = () => {
    setPaymentAmount("");
    setPaymentNote("");
    setPaymentDate(getTodayString());
    setModalError(null);
    setActiveModal("payment");
  };

  const openRenew = () => {
    setRenewPlanId("");
    setRenewSlotId("");
    setRenewStartDate(getTodayString());
    setRenewPayment("");
    setModalError(null);
    setActiveModal("renew");
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
        initialPayment: renewPayment ? parseFloat(renewPayment) : undefined,
      });
      showToast("Membership renewed successfully");
      closeModal();
      fetchMember();
    } catch {
      setModalError("Failed to renew membership.");
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
          <Paper sx={{ p: 3, mb: 3, border: "1px solid #E8EDF3", boxShadow: "none" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Personal Information
              </Typography>
              <Button size="small" startIcon={<EditOutlined />} onClick={openEdit}>
                Edit
              </Button>
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
          <Paper sx={{ p: 3, mb: 3, border: "1px solid #E8EDF3", boxShadow: "none" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Membership Details
              </Typography>
              <StatusBadge status={member.status} />
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
          <Paper sx={{ p: 3, border: "1px solid #E8EDF3", boxShadow: "none" }}>
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
          <Paper sx={{ p: 3, mb: 3, border: "1px solid #E8EDF3", boxShadow: "none" }}>
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
          <Paper sx={{ p: 3, border: "1px solid #E8EDF3", boxShadow: "none" }}>
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
                Renew Membership
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Payment Modal */}
      <Dialog open={activeModal === "payment"} onClose={closeModal} maxWidth="xs" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeModal} disabled={isSubmitting}>Cancel</Button>
          <Button variant="contained" onClick={handlePayment} disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "Record Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Renew Modal */}
      <Dialog open={activeModal === "renew"} onClose={closeModal} maxWidth="xs" fullWidth>
        <DialogTitle>Renew Membership</DialogTitle>
        <DialogContent>
          {modalError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{modalError}</Alert>}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Leave plan and slot empty to keep current ones.
            </Typography>
            <TextField
              select
              label="New Plan (optional)"
              value={renewPlanId}
              onChange={(e) => setRenewPlanId(e.target.value)}
              fullWidth
            >
              <MenuItem value="">Keep current plan</MenuItem>
              {plans.map((plan) => (
                <MenuItem key={plan._id} value={plan._id}>{plan.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="New Slot (optional)"
              value={renewSlotId}
              onChange={(e) => setRenewSlotId(e.target.value)}
              fullWidth
            >
              <MenuItem value="">Keep current slot</MenuItem>
              {slots.map((slot) => (
                <MenuItem key={slot._id} value={slot._id}>{slot.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="New Start Date"
              type="date"
              value={renewStartDate}
              onChange={(e) => setRenewStartDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Initial Payment (optional)"
              type="number"
              value={renewPayment}
              onChange={(e) => setRenewPayment(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeModal} disabled={isSubmitting}>Cancel</Button>
          <Button variant="contained" onClick={handleRenew} disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "Renew"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={activeModal === "edit"} onClose={closeModal} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Member</DialogTitle>
        <DialogContent>
          {modalError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{modalError}</Alert>}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Full Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              fullWidth
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeModal} disabled={isSubmitting}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 