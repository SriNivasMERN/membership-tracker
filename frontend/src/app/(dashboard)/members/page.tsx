"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Checkbox,
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
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
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
  const theme = useTheme();
  const isMobileTable = useMediaQuery(theme.breakpoints.down("md"));
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
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
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
    setSelectedMemberIds([]);
  }, [search, statusFilter, planFilter, paymentFilter]);

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
  const selectedMembers = allMatchingMembers.filter((member) => selectedMemberIds.includes(member._id));
  const areAllVisibleSelected = members.length > 0 && members.every((member) => selectedMemberIds.includes(member._id));
  const areSomeVisibleSelected = members.some((member) => selectedMemberIds.includes(member._id));
  const columns = [
    { key: "select", label: "", width: "46px", align: "center" as const },
    { key: "member", label: "Member", width: "15%", align: "left" as const },
    { key: "mobile", label: "Mobile", width: "9%", align: "left" as const },
    { key: "plan", label: "Plan", width: "10%", align: "center" as const },
    { key: "slot", label: "Slot", width: "12%", align: "center" as const },
    { key: "renewal", label: "Renewal Date", width: "12%", align: "center" as const },
    { key: "payment", label: "Payment Due", width: "9%", align: "center" as const },
    { key: "status", label: "Status", width: "8%", align: "center" as const },
    { key: "actions", label: "Actions", width: "108px", align: "center" as const },
  ];
  const alignedColumnStartPx = 0.44;
  const alignedColumnRightPx = 0.26;

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

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    );
  };

  const toggleVisibleSelection = () => {
    if (areAllVisibleSelected) {
      setSelectedMemberIds((current) =>
        current.filter((id) => !members.some((member) => member._id === id))
      );
      return;
    }

    setSelectedMemberIds((current) => {
      const merged = new Set(current);
      members.forEach((member) => merged.add(member._id));
      return Array.from(merged);
    });
  };

  const exportSelectedMembers = () => {
    if (!selectedMembers.length) return;

    const escapeCsv = (value: string) => {
      const normalized = String(value ?? "");
      if (/[",\n]/.test(normalized)) {
        return `"${normalized.replace(/"/g, '""')}"`;
      }
      return normalized;
    };

    const rows = [
      ["Name", "Mobile", "Plan", "Slot", "Renewal Date", "Payment Due", "Status"],
      ...selectedMembers.map((member) => [
        member.name,
        member.mobile,
        member.planSnapshot.name,
        `${member.slotSnapshot.label} (${member.slotSnapshot.startTime} - ${member.slotSnapshot.endTime})`,
        member.status === "ended" ? "Not Applicable" : formatDate(member.endDate),
        member.pendingAmount > 0 ? formatCurrency(member.pendingAmount) : "Paid",
        getStatusTextStyle(member.status).label,
      ]),
    ];

    const csv = rows.map((row) => row.map((value) => escapeCsv(value)).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `members-page-${page}-selection.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`${selectedMembers.length} member record(s) exported`);
  };

  const handleBulkDelete = async () => {
    if (!selectedMembers.length) return;

    setIsDeleting(true);
    try {
      await Promise.all(selectedMembers.map((member) => membersApi.delete(member._id)));
      showToast(`${selectedMembers.length} member(s) deleted`);
      setSelectedMemberIds([]);
      setDeleteOpen(false);
      setDeletingMember(null);
      fetchMembers();
    } catch {
      showToast("Failed to delete selected members.", "error");
    } finally {
      setIsDeleting(false);
    }
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
          {selectedMemberIds.length ? (
            <Paper
              elevation={0}
              sx={{
                borderRadius: "16px",
                border: `1px solid ${C.border}`,
                background:
                  "linear-gradient(180deg, rgba(252,247,241,0.96) 0%, rgba(248,242,235,0.94) 100%)",
                px: { xs: 1.25, sm: 1.55 },
                py: 1,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: { xs: "stretch", sm: "center" },
                  justifyContent: "space-between",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 1.1,
                }}
              >
                <Chip
                  label={`${selectedMemberIds.length} member${selectedMemberIds.length > 1 ? "s" : ""} selected`}
                  size="small"
                  sx={{
                    alignSelf: { xs: "flex-start", sm: "center" },
                    height: 32,
                    borderRadius: "999px",
                    backgroundColor: "rgba(255,255,255,0.74)",
                    border: `1px solid ${C.border}`,
                    color: C.navy,
                    fontWeight: 800,
                    fontSize: "0.8rem",
                  }}
                />
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  <Button size="small" variant="outlined" onClick={exportSelectedMembers} sx={{ minHeight: 38, px: 1.35 }}>
                    Export Selected
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => {
                      setDeletingMember(null);
                      setDeleteOpen(true);
                    }}
                    sx={{ minHeight: 38, px: 1.35 }}
                  >
                    Delete Selected
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setSelectedMemberIds([])}
                    sx={{ minHeight: 38, px: 1.1 }}
                  >
                    Clear Selection
                  </Button>
                </Box>
              </Box>
            </Paper>
          ) : null}

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
                InputLabelProps={{ shrink: true }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => {
                    if (!value) return "All Status";
                    switch (value) {
                      case "active":
                        return "Active";
                      case "expiring_soon":
                        return "Renewal Due Soon";
                      case "expired":
                        return "Expired";
                      case "ended":
                        return "Ended";
                      default:
                        return String(value);
                    }
                  },
                }}
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
                InputLabelProps={{ shrink: true }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => {
                    if (!value) return "All Plans";
                    const selectedPlan = plans.find((plan) => plan._id === value);
                    return selectedPlan?.name || String(value);
                  },
                }}
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
                InputLabelProps={{ shrink: true }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => {
                    if (!value) return "All Payments";
                    return value === "pending" ? "Payment Due" : "Fully Paid";
                  },
                }}
                sx={MODULE_FIELD_SX}
              >
                <MenuItem value="">All Payments</MenuItem>
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
          <>
          <TableContainer sx={{ ...MODULE_TABLE_CONTAINER_SX, display: isMobileTable ? "none" : "block" }}>
            <Table
              sx={{
                tableLayout: { xs: "auto", md: "fixed" },
                width: "100%",
                minWidth: { xs: 860, sm: 940, md: 0 },
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
                        pl:
                          column.key === "select"
                            ? 0.32
                            : column.key === "member" ||
                                column.key === "mobile" ||
                                column.key === "renewal" ||
                                column.key === "status" ||
                                column.key === "actions"
                              ? alignedColumnStartPx
                              : 0.42,
                        pr:
                          column.key === "select"
                            ? 0.32
                            : column.key === "member" ||
                                column.key === "mobile" ||
                                column.key === "renewal" ||
                                column.key === "status" ||
                                column.key === "actions"
                              ? alignedColumnRightPx
                              : 0.42,
                        textAlign:
                          column.key === "mobile"
                            ? "center"
                            : column.key === "member"
                              ? "left"
                              : column.align || "left",
                        whiteSpace: "nowrap",
                        ...(column.key === "status"
                          ? {
                              transform: "translateX(8px)",
                            }
                          : {}),
                      }}
                    >
                      {column.key === "select" ? (
                        <Checkbox
                          checked={areAllVisibleSelected}
                          indeterminate={!areAllVisibleSelected && areSomeVisibleSelected}
                          onChange={toggleVisibleSelection}
                          disabled={!members.length || isLoading}
                          inputProps={{ "aria-label": "Select all members on this page" }}
                          sx={{
                            p: 0.3,
                            "& .MuiSvgIcon-root": {
                              fontSize: 20,
                            },
                          }}
                        />
                      ) : (
                        column.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  [...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((j) => (
                        <TableCell key={j} sx={{ py: 2 }}>
                          <Skeleton height={22} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ border: 0, p: 0 }}>
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
                      <TableCell
                        sx={{ py: 1.45, px: 0.32, verticalAlign: "top", textAlign: "center" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedMemberIds.includes(member._id)}
                          onChange={() => toggleMemberSelection(member._id)}
                          inputProps={{ "aria-label": `Select ${member.name}` }}
                          sx={{
                            p: 0.45,
                            mt: -0.18,
                            "& .MuiSvgIcon-root": {
                              fontSize: 20,
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 1.45, pl: alignedColumnStartPx, pr: alignedColumnRightPx, verticalAlign: "top" }}>
                        <Box>
                          <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: "#0F172A" }}>{member.name}</Typography>
                          <Typography sx={{ mt: 0.3, fontSize: "0.74rem", color: C.muted, fontWeight: 600 }}>
                            Joined {formatDate(member.createdAt)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.45, px: 0.2, verticalAlign: "top", textAlign: "center" }}>
                        <Box
                          sx={{
                            mt: -0.02,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: 30,
                            pl: 0.24,
                            pr: 0.34,
                            borderRadius: "999px",
                            border: `1px solid rgba(221, 205, 183, 0.92)`,
                            background:
                              "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(251,246,239,0.95) 100%)",
                            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: "0.84rem",
                              color: C.navy,
                              fontWeight: 800,
                              fontVariantNumeric: "tabular-nums",
                              letterSpacing: 0.015,
                              lineHeight: 1,
                              textAlign: "left",
                            }}
                          >
                            {member.mobile}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.45, px: 0.42, verticalAlign: "top", textAlign: "center" }}>
                        <Typography sx={{ mt: 0.08, fontSize: "0.85rem", color: C.slate, fontWeight: 700, textAlign: "center" }}>{member.planSnapshot.name}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.45, px: 0.42, verticalAlign: "top", textAlign: "center" }}>
                        <Typography
                          sx={{
                            mt: 0.08,
                            fontSize: "0.82rem",
                            color: C.slate,
                            fontWeight: 700,
                            textAlign: "center",
                            whiteSpace: "nowrap",
                            wordBreak: "keep-all",
                          }}
                        >
                          {member.slotSnapshot.label}
                        </Typography>
                        <Typography sx={{ mt: 0.25, fontSize: "0.72rem", color: C.muted, fontWeight: 600, textAlign: "center" }}>
                          {member.slotSnapshot.startTime} - {member.slotSnapshot.endTime}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.45, px: 0.42, verticalAlign: "top", textAlign: "center" }}>
                        <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
                          <Box
                            sx={{
                              mt: -0.02,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minHeight: 30,
                              minWidth: 108,
                              pl: 0.24,
                              pr: 0.34,
                              borderRadius: "999px",
                              border: `1px solid rgba(221, 205, 183, 0.92)`,
                              background:
                                "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(251,246,239,0.95) 100%)",
                              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "0.84rem",
                                color: member.status === "ended" ? "#64748B" : C.navy,
                                fontWeight: member.status === "ended" ? 800 : 700,
                                fontVariantNumeric: "tabular-nums",
                                letterSpacing: member.status === "ended" ? 0.04 : 0.015,
                                lineHeight: 1,
                                textAlign: "center",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {member.status === "ended" ? "Not Applicable" : formatDate(member.endDate)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.45, px: 0.42, verticalAlign: "top", textAlign: "center" }}>
                        <Typography sx={{ mt: 0.08, fontSize: "0.88rem", fontWeight: 800, color: member.pendingAmount > 0 ? C.red : C.green, textAlign: "center" }}>
                          {member.pendingAmount > 0 ? formatCurrency(member.pendingAmount) : "Paid"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.45, pl: alignedColumnStartPx, pr: alignedColumnRightPx, verticalAlign: "top", textAlign: "center", transform: "translateX(8px)" }}>
                        <Typography
                          sx={{
                            mt: 0.08,
                            fontSize: "0.84rem",
                            fontWeight: 800,
                            color: getStatusTextStyle(member.status).color,
                            lineHeight: 1.2,
                            whiteSpace: "nowrap",
                            textAlign: "center",
                          }}
                        >
                          {getStatusTextStyle(member.status).label}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.45, pl: 0.42, pr: 0.3, verticalAlign: "top", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 0.55, mt: -0.02 }}>
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => navigateTo(`/members/${member._id}`)} sx={{ p: 0.22, ...getActionIconSx("primary") }}>
                              <VisibilityOutlined sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => navigateTo(`/members/${member._id}?action=edit`)} sx={{ p: 0.22, ...getActionIconSx("primary") }}>
                              <EditOutlined sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => { setDeletingMember(member); setDeleteOpen(true); }} sx={{ p: 0.22, ...getActionIconSx("danger") }}>
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
                      background: "linear-gradient(180deg, rgba(255,255,255,0.995) 0%, rgba(253,250,246,0.988) 100%)",
                    }}
                  >
                    <Skeleton height={28} sx={{ mb: 1 }} />
                    <Skeleton height={20} sx={{ mb: 0.7 }} />
                    <Skeleton height={20} sx={{ mb: 0.7 }} />
                    <Skeleton height={20} sx={{ mb: 0.7 }} />
                    <Skeleton height={20} />
                  </Paper>
                ))
              ) : members.length === 0 ? (
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
              ) : (
                members.map((member) => (
                  <Paper
                    key={member._id}
                    elevation={0}
                    onClick={() => navigateTo(`/members/${member._id}`)}
                    sx={{
                      ...MODULE_CARD_SX,
                      p: 1.4,
                      cursor: "pointer",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.94rem", color: "#0F172A" }}>
                          {member.name}
                        </Typography>
                        <Typography sx={{ mt: 0.35, fontSize: "0.76rem", color: C.muted, fontWeight: 600 }}>
                          Joined {formatDate(member.createdAt)}
                        </Typography>
                      </Box>
                      <Box onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedMemberIds.includes(member._id)}
                          onChange={() => toggleMemberSelection(member._id)}
                          inputProps={{ "aria-label": `Select ${member.name}` }}
                          sx={{ p: 0.2 }}
                        />
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
                          Mobile
                        </Typography>
                        <Typography sx={{ mt: 0.3, fontSize: "0.84rem", fontWeight: 800, color: C.navy }}>
                          {member.mobile}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.35 }}>
                          Plan
                        </Typography>
                        <Typography sx={{ mt: 0.3, fontSize: "0.84rem", fontWeight: 700, color: C.slate }}>
                          {member.planSnapshot.name}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.35 }}>
                          Slot
                        </Typography>
                        <Typography sx={{ mt: 0.3, fontSize: "0.84rem", fontWeight: 700, color: C.slate }}>
                          {member.slotSnapshot.label}
                        </Typography>
                        <Typography sx={{ mt: 0.2, fontSize: "0.72rem", color: C.muted, fontWeight: 600 }}>
                          {member.slotSnapshot.startTime} - {member.slotSnapshot.endTime}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.35 }}>
                          Renewal
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.3,
                            fontSize: "0.84rem",
                            color: member.status === "ended" ? "#64748B" : C.slate,
                            fontWeight: member.status === "ended" ? 800 : 700,
                          }}
                        >
                          {member.status === "ended" ? "Not Applicable" : formatDate(member.endDate)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mt: 1.15, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Box>
                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.35 }}>
                          Payment Due
                        </Typography>
                        <Typography sx={{ mt: 0.25, fontSize: "0.88rem", fontWeight: 800, color: member.pendingAmount > 0 ? C.red : C.green }}>
                          {member.pendingAmount > 0 ? formatCurrency(member.pendingAmount) : "Paid"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.35 }}>
                          Status
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.25,
                            fontSize: "0.84rem",
                            fontWeight: 800,
                            color: getStatusTextStyle(member.status).color,
                          }}
                        >
                          {getStatusTextStyle(member.status).label}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{ mt: 1.2, pt: 1, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 0.35 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => navigateTo(`/members/${member._id}`)} sx={{ p: 0.45, minWidth: 44, minHeight: 44, ...getActionIconSx("primary") }}>
                          <VisibilityOutlined sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => navigateTo(`/members/${member._id}?action=edit`)} sx={{ p: 0.45, minWidth: 44, minHeight: 44, ...getActionIconSx("primary") }}>
                          <EditOutlined sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => { setDeletingMember(member); setDeleteOpen(true); }} sx={{ p: 0.45, minWidth: 44, minHeight: 44, ...getActionIconSx("danger") }}>
                          <DeleteOutlined sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>
                ))
              )}
            </Box>
          ) : null}
          </>
        )}

        {!isLoading && !error && totalPages > 1 ? (
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 1.2, px: 2.5, py: 1.6, borderTop: `1px solid ${C.border}` }}>
            <Typography sx={{ fontSize: "0.8rem", color: C.muted, fontWeight: 700 }}>
              Page {page} of {totalPages}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                disabled={page === totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </Box>
          </Box>
        ) : null}
      </Paper>

      <ConfirmDialog
        open={deleteOpen}
        title={deletingMember ? "Delete Member" : "Delete Selected Members"}
        message={
          deletingMember
            ? `Delete "${deletingMember?.name}"? All payment history will also be removed. This cannot be undone.`
            : `Delete ${selectedMemberIds.length} selected member(s)? All related payment history will also be removed. This cannot be undone.`
        }
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={async () => {
          if (deletingMember) {
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
            return;
          }

          await handleBulkDelete();
        }}
        onCancel={() => {
          setDeleteOpen(false);
          setDeletingMember(null);
        }}
        isLoading={isDeleting}
      />
    </Box>
  );
}
