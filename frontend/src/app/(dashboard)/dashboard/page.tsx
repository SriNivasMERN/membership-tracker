"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  CheckCircleOutlined,
  CloseOutlined,
  ErrorOutlineOutlined,
  Groups2Outlined,
  RemoveCircleOutlined,
  ScheduleOutlined,
  TrendingDownOutlined,
  TrendingUpOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { dashboardApi } from "@/lib/api/dashboard.api";
import { membersApi } from "@/lib/api/members.api";
import { Member } from "@/types/member.types";

interface MemberCounts {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
}

interface Revenue {
  totalRevenue: number;
  totalPending: number;
}

interface ExpiryAlert {
  memberId: string;
  name: string;
  mobile: string;
  endDate: string;
  planName: string;
  slotLabel: string;
  pendingAmount: number;
}

interface SlotActivity {
  label: string;
  count: number;
}

interface DashboardData {
  memberCounts: MemberCounts;
  revenue: Revenue;
  expiryAlerts: ExpiryAlert[];
  slotActivity: SlotActivity[];
}

interface MonthlyRevenue {
  year: number;
  month: number;
  totalAmount: number;
  paymentCount: number;
}

interface PlanDistribution {
  planId: string;
  planName: string;
  memberCount: number;
}

type ModalType = "total" | "active" | "expiring" | "expired" | null;

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PALETTE = ["#1E3A5F", "#2E75B6", "#15803D", "#B45309", "#6D28D9"];

const C = {
  navy: "#1E3A5F",
  blue: "#2E75B6",
  green: "#15803D",
  orange: "#B45309",
  red: "#B91C1C",
  slate: "#334155",
  muted: "#64748B",
  border: "#E2E8F0",
  surface: "#F8FAFC",
};

const fmt = (n: number) => `Rs.${n.toLocaleString("en-IN")}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function StatCard({
  label,
  helper,
  value,
  accentColor,
  icon,
  isLoading,
  onClick,
}: {
  label: string;
  helper: string;
  value: number;
  accentColor: string;
  icon: React.ReactNode;
  isLoading: boolean;
  onClick: () => void;
}) {
  return (
    <Paper
      onClick={onClick}
      elevation={0}
      sx={{
        p: 2.25,
        border: `1px solid ${C.border}`,
        borderRadius: "14px",
        cursor: "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: "0 12px 28px rgba(15,23,42,0.08)",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
        <Box>
          <Typography sx={{ fontSize: "0.74rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>
            {label}
          </Typography>
          {isLoading ? (
            <Skeleton width={80} height={42} sx={{ mt: 0.6 }} />
          ) : (
            <Typography sx={{ mt: 0.7, fontSize: "2rem", fontWeight: 900, color: C.navy, lineHeight: 1 }}>
              {value}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accentColor,
            backgroundColor: `${accentColor}12`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Box>
      <Typography sx={{ mt: 1.25, fontSize: "0.82rem", color: C.muted, fontWeight: 600 }}>
        {helper}
      </Typography>
    </Paper>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Paper elevation={0} sx={{ borderRadius: "16px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography sx={{ mt: 0.5, fontSize: "0.82rem", color: C.muted, fontWeight: 500 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {action}
      </Box>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
  );
}

function AreaTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <Box sx={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "10px", px: 1.5, py: 1, boxShadow: "0 8px 20px rgba(15,23,42,0.08)" }}>
      <Typography sx={{ fontSize: "0.72rem", color: C.muted, fontWeight: 700 }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.92rem", fontWeight: 800, color: C.navy }}>{fmt(payload[0].value)}</Typography>
    </Box>
  );
}

function MemberTable({ members }: { members: Member[] }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: C.surface }}>
            {["Name", "Mobile", "Plan", "End Date", "Payment Due"].map((h) => (
              <TableCell key={h} sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.slate, py: 1.25, px: 2, borderBottom: `1px solid ${C.border}` }}>
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {members.map((m) => (
            <TableRow key={m._id} sx={{ "&:last-child td": { border: 0 }, "&:hover": { backgroundColor: C.surface } }}>
              <TableCell sx={{ py: 1.25, px: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#0F172A" }}>{m.name}</Typography>
              </TableCell>
              <TableCell sx={{ py: 1.25, px: 2 }}>
                <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 600 }}>{m.mobile}</Typography>
              </TableCell>
              <TableCell sx={{ py: 1.25, px: 2 }}>
                <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 600 }}>{m.planSnapshot.name}</Typography>
              </TableCell>
              <TableCell sx={{ py: 1.25, px: 2 }}>
                <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 600 }}>{fmtDate(m.endDate)}</Typography>
              </TableCell>
              <TableCell sx={{ py: 1.25, px: 2 }}>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: m.pendingAmount > 0 ? C.red : C.green }}>
                  {m.pendingAmount > 0 ? fmt(m.pendingAmount) : "Paid"}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function DetailModal({
  open,
  type,
  data,
  onClose,
}: {
  open: boolean;
  type: ModalType;
  data: DashboardData | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  useEffect(() => {
    if (!open || !type || type === "expiring") return;

    const fetch = async () => {
      setIsLoadingMembers(true);
      try {
        const response = await membersApi.getAll({ page: 1, limit: 500 });
        const all: Member[] = response.data || [];
        if (type === "total") setMembers(all);
        else if (type === "active") setMembers(all.filter((m) => m.status === "active"));
        else if (type === "expired") setMembers(all.filter((m) => m.status === "expired"));
      } catch {
        setMembers([]);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetch();
  }, [open, type]);

  useEffect(() => {
    if (!open) setMembers([]);
  }, [open]);

  if (!type) return null;

  const configMap = {
    total: { title: "All Members", color: C.navy, bg: "#EFF6FF" },
    active: { title: "Active Members", color: C.green, bg: "#F0FDF4" },
    expiring: { title: "Renewal Due Soon", color: C.orange, bg: "#FFFBEB" },
    expired: { title: "Expired Members", color: C.red, bg: "#FEF2F2" },
  };

  const { title, color, bg } = configMap[type];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: fullScreen ? 0 : "18px",
          border: `1px solid ${C.border}`,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle sx={{ backgroundColor: bg, borderBottom: `1px solid ${color}25`, px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1rem", color }}>{title}</Typography>
          <Typography sx={{ fontSize: "0.74rem", color, opacity: 0.84, fontWeight: 600, mt: 0.25 }}>
            {type === "expiring"
              ? `${data?.expiryAlerts.length ?? 0} members`
              : isLoadingMembers
                ? "Loading..."
                : `${members.length} members`}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: C.muted }}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {type === "expiring" ? (
          !data?.expiryAlerts.length ? (
            <EmptyState title="No renewals due right now" subtitle="Members who are close to expiry will appear here." />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: C.surface }}>
                    {["Name", "Mobile", "Plan / Slot", "Expires On", "Payment Due"].map((h) => (
                      <TableCell key={h} sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.slate, py: 1.25, px: 2, borderBottom: `1px solid ${C.border}` }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.expiryAlerts.map((a) => (
                    <TableRow key={a.memberId} sx={{ "&:last-child td": { border: 0 }, "&:hover": { backgroundColor: C.surface } }}>
                      <TableCell sx={{ py: 1.25, px: 2 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#0F172A" }}>{a.name}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.25, px: 2 }}>
                        <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 600 }}>{a.mobile}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.25, px: 2 }}>
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: C.slate }}>{a.planName}</Typography>
                        <Typography sx={{ fontSize: "0.72rem", color: C.muted, fontWeight: 600 }}>{a.slotLabel}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.25, px: 2 }}>
                        <Chip label={fmtDate(a.endDate)} size="small" sx={{ height: 24, fontSize: "0.7rem", fontWeight: 700, backgroundColor: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }} />
                      </TableCell>
                      <TableCell sx={{ py: 1.25, px: 2 }}>
                        <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: a.pendingAmount > 0 ? C.red : C.green }}>
                          {a.pendingAmount > 0 ? fmt(a.pendingAmount) : "Paid"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        ) : isLoadingMembers ? (
          <Box sx={{ py: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <CircularProgress size={28} thickness={3} sx={{ color: C.blue }} />
            <Typography sx={{ fontSize: "0.82rem", color: C.muted, fontWeight: 600 }}>Loading members...</Typography>
          </Box>
        ) : members.length === 0 ? (
          <EmptyState title="No members found" subtitle="There are no records for this segment yet." />
        ) : (
          <MemberTable members={members} />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRevenue[]>([]);
  const [plans, setPlans] = useState<PlanDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [summary, monthlyRevenue, planDistribution] = await Promise.all([
          dashboardApi.getSummary(),
          dashboardApi.getMonthlyRevenue(),
          dashboardApi.getPlanDistribution(),
        ]);
        setData(summary.data);
        setMonthly(monthlyRevenue.data || []);
        setPlans(planDistribution.data || []);
      } catch {
        setError("Failed to load dashboard. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const chartData = useMemo(
    () =>
      monthly.map((m) => ({
        name: `${MONTH_NAMES[m.month - 1]} '${String(m.year).slice(2)}`,
        amount: m.totalAmount,
      })),
    [monthly],
  );

  const totalSlotMembers = data?.slotActivity.reduce((sum, slot) => sum + slot.count, 0) ?? 0;

  const trend = useMemo(() => {
    if (chartData.length < 2) return null;
    const last = chartData[chartData.length - 1].amount;
    const previous = chartData[chartData.length - 2].amount;
    if (previous === 0) return null;
    const pct = Math.round(((last - previous) / previous) * 100);
    return { pct, up: pct >= 0 };
  }, [chartData]);

  const topPlan = plans[0];
  const renewalCount = data?.expiryAlerts.length ?? 0;

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <PageHeader
        title="Dashboard"
        subtitle="Live business view for member counts, collections, renewals due, and operational activity."
      />

      <Grid container spacing={2}>
        {[
          {
            label: "Total Members",
            helper: "All registered members",
            value: data?.memberCounts.total ?? 0,
            accentColor: C.navy,
            icon: <Groups2Outlined sx={{ fontSize: 20 }} />,
            modal: "total" as ModalType,
          },
          {
            label: "Active",
            helper: "Membership valid today",
            value: data?.memberCounts.active ?? 0,
            accentColor: C.green,
            icon: <CheckCircleOutlined sx={{ fontSize: 20 }} />,
            modal: "active" as ModalType,
          },
          {
            label: "Renewal Due Soon",
            helper: "Within your alert window",
            value: data?.memberCounts.expiringSoon ?? 0,
            accentColor: C.orange,
            icon: <ScheduleOutlined sx={{ fontSize: 20 }} />,
            modal: "expiring" as ModalType,
          },
          {
            label: "Expired",
            helper: "Needs renewal follow-up",
            value: data?.memberCounts.expired ?? 0,
            accentColor: C.red,
            icon: <RemoveCircleOutlined sx={{ fontSize: 20 }} />,
            modal: "expired" as ModalType,
          },
        ].map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.label}>
            <StatCard {...card} isLoading={isLoading} onClick={() => setActiveModal(card.modal)} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <SectionCard
            title="Collections Overview"
            subtitle="Track revenue collected and payment due across the business."
            action={
              !isLoading ? (
                <Chip
                  label={renewalCount > 0 ? `${renewalCount} renewal${renewalCount > 1 ? "s" : ""} due` : "No urgent renewals"}
                  size="small"
                  sx={{
                    backgroundColor: renewalCount > 0 ? "#FFFBEB" : "#F0FDF4",
                    color: renewalCount > 0 ? "#92400E" : C.green,
                    border: renewalCount > 0 ? "1px solid #FDE68A" : "1px solid #BBF7D0",
                  }}
                />
              ) : null
            }
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Paper elevation={0} sx={{ p: 2, border: `1px solid ${C.border}`, backgroundColor: "#FCFDFE" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography sx={{ fontSize: "0.74rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.7 }}>
                      Total Collected
                    </Typography>
                    <TrendingUpOutlined sx={{ fontSize: 18, color: C.green }} />
                  </Box>
                  {isLoading ? <Skeleton width={180} height={38} /> : <Typography sx={{ fontSize: "1.8rem", fontWeight: 900, color: C.green }}>{fmt(data?.revenue.totalRevenue ?? 0)}</Typography>}
                  <Typography sx={{ mt: 0.6, fontSize: "0.8rem", color: C.muted, fontWeight: 600 }}>
                    Money already received from payments.
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper elevation={0} sx={{ p: 2, border: `1px solid ${C.border}`, backgroundColor: "#FCFDFE" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography sx={{ fontSize: "0.74rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.7 }}>
                      Payment Due
                    </Typography>
                    <ErrorOutlineOutlined sx={{ fontSize: 18, color: C.red }} />
                  </Box>
                  {isLoading ? <Skeleton width={180} height={38} /> : <Typography sx={{ fontSize: "1.8rem", fontWeight: 900, color: C.red }}>{fmt(data?.revenue.totalPending ?? 0)}</Typography>}
                  <Typography sx={{ mt: 0.6, fontSize: "0.8rem", color: C.muted, fontWeight: 600 }}>
                    Outstanding amount still to be collected.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </SectionCard>
        </Grid>
        <Grid item xs={12} lg={4}>
          <SectionCard
            title="Today's Focus"
            subtitle="What deserves attention first."
          >
            {isLoading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} height={42} sx={{ borderRadius: "10px" }} />
                ))}
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                <Paper elevation={0} sx={{ p: 1.6, backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}>
                  <Typography sx={{ fontSize: "0.78rem", color: "#92400E", fontWeight: 800 }}>Renewals Due Soon</Typography>
                  <Typography sx={{ mt: 0.35, fontSize: "1.4rem", color: "#92400E", fontWeight: 900 }}>{renewalCount}</Typography>
                  <Typography sx={{ mt: 0.35, fontSize: "0.78rem", color: "#92400E", fontWeight: 600 }}>
                    Members who may need follow-up this week.
                  </Typography>
                </Paper>
                <Paper elevation={0} sx={{ p: 1.6, backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                  <Typography sx={{ fontSize: "0.78rem", color: "#1D4ED8", fontWeight: 800 }}>Top Active Plan</Typography>
                  <Typography sx={{ mt: 0.35, fontSize: "1rem", color: C.navy, fontWeight: 800 }}>
                    {topPlan?.planName || "No active plan data"}
                  </Typography>
                  <Typography sx={{ mt: 0.35, fontSize: "0.78rem", color: C.muted, fontWeight: 600 }}>
                    {topPlan ? `${topPlan.memberCount} member${topPlan.memberCount > 1 ? "s" : ""} currently on this plan` : "Plan distribution will appear once members are added."}
                  </Typography>
                </Paper>
                <Paper elevation={0} sx={{ p: 1.6, backgroundColor: "#F8FAFC", border: `1px solid ${C.border}` }}>
                  <Typography sx={{ fontSize: "0.78rem", color: C.slate, fontWeight: 800 }}>Revenue Trend</Typography>
                  <Typography sx={{ mt: 0.35, fontSize: "1rem", color: C.navy, fontWeight: 800 }}>
                    {trend ? `${trend.up ? "+" : ""}${trend.pct}% vs last month` : "Need more payment history"}
                  </Typography>
                  <Typography sx={{ mt: 0.35, fontSize: "0.78rem", color: C.muted, fontWeight: 600 }}>
                    {trend ? "Month-over-month collection movement based on recorded payments." : "The trend appears once at least two months of payments exist."}
                  </Typography>
                </Paper>
              </Box>
            )}
          </SectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <SectionCard
            title="Monthly Revenue"
            subtitle="Recent payment collection trend across the last recorded months."
            action={
              trend ? (
                <Chip
                  icon={trend.up ? <TrendingUpOutlined /> : <TrendingDownOutlined />}
                  label={`${trend.up ? "+" : ""}${trend.pct}%`}
                  size="small"
                  sx={{
                    backgroundColor: trend.up ? "#F0FDF4" : "#FEF2F2",
                    color: trend.up ? C.green : C.red,
                    border: trend.up ? "1px solid #BBF7D0" : "1px solid #FECACA",
                    "& .MuiChip-icon": {
                      color: "inherit",
                    },
                  }}
                />
              ) : null
            }
          >
            <Box sx={{ height: 320 }}>
              {isLoading ? (
                <Skeleton variant="rectangular" sx={{ height: "100%", borderRadius: "12px" }} />
              ) : chartData.length === 0 ? (
                <EmptyState
                  title="No payment data yet"
                  subtitle="Once payments are recorded, monthly revenue trends will appear here."
                  icon={<WarningAmberOutlined sx={{ fontSize: 26 }} />}
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 6, right: 8, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.blue} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.muted, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: C.muted, fontWeight: 600 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)} />
                    <Tooltip content={<AreaTooltip />} cursor={{ stroke: C.border, strokeWidth: 1 }} />
                    <Area type="monotone" dataKey="amount" stroke={C.blue} strokeWidth={2.5} fill="url(#revenueGradient)" dot={{ fill: C.blue, strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: C.blue, strokeWidth: 2, stroke: "#fff" }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <SectionCard title="Members by Plan" subtitle="Current active distribution by plan.">
            <Box sx={{ minHeight: 320, display: "flex", flexDirection: "column" }}>
              {isLoading ? (
                <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Skeleton variant="circular" width={120} height={120} />
                </Box>
              ) : plans.length === 0 ? (
                <Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
                  <EmptyState title="No plan data yet" subtitle="This chart will populate once members are assigned to plans." />
                </Box>
              ) : (
                <>
                  <Box sx={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={plans} dataKey="memberCount" nameKey="planName" cx="50%" cy="50%" innerRadius="46%" outerRadius="70%" paddingAngle={2} strokeWidth={2} stroke="#fff">
                          {plans.map((_, i) => (
                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: "10px", border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, mt: 1 }}>
                    {plans.map((plan, i) => (
                      <Box key={plan.planId} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 9, height: 9, borderRadius: "999px", backgroundColor: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                        <Typography sx={{ fontSize: "0.77rem", color: C.slate, fontWeight: 700, flex: 1 }} noWrap>
                          {plan.planName}
                        </Typography>
                        <Typography sx={{ fontSize: "0.77rem", fontWeight: 800, color: C.slate }}>
                          {plan.memberCount}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6} lg={2}>
          <SectionCard title="By Slot" subtitle="Attendance distribution across time slots.">
            {isLoading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.3 }}>
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} height={30} sx={{ borderRadius: "6px" }} />
                ))}
              </Box>
            ) : !data?.slotActivity.length ? (
              <EmptyState title="No slot data yet" subtitle="Slots will appear after members are assigned." />
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.6 }}>
                {[...data.slotActivity]
                  .sort((a, b) => b.count - a.count)
                  .map((slot, i) => {
                    const pct = totalSlotMembers > 0 ? Math.round((slot.count / totalSlotMembers) * 100) : 0;
                    return (
                      <Box key={slot.label}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.55 }}>
                          <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: C.slate }} noWrap>
                            {slot.label}
                          </Typography>
                          <Typography sx={{ fontSize: "0.76rem", color: C.muted, fontWeight: 700 }}>
                            {slot.count} ({pct}%)
                          </Typography>
                        </Box>
                        <Box sx={{ height: 7, borderRadius: "999px", backgroundColor: "#E2E8F0", overflow: "hidden" }}>
                          <Box sx={{ height: "100%", width: `${pct}%`, borderRadius: "999px", backgroundColor: PALETTE[i % PALETTE.length] }} />
                        </Box>
                      </Box>
                    );
                  })}
              </Box>
            )}
          </SectionCard>
        </Grid>
      </Grid>

      <SectionCard
        title="Renewal Due Soon"
        subtitle="Members whose memberships end within the configured alert window."
        action={
          !isLoading && renewalCount > 0 ? (
            <Chip label={`${renewalCount} member${renewalCount > 1 ? "s" : ""}`} size="small" sx={{ backgroundColor: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }} />
          ) : null
        }
      >
        {isLoading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} height={42} sx={{ borderRadius: "6px" }} />
            ))}
          </Box>
        ) : !data?.expiryAlerts.length ? (
          <EmptyState
            title="No members expiring soon"
            subtitle="This section stays empty until members enter the renewal alert window."
          />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: C.surface }}>
                  {["Name", "Mobile", "Plan", "Slot", "Renewal Date", "Payment Due"].map((h) => (
                    <TableCell key={h} sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.slate, py: 1.25, px: 2, borderBottom: `1px solid ${C.border}` }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.expiryAlerts.map((member) => (
                  <TableRow key={member.memberId} sx={{ "&:last-child td": { border: 0 }, "&:hover": { backgroundColor: C.surface } }}>
                    <TableCell sx={{ py: 1.25, px: 2 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#0F172A" }}>{member.name}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 2 }}>
                      <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 600 }}>{member.mobile}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 2 }}>
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: C.slate }}>{member.planName}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 2 }}>
                      <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 600 }}>{member.slotLabel}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 2 }}>
                      <Chip label={fmtDate(member.endDate)} size="small" sx={{ height: 24, fontSize: "0.7rem", fontWeight: 700, backgroundColor: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }} />
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 2 }}>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: member.pendingAmount > 0 ? C.red : C.green }}>
                        {member.pendingAmount > 0 ? fmt(member.pendingAmount) : "Paid"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>

      <DetailModal open={activeModal !== null} type={activeModal} data={data} onClose={() => setActiveModal(null)} />
    </Box>
  );
}
