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
  Groups2Outlined,
  NorthEastOutlined,
  RemoveCircleOutlined,
  ScheduleOutlined,
  TrendingDownOutlined,
  TrendingUpOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import { Line, LineChart, ResponsiveContainer } from "recharts";
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
        p: 1.8,
        border: `1px solid ${C.border}`,
        borderRadius: "14px",
        cursor: "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.25 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.65 }}>
            {label}
          </Typography>
          {isLoading ? (
            <Skeleton width={70} height={34} sx={{ mt: 0.45 }} />
          ) : (
            <Typography sx={{ mt: 0.5, fontSize: "1.8rem", fontWeight: 900, color: C.navy, lineHeight: 1 }}>
              {value}
            </Typography>
          )}
          <Typography sx={{ mt: 0.75, fontSize: "0.78rem", color: C.muted, fontWeight: 600, lineHeight: 1.4 }}>
            {helper}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "12px",
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
    </Paper>
  );
}

function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Paper elevation={0} sx={{ borderRadius: "16px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <Box
        sx={{
          px: 2,
          py: 1.4,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.75 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography sx={{ mt: 0.45, fontSize: "0.82rem", color: C.muted, fontWeight: 600 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {action}
      </Box>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Paper>
  );
}

function PulseMetric({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const styles =
    tone === "success"
      ? { bg: "#F0FDF4", border: "#BBF7D0", color: C.green }
      : tone === "warning"
        ? { bg: "#FFFBEB", border: "#FDE68A", color: C.orange }
        : tone === "danger"
          ? { bg: "#FEF2F2", border: "#FECACA", color: C.red }
          : { bg: "#EFF6FF", border: "#BFDBFE", color: C.navy };

  return (
    <Paper elevation={0} sx={{ p: 1.45, borderRadius: "14px", border: `1px solid ${styles.border}`, backgroundColor: styles.bg, height: "100%" }}>
      <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.45, fontSize: "1.18rem", fontWeight: 900, color: styles.color }}>
        {value}
      </Typography>
      <Typography sx={{ mt: 0.4, fontSize: "0.76rem", color: C.muted, fontWeight: 600, lineHeight: 1.4 }}>
        {helper}
      </Typography>
    </Paper>
  );
}

function ActionLine({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const color = tone === "success" ? C.green : tone === "warning" ? C.orange : tone === "danger" ? C.red : C.navy;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        gap: 1.5,
        px: 1.4,
        py: 1.15,
        borderRadius: "12px",
        backgroundColor: "#FFFFFF",
        border: `1px solid ${C.border}`,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color }}>{label}</Typography>
        <Typography sx={{ mt: 0.3, fontSize: "0.75rem", color: C.muted, fontWeight: 600, lineHeight: 1.35 }}>
          {helper}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: "1.1rem", fontWeight: 900, color, flexShrink: 0 }}>{value}</Typography>
    </Box>
  );
}

function MetricStrip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        px: 1.1,
        py: 0.8,
        borderRadius: "12px",
        border: `1px solid ${C.border}`,
        backgroundColor: "rgba(255,255,255,0.84)",
      }}
    >
      <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.45 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "0.82rem", fontWeight: 900, color: C.navy }}>
        {value}
      </Typography>
    </Box>
  );
}

function SparklinePanel({
  data,
  trend,
}: {
  data: { name: string; amount: number }[];
  trend: { pct: number; up: boolean } | null;
}) {
  return (
    <Box
      sx={{
        p: 1.35,
        borderRadius: "16px",
        border: "1px solid rgba(191,219,254,0.7)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(243,248,255,0.92) 100%)",
        boxShadow: "0 14px 28px rgba(46,117,182,0.10)",
        minHeight: 116,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
        <Box>
          <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.55 }}>
            Trend Signal
          </Typography>
          <Typography sx={{ mt: 0.3, fontSize: "1rem", fontWeight: 900, color: trend ? (trend.up ? C.green : C.red) : C.navy }}>
            {trend ? `${trend.up ? "+" : ""}${trend.pct}%` : "Stable"}
          </Typography>
        </Box>
        <Chip
          label="Live"
          size="small"
          sx={{
            height: 24,
            backgroundColor: "rgba(30,58,95,0.92)",
            color: "#FFFFFF",
            fontWeight: 800,
            fontSize: "0.68rem",
            "& .MuiChip-label": { px: 1 },
          }}
        />
      </Box>
      <Box sx={{ height: 46, mt: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <defs>
              <linearGradient id="sparklineStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#1E3A5F" />
              </linearGradient>
            </defs>
            <Line type="monotone" dataKey="amount" stroke="url(#sparklineStroke)" strokeWidth={2.5} dot={false} isAnimationActive animationDuration={900} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

function RevenueTimeline({
  data,
  trend,
  highestAmount,
}: {
  data: { name: string; amount: number; payments: number }[];
  trend: { pct: number; up: boolean } | null;
  highestAmount: number;
}) {
  const months = data.slice(-6);
  const maxValue = Math.max(highestAmount, 1);
  const gridSteps = 5;
  const axisValues = Array.from({ length: gridSteps + 1 }, (_, index) => Math.round((maxValue / gridSteps) * (gridSteps - index)));
  const cardWidth = months.length <= 2 ? 92 : 84;
  const columnGap = months.length <= 2 ? 18 : 14;
  const chartInnerWidth = Math.max(months.length * cardWidth + Math.max(months.length - 1, 0) * columnGap, months.length <= 2 ? 240 : 320);
  const barVisualHeight = 190;
  const points = months.map((month, index) => {
    const percent = highestAmount > 0 ? Math.max(8, month.amount / highestAmount) : 0.08;
    const x = cardWidth / 2 + index * (cardWidth + columnGap);
    const y = barVisualHeight - Math.max(18, percent * barVisualHeight);
    return { x, y, amount: month.amount };
  });
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y + 8}`).join(" ");

  return (
    <Box
      sx={{
        position: "relative",
        p: { xs: 1.5, sm: 2 },
        borderRadius: "18px",
        border: "1px solid rgba(186,214,245,0.9)",
        background:
          "linear-gradient(145deg, rgba(193,227,255,0.9) 0%, rgba(232,245,255,0.88) 38%, rgba(204,231,255,0.92) 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.96), 0 16px 30px rgba(46,117,182,0.08)",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(60deg, rgba(255,255,255,0.18) 10%, transparent 10%, transparent 42%, rgba(255,255,255,0.18) 42%, rgba(255,255,255,0.18) 52%, transparent 52%, transparent 76%, rgba(255,255,255,0.16) 76%)",
          opacity: 0.75,
          pointerEvents: "none",
        },
      }}
    >
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: "rgba(30,58,95,0.72)", textTransform: "uppercase", letterSpacing: 0.55 }}>
              Monthly Collections
            </Typography>
            <Typography sx={{ mt: 0.35, fontSize: "1rem", fontWeight: 900, color: "#0F172A" }}>
              Revenue overview
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.9 }}>
            <Chip
              label="Live"
              size="small"
              sx={{
                height: 24,
                backgroundColor: "rgba(30,58,95,0.94)",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: "0.68rem",
                boxShadow: "0 10px 24px rgba(30,58,95,0.18)",
                animation: "liveBadgePulse 2.1s ease-in-out infinite",
                "@keyframes liveBadgePulse": {
                  "0%": { transform: "translateY(0px)" },
                  "50%": { transform: "translateY(-1px)" },
                  "100%": { transform: "translateY(0px)" },
                },
              }}
            />
            {trend ? (
              <Typography sx={{ fontSize: "0.84rem", fontWeight: 900, color: trend.up ? C.green : C.red }}>
                {trend.up ? "+" : ""}{trend.pct}%
              </Typography>
            ) : null}
          </Box>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "56px minmax(0, 1fr)",
            gap: 1.2,
            minHeight: 320,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", py: 0.75 }}>
            {axisValues.map((value) => (
              <Typography key={value} sx={{ fontSize: "0.78rem", color: "rgba(30,58,95,0.72)", fontWeight: 800 }}>
                {value >= 1000 ? `${Math.round(value / 1000)}k` : value}
              </Typography>
            ))}
          </Box>

          <Box sx={{ position: "relative", minWidth: 0, overflowX: "auto" }}>
            <Box
              sx={{
                minWidth: chartInnerWidth,
                height: 320,
                display: "grid",
                gridTemplateColumns: `repeat(${Math.max(months.length, 1)}, ${cardWidth}px)`,
                justifyContent: "center",
                alignItems: "stretch",
                gap: `${columnGap}px`,
                position: "relative",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  gridTemplateRows: `repeat(${gridSteps + 1}, 1fr)`,
                  pointerEvents: "none",
                }}
              >
                {axisValues.map((value) => (
                  <Box
                    key={value}
                    sx={{
                      borderTop: "1px solid rgba(255,255,255,0.55)",
                    }}
                  />
                ))}
              </Box>

              <Box
                component="svg"
                viewBox={`0 0 ${chartInnerWidth} ${barVisualHeight + 26}`}
                sx={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 54,
                  height: barVisualHeight + 26,
                  width: "100%",
                  overflow: "visible",
                  pointerEvents: "none",
                }}
              >
                <defs>
                  <linearGradient id="liveTrendStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#60A5FA" />
                    <stop offset="100%" stopColor="#1E3A5F" />
                  </linearGradient>
                  <filter id="liveTrendGlow">
                    <feGaussianBlur stdDeviation="2.4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d={linePath}
                  fill="none"
                  stroke="url(#liveTrendStroke)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#liveTrendGlow)"
                  strokeDasharray="320"
                  strokeDashoffset="320"
                >
                  <animate attributeName="stroke-dashoffset" from="320" to="0" dur="1.25s" fill="freeze" />
                </path>
                {points.map((point, index) => {
                  const isLatest = index === points.length - 1;
                  return (
                    <g key={index}>
                      <circle cx={point.x} cy={point.y + 8} r={isLatest ? 6 : 4.5} fill={isLatest ? "#2563EB" : "#1E3A5F"} stroke="#FFFFFF" strokeWidth="2.4" />
                      {isLatest ? (
                        <circle cx={point.x} cy={point.y + 8} r="10" fill="none" stroke="#60A5FA" strokeWidth="2" opacity="0.6">
                          <animate attributeName="r" values="8;16;8" dur="2.1s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.6;0.08;0.6" dur="2.1s" repeatCount="indefinite" />
                        </circle>
                      ) : null}
                    </g>
                  );
                })}
              </Box>

              {months.map((month, index) => {
                const percent = highestAmount > 0 ? Math.max(8, (month.amount / highestAmount) * 100) : 8;
                const isLatest = index === months.length - 1;
                const isPeak = month.amount === highestAmount;
                const previous = index > 0 ? months[index - 1].amount : null;
                const delta = previous !== null ? month.amount - previous : null;

                return (
                  <Box
                    key={month.name}
                    sx={{
                      flex: 1,
                      minWidth: 72,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      alignItems: "center",
                      position: "relative",
                      pt: 0.25,
                    }}
                  >
                    <Typography sx={{ fontSize: "0.9rem", fontWeight: 900, color: "#1E3A5F", mb: 0.5 }}>
                      {fmt(month.amount).replace("Rs.", "")}
                    </Typography>

                    <Box
                      sx={{
                        flex: 1,
                        width: "100%",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        pb: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: { xs: 40, sm: 48 },
                          height: `${Math.max(percent, 14)}%`,
                          minHeight: 28,
                          borderRadius: "12px 12px 0 0",
                          background: isLatest
                            ? "linear-gradient(180deg, #7EB6FF 0%, #4E7FDC 54%, #263F90 100%)"
                            : isPeak
                              ? "linear-gradient(180deg, #8EBEFF 0%, #5B88E0 54%, #2B4292 100%)"
                              : "linear-gradient(180deg, #94C1FF 0%, #628EDB 54%, #304A9A 100%)",
                          boxShadow: isLatest
                            ? "0 0 20px rgba(96,165,250,0.18), 0 14px 24px rgba(46,117,182,0.16)"
                            : isPeak
                              ? "0 0 14px rgba(93,138,226,0.14), 0 12px 20px rgba(39,59,138,0.14)"
                              : "0 10px 18px rgba(46,117,182,0.16)",
                          position: "relative",
                          transformOrigin: "bottom",
                          overflow: "hidden",
                          animation: `${isLatest ? `barLive${index}` : `barRise${index}`} ${isLatest ? "1600ms" : "1100ms"} ${isLatest ? "cubic-bezier(0.22, 1, 0.36, 1)" : "ease-out"}, ${`barFloat${index} 3.8s ease-in-out ${1.2 + index * 0.18}s infinite`}, ${isPeak ? `barGlow${index} 4.2s ease-in-out ${1.4 + index * 0.12}s infinite` : `barGlowSoft${index} 5.2s ease-in-out ${1.1 + index * 0.14}s infinite`}`,
                          [`@keyframes barRise${index}`]: {
                            "0%": { transform: "scaleY(0.05) translateY(8px)", opacity: 0.18 },
                            "60%": { transform: "scaleY(1.04) translateY(-2px)", opacity: 1 },
                            "100%": { transform: "scaleY(1) translateY(0)", opacity: 1 },
                          },
                          [`@keyframes barLive${index}`]: {
                            "0%": { transform: "scaleY(0.05) translateY(10px)", opacity: 0.12 },
                            "55%": { transform: "scaleY(1.08) translateY(-3px)", opacity: 1 },
                            "72%": { transform: "scaleY(0.98) translateY(1px)", opacity: 1 },
                            "100%": { transform: "scaleY(1) translateY(0)", opacity: 1 },
                          },
                          [`@keyframes barFloat${index}`]: {
                            "0%": { transform: "scaleY(1) translateY(0px)" },
                            "50%": { transform: `scaleY(${isLatest ? 1.016 : 1.01}) translateY(${isLatest ? "-3px" : "-2px"})` },
                            "100%": { transform: "scaleY(1) translateY(0px)" },
                          },
                          [`@keyframes barGlow${index}`]: {
                            "0%": { boxShadow: "0 0 10px rgba(93,138,226,0.10), 0 12px 20px rgba(39,59,138,0.12)" },
                            "50%": { boxShadow: "0 0 18px rgba(93,138,226,0.18), 0 14px 24px rgba(39,59,138,0.16)" },
                            "100%": { boxShadow: "0 0 10px rgba(93,138,226,0.10), 0 12px 20px rgba(39,59,138,0.12)" },
                          },
                          [`@keyframes barGlowSoft${index}`]: {
                            "0%": { boxShadow: "0 8px 18px rgba(46,117,182,0.12)" },
                            "50%": { boxShadow: "0 0 12px rgba(96,165,250,0.12), 0 10px 20px rgba(46,117,182,0.16)" },
                            "100%": { boxShadow: "0 8px 18px rgba(46,117,182,0.12)" },
                          },
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            left: "10%",
                            width: "80%",
                            height: "10%",
                            borderRadius: "10px 10px 999px 999px",
                            background: "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.02) 100%)",
                          },
                          "&::after": {
                            content: '""',
                            position: "absolute",
                            inset: 0,
                            background: isLatest
                              ? "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.02) 28%, rgba(255,255,255,0.18) 46%, rgba(255,255,255,0.02) 64%, transparent 100%)"
                              : "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.01) 34%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.01) 66%, transparent 100%)",
                            transform: "translateX(-135%)",
                            animation: `${`barSweep${index} ${isLatest ? "2.6s" : "4.8s"} ease-in-out ${0.6 + index * 0.15}s infinite`}`,
                          },
                          [`@keyframes barSweep${index}`]: {
                            "0%": { transform: "translateX(-135%)" },
                            "100%": { transform: "translateX(135%)" },
                          },
                        }}
                      >
                        {isLatest ? (
                          <Box
                            sx={{
                              position: "absolute",
                              top: -18,
                              left: "50%",
                              width: 12,
                              height: 12,
                              borderRadius: "999px",
                              backgroundColor: "#2563EB",
                              transform: "translateX(-50%)",
                              boxShadow: "0 0 0 4px rgba(255,255,255,0.9)",
                              "&::after": {
                                content: '""',
                                position: "absolute",
                                inset: -8,
                                borderRadius: "999px",
                                border: "2px solid rgba(96,165,250,0.55)",
                                animation: "livePulseRing 2s ease-in-out infinite",
                              },
                              "@keyframes livePulseRing": {
                                "0%": { transform: "scale(0.85)", opacity: 0.8 },
                                "100%": { transform: "scale(1.8)", opacity: 0 },
                              },
                            }}
                          />
                        ) : null}
                      </Box>
                    </Box>

                    <Typography sx={{ mt: 0.4, fontSize: "0.8rem", fontWeight: 800, color: C.slate }}>
                      {month.name}
                    </Typography>
                    <Box sx={{ mt: 0.25, display: "flex", alignItems: "center", gap: 0.3, minHeight: 18 }}>
                      {delta !== null ? (
                        <NorthEastOutlined sx={{ fontSize: 13, color: delta >= 0 ? C.green : C.red, transform: delta >= 0 ? "none" : "rotate(90deg)" }} />
                      ) : null}
                      <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: delta === null ? C.muted : delta >= 0 ? C.green : C.red }}>
                        {delta === null ? "Start" : `${delta >= 0 ? "+" : "-"}${fmt(Math.abs(delta)).replace("Rs.", "")}`}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function UtilizationBar({
  label,
  value,
  percent,
  color,
  helper,
}: {
  label: string;
  value: number;
  percent: number;
  color: string;
  helper: string;
}) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.45 }}>
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: C.slate }} noWrap>
          {label}
        </Typography>
        <Typography sx={{ fontSize: "0.76rem", color: C.muted, fontWeight: 800, flexShrink: 0 }}>
          {value} ({percent}%)
        </Typography>
      </Box>
      <Box sx={{ height: 8, borderRadius: "999px", backgroundColor: "#E2E8F0", overflow: "hidden" }}>
        <Box sx={{ height: "100%", width: `${percent}%`, borderRadius: "999px", backgroundColor: color }} />
      </Box>
      <Typography sx={{ mt: 0.4, fontSize: "0.72rem", color: C.muted, fontWeight: 600 }}>
        {helper}
      </Typography>
    </Box>
  );
}

function MemberTable({ members }: { members: Member[] }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: C.surface }}>
            {["Member", "Mobile", "Plan / Slot", "Renewal Date", "Payment Due"].map((h) => (
              <TableCell key={h} sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.slate, py: 1.2, px: 2, borderBottom: `1px solid ${C.border}` }}>
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {members.map((m) => (
            <TableRow key={m._id} sx={{ "&:last-child td": { border: 0 }, "&:hover": { backgroundColor: C.surface } }}>
              <TableCell sx={{ py: 1.2, px: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.84rem", color: "#0F172A" }}>{m.name}</Typography>
              </TableCell>
              <TableCell sx={{ py: 1.2, px: 2 }}>
                <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 600 }}>{m.mobile}</Typography>
              </TableCell>
              <TableCell sx={{ py: 1.2, px: 2 }}>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: C.slate }}>{m.planSnapshot.name}</Typography>
                <Typography sx={{ mt: 0.15, fontSize: "0.72rem", color: C.muted, fontWeight: 600 }}>{m.slotSnapshot.label}</Typography>
              </TableCell>
              <TableCell sx={{ py: 1.2, px: 2 }}>
                <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 600 }}>{fmtDate(m.endDate)}</Typography>
              </TableCell>
              <TableCell sx={{ py: 1.2, px: 2 }}>
                <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: m.pendingAmount > 0 ? C.red : C.green }}>
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
            {type === "expiring" ? `${data?.expiryAlerts.length ?? 0} members` : isLoadingMembers ? "Loading..." : `${members.length} members`}
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
            <MemberTable
              members={data.expiryAlerts.map((member) => ({
                _id: member.memberId,
                businessId: "",
                name: member.name,
                mobile: member.mobile,
                planSnapshot: { planId: "", name: member.planName, durationDays: 0, basePrice: 0 },
                slotSnapshot: { slotId: "", label: member.slotLabel, startTime: "", endTime: "" },
                startDate: "",
                endDate: member.endDate,
                finalPrice: 0,
                payments: [],
                isDeleted: false,
                status: "expiring_soon",
                paidAmount: 0,
                pendingAmount: member.pendingAmount,
                createdAt: "",
                updatedAt: "",
              } as Member))}
            />
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
        payments: m.paymentCount,
      })),
    [monthly],
  );

  const trend = useMemo(() => {
    if (chartData.length < 2) return null;
    const last = chartData[chartData.length - 1].amount;
    const previous = chartData[chartData.length - 2].amount;
    if (previous === 0) return null;
    const pct = Math.round(((last - previous) / previous) * 100);
    return { pct, up: pct >= 0 };
  }, [chartData]);

  const latestMonth = chartData[chartData.length - 1];
  const highestMonth = chartData.reduce<{ name: string; amount: number } | null>(
    (best, entry) => (!best || entry.amount > best.amount ? { name: entry.name, amount: entry.amount } : best),
    null,
  );
  const averageRevenue = chartData.length
    ? Math.round(chartData.reduce((sum, entry) => sum + entry.amount, 0) / chartData.length)
    : 0;
  const lowestMonth = chartData.reduce<{ name: string; amount: number } | null>(
    (worst, entry) => (!worst || entry.amount < worst.amount ? { name: entry.name, amount: entry.amount } : worst),
    null,
  );
  const latestRevenue = latestMonth?.amount ?? 0;
  const highestAmount = chartData.length ? Math.max(...chartData.map((entry) => entry.amount), 0) : 0;

  const totalSlotMembers = data?.slotActivity.reduce((sum, slot) => sum + slot.count, 0) ?? 0;
  const totalPlanMembers = plans.reduce((sum, plan) => sum + plan.memberCount, 0);

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Grid container spacing={1.5}>
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
            label: "Renewal Due",
            helper: "Need follow-up soon",
            value: data?.memberCounts.expiringSoon ?? 0,
            accentColor: C.orange,
            icon: <ScheduleOutlined sx={{ fontSize: 20 }} />,
            modal: "expiring" as ModalType,
          },
          {
            label: "Expired",
            helper: "Already overdue",
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
        <Grid item xs={12} xl={8}>
          <SectionCard title="Business Pulse" subtitle="Collections, dues, renewals, and what needs attention now.">
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6} lg={3}>
                {isLoading ? <Skeleton variant="rounded" height={94} sx={{ borderRadius: "14px" }} /> : <PulseMetric label="Collections" value={fmt(data?.revenue.totalRevenue ?? 0)} helper="Recorded payments so far" tone="success" />}
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                {isLoading ? <Skeleton variant="rounded" height={94} sx={{ borderRadius: "14px" }} /> : <PulseMetric label="Payment Due" value={fmt(data?.revenue.totalPending ?? 0)} helper="Amount still to collect" tone={(data?.revenue.totalPending ?? 0) > 0 ? "danger" : "success"} />}
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                {isLoading ? <Skeleton variant="rounded" height={94} sx={{ borderRadius: "14px" }} /> : <PulseMetric label="Renewals Due" value={String(data?.expiryAlerts.length ?? 0)} helper="Members inside the alert window" tone={(data?.expiryAlerts.length ?? 0) > 0 ? "warning" : "success"} />}
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                {isLoading ? <Skeleton variant="rounded" height={94} sx={{ borderRadius: "14px" }} /> : <PulseMetric label="Top Plan" value={plans[0]?.planName || "No data"} helper={plans[0] ? `${plans[0].memberCount} members on this plan` : "Appears once plans are in use"} />}
              </Grid>
            </Grid>

            <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={6}>
                {isLoading ? (
                  <Skeleton variant="rounded" height={146} sx={{ borderRadius: "14px" }} />
                ) : (
                  <Box sx={{ p: 1.6, borderRadius: "14px", border: `1px solid ${C.border}`, backgroundColor: C.surface, height: "100%" }}>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: C.slate }}>
                      What needs attention first
                    </Typography>
                    <Box sx={{ mt: 1.1, display: "flex", flexDirection: "column", gap: 0.9 }}>
                      <ActionLine label="Pending collections" value={fmt(data?.revenue.totalPending ?? 0)} helper="Outstanding amount waiting to be collected." tone={(data?.revenue.totalPending ?? 0) > 0 ? "danger" : "success"} />
                      <ActionLine label="Renewals to call" value={String(data?.expiryAlerts.length ?? 0)} helper="Members who need follow-up before expiry." tone={(data?.expiryAlerts.length ?? 0) > 0 ? "warning" : "success"} />
                      <ActionLine label="Expired memberships" value={String(data?.memberCounts.expired ?? 0)} helper="Members whose membership has already lapsed." tone={(data?.memberCounts.expired ?? 0) > 0 ? "danger" : "default"} />
                    </Box>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                {isLoading ? (
                  <Skeleton variant="rounded" height={146} sx={{ borderRadius: "14px" }} />
                ) : (
                  <Box sx={{ p: 1.6, borderRadius: "14px", border: `1px solid ${C.border}`, backgroundColor: "#FFFFFF", height: "100%" }}>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: C.slate }}>
                      Revenue context
                    </Typography>
                    <Grid container spacing={1.1} sx={{ mt: 0.2 }}>
                      <Grid item xs={12} sm={4}>
                        <PulseMetric label="Latest Month" value={latestMonth ? fmt(latestMonth.amount) : "Rs.0"} helper={latestMonth ? `${latestMonth.name} collections` : "Waiting for payment data"} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <PulseMetric label="Best Month" value={highestMonth ? fmt(highestMonth.amount) : "Rs.0"} helper={highestMonth ? highestMonth.name : "Waiting for payment data"} tone="success" />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <PulseMetric label="Monthly Average" value={fmt(averageRevenue)} helper="Average recorded collections" />
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Grid>
            </Grid>
          </SectionCard>
        </Grid>

        <Grid item xs={12} xl={4}>
          <SectionCard title="Utilization" subtitle="Which plans and slots are carrying the load.">
            {isLoading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.1 }}>
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} height={52} sx={{ borderRadius: "10px" }} />
                ))}
              </Box>
            ) : !plans.length && !data?.slotActivity.length ? (
              <EmptyState title="No usage data yet" subtitle="Plan and slot usage appears once members are assigned." />
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: "0.76rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.55 }}>
                    Plans
                  </Typography>
                  <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1.1 }}>
                    {plans.slice(0, 4).map((plan, index) => {
                      const percent = totalPlanMembers > 0 ? Math.round((plan.memberCount / totalPlanMembers) * 100) : 0;
                      return (
                        <UtilizationBar
                          key={plan.planId}
                          label={plan.planName}
                          value={plan.memberCount}
                          percent={percent}
                          color={[C.navy, C.blue, C.green, C.orange][index % 4]}
                          helper={percent > 0 ? `${percent}% of active plan assignments` : "No members on this plan"}
                        />
                      );
                    })}
                  </Box>
                </Box>

                <Box sx={{ pt: 1.25, borderTop: `1px solid ${C.border}` }}>
                  <Typography sx={{ fontSize: "0.76rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.55 }}>
                    Slots
                  </Typography>
                  <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1.1 }}>
                    {[...(data?.slotActivity || [])]
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 4)
                      .map((slot, index) => {
                        const percent = totalSlotMembers > 0 ? Math.round((slot.count / totalSlotMembers) * 100) : 0;
                        return (
                          <UtilizationBar
                            key={slot.label}
                            label={slot.label}
                            value={slot.count}
                            percent={percent}
                            color={[C.orange, C.blue, C.green, C.navy][index % 4]}
                            helper={percent > 0 ? `${percent}% of slot usage` : "No members in this slot"}
                          />
                        );
                      })}
                  </Box>
                </Box>
              </Box>
            )}
          </SectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <SectionCard
            title="Collections Trend"
            subtitle="Monthly payment totals with quick context."
            action={
              trend ? (
                <Chip
                  icon={trend.up ? <TrendingUpOutlined /> : <TrendingDownOutlined />}
                  label={`${trend.up ? "+" : ""}${trend.pct}% vs previous`}
                  size="small"
                  sx={{
                    backgroundColor: trend.up ? "#F0FDF4" : "#FEF2F2",
                    color: trend.up ? C.green : C.red,
                    border: trend.up ? "1px solid #BBF7D0" : "1px solid #FECACA",
                    "& .MuiChip-icon": { color: "inherit" },
                  }}
                />
              ) : null
            }
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {!isLoading && chartData.length > 0 ? (
                <Grid container spacing={1.2}>
                  <Grid item xs={12} md={8}>
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={4}>
                        <MetricStrip label="Latest Month" value={latestMonth ? `${latestMonth.name} | ${fmt(latestRevenue)}` : "No data"} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <MetricStrip label="Best Month" value={highestMonth ? `${highestMonth.name} | ${fmt(highestMonth.amount)}` : "No data"} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <MetricStrip label="Lowest Month" value={lowestMonth ? `${lowestMonth.name} | ${fmt(lowestMonth.amount)}` : "No data"} />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <SparklinePanel data={chartData} trend={trend} />
                  </Grid>
                </Grid>
              ) : null}

              {isLoading ? (
                <Skeleton variant="rectangular" height={320} sx={{ borderRadius: "18px" }} />
              ) : chartData.length === 0 ? (
                <EmptyState title="No payment data yet" subtitle="The trend appears once payments start getting recorded." icon={<WarningAmberOutlined sx={{ fontSize: 26 }} />} />
              ) : (
                <RevenueTimeline data={chartData} trend={trend} highestAmount={highestAmount} />
              )}
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={5}>
          <SectionCard title="Renewal Queue" subtitle="Members who need renewal follow-up soon.">
            {isLoading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} height={42} sx={{ borderRadius: "8px" }} />
                ))}
              </Box>
            ) : !data?.expiryAlerts.length ? (
              <EmptyState title="No members expiring soon" subtitle="This queue fills in when members enter the alert window." />
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.9 }}>
                {data.expiryAlerts.slice(0, 5).map((member) => (
                  <Box
                    key={member.memberId}
                    sx={{
                      p: 1.35,
                      borderRadius: "12px",
                      border: `1px solid ${C.border}`,
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: "#0F172A" }}>
                          {member.name}
                        </Typography>
                        <Typography sx={{ mt: 0.2, fontSize: "0.74rem", color: C.muted, fontWeight: 600 }}>
                          {member.planName} | {member.slotLabel}
                        </Typography>
                      </Box>
                      <Chip label={fmtDate(member.endDate)} size="small" sx={{ height: 24, fontSize: "0.7rem", fontWeight: 700, backgroundColor: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }} />
                    </Box>
                    <Box sx={{ mt: 0.9, display: "flex", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
                      <Typography sx={{ fontSize: "0.75rem", color: C.muted, fontWeight: 600 }}>
                        {member.mobile}
                      </Typography>
                      <Typography sx={{ fontSize: "0.76rem", fontWeight: 800, color: member.pendingAmount > 0 ? C.red : C.green }}>
                        {member.pendingAmount > 0 ? `${fmt(member.pendingAmount)} due` : "Paid"}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </SectionCard>
        </Grid>
      </Grid>

      <DetailModal open={activeModal !== null} type={activeModal} data={data} onClose={() => setActiveModal(null)} />
    </Box>
  );
}
