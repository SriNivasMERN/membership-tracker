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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  PeopleAltOutlined,
  CheckCircleOutlined,
  ScheduleOutlined,
  RemoveCircleOutlined,
  TrendingUpOutlined,
  ErrorOutlineOutlined,
  CloseOutlined,
  BarChartOutlined,
  ArrowForwardOutlined,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { dashboardApi } from "@/lib/api/dashboard.api";

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
const CHART_COLORS = ["#1E3A5F","#2E75B6","#0EA5E9","#6366F1","#8B5CF6"];

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
  icon,
  iconBg,
  iconColor,
  isLoading,
  onClick,
}: {
  label: string;
  sublabel: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  isLoading: boolean;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);

  return (
    <Paper
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: "12px",
        border: "1px solid",
        borderColor: hov ? `${iconColor}40` : "#E2E8F0",
        borderTop: `3px solid ${iconColor}`,
        boxShadow: hov
          ? `0 8px 24px ${iconColor}20`
          : "0 1px 3px rgba(0,0,0,0.06)",
        backgroundColor: "#fff",
        cursor: "pointer",
        transition: "all 0.15s ease",
        transform: hov ? "translateY(-2px)" : "none",
        display: "flex",
        alignItems: "center",
        gap: 2,
        height: "100%",
        userSelect: "none",
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: "12px",
          backgroundColor: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: iconColor,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: "0.73rem", fontWeight: 600, color: "#374151", display: "block", mb: 0.75 }}>
          {sublabel}
        </Typography>
        {isLoading ? (
          <Skeleton width={40} height={30} />
        ) : (
          <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, color: iconColor, lineHeight: 1 }}>
            {value}
          </Typography>
        )}
      </Box>

      <ArrowForwardOutlined
        sx={{
          fontSize: 14,
          color: "#CBD5E1",
          flexShrink: 0,
          opacity: hov ? 1 : 0,
          transition: "opacity 0.15s",
        }}
      />
    </Paper>
  );
}

// ─── Bar Tooltip ──────────────────────────────────────────────────────────────

