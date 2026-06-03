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

interface MemberCounts { total: number; active: number; expiringSoon: number; expired: number; }
interface Revenue { totalRevenue: number; totalPending: number; }
interface ExpiryAlert { memberId: string; name: string; mobile: string; endDate: string; planName: string; slotLabel: string; pendingAmount: number; }
interface SlotActivity { label: string; count: number; }
interface DashboardData { memberCounts: MemberCounts; revenue: Revenue; expiryAlerts: ExpiryAlert[]; slotActivity: SlotActivity[]; }
interface MonthlyRevenue { year: number; month: number; totalAmount: number; paymentCount: number; }
interface PlanDistribution { planId: string; planName: string; memberCount: number; }
type ModalType = "total" | "active" | "expiring" | "expired" | null;

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PALETTE = ["#1E3A5F","#2E75B6","#15803D","#B45309","#6D28D9"];

const C = {
  navy: "#1E3A5F", blue: "#2E75B6", green: "#15803D",
  orange: "#B45309", red: "#B91C1C", slate: "#334155",
  muted: "#64748B", border: "#E2E8F0", surface: "#F8FAFC",
};

const fmt = (n: number) => `Rs.${n.toLocaleString("en-IN")}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, sublabel, value, accentColor, icon, isLoading, onClick }: {
  label: string; sublabel: string; value: number; accentColor: string;
  icon: React.ReactNode; isLoading: boolean; onClick: () => void;
}) {
  return (
    <Paper onClick={onClick} elevation={0} sx={{
      px: 2.5, py: 2, borderRadius: "12px",
      border: `1px solid ${C.border}`, borderLeft: `4px solid ${accentColor}`,
      backgroundColor: "#fff", cursor: "pointer",
      transition: "all 0.15s", userSelect: "none",
      "&:hover": { boxShadow: `0 6px 20px ${accentColor}18`, transform: "translateY(-1px)" },
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2,
    }}>
      <Box>
        <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1, mb: 0.5 }}>
          {label}
        </Typography>
        {isLoading ? <Skeleton width={48} height={38} /> : (
          <Typography sx={{ fontSize: "2rem", fontWeight: 900, color: C.navy, lineHeight: 1 }}>
            {value}
          </Typography>
        )}
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: C.muted, mt: 0.5 }}>
          {sublabel}
        </Typography>
      </Box>
      <Box sx={{
        width: 40, height: 40, borderRadius: "10px",
        backgroundColor: `${accentColor}12`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: accentColor, flexShrink: 0,
      }}>
        {icon}
      </Box>
    </Paper>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function AreaTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string; }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "8px", px: 1.5, py: 1, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <Typography sx={{ fontSize: "0.72rem", color: C.muted, fontWeight: 700 }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.92rem", fontWeight: 800, color: C.navy }}>{fmt(payload[0].value)}</Typography>
    </Box>
  );
}

// ─── Member Table ─────────────────────────────────────────────────────────────

function MemberTable({ members }: { members: Member[] }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: C.surface }}>
            {["Name", "Mobile", "Plan", "End Date", "Pending"].map((h) => (
              <TableCell key={h} sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.slate, py: 1.25, px: 2, borderBottom: `1px solid ${C.border}`, letterSpacing: 0.5 }}>{h}</TableCell>
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

function ModalLoader() {
  return (
    <Box sx={{ py: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <CircularProgress size={28} thickness={3} sx={{ color: C.blue }} />
      <Typography sx={{ fontSize: "0.82rem", color: C.muted, fontWeight: 600 }}>Loading...</Typography>
    </Box>
  );
}

function ModalEmpty({ message }: { message: string }) {
  return (
    <Box sx={{ py: 5, textAlign: "center" }}>
      <CheckCircleOutlined sx={{ fontSize: 36, color: "#86EFAC", mb: 1 }} />
      <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: C.slate }}>{message}</Typography>
    </Box>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ open, type, data, onClose }: { open: boolean; type: ModalType; data: DashboardData | null; onClose: () => void; }) {
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
      } catch { setMembers([]); }
      finally { setIsLoadingMembers(false); }
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
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth="md" fullWidth
      PaperProps={{ elevation: 0, sx: { borderRadius: fullScreen ? 0 : "16px", border: `1px solid ${C.border}`, overflow: "hidden" } }}
    >
      <DialogTitle sx={{ backgroundColor: bg, borderBottom: `1px solid ${color}25`, px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1rem", color }}>{title}</Typography>
          <Typography sx={{ fontSize: "0.73rem", color, opacity: 0.8, fontWeight: 600, mt: 0.25 }}>
            {type === "expiring" ? `${data?.expiryAlerts.length ?? 0} members` : isLoadingMembers ? "Loading..." : `${members.length} members`}
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
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#92400E" }}>
                  {data.expiryAlerts.length} member{data.expiryAlerts.length > 1 ? "s" : ""} need renewal attention
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: C.surface }}>
                      {["Name", "Mobile", "Plan / Slot", "Expires On", "Pending"].map((h) => (
                        <TableCell key={h} sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.slate, py: 1.25, px: 2, borderBottom: `1px solid ${C.border}` }}>{h}</TableCell>
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
                          <Chip label={fmtDate(a.endDate)} size="small" sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700, backgroundColor: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }} />
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
        const [s, m, p] = await Promise.all([dashboardApi.getSummary(), dashboardApi.getMonthlyRevenue(), dashboardApi.getPlanDistribution()]);
        setData(s.data);
        setMonthly(m.data || []);
        setPlans(p.data || []);
      } catch { setError("Failed to load dashboard. Please refresh."); }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  const chartData = monthly.map((m) => ({
    name: `${MONTH_NAMES[m.month - 1]} '${String(m.year).slice(2)}`,
    amount: m.totalAmount,
  }));

  const totalSlotMembers = data?.slotActivity.reduce((s, a) => s + a.count, 0) ?? 0;
  const maxPlanCount = plans[0]?.memberCount ?? 1;

  const trend = (() => {
    if (chartData.length < 2) return null;
    const last = chartData[chartData.length - 1].amount;
    const prev = chartData[chartData.length - 2].amount;
    if (prev === 0) return null;
    const pct = Math.round(((last - prev) / prev) * 100);
    return { pct, up: pct >= 0 };
  })();

  if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;

  return (
    <Box sx={{
      display: "flex",
      flexDirection: "column",
      gap: 1.5,
      height: "calc(100vh - 64px - 48px)",  // viewport minus topbar minus page padding
      overflow: "hidden",
    }}>

      {/* Row 1 - Stat cards - fixed height */}
      <Grid container spacing={1.5} sx={{ flexShrink: 0 }}>
        {[
          { label: "Total Members",  sublabel: "All registered",      value: data?.memberCounts.total ?? 0,        accentColor: C.navy,   icon: <PeopleAltOutlined sx={{ fontSize: 20 }} />,    modal: "total"    as ModalType },
          { label: "Active",         sublabel: "Valid today",          value: data?.memberCounts.active ?? 0,       accentColor: C.green,  icon: <CheckCircleOutlined sx={{ fontSize: 20 }} />, modal: "active"   as ModalType },
          { label: "Expiring Soon",  sublabel: "Within alert window",  value: data?.memberCounts.expiringSoon ?? 0, accentColor: C.orange, icon: <ScheduleOutlined sx={{ fontSize: 20 }} />,    modal: "expiring" as ModalType },
          { label: "Expired",        sublabel: "Needs renewal",        value: data?.memberCounts.expired ?? 0,      accentColor: C.red,    icon: <RemoveCircleOutlined sx={{ fontSize: 20 }} />, modal: "expired"  as ModalType },
        ].map((card) => (
          <Grid item xs={6} md={3} key={card.label}>
            <StatCard {...card} isLoading={isLoading} onClick={() => setActiveModal(card.modal)} />
          </Grid>
        ))}
      </Grid>

      {/* Row 2 - Revenue - fixed height */}
      <Paper elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${C.border}`, backgroundColor: "#fff", overflow: "hidden", flexShrink: 0 }}>
      <Grid container>
       <Grid item xs={12} sm={6} sx={{ px: 3, py: 2, borderRight: { sm: `1px solid ${C.border}` }, borderBottom: { xs: `1px solid ${C.border}`, sm: "none" } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
              <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Total Collected</Typography>
              <TrendingUpOutlined sx={{ fontSize: 16, color: C.green }} />
            </Box>
            {isLoading ? <Skeleton width={160} height={38} /> : (
              <Typography sx={{ fontSize: "1.6rem", fontWeight: 900, color: C.green }}>{fmt(data?.revenue.totalRevenue ?? 0)}</Typography>
            )}
          </Grid>
          <Grid item xs={12} sm={6} sx={{ px: 3, py: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
              <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Total Pending</Typography>
              <ErrorOutlineOutlined sx={{ fontSize: 16, color: C.red }} />
            </Box>
            {isLoading ? <Skeleton width={160} height={38} /> : (
              <Typography sx={{ fontSize: "1.6rem", fontWeight: 900, color: C.red }}>{fmt(data?.revenue.totalPending ?? 0)}</Typography>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Row 3 - Chart + Plan + Slot - flex grow */}
      <Grid container spacing={1.5} sx={{ flex: 1, minHeight: 0 }}>

        {/* Area chart */}
        <Grid item xs={12} md={5} sx={{ height: "100%" }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: "12px", border: `1px solid ${C.border}`, backgroundColor: "#fff", height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5, flexShrink: 0 }}>
              <Box>
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Monthly Revenue</Typography>
                <Typography sx={{ fontSize: "0.72rem", color: C.muted, fontWeight: 600, mt: 0.25 }}>Last {Math.min(chartData.length, 6)} months</Typography>
              </Box>
              {trend && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1, py: 0.4, borderRadius: "6px", backgroundColor: trend.up ? "#F0FDF4" : "#FEF2F2" }}>
                  {trend.up ? <TrendingUpOutlined sx={{ fontSize: 13, color: C.green }} /> : <TrendingDownOutlined sx={{ fontSize: 13, color: C.red }} />}
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: trend.up ? C.green : C.red }}>{trend.up ? "+" : ""}{trend.pct}%</Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              {isLoading ? (
                <Skeleton variant="rectangular" sx={{ height: "100%", borderRadius: "6px" }} />
              ) : chartData.length === 0 ? (
                <Box sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
                  <WarningAmberOutlined sx={{ fontSize: 28, color: C.muted }} />
                  <Typography sx={{ fontSize: "0.82rem", color: C.muted, fontWeight: 700 }}>No payment data yet</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.blue} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.muted, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: C.muted, fontWeight: 600 }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
                    <Tooltip content={<AreaTooltip />} cursor={{ stroke: C.border, strokeWidth: 1 }} />
                    <Area type="monotone" dataKey="amount" stroke={C.blue} strokeWidth={2.5} fill="url(#revenueGradient)" dot={{ fill: C.blue, strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: C.blue, strokeWidth: 2, stroke: "#fff" }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Plan donut */}
        <Grid item xs={12} md={4} sx={{ height: "100%" }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: "12px", border: `1px solid ${C.border}`, backgroundColor: "#fff", height: "100%", display: "flex", flexDirection: "column" }}>
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1, mb: 1.5, flexShrink: 0 }}>Members by Plan</Typography>
            {isLoading ? (
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Skeleton variant="circular" width={100} height={100} />
              </Box>
            ) : plans.length === 0 ? (
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography sx={{ fontSize: "0.82rem", color: C.muted, fontWeight: 700 }}>No data yet</Typography>
              </Box>
            ) : (
              <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={plans} dataKey="memberCount" nameKey="planName" cx="50%" cy="50%" innerRadius="35%" outerRadius="60%" strokeWidth={2} stroke="#fff">
                        {plans.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "8px", border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, flexShrink: 0, mt: 1 }}>
                  {plans.map((p, i) => (
                    <Box key={p.planId} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "2px", backgroundColor: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                      <Typography sx={{ fontSize: "0.75rem", color: C.slate, fontWeight: 700, flex: 1 }} noWrap>{p.planName}</Typography>
                      <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: C.slate }}>{p.memberCount}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Slot activity */}
        <Grid item xs={12} md={3} sx={{ height: "100%" }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: "12px", border: `1px solid ${C.border}`, backgroundColor: "#fff", height: "100%", display: "flex", flexDirection: "column" }}>
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1, mb: 1.5, flexShrink: 0 }}>By Slot</Typography>
            {isLoading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {[1,2,3].map(i => <Skeleton key={i} height={28} sx={{ borderRadius: "4px" }} />)}
              </Box>
            ) : !data?.slotActivity.length ? (
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography sx={{ fontSize: "0.82rem", color: C.muted, fontWeight: 700 }}>No data yet</Typography>
              </Box>
            ) : (
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
                  {[...data.slotActivity].sort((a, b) => b.count - a.count).map((slot, i) => {
                    const pct = totalSlotMembers > 0 ? Math.round((slot.count / totalSlotMembers) * 100) : 0;
                    return (
                      <Box key={i}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.6 }}>
                          <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: C.slate }} noWrap>{slot.label}</Typography>
                          <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0, ml: 1 }}>
                            <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: C.slate }}>{slot.count}</Typography>
                            <Typography sx={{ fontSize: "0.72rem", color: C.muted, fontWeight: 600 }}>{pct}%</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ height: 6, borderRadius: "99px", backgroundColor: "#F1F5F9", overflow: "hidden" }}>
                          <Box sx={{ height: "100%", width: `${pct}%`, borderRadius: "99px", backgroundColor: PALETTE[i % PALETTE.length] }} />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
                <Box>
                  <Divider sx={{ mb: 1 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: "0.72rem", color: C.muted, fontWeight: 700 }}>Total</Typography>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 900, color: C.slate }}>{totalSlotMembers}</Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Row 4 - Expiry alerts - flex grow fills remaining space */}
      <Paper elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${C.border}`, backgroundColor: "#fff", overflow: "hidden", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Box sx={{ px: 2.5, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <Box>
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Expiring Soon</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: C.muted, fontWeight: 600, mt: 0.15 }}>Members whose membership ends within the alert window</Typography>
          </Box>
          {!isLoading && !!data?.expiryAlerts.length && (
            <Chip label={`${data.expiryAlerts.length} member${data.expiryAlerts.length > 1 ? "s" : ""}`} size="small" sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700, backgroundColor: "#FEF3C7", color: "#92400E" }} />
          )}
        </Box>
        <Box sx={{ flex: 1, overflow: "auto" }}>
          {isLoading ? (
            <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1 }}>
              {[1,2,3].map(i => <Skeleton key={i} height={40} sx={{ borderRadius: "4px" }} />)}
            </Box>
          ) : !data?.expiryAlerts.length ? (
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <CheckCircleOutlined sx={{ fontSize: 32, color: "#86EFAC", mb: 1 }} />
              <Typography sx={{ fontSize: "0.85rem", color: C.slate, fontWeight: 700 }}>No members expiring soon</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: C.surface }}>
                    {["Name", "Mobile", "Plan", "Slot", "Expires", "Pending"].map(h => (
                      <TableCell key={h} sx={{ fontSize: "0.7rem", fontWeight: 800, color: C.slate, py: 1.25, px: 2, borderBottom: `1px solid ${C.border}`, letterSpacing: 0.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.expiryAlerts.map(a => (
                    <TableRow key={a.memberId} sx={{ "&:last-child td": { border: 0 }, "&:hover": { backgroundColor: C.surface } }}>
                      <TableCell sx={{ py: 1.25, px: 2 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#0F172A" }}>{a.name}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.25, px: 2 }}>
                        <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 600 }}>{a.mobile}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.25, px: 2 }}>
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: C.slate }}>{a.planName}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.25, px: 2 }}>
                        <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 600 }}>{a.slotLabel}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.25, px: 2 }}>
                        <Chip label={fmtDate(a.endDate)} size="small" sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700, backgroundColor: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }} />
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
          )}
        </Box>
      </Paper>

      <DetailModal open={activeModal !== null} type={activeModal} data={data} onClose={() => setActiveModal(null)} />
    </Box>
  );
}