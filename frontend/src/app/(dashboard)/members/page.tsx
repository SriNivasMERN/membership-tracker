"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AddOutlined,
  ClearOutlined,
  DeleteOutlined,
  EditOutlined,
  FilterListOutlined,
  SearchOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/context/ToastContext";
import { membersApi } from "@/lib/api/members.api";
import { plansApi } from "@/lib/api/plans.api";
import { Member } from "@/types/member.types";
import { Plan } from "@/types/plan.types";

const C = {
  navy: "#1E3A5F",
  slate: "#334155",
  muted: "#64748B",
  border: "#E2E8F0",
  surface: "#F8FAFC",
  green: "#15803D",
  red: "#B91C1C",
};

function SummaryStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "success";
}) {
  const styles =
    tone === "warning"
      ? { backgroundColor: "#FFFBEB", borderColor: "#FDE68A", valueColor: "#92400E" }
      : tone === "success"
        ? { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0", valueColor: "#15803D" }
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

export default function MembersPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    plansApi
      .getAll()
      .then((response) => setPlans(response.data || []))
      .catch(() => {});
  }, []);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await membersApi.getAll({
        page,
        limit: 10,
        search: search.trim() || undefined,
        planId: planFilter || undefined,
        status: statusFilter || undefined,
        hasPending: paymentFilter === "pending" ? true : undefined,
        fullyPaid: paymentFilter === "paid" ? true : undefined,
      });

      setMembers(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || 0);
    } catch {
      setError("Failed to load members.");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, planFilter, paymentFilter]);

  useEffect(() => {
    const delay = setTimeout(fetchMembers, 300);
    return () => clearTimeout(delay);
  }, [fetchMembers]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPlanFilter("");
    setPaymentFilter("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || statusFilter || planFilter || paymentFilter);

  const counts = useMemo(() => {
    const active = members.filter((member) => member.status === "active").length;
    const pending = members.filter((member) => member.pendingAmount > 0).length;
    const expiring = members.filter((member) => member.status === "expiring_soon").length;
    return { active, pending, expiring };
  }, [members]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatCurrency = (amount: number) => `Rs.${amount.toLocaleString("en-IN")}`;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
      <Box sx={{ display: "flex", alignItems: { xs: "flex-start", lg: "center" }, justifyContent: "space-between", flexDirection: { xs: "column", lg: "row" }, gap: 1.5 }}>
        <Box sx={{ flex: 1, display: "flex", justifyContent: { xs: "flex-start", lg: "center" } }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {!isLoading ? (
            <>
              <SummaryStat label="Overall Members" value={String(total)} />
              <SummaryStat label="Active" value={String(counts.active)} tone="success" />
              <SummaryStat label="Renewal Due" value={String(counts.expiring)} tone="warning" />
              <SummaryStat label="Payment Due" value={String(counts.pending)} />
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
          onClick={() => router.push("/members/new")}
          sx={{ px: 1.75, alignSelf: { xs: "flex-start", lg: "center" } }}
        >
          Add Member
        </Button>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: "16px", border: `1px solid ${C.border}`, p: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={4}>
              <TextField
                placeholder="Search by member name or mobile"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined sx={{ fontSize: 18, color: C.muted }} />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSearch("");
                          setPage(1);
                        }}
                      >
                        <ClearOutlined sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={2.5}>
              <TextField
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                size="small"
                fullWidth
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="expiring_soon">Renewal Due Soon</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4} md={2.5}>
              <TextField
                select
                label="Plan"
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value);
                  setPage(1);
                }}
                size="small"
                fullWidth
              >
                <MenuItem value="">All Plans</MenuItem>
                {plans.map((plan) => (
                  <MenuItem key={plan._id} value={plan._id}>
                    {plan.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <TextField
                select
                label="Payments"
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setPage(1);
                }}
                size="small"
                fullWidth
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Payment Due</MenuItem>
                <MenuItem value="paid">Fully Paid</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                variant={hasActiveFilters ? "outlined" : "contained"}
                size="small"
                fullWidth
                startIcon={<FilterListOutlined />}
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                sx={{
                  height: 40,
                  minWidth: 96,
                  opacity: hasActiveFilters ? 1 : 0.65,
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>

          {hasActiveFilters ? (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {statusFilter ? (
                <Chip label={`Status: ${statusFilter.replace("_", " ")}`} size="small" onDelete={() => setStatusFilter("")} />
              ) : null}
              {planFilter ? (
                <Chip label={`Plan: ${plans.find((p) => p._id === planFilter)?.name || planFilter}`} size="small" onDelete={() => setPlanFilter("")} />
              ) : null}
              {paymentFilter ? (
                <Chip label={paymentFilter === "pending" ? "Payment Due" : "Fully Paid"} size="small" onDelete={() => setPaymentFilter("")} />
              ) : null}
              {search ? <Chip label={`Search: ${search}`} size="small" onDelete={() => setSearch("")} /> : null}
            </Box>
          ) : null}
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: "16px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {error ? (
          <ErrorState message={error} onRetry={fetchMembers} />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: C.surface }}>
                  {["Member", "Mobile", "Plan", "Slot", "Renewal Date", "Payment Due", "Status", "Actions"].map((heading) => (
                    <TableCell key={heading} sx={{ fontWeight: 800, fontSize: "0.72rem", color: C.slate, py: 1.45, borderBottom: `1px solid ${C.border}`, letterSpacing: 0.5, textTransform: "uppercase" }}>
                      {heading}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  [...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                        <TableCell key={j} sx={{ py: 2 }}>
                          <Skeleton height={22} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ border: 0, p: 0 }}>
                      <EmptyState
                        title={hasActiveFilters ? "No members match these filters" : "No members yet"}
                        subtitle={
                          hasActiveFilters
                            ? "Try clearing one or more filters to widen the results."
                            : "Add your first member to begin tracking plans, payments, and renewals."
                        }
                        actionLabel={hasActiveFilters ? "Clear Filters" : "Add Member"}
                        onAction={hasActiveFilters ? clearFilters : () => router.push("/members/new")}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow
                      key={member._id}
                      onClick={() => router.push(`/members/${member._id}`)}
                      sx={{
                        "&:last-child td": { border: 0 },
                        "&:hover": { backgroundColor: "#F8FAFF" },
                        cursor: "pointer",
                      }}
                    >
                      <TableCell sx={{ py: 1.6 }}>
                        <Box>
                          <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: "#0F172A" }}>{member.name}</Typography>
                          <Typography sx={{ mt: 0.3, fontSize: "0.74rem", color: C.muted, fontWeight: 600 }}>
                            Joined {formatDate(member.createdAt)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.6 }}>
                        <Typography sx={{ fontSize: "0.85rem", color: C.slate, fontWeight: 600 }}>{member.mobile}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.6 }}>
                        <Typography sx={{ fontSize: "0.85rem", color: C.slate, fontWeight: 700 }}>{member.planSnapshot.name}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.6 }}>
                        <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 600 }}>{member.slotSnapshot.label}</Typography>
                        <Typography sx={{ fontSize: "0.72rem", color: C.muted, fontWeight: 600 }}>
                          {member.slotSnapshot.startTime} - {member.slotSnapshot.endTime}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.6 }}>
                        <Typography sx={{ fontSize: "0.85rem", color: C.slate, fontWeight: 600 }}>{formatDate(member.endDate)}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.6 }}>
                        <Typography sx={{ fontSize: "0.88rem", fontWeight: 800, color: member.pendingAmount > 0 ? C.red : C.green }}>
                          {member.pendingAmount > 0 ? formatCurrency(member.pendingAmount) : "Paid"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.6 }}>
                        <StatusBadge status={member.status} />
                      </TableCell>
                      <TableCell sx={{ py: 1.6 }} onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: "flex", gap: 0.4 }}>
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => router.push(`/members/${member._id}`)} sx={{ color: C.muted, "&:hover": { color: "#1D4ED8", backgroundColor: "#EFF6FF" } }}>
                              <VisibilityOutlined sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => router.push(`/members/${member._id}?action=edit`)} sx={{ color: C.muted, "&:hover": { color: C.green, backgroundColor: "#F0FDF4" } }}>
                              <EditOutlined sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => { setDeletingMember(member); setDeleteOpen(true); }} sx={{ color: C.muted, "&:hover": { color: C.red, backgroundColor: "#FEF2F2" } }}>
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
        )}

        {!isLoading && !error && totalPages > 1 ? (
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 1.2, px: 2.5, py: 1.6, borderTop: `1px solid ${C.border}` }}>
            <Typography sx={{ fontSize: "0.8rem", color: C.muted, fontWeight: 700 }}>
              Page {page} of {totalPages}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button size="small" variant="outlined" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>
                Previous
              </Button>
              <Button size="small" variant="outlined" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>
                Next
              </Button>
            </Box>
          </Box>
        ) : null}
      </Paper>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Member"
        message={`Delete "${deletingMember?.name}"? All payment history will also be removed. This cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={async () => {
          if (!deletingMember) return;
          setIsDeleting(true);
          try {
            await membersApi.delete(deletingMember._id);
            showToast("Member deleted");
            setDeleteOpen(false);
            fetchMembers();
          } catch {
            showToast("Failed to delete.", "error");
          } finally {
            setIsDeleting(false);
          }
        }}
        onCancel={() => setDeleteOpen(false)}
        isLoading={isDeleting}
      />
    </Box>
  );
}