function BarTooltip({
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
        border: "1px solid #E2E8F0",
        borderRadius: "8px",
        px: 1.5,
        py: 1,
        boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
      }}
    >
      <Typography sx={{ fontSize: "0.72rem", color: "#6B7280", fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "#1E3A5F" }}>
        {fmt(payload[0].value)}
      </Typography>
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

  if (!type) return null;

  const configMap = {
    total:    { title: "Member Breakdown",       color: "#1D4ED8", headerBg: "#EFF6FF" },
    active:   { title: "Active Members",          color: "#15803D", headerBg: "#F0FDF4" },
    expiring: { title: "Expiring Soon",           color: "#B45309", headerBg: "#FFFBEB" },
    expired:  { title: "Expired Memberships",     color: "#B91C1C", headerBg: "#FEF2F2" },
  };

  const { title, color, headerBg } = configMap[type];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: fullScreen ? 0 : "16px",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: headerBg,
          borderBottom: `1px solid ${color}20`,
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: "1rem", color }}>
          {title}
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: "#9CA3AF" }}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>

        {type === "total" && (
          <Box sx={{ p: 3 }}>
            <Typography sx={{ fontSize: "0.82rem", color: "#374151", fontWeight: 500, mb: 2.5 }}>
              All {data?.memberCounts.total ?? 0} members broken down by current membership status.
            </Typography>
            {[
              { label: "Active",        desc: "Membership currently valid",         value: data?.memberCounts.active ?? 0,       color: "#15803D", bg: "#F0FDF4", border: "#BBF7D0" },
              { label: "Expiring Soon", desc: "Ends within the alert window",       value: data?.memberCounts.expiringSoon ?? 0, color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" },
              { label: "Expired",       desc: "Membership end date has passed",     value: data?.memberCounts.expired ?? 0,      color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
            ].map((row) => (
              <Box
                key={row.label}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 2,
                  mb: 1.5,
                  borderRadius: "10px",
                  backgroundColor: row.bg,
                  border: `1px solid ${row.border}`,
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: row.color }}>
                    {row.label}
                  </Typography>
                  <Typography sx={{ fontSize: "0.73rem", color: "#6B7280", fontWeight: 500, mt: 0.25 }}>
                    {row.desc}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: "1.8rem", color: row.color }}>
                  {row.value}
                </Typography>
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: "#374151" }}>Total Members</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color: "#1D4ED8" }}>
                {data?.memberCounts.total ?? 0}
              </Typography>
            </Box>
          </Box>
        )}

        {type === "active" && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ borderRadius: "12px", backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", p: 3, textAlign: "center", mb: 2.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "4rem", color: "#15803D", lineHeight: 1 }}>
                {data?.memberCounts.active ?? 0}
              </Typography>
              <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: "#166534", mt: 1 }}>
                members with active memberships
              </Typography>
            </Box>
            {[
              { label: "Active out of total", value: `${data?.memberCounts.active ?? 0} / ${data?.memberCounts.total ?? 0}`, color: "#111827" },
              {
                label: "Active rate",
                value: `${data?.memberCounts.total ? Math.round((data.memberCounts.active / data.memberCounts.total) * 100) : 0}%`,
                color: "#15803D",
              },
            ].map((row) => (
              <Box key={row.label} sx={{ display: "flex", justifyContent: "space-between", py: 1.25, borderBottom: "1px solid #F1F5F9" }}>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: "#4B5563" }}>{row.label}</Typography>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: row.color }}>{row.value}</Typography>
              </Box>
            ))}
            <Typography sx={{ fontSize: "0.72rem", color: "#9CA3AF", mt: 2, fontWeight: 500 }}>
              Visit the Members page to see each active member in detail.
            </Typography>
          </Box>
        )}

        {type === "expiring" && (
          <Box>
            {!data?.expiryAlerts.length ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <CheckCircleOutlined sx={{ fontSize: 44, color: "#86EFAC", mb: 1.5 }} />
                <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: "#374151" }}>
                  No members expiring soon
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", color: "#9CA3AF", mt: 0.5, fontWeight: 500 }}>
                  All memberships are valid beyond the alert window
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ px: 3, py: 1.5, backgroundColor: "#FFFBEB", borderBottom: "1px solid #FDE68A" }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "#92400E" }}>
                    {data.expiryAlerts.length} member{data.expiryAlerts.length > 1 ? "s" : ""} need renewal attention
                  </Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                        {["Member", "Plan / Slot", "Expires On", "Pending"].map((h) => (
                          <TableCell key={h} sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#6B7280", py: 1.25, px: 2, borderBottom: "1px solid #E2E8F0" }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.expiryAlerts.map((a) => (
                        <TableRow key={a.memberId} sx={{ "&:last-child td": { border: 0 }, "&:hover": { backgroundColor: "#FAFAFA" } }}>
                          <TableCell sx={{ py: 1.5, px: 2 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: "0.82rem", color: "#111827" }}>{a.name}</Typography>
                            <Typography sx={{ fontSize: "0.72rem", color: "#9CA3AF", fontWeight: 500 }}>{a.mobile}</Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1.5, px: 2 }}>
                            <Typography sx={{ fontSize: "0.8rem", color: "#374151", fontWeight: 600 }}>{a.planName}</Typography>
                            <Typography sx={{ fontSize: "0.72rem", color: "#9CA3AF", fontWeight: 500 }}>{a.slotLabel}</Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1.5, px: 2 }}>
                            <Chip
                              label={fmtDate(a.endDate)}
                              size="small"
                              sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600, backgroundColor: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 1.5, px: 2 }}>
                            <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: a.pendingAmount > 0 ? "#DC2626" : "#16A34A" }}>
                              {a.pendingAmount > 0 ? fmt(a.pendingAmount) : "Fully Paid"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        )}

        {type === "expired" && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ borderRadius: "12px", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", p: 3, textAlign: "center", mb: 2.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "4rem", color: "#B91C1C", lineHeight: 1 }}>
                {data?.memberCounts.expired ?? 0}
              </Typography>
              <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: "#991B1B", mt: 1 }}>
                memberships have expired
              </Typography>
            </Box>
            {[
              { label: "Expired out of total", value: `${data?.memberCounts.expired ?? 0} / ${data?.memberCounts.total ?? 0}`, color: "#111827" },
              {
                label: "Expiry rate",
                value: `${data?.memberCounts.total ? Math.round((data.memberCounts.expired / data.memberCounts.total) * 100) : 0}%`,
                color: "#B91C1C",
              },
            ].map((row) => (
              <Box key={row.label} sx={{ display: "flex", justifyContent: "space-between", py: 1.25, borderBottom: "1px solid #F1F5F9" }}>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: "#4B5563" }}>{row.label}</Typography>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: row.color }}>{row.value}</Typography>
              </Box>
            ))}
            <Typography sx={{ fontSize: "0.72rem", color: "#9CA3AF", mt: 2, fontWeight: 500 }}>
              Visit Members page, filter by Expired, and renew their memberships.
            </Typography>
          </Box>
        )}
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
  }));

  const totalSlotMembers = data?.slotActivity.reduce((s, a) => s + a.count, 0) ?? 0;
  const maxPlanCount = plans[0]?.memberCount ?? 1;

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  return (
    <Box>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 2.5 }}>
        {[
          { label: "Total Members",  sublabel: "All registered members",    value: data?.memberCounts.total ?? 0,         icon: <PeopleAltOutlined sx={{ fontSize: 22 }} />,      iconBg: "#EFF6FF", iconColor: "#1D4ED8", modal: "total"    as ModalType },
          { label: "Active",         sublabel: "Valid membership today",     value: data?.memberCounts.active ?? 0,        icon: <CheckCircleOutlined sx={{ fontSize: 22 }} />,    iconBg: "#F0FDF4", iconColor: "#15803D", modal: "active"   as ModalType },
          { label: "Expiring Soon",  sublabel: "Needs renewal attention",   value: data?.memberCounts.expiringSoon ?? 0,  icon: <ScheduleOutlined sx={{ fontSize: 22 }} />,       iconBg: "#FFFBEB", iconColor: "#B45309", modal: "expiring" as ModalType },
          { label: "Expired",        sublabel: "Membership lapsed",          value: data?.memberCounts.expired ?? 0,       icon: <RemoveCircleOutlined sx={{ fontSize: 22 }} />,   iconBg: "#FEF2F2", iconColor: "#B91C1C", modal: "expired"  as ModalType },
        ].map((card) => (
          <Grid item xs={6} md={3} key={card.label}>
            <StatCard
              label={card.label}
              sublabel={card.sublabel}
              value={card.value}
              icon={card.icon}
              iconBg={card.iconBg}
              iconColor={card.iconColor}
              isLoading={isLoading}
              onClick={() => setActiveModal(card.modal)}
            />
          </Grid>
        ))}
      </Grid>

      {/* ── Revenue ──────────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          backgroundColor: "#fff",
          mb: 2.5,
          overflow: "hidden",
        }}
      >
        <Grid container>
          <Grid item xs={12} sm={6} sx={{ p: { xs: 2.5, sm: 3 }, borderRight: { sm: "1px solid #E2E8F0" }, borderBottom: { xs: "1px solid #E2E8F0", sm: "none" } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: "8px", backgroundColor: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUpOutlined sx={{ fontSize: 16, color: "#16A34A" }} />
              </Box>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>Total Collected</Typography>
            </Box>
            {isLoading ? <Skeleton width={150} height={38} /> : (
              <Typography sx={{ fontWeight: 800, fontSize: "1.75rem", color: "#15803D" }}>
                {fmt(data?.revenue.totalRevenue ?? 0)}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} sm={6} sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: "8px", backgroundColor: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ErrorOutlineOutlined sx={{ fontSize: 16, color: "#DC2626" }} />
              </Box>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>Total Pending</Typography>
            </Box>
            {isLoading ? <Skeleton width={150} height={38} /> : (
              <Typography sx={{ fontWeight: 800, fontSize: "1.75rem", color: "#B91C1C" }}>
                {fmt(data?.revenue.totalPending ?? 0)}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* ── Chart + Plan distribution ─────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ borderRadius: "12px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", backgroundColor: "#fff", p: { xs: 2, sm: 2.5 }, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
              <BarChartOutlined sx={{ fontSize: 16, color: "#6B7280" }} />
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#374151" }}>Monthly Revenue</Typography>
            </Box>
            {isLoading ? (
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: "8px" }} />
            ) : chartData.length === 0 ? (
              <Box sx={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography sx={{ fontSize: "0.82rem", color: "#9CA3AF", fontWeight: 500 }}>No payment data yet</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }} barCategoryGap="45%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF", fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF", fontWeight: 500 }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: "#F8FAFC", radius: 4 }} />
                  <Bar dataKey="amount" fill="#2E75B6" radius={[5, 5, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ borderRadius: "12px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", backgroundColor: "#fff", p: { xs: 2, sm: 2.5 }, height: "100%" }}>
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#374151", mb: 2.5 }}>Members by Plan</Typography>
            {isLoading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[1,2,3].map(i => <Skeleton key={i} height={36} sx={{ borderRadius: "6px" }} />)}
              </Box>
            ) : plans.length === 0 ? (
              <Box sx={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography sx={{ fontSize: "0.82rem", color: "#9CA3AF", fontWeight: 500 }}>No data yet</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {plans.map((p, i) => {
                  const pct = Math.round((p.memberCount / maxPlanCount) * 100);
                  return (
                    <Box key={p.planId}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151" }} noWrap>{p.planName}</Typography>
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#6B7280", ml: 1, flexShrink: 0 }}>{p.memberCount}</Typography>
                      </Box>
                      <Box sx={{ height: 8, borderRadius: "99px", backgroundColor: "#F1F5F9", overflow: "hidden" }}>
                        <Box sx={{ height: "100%", width: `${pct}%`, borderRadius: "99px", backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ── Expiry alerts + Slot activity ─────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ borderRadius: "12px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", backgroundColor: "#fff", overflow: "hidden" }}>
            <Box sx={{ px: 2.5, pt: 2.5, pb: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#374151" }}>Expiring Soon</Typography>
              {!isLoading && !!data?.expiryAlerts.length && (
                <Chip label={`${data.expiryAlerts.length} member${data.expiryAlerts.length > 1 ? "s" : ""}`} size="small" sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700, backgroundColor: "#FEF3C7", color: "#92400E" }} />
              )}
            </Box>
            {isLoading ? (
              <Box sx={{ px: 2.5, pb: 2.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
                {[1,2,3].map(i => <Skeleton key={i} height={44} sx={{ borderRadius: "6px" }} />)}
              </Box>
            ) : !data?.expiryAlerts.length ? (
              <Box sx={{ py: 5, textAlign: "center" }}>
                <CheckCircleOutlined sx={{ fontSize: 36, color: "#86EFAC", mb: 1 }} />
                <Typography sx={{ fontSize: "0.82rem", color: "#6B7280", fontWeight: 600 }}>No members expiring soon</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                      {["Name", "Plan", "Expires", "Pending"].map(h => (
                        <TableCell key={h} sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#6B7280", py: 1.25, px: 2, borderBottom: "1px solid #F1F5F9" }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.expiryAlerts.map(a => (
                      <TableRow key={a.memberId} sx={{ "&:last-child td": { border: 0 }, "&:hover": { backgroundColor: "#FAFAFA" } }}>
                        <TableCell sx={{ py: 1.5, px: 2 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: "0.82rem", color: "#111827" }}>{a.name}</Typography>
                          <Typography sx={{ fontSize: "0.72rem", color: "#9CA3AF", fontWeight: 500 }}>{a.mobile}</Typography>
                        </TableCell>
                        <TableCell sx={{ px: 2 }}>
                          <Typography sx={{ fontSize: "0.8rem", color: "#374151", fontWeight: 600 }}>{a.planName}</Typography>
                        </TableCell>
                        <TableCell sx={{ px: 2 }}>
                          <Chip label={fmtDate(a.endDate)} size="small" sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600, backgroundColor: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }} />
                        </TableCell>
                        <TableCell sx={{ px: 2 }}>
                          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: a.pendingAmount > 0 ? "#DC2626" : "#16A34A" }}>
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
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ borderRadius: "12px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", backgroundColor: "#fff", p: { xs: 2, sm: 2.5 }, height: "100%" }}>
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#374151", mb: 2.5 }}>Members by Slot</Typography>
            {isLoading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[1,2,3].map(i => <Skeleton key={i} height={32} sx={{ borderRadius: "6px" }} />)}
              </Box>
            ) : !data?.slotActivity.length ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography sx={{ fontSize: "0.82rem", color: "#9CA3AF", fontWeight: 500 }}>No slot data yet</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {[...data.slotActivity].sort((a, b) => b.count - a.count).map((slot, i) => {
                  const pct = totalSlotMembers > 0 ? Math.round((slot.count / totalSlotMembers) * 100) : 0;
                  return (
                    <Box key={i}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151" }} noWrap>{slot.label}</Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0, ml: 1 }}>
                          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#374151" }}>{slot.count}</Typography>
                          <Typography sx={{ fontSize: "0.72rem", color: "#9CA3AF", fontWeight: 500 }}>{pct}%</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ height: 8, borderRadius: "99px", backgroundColor: "#F1F5F9", overflow: "hidden" }}>
                        <Box sx={{ height: "100%", width: `${pct}%`, borderRadius: "99px", backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      </Box>
                    </Box>
                  );
                })}
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={{ fontSize: "0.78rem", color: "#6B7280", fontWeight: 600 }}>Total across all slots</Typography>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151" }}>{totalSlotMembers}</Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      <DetailModal
        open={activeModal !== null}
        type={activeModal}
        data={data}
        onClose={() => setActiveModal(null)}
      />
    </Box>
  );
}