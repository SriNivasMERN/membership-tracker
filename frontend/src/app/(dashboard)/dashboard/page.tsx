"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Skeleton,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  PeopleAltOutlined,
  CheckCircleOutlined,
  ScheduleOutlined,
  RemoveCircleOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  ErrorOutlineOutlined,
  CloseOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { dashboardApi } from "@/lib/api/dashboard.api";
import { membersApi } from "@/lib/api/members.api";
import { Member } from "@/types/member.types";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

const C = {
  navy:    "#1E3A5F",
  blue:    "#2E75B6",
  green:   "#15803D",
  orange:  "#B45309",
  red:     "#B91C1C",
  slate:   "#64748B",
  muted:   "#94A3B8",
  border:  "#E2E8F0",
  surface: "#F8FAFC",
};

const DONUT_COLORS = ["#1E3A5F","#2E75B6","#15803D","#B45309","#6D28D9"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => `Rs.${n.toLocaleString("en-IN")}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  sublabel,
  value,
  accentColor,
  icon,
  isLoading,
  onClick,
}: {
  label: string;
  sublabel: string;
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
        p: 2.5,
        borderRadius: "10px",
        border: `1px solid ${C.border}`,
        borderLeft: `4px solid ${accentColor}`,
        backgroundColor: "#fff",
        cursor: "pointer",
        transition: "box-shadow 0.15s",
        "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
        height: "100%",
        userSelect: "none",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: 0.5, mb: 0.5 }}>
            {label}
          </Typography>
          {isLoading ? (
            <Skeleton width={48} height={42} />
          ) : (
            <Typography sx={{ fontSize: "2rem", fontWeight: 800, color: C.navy, lineHeight: 1.1 }}>
              {value}
            </Typography>
          )}
          <Typography sx={{ fontSize: "0.72rem", color: C.muted, mt: 0.5, fontWeight: 500 }}>
            {sublabel}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "8px",
            backgroundColor: `${accentColor}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accentColor,
          }}
        >
          {icon}
        </Box>
      </Box>
    </Paper>
  );
}

// ─── Area chart tooltip ───────────────────────────────────────────────────────

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
    <Box
      sx={{
        background: "#fff",
        border: `1px solid ${C.border}`,
        borderRadius: "8px",
        px: 1.5,
        py: 1,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <Typography sx={{ fontSize: "0.72rem", color: C.slate, fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, color: C.navy }}>
        {fmt(payload[0].value)}
      </Typography>
    </Box>
  );
}

// ─── Custom donut label ───────────────────────────────────────────────────────

function DonutLabel({
  cx,
  cy,
  total,
}: {
  cx: number;
  cy: number;
  total: number;
}) {
  return (
    <>
      <text x={cx} y={cy - 8} textAnchor="middle" fill={C.navy} style={{ fontSize: 22, fontWeight: 800 }}>
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={C.muted} style={{ fontSize: 11, fontWeight: 500 }}>
        members
      </text>
    </>
  );
}

// ─── Member table ─────────────────────────────────────────────────────────────

function MemberTable({ members }: { members: Member[] }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: C.surface }}>
            {["Name", "Mobile", "Plan", "End Date", "Pending"].map((h) => (
              <TableCell key={h} sx={{ fontSize: "0.72rem", fontWeight: 700, color: C.slate, py: 1.25, px: 2, borderBottom: `1px solid ${C.border}` }}>
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {members.map((m) => (
            <TableRow key={m._id} sx={{ "&:last-child td": { border: 0 }, "&:hover": { backgroundColor: C.surface } }}>
              <TableCell sx={{ py: 1.5, px: 2 }}>
                <Typography sx={{ fontWeight: 600, fontSize: "0.82rem", color: "#111827" }}>{m.name}</Typography>
              </TableCell>
              <TableCell sx={{ py: 1.5, px: 2 }}>
                <Typography sx={{ fontSize: "0.8rem", color: "#374151" }}>{m.mobile}</Typography>
              </TableCell>
              <TableCell sx={{ py: 1.5, px: 2 }}>
                <Typography sx={{ fontSize: "0.8rem", color: "#374151" }}>{m.planSnapshot.name}</Typography>
              </TableCell>
              <TableCell sx={{ py: 1.5, px: 2 }}>
                <Typography sx={{ fontSize: "0.8rem", color: "#374151" }}>{fmtDate(m.endDate)}</Typography>
              </TableCell>
              <TableCell sx={{ py: 1.5, px: 2 }}>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: m.pendingAmount > 0 ? C.red : C.green }}>
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

function ModalLoader() {
  return (
    <Box sx={{ py: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <CircularProgress size={28} thickness={3} sx={{ color: C.blue }} />
      <Typography sx={{ fontSize: "0.82rem", color: C.muted }}>Loading...</Typography>
    </Box>
  );
}

function ModalEmpty({ message }: { message: string }) {
  return (
    <Box sx={{ py: 6, textAlign: "center" }}>
      <CheckCircleOutlined sx={{ fontSize: 36, color: "#86EFAC", mb: 1 }} />
      <Typography sx={{ fontWeight: 600, fontSize: "0.88rem", color: "#374151" }}>{message}</Typography>
    </Box>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

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

  useEffect(() => { if (!open) setMembers([]); }, [open]);

  if (!type) return null;

  const configMap = {
    total:    { title: "All Members",     color: C.navy,   bg: "#EFF6FF" },
    active:   { title: "Active Members",  color: C.green,  bg: "#F0FDF4" },
    expiring: { title: "Expiring Soon",   color: C.orange, bg: "#FFFBEB" },
    expired:  { title: "Expired Members", color: C.red,    bg: "#FEF2F2" },
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
        sx: { borderRadius: fullScreen ? 0 : "14px", border: `1px solid ${C.border}`, overflow: "hidden" },
      }}
    >
      <DialogTitle sx={{ backgroundColor: bg, borderBottom: `1px solid ${color}25`, px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color }}>{title}</Typography>
          <Typography sx={{ fontSize: "0.73rem", color, opacity: 0.75, fontWeight: 500, mt: 0.25 }}>
            {type === "expiring"
              ? `${data?.expiryAlerts.length ?? 0} members`
              : isLoadingMembers ? "Loading..." : `${members.length} members`}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: C.muted }}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {type === "total" && (isLoadingMembers ? <ModalLoader /> : members.length === 0 ? <ModalEmpty message="No members found" /> : <MemberTable members={members} />)}
        {type === "active" && (isLoadingMembers ? <ModalLoader /> : members.length === 0 ? <ModalEmpty message="No active members" /> : <MemberTable members={members} />)}
        {type === "expiring" && (
          !data?.expiryAlerts.length ? <ModalEmpty message="No members expiring soon" /> : (
            <>
              <Box sx={{ px: 3, py: 1.5, backgroundColor: "#FFFBEB", borderBottom: "1px solid #FDE68A" }}>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "#92400E" }}>
                  {data.expiryAlerts.length} member{data.expiryAlerts.length > 1 ? "s" : ""} need renewal attention
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: C.surface }}>
                      {["Name", "Mobile", "Plan / Slot", "Expires On", "Pending"].map((h) => (
                        <TableCell key={h} sx={{ fontSize: "0.72rem", fontWeight: 700, color: C.slate, py: 1.25, px: 2, borderBottom: `1px solid ${C.border}` }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.expiryAlerts.map((a) => (
                      <TableRow key={a.memberId} sx={{ "&:last-child td": { border: 0 }, "&:hover": { backgroundColor: C.surface } }}>
                        <TableCell sx={{ py: 1.5, px: 2 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: "0.82rem", color: "#111827" }}>{a.name}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.5, px: 2 }}>
                          <Typography sx={{ fontSize: "0.8rem", color: "#374151" }}>{a.mobile}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.5, px: 2 }}>
                          <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>{a.planName}</Typography>
                          <Typography sx={{ fontSize: "0.72rem", color: C.muted }}>{a.slotLabel}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.5, px: 2 }}>
                          <Chip label={fmtDate(a.endDate)} size="small" sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600, backgroundColor: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }} />
                        </TableCell>
                        <TableCell sx={{ py: 1.5, px: 2 }}>
                          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: a.pendingAmount > 0 ? C.red : C.green }}>
                            {a.pendingAmount > 0 ? fmt(a.pendingAmount) : "Paid"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )
        )}
        {type === "expired" && (isLoadingMembers ? <ModalLoader /> : members.length === 0 ? <ModalEmpty message="No expired members" /> : <MemberTable members={members} />)}
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
        const [s, m, p] = await Promise.all([
          dashboardApi.getSummary(),
          dashboardApi.getMonthlyRevenue(),
          dashboardApi.getPlanDistribution(),
        ]);
        setData(s.data);
        setMonthly(m.data || []);
        setPlans(p.data || []);
      } catch {
        setError("Failed to load dashboard. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const chartData = monthly.map((m) => ({
    name: `${MONTH_NAMES[m.month - 1]} '${String(m.year).slice(2)}`,
    amount: m.totalAmount,
    payments: m.paymentCount,
  }));

  const totalSlotMembers = data?.slotActivity.reduce((s, a) => s + a.count, 0) ?? 0;
  const totalPlanMembers = plans.reduce((s, p) => s + p.memberCount, 0);

  // Month over month trend
  const trend = (() => {
    if (chartData.length < 2) return null;
    const last = chartData[chartData.length - 1].amount;
    const prev = chartData[chartData.length - 2].amount;
    if (prev === 0) return null;
    const pct = Math.round(((last - prev) / prev) * 100);
    return { pct, up: pct >= 0 };
  })();

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  return (
    <Box>

      {/* ── Row 1: Stat cards ─────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          { label: "Total Members",  sublabel: "All registered",       value: data?.memberCounts.total ?? 0,        accentColor: C.navy,   icon: <PeopleAltOutlined sx={{ fontSize: 18 }} />,    modal: "total"    as ModalType },
          { label: "Active",         sublabel: "Valid today",           value: data?.memberCounts.active ?? 0,       accentColor: C.green,  icon: <CheckCircleOutlined sx={{ fontSize: 18 }} />, modal: "active"   as ModalType },
          { label: "Expiring Soon",  sublabel: "Within alert window",  value: data?.memberCounts.expiringSoon ?? 0, accentColor: C.orange, icon: <ScheduleOutlined sx={{ fontSize: 18 }} />,    modal: "expiring" as ModalType },
          { label: "Expired",        sublabel: "Needs renewal",         value: data?.memberCounts.expired ?? 0,      accentColor: C.red,    icon: <RemoveCircleOutlined sx={{ fontSize: 18 }} />,modal: "expired"  as ModalType },
        ].map((card) => (
          <Grid item xs={6} md={3} key={card.label}>
            <StatCard
              label={card.label}
              sublabel={card.sublabel}
              value={card.value}
              accentColor={card.accentColor}
              icon={card.icon}
              isLoading={isLoading}
              onClick={() => setActiveModal(card.modal)}
            />
          </Grid>
        ))}
      </Grid>

      {/* ── Row 2: Revenue ────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ mb: 2, borderRadius: "10px", border: `1px solid ${C.border}`, backgroundColor: "#fff", overflow: "hidden" }}>
        <Grid container>
          <Grid item xs={12} sm={6} sx={{ p: 2.5, borderRight: { sm: `1px solid ${C.border}` }, borderBottom: { xs: `1px solid ${C.border}`, sm: "none" } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Collected</Typography>
              <TrendingUpOutlined sx={{ fontSize: 16, color: C.green }} />
            </Box>
            {isLoading ? <Skeleton width={160} height={42} /> : (
              <Typography sx={{ fontSize: "1.75rem", fontWeight: 800, color: C.green }}>
                {fmt(data?.revenue.totalRevenue ?? 0)}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} sm={6} sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Pending</Typography>
              <ErrorOutlineOutlined sx={{ fontSize: 16, color: C.red }} />
            </Box>
            {isLoading ? <Skeleton width={160} height={42} /> : (
              <Typography sx={{ fontSize: "1.75rem", fontWeight: 800, color: C.red }}>
                {fmt(data?.revenue.totalPending ?? 0)}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* ── Row 3: Area chart + Donut chart ──────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 2 }}>

        {/* Area chart - monthly revenue */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: "10px", border: `1px solid ${C.border}`, backgroundColor: "#fff", height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2.5 }}>
              <Box>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Monthly Revenue
                </Typography>
                <Typography sx={{ fontSize: "0.73rem", color: C.muted, mt: 0.25 }}>
                  Last {Math.min(chartData.length, 6)} months
                </Typography>
              </Box>
              {trend && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.5, borderRadius: "6px", backgroundColor: trend.up ? "#F0FDF4" : "#FEF2F2" }}>
                  {trend.up
                    ? <TrendingUpOutlined sx={{ fontSize: 14, color: C.green }} />
                    : <TrendingDownOutlined sx={{ fontSize: 14, color: C.red }} />
                  }
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: trend.up ? C.green : C.red }}>
                    {trend.up ? "+" : ""}{trend.pct}% vs last month
                  </Typography>
                </Box>
              )}
            </Box>

            {isLoading ? (
              <Skeleton variant="rectangular" height={180} sx={{ borderRadius: "6px" }} />
            ) : chartData.length === 0 ? (
              <Box sx={{ height: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
                <WarningAmberOutlined sx={{ fontSize: 28, color: C.muted }} />
                <Typography sx={{ fontSize: "0.82rem", color: C.muted }}>No payment data yet</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.blue} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: C.muted }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: C.muted }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                  />
                  <Tooltip content={<AreaTooltip />} cursor={{ stroke: C.border, strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke={C.blue}
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                    dot={{ fill: C.blue, strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: C.blue, strokeWidth: 2, stroke: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Donut chart - plan distribution */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: "10px", border: `1px solid ${C.border}`, backgroundColor: "#fff", height: "100%" }}>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: 0.5, mb: 2.5 }}>
              Members by Plan
            </Typography>

            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 180 }}>
                <Skeleton variant="circular" width={140} height={140} />
              </Box>
            ) : plans.length === 0 ? (
              <Box sx={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography sx={{ fontSize: "0.82rem", color: C.muted }}>No data yet</Typography>
              </Box>
            ) : (
              <Box>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={plans}
                      dataKey="memberCount"
                      nameKey="planName"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      strokeWidth={2}
                      stroke="#fff"
                    >
                      {plans.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: `1px solid ${C.border}`,
                      fontSize: 12,
                    }}
                    labelStyle={{ fontSize: 12, fontWeight: 600, color: C.slate }}
                    itemStyle={{ fontSize: 12, color: C.navy }}
                  />
                  </PieChart>
                </ResponsiveContainer>

                {/* Custom label in center - rendered via absolute positioning */}
                <Box sx={{ mt: -2.5, display: "flex", flexDirection: "column", gap: 1 }}>
                  {plans.map((p, i) => (
                    <Box key={p.planId} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "3px", backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
                      <Typography sx={{ fontSize: "0.78rem", color: "#374151", fontWeight: 500, flex: 1 }} noWrap>
                        {p.planName}
                      </Typography>
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: C.slate }}>
                        {p.memberCount}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ── Row 4: Expiry alerts ──────────────────────────────────── */}
      <Paper elevation={0} sx={{ mb: 2, borderRadius: "10px", border: `1px solid ${C.border}`, backgroundColor: "#fff", overflow: "hidden" }}>
        <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: data?.expiryAlerts.length ? `1px solid ${C.border}` : "none" }}>
          <Box>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Expiring Soon
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: C.muted, mt: 0.25 }}>
              Members whose membership ends within the alert window
            </Typography>
          </Box>
          {!isLoading && !!data?.expiryAlerts.length && (
            <Chip label={`${data.expiryAlerts.length} member${data.expiryAlerts.length > 1 ? "s" : ""}`} size="small" sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700, backgroundColor: "#FEF3C7", color: "#92400E" }} />
          )}
        </Box>

        {isLoading ? (
          <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
            {[1,2,3].map(i => <Skeleton key={i} height={40} sx={{ borderRadius: "4px" }} />)}
          </Box>
        ) : !data?.expiryAlerts.length ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <CheckCircleOutlined sx={{ fontSize: 32, color: "#86EFAC", mb: 1 }} />
            <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 600 }}>No members expiring soon</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: C.surface }}>
                  {["Name", "Mobile", "Plan", "Slot", "Expires", "Pending"].map(h => (
                    <TableCell key={h} sx={{ fontSize: "0.72rem", fontWeight: 700, color: C.slate, py: 1.25, px: 2, borderBottom: `1px solid ${C.border}` }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.expiryAlerts.map(a => (
                  <TableRow key={a.memberId} sx={{ "&:last-child td": { border: 0 }, "&:hover": { backgroundColor: C.surface } }}>
                    <TableCell sx={{ py: 1.5, px: 2 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: "0.82rem", color: "#111827" }}>{a.name}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, px: 2 }}>
                      <Typography sx={{ fontSize: "0.8rem", color: "#374151" }}>{a.mobile}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, px: 2 }}>
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>{a.planName}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, px: 2 }}>
                      <Typography sx={{ fontSize: "0.8rem", color: "#374151" }}>{a.slotLabel}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, px: 2 }}>
                      <Chip label={fmtDate(a.endDate)} size="small" sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600, backgroundColor: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }} />
                    </TableCell>
                    <TableCell sx={{ py: 1.5, px: 2 }}>
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: a.pendingAmount > 0 ? C.red : C.green }}>
                        {a.pendingAmount > 0 ? fmt(a.pendingAmount) : "Paid"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ── Row 5: Slot activity ──────────────────────────────────── */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: "10px", border: `1px solid ${C.border}`, backgroundColor: "#fff" }}>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: 0.5, mb: 2.5 }}>
              Members by Slot
            </Typography>
            {isLoading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[1,2,3].map(i => <Skeleton key={i} height={28} sx={{ borderRadius: "4px" }} />)}
              </Box>
            ) : !data?.slotActivity.length ? (
              <Box sx={{ py: 3, textAlign: "center" }}>
                <Typography sx={{ fontSize: "0.82rem", color: C.muted }}>No slot data yet</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[...data.slotActivity].sort((a, b) => b.count - a.count).map((slot, i) => {
                  const pct = totalSlotMembers > 0 ? Math.round((slot.count / totalSlotMembers) * 100) : 0;
                  return (
                    <Box key={i}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151" }} noWrap>{slot.label}</Typography>
                        <Box sx={{ display: "flex", gap: 0.75, flexShrink: 0, ml: 1 }}>
                          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#374151" }}>{slot.count}</Typography>
                          <Typography sx={{ fontSize: "0.75rem", color: C.muted }}>{pct}%</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ height: 7, borderRadius: "99px", backgroundColor: "#F1F5F9", overflow: "hidden" }}>
                        <Box sx={{ height: "100%", width: `${pct}%`, borderRadius: "99px", backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      </Box>
                    </Box>
                  );
                })}
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={{ fontSize: "0.75rem", color: C.slate, fontWeight: 600 }}>Total</Typography>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151" }}>{totalSlotMembers}</Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <DetailModal
        open={activeModal !== null}
        type={activeModal}
        data={data}
        onClose={() => setActiveModal(null)}
      />
    </Box>
  );
}