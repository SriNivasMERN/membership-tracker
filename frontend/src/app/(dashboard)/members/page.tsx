"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Skeleton,
  Tooltip,
  MenuItem,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  SearchOutlined,
  VisibilityOutlined,
  DeleteOutlined,
  ClearOutlined,
  EditOutlined,
  FilterListOutlined,
  AddOutlined,
} from "@mui/icons-material";
import { membersApi } from "@/lib/api/members.api";
import { plansApi } from "@/lib/api/plans.api";
import { Member } from "@/types/member.types";
import { Plan } from "@/types/plan.types";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import PageHeader from "@/components/layout/PageHeader";
import { useToast } from "@/context/ToastContext";

const C = {
  navy: "#1E3A5F", slate: "#334155", muted: "#64748B",
  border: "#E2E8F0", surface: "#F8FAFC", green: "#15803D", red: "#B91C1C",
};

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
    plansApi.getAll().then(r => setPlans(r.data || [])).catch(() => {});
  }, []);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await membersApi.getAll({
        page, limit: 10,
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
    setSearch(""); setStatusFilter(""); setPlanFilter(""); setPaymentFilter(""); setPage(1);
  };

  const hasActiveFilters = search || statusFilter || planFilter || paymentFilter;

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const formatCurrency = (n: number) => `Rs.${n.toLocaleString("en-IN")}`;

  return (
    <Box>
      <PageHeader
        title="Members"
        subtitle={isLoading ? "Loading..." : `${total} member${total !== 1 ? "s" : ""} total`}
        action={{ label: "Add Member", onClick: () => router.push("/members/new") }}
      />

      {/* Filters */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            placeholder="Search name or mobile..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 18, color: C.muted }} /></InputAdornment>,
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => { setSearch(""); setPage(1); }}>
                    <ClearOutlined sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
        </Grid>
        <Grid item xs={6} sm={2.5}>
          <TextField select label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} size="small" fullWidth>
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="expiring_soon">Expiring Soon</MenuItem>
            <MenuItem value="expired">Expired</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={6} sm={2.5}>
          <TextField select label="Plan" value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }} size="small" fullWidth>
            <MenuItem value="">All Plans</MenuItem>
            {plans.map((p) => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={6} sm={2}>
          <TextField select label="Payment" value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }} size="small" fullWidth>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Has Pending</MenuItem>
            <MenuItem value="paid">Fully Paid</MenuItem>
          </TextField>
        </Grid>
        {hasActiveFilters && (
          <Grid item xs={6} sm={1}>
            <Tooltip title="Clear filters">
              <Button variant="outlined" size="small" onClick={clearFilters} sx={{ height: 40, borderRadius: "8px", minWidth: 0 }} fullWidth>
                <FilterListOutlined sx={{ fontSize: 18 }} />
              </Button>
            </Tooltip>
          </Grid>
        )}
      </Grid>

      {/* Active chips */}
      {hasActiveFilters && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
          {statusFilter && <Chip label={`Status: ${statusFilter.replace("_", " ")}`} size="small" onDelete={() => setStatusFilter("")} sx={{ fontSize: "0.75rem", fontWeight: 700 }} />}
          {planFilter && <Chip label={`Plan: ${plans.find(p => p._id === planFilter)?.name || planFilter}`} size="small" onDelete={() => setPlanFilter("")} sx={{ fontSize: "0.75rem", fontWeight: 700 }} />}
          {paymentFilter && <Chip label={paymentFilter === "pending" ? "Has Pending Dues" : "Fully Paid"} size="small" onDelete={() => setPaymentFilter("")} sx={{ fontSize: "0.75rem", fontWeight: 700 }} />}
        </Box>
      )}

      <Paper elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        {error ? (
          <ErrorState message={error} onRetry={fetchMembers} />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: C.surface }}>
                  {["Name", "Mobile", "Plan", "Slot", "End Date", "Pending", "Status", "Actions"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 800, fontSize: "0.72rem", color: C.slate, py: 1.5, borderBottom: `1px solid ${C.border}`, letterSpacing: 0.5, textTransform: "uppercase" }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  [...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      {[1,2,3,4,5,6,7,8].map((j) => (
                        <TableCell key={j} sx={{ py: 2 }}><Skeleton height={20} /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ border: 0, p: 0 }}>
                      <EmptyState
                        title={hasActiveFilters ? "No members match your filters" : "No members yet"}
                        subtitle={hasActiveFilters ? "Try adjusting or clearing the filters" : "Add your first member to get started"}
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
                        borderLeft: "3px solid transparent",
                        "&:hover td:first-of-type": { borderLeft: `3px solid ${C.navy}` },
                      }}
                    >
                      <TableCell sx={{ py: 1.75 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: "#0F172A" }}>
                          {member.name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.75 }}>
                        <Typography sx={{ fontSize: "0.85rem", color: C.slate, fontWeight: 600 }}>
                          {member.mobile}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.75 }}>
                        <Typography sx={{ fontSize: "0.85rem", color: C.slate, fontWeight: 700 }}>
                          {member.planSnapshot.name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.75 }}>
                        <Typography sx={{ fontSize: "0.82rem", color: C.muted, fontWeight: 600 }}>
                          {member.slotSnapshot.label}
                        </Typography>
                        <Typography sx={{ fontSize: "0.72rem", color: C.muted, fontWeight: 600 }}>
                          {member.slotSnapshot.startTime} - {member.slotSnapshot.endTime}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.75 }}>
                        <Typography sx={{ fontSize: "0.85rem", color: C.slate, fontWeight: 600 }}>
                          {formatDate(member.endDate)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.75 }}>
                        <Typography sx={{ fontSize: "0.88rem", fontWeight: 800, color: member.pendingAmount > 0 ? C.red : C.green }}>
                          {member.pendingAmount > 0 ? formatCurrency(member.pendingAmount) : "Paid"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.75 }}>
                        <StatusBadge status={member.status} />
                      </TableCell>
                      <TableCell sx={{ py: 1.75 }} onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => router.push(`/members/${member._id}`)}
                              sx={{ color: C.muted, "&:hover": { color: "#1D4ED8", backgroundColor: "#EFF6FF" } }}>
                              <VisibilityOutlined sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => router.push(`/members/${member._id}?action=edit`)}
                              sx={{ color: C.muted, "&:hover": { color: C.green, backgroundColor: "#F0FDF4" } }}>
                              <EditOutlined sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => { setDeletingMember(member); setDeleteOpen(true); }}
                              sx={{ color: C.muted, "&:hover": { color: C.red, backgroundColor: "#FEF2F2" } }}>
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

        {!isLoading && !error && totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2.5, py: 1.5, borderTop: `1px solid ${C.border}` }}>
            <Typography sx={{ fontSize: "0.78rem", color: C.muted, fontWeight: 700 }}>
              Page {page} of {totalPages}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button size="small" variant="outlined" disabled={page === 1} onClick={() => setPage(p => p - 1)} sx={{ borderRadius: "8px", fontWeight: 700 }}>Previous</Button>
              <Button size="small" variant="outlined" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} sx={{ borderRadius: "8px", fontWeight: 700 }}>Next</Button>
            </Box>
          </Box>
        )}
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
          } catch { showToast("Failed to delete.", "error"); }
          finally { setIsDeleting(false); }
        }}
        onCancel={() => setDeleteOpen(false)}
        isLoading={isDeleting}
      />
    </Box>
  );
}