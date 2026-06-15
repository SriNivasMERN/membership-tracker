"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  CircularProgress,
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
  CheckCircleOutlined,
  AddOutlined,
  CreditCardOutlined,
  ClearOutlined,
  DeleteOutlined,
  EditOutlined,
  FilterListOutlined,
  Groups2Outlined,
  SearchOutlined,
  ScheduleOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import {
  MODULE_ACTION_ICON_SX,
  MODULE_CARD_SX,
  MODULE_COLORS,
  MODULE_FIELD_SX,
  MODULE_NEUTRAL_CHIP_SX,
  MODULE_PAGE_SX,
  MODULE_TABLE_CONTAINER_SX,
  MODULE_TABLE_HEAD_CELL_SX,
  MODULE_TABLE_ROW_SX,
  ModuleDashboardStat,
} from "@/components/ui/moduleStyles";
import { useToast } from "@/context/ToastContext";
import { useNavigationLoading } from "@/context/NavigationLoadingContext";
import { membersApi } from "@/lib/api/members.api";
import { plansApi } from "@/lib/api/plans.api";
import { Member } from "@/types/member.types";
import { Plan } from "@/types/plan.types";

const C = {
  navy: MODULE_COLORS.ink,
  slate: MODULE_COLORS.slate,
  muted: MODULE_COLORS.muted,
  border: MODULE_COLORS.border,
  surface: MODULE_COLORS.surface,
  green: MODULE_COLORS.green,
  red: MODULE_COLORS.red,
};

export default function MembersPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { startNavigation } = useNavigationLoading();
  const PAGE_SIZE = 10;
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [allMatchingMembers, setAllMatchingMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    expiring: 0,
    pending: 0,
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const hasFetchedOnceRef = useRef(false);

  useEffect(() => {
    plansApi
      .getAll()
      .then((response) => setPlans(response.data || []))
      .catch(() => {});
  }, []);

  const fetchMembers = useCallback(async () => {
    if (hasFetchedOnceRef.current) {
      setIsFiltering(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const response = await membersApi.getAll({
        page: 1,
        limit: 5000,
        search: search.trim() || undefined,
        planId: planFilter || undefined,
        status: statusFilter || undefined,
        hasPending: paymentFilter === "pending" ? true : undefined,
        fullyPaid: paymentFilter === "paid" ? true : undefined,
      });

      const matchingMembers = response.data || [];
      setAllMatchingMembers(matchingMembers);
      setSummary({
        total: matchingMembers.length,
        active: matchingMembers.filter((member: Member) => member.status === "active").length,
        expiring: matchingMembers.filter((member: Member) => member.status === "expiring_soon").length,
        pending: matchingMembers.filter((member: Member) => member.pendingAmount > 0).length,
      });
      setTotalPages(Math.max(1, Math.ceil(matchingMembers.length / PAGE_SIZE)));
      hasFetchedOnceRef.current = true;
    } catch {
      setError("Failed to load members.");
    } finally {
      setIsLoading(false);
      setIsFiltering(false);
    }
  }, [search, statusFilter, planFilter, paymentFilter]);

  useEffect(() => {
    if (!hasFetchedOnceRef.current) {
      fetchMembers();
      return;
    }

    const delay = setTimeout(fetchMembers, 300);
    return () => clearTimeout(delay);
  }, [fetchMembers]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, [page]);

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(allMatchingMembers.length / PAGE_SIZE));

    if (page > nextTotalPages) {
      setPage(nextTotalPages);
      return;
    }

    const startIndex = (page - 1) * PAGE_SIZE;
    setMembers(allMatchingMembers.slice(startIndex, startIndex + PAGE_SIZE));
  }, [allMatchingMembers, page]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPlanFilter("");
    setPaymentFilter("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || statusFilter || planFilter || paymentFilter);
  const columns = [
    { key: "member", label: "Member", width: "20%" },
    { key: "mobile", label: "Mobile", width: "12%" },
    { key: "plan", label: "Plan", width: "12%" },
    { key: "slot", label: "Slot", width: "16%" },
    { key: "renewal", label: "Renewal Date", width: "13%" },
    { key: "payment", label: "Payment Due", width: "10%" },
    { key: "status", label: "Status", width: "9%" },
    { key: "actions", label: "Actions", width: "8%", align: "center" as const },
  ];

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatCurrency = (amount: number) => `Rs.${amount.toLocaleString("en-IN")}`;
  const getStatusTextStyle = (status: Member["status"]) => {
    switch (status) {
      case "active":
        return { label: "Active", color: "#15803D" };
      case "expiring_soon":
        return { label: "Expiring Soon", color: "#B45309" };
      case "expired":
        return { label: "Expired", color: "#B91C1C" };
      case "ended":
        return { label: "Ended", color: "#475569" };
      default:
        return { label: status, color: C.slate };
    }
  };
  const getActionIconSx = (tone: "primary" | "danger") => ({
    color: tone === "danger" ? "#8A6B65" : "#667085",
    transition: "color 0.16s ease, background-color 0.16s ease, transform 0.16s ease",
    "&:hover": {
      color: tone === "danger" ? C.red : C.navy,
      backgroundColor:
        tone === "danger" ? "rgba(251,239,234,0.95)" : "rgba(248,242,235,0.96)",
      transform: "translateY(-1px)",
    },
  });
  const navigateTo = (path: string) => {
    startNavigation(path);
    router.push(path);
  };

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
            {isLoading
              ? [1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} variant="rounded" height={96} sx={{ borderRadius: "14px" }} />
                ))
              : [
                  {
                    label: "Overall Members",
                    value: String(summary.total),
                    helper: "All registered members",
                    icon: <Groups2Outlined sx={{ fontSize: 18 }} />,
                    tone: "default" as const,
                  },
                  {
                    label: "Active",
                    value: String(summary.active),
                    helper: "Membership valid today",
                    icon: <CheckCircleOutlined sx={{ fontSize: 18 }} />,
                    tone: "success" as const,
                  },
                  {
                    label: "Renewal Due",
                    value: String(summary.expiring),
                    helper: "Need follow-up soon",
                    icon: <ScheduleOutlined sx={{ fontSize: 18 }} />,
                    tone: "warning" as const,
                  },
                  {
                    label: "Payment Due",
                    value: String(summary.pending),
                    helper: "Members with dues pending",
                    icon: <CreditCardOutlined sx={{ fontSize: 18 }} />,
                    tone: "danger" as const,
                  },
                ].map((card) => (
                  <ModuleDashboardStat key={card.label} {...card} compact />
                ))}
          </Box>
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() => navigateTo("/members/new")}
            sx={{
              px: 1.8,
              minHeight: 44,
              minWidth: { xs: "auto", xl: 158 },
              alignSelf: { xs: "flex-start", xl: "center" },
              mt: { xs: 0.2, xl: 0 },
            }}
          >
            Add Member
          </Button>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ ...MODULE_CARD_SX, p: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {isFiltering ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.9,
                px: 0.2,
              }}
            >
              <CircularProgress size={16} sx={{ color: C.muted }} />
              <Typography
                sx={{
                  fontSize: "0.78rem",
                  color: C.muted,
                  fontWeight: 700,
                }}
              >
                Updating member list...
              </Typography>
            </Box>
          ) : null}

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
                sx={MODULE_FIELD_SX}
                inputRef={searchInputRef}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined sx={{ fontSize: 18, color: C.muted }} />
                    </InputAdornment>
                  ),
                  endAdornment: isFiltering ? (
                    <InputAdornment position="end">
                      <CircularProgress size={16} sx={{ color: C.muted }} />
                    </InputAdornment>
                  ) : search ? (
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
                sx={MODULE_FIELD_SX}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="expiring_soon">Renewal Due Soon</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
                <MenuItem value="ended">Ended</MenuItem>
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
                sx={MODULE_FIELD_SX}
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
                sx={MODULE_FIELD_SX}
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
                  height: 44,
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
                <Chip label={`Status: ${statusFilter.replace("_", " ")}`} size="small" onDelete={() => setStatusFilter("")} sx={MODULE_NEUTRAL_CHIP_SX} />
              ) : null}
              {planFilter ? (
                <Chip label={`Plan: ${plans.find((p) => p._id === planFilter)?.name || planFilter}`} size="small" onDelete={() => setPlanFilter("")} sx={MODULE_NEUTRAL_CHIP_SX} />
              ) : null}
              {paymentFilter ? (
                <Chip label={paymentFilter === "pending" ? "Payment Due" : "Fully Paid"} size="small" onDelete={() => setPaymentFilter("")} sx={MODULE_NEUTRAL_CHIP_SX} />
              ) : null}
              {search ? <Chip label={`Search: ${search}`} size="small" onDelete={() => setSearch("")} sx={MODULE_NEUTRAL_CHIP_SX} /> : null}
            </Box>
          ) : null}
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ ...MODULE_CARD_SX, overflow: "hidden" }}>
        {error ? (
          <ErrorState message={error} onRetry={fetchMembers} />
        ) : (
          <TableContainer sx={MODULE_TABLE_CONTAINER_SX}>
            <Table
              sx={{
                tableLayout: { xs: "auto", lg: "fixed" },
                width: "100%",
                minWidth: { xs: 1180, lg: 0 },
              }}
            >
              <colgroup>
                {columns.map((column) => (
                  <col key={column.key} style={{ width: column.width }} />
                ))}
              </colgroup>
              <TableHead>
                <TableRow
                  sx={{
                    background:
                      "linear-gradient(180deg, rgba(252,247,241,0.98) 0%, rgba(247,240,231,0.96) 100%)",
                  }}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      sx={{
                        ...MODULE_TABLE_HEAD_CELL_SX,
                        px: 1,
                        textAlign: column.align || "left",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {column.label}
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
                        onAction={hasActiveFilters ? clearFilters : () => navigateTo("/members/new")}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow
                      key={member._id}
                      onClick={() => navigateTo(`/members/${member._id}`)}
                      sx={{
                        ...MODULE_TABLE_ROW_SX,
                        "&:last-child td": { border: 0 },
                        cursor: "pointer",
                      }}
                    >
                      <TableCell sx={{ py: 1.45, px: 1, verticalAlign: "top" }}>
                        <Box>
                          <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: "#0F172A" }}>{member.name}</Typography>
                          <Typography sx={{ mt: 0.3, fontSize: "0.74rem", color: C.muted, fontWeight: 600 }}>
                            Joined {formatDate(member.createdAt)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.45, px: 1, verticalAlign: "top" }}>
                        <Typography
                          sx={{
                            mt: 0.08,
                            fontSize: "0.84rem",
                            color: C.navy,
                            fontWeight: 700,
                            fontVariantNumeric: "tabular-nums",
                            letterSpacing: 0.04,
                            lineHeight: 1.2,
                          }}
                        >
                          {member.mobile}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.45, px: 1, verticalAlign: "top" }}>
                        <Typography sx={{ mt: 0.08, fontSize: "0.85rem", color: C.slate, fontWeight: 700 }}>{member.planSnapshot.name}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.45, px: 1, verticalAlign: "top" }}>
                        <Typography sx={{ mt: 0.08, fontSize: "0.85rem", color: C.slate, fontWeight: 700 }}>{member.slotSnapshot.label}</Typography>
                        <Typography sx={{ mt: 0.25, fontSize: "0.72rem", color: C.muted, fontWeight: 600 }}>
                          {member.slotSnapshot.startTime} - {member.slotSnapshot.endTime}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.45, px: 1, verticalAlign: "top" }}>
                        <Typography
                          sx={{
                            mt: 0.08,
                            fontSize: "0.85rem",
                            color: member.status === "ended" ? "#64748B" : C.slate,
                            fontWeight: member.status === "ended" ? 800 : 700,
                            letterSpacing: member.status === "ended" ? 0.08 : 0,
                            lineHeight: 1.2,
                          }}
                        >
                          {member.status === "ended" ? "Not Applicable" : formatDate(member.endDate)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.45, px: 1, verticalAlign: "top" }}>
                        <Typography sx={{ mt: 0.08, fontSize: "0.88rem", fontWeight: 800, color: member.pendingAmount > 0 ? C.red : C.green }}>
                          {member.pendingAmount > 0 ? formatCurrency(member.pendingAmount) : "Paid"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.45, px: 1, verticalAlign: "top" }}>
                        <Typography
                          sx={{
                            mt: 0.08,
                            fontSize: "0.84rem",
                            fontWeight: 800,
                            color: getStatusTextStyle(member.status).color,
                            lineHeight: 1.2,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {getStatusTextStyle(member.status).label}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.45, px: 0.7, verticalAlign: "top", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 0.08, minWidth: 88, mt: -0.02, mx: "auto" }}>
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => navigateTo(`/members/${member._id}`)} sx={{ p: 0.38, ...getActionIconSx("primary") }}>
                              <VisibilityOutlined sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => navigateTo(`/members/${member._id}?action=edit`)} sx={{ p: 0.38, ...getActionIconSx("primary") }}>
                              <EditOutlined sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => { setDeletingMember(member); setDeleteOpen(true); }} sx={{ p: 0.38, ...getActionIconSx("danger") }}>
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
