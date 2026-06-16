"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
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
  KeyboardArrowDownRounded,
  KeyboardArrowUpRounded,
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
import {
  MODULE_CARD_SX,
  MODULE_COLORS,
  MODULE_DIALOG_PAPER_SX,
  MODULE_DIALOG_TITLE_SX,
  MODULE_NEUTRAL_CHIP_SX,
  MODULE_PAGE_SX,
  MODULE_SUCCESS_CHIP_SX,
  MODULE_TABLE_CONTAINER_SX,
  MODULE_TABLE_HEAD_CELL_SX,
  MODULE_TABLE_ROW_SX,
  MODULE_WARNING_CHIP_SX,
} from "@/components/ui/moduleStyles";
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
  navy: MODULE_COLORS.ink,
  blue: MODULE_COLORS.accent,
  green: MODULE_COLORS.green,
  orange: MODULE_COLORS.amber,
  red: MODULE_COLORS.red,
  slate: MODULE_COLORS.slate,
  muted: MODULE_COLORS.muted,
  border: MODULE_COLORS.border,
  surface: MODULE_COLORS.surface,
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
        ...MODULE_CARD_SX,
        borderRadius: "14px",
        cursor: "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: "0 18px 30px rgba(36,58,87,0.1)",
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
          background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,242,235,0.94) 100%)",
          border: `1px solid ${C.border}`,
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
  sectionId,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  sectionId?: string;
  children: React.ReactNode;
}) {
  return (
    <Paper id={sectionId} elevation={0} sx={{ ...MODULE_CARD_SX, borderRadius: "16px", overflow: "hidden", scrollMarginTop: "92px" }}>
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
            <Typography sx={{ mt: 0.45, fontSize: "0.82rem", color: C.slate, fontWeight: 600 }}>
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

function SectionJumpLink({
  label,
  onClick,
  direction = "down",
}: {
  label: string;
  onClick: () => void;
  direction?: "up" | "down";
}) {
  return (
    <Button
      size="small"
      onClick={onClick}
      endIcon={
        direction === "down" ? (
          <KeyboardArrowDownRounded sx={{ fontSize: 18 }} />
        ) : (
          <KeyboardArrowUpRounded sx={{ fontSize: 18 }} />
        )
      }
      sx={{
        minWidth: "auto",
        px: 0.4,
        py: 0.2,
        color: C.slate,
        fontSize: "0.78rem",
        fontWeight: 800,
        textTransform: "none",
        borderRadius: "8px",
        whiteSpace: "nowrap",
        textDecoration: "underline",
        textUnderlineOffset: "0.18em",
        textDecorationColor: "rgba(30,58,95,0.32)",
        "&:hover": {
          backgroundColor: "rgba(255,255,255,0.5)",
          color: C.blue,
          textDecorationColor: C.blue,
        },
        "& .MuiButton-endIcon": {
          ml: 0.15,
        },
      }}
    >
      {label}
    </Button>
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
      ? { bg: "#F4FAF5", border: "#C9DFCF", color: C.green }
      : tone === "warning"
        ? { bg: "#FCF4E9", border: "#E2CCAF", color: C.orange }
        : tone === "danger"
          ? { bg: "#FBEFEA", border: "#E8C9BF", color: C.red }
          : { bg: "#FBF7F1", border: "#D9CCBB", color: C.navy };

  return (
    <Paper elevation={0} sx={{ p: 1.45, borderRadius: "14px", border: `1px solid ${styles.border}`, background: `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, ${styles.bg} 100%)`, height: "100%", boxShadow: "0 10px 20px rgba(36,58,87,0.05)" }}>
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
        background: "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(253,250,246,0.98) 100%)",
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
        background: "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(252,248,243,0.96) 100%)",
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
        border: `1px solid ${C.border}`,
        background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(253,250,246,0.96) 100%)",
        boxShadow: "0 14px 28px rgba(36,58,87,0.07)",
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
  animateIn,
}: {
  data: { name: string; amount: number; payments: number }[];
  trend: { pct: number; up: boolean } | null;
  highestAmount: number;
  animateIn: boolean;
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
        border: `1px solid ${C.border}`,
        background: "#FFFFFF",
        boxShadow: "0 12px 22px rgba(36,58,87,0.04)",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(246,249,253,0.88) 0%, rgba(255,255,255,0) 24%)",
          opacity: 0.7,
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
                      borderTop: "1px solid rgba(217,226,238,0.82)",
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
                    <feGaussianBlur stdDeviation="1.1" result="blur" />
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
                  strokeDashoffset={animateIn ? "0" : "320"}
                  style={{ transition: "stroke-dashoffset 1.25s ease" }}
                />
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
                          width: { xs: 30, sm: 34 },
                          height: animateIn ? `${Math.max(percent, 14)}%` : "0%",
                          minHeight: 28,
                          borderRadius: "4px 4px 0 0",
                          background: isLatest
                            ? "linear-gradient(180deg, #78AEFF 0%, #4F82D8 42%, #2F58A9 76%, #203B77 100%)"
                            : isPeak
                              ? "linear-gradient(180deg, #86B5FF 0%, #648FDC 42%, #3D66B4 76%, #294687 100%)"
                              : "linear-gradient(180deg, #97BAF1 0%, #7399D4 44%, #4C71B5 78%, #34508E 100%)",
                          boxShadow: isLatest
                            ? "0 8px 18px rgba(35,61,124,0.12)"
                            : isPeak
                              ? "0 7px 16px rgba(41,70,135,0.1)"
                              : "0 6px 12px rgba(49,77,139,0.08)",
                          borderLeft: "1px solid rgba(255,255,255,0.16)",
                          borderRight: "1px solid rgba(19,42,93,0.08)",
                          position: "relative",
                          transformOrigin: "bottom",
                          overflow: "hidden",
                          transition: "height 1.05s cubic-bezier(0.22, 1, 0.36, 1)",
                          transitionDelay: `${index * 120}ms`,
                          animation: animateIn
                            ? `${isLatest ? `barLive${index}` : `barRise${index}`} ${isLatest ? "1600ms" : "1100ms"} ${isLatest ? "cubic-bezier(0.22, 1, 0.36, 1)" : "ease-out"}, ${`barFloat${index} 5.4s ease-in-out ${1.4 + index * 0.18}s infinite`}, ${isPeak ? `barGlow${index} 6s ease-in-out ${1.6 + index * 0.12}s infinite` : `barGlowSoft${index} 7.2s ease-in-out ${1.4 + index * 0.14}s infinite`}`
                            : "none",
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
                            "50%": { transform: `scaleY(${isLatest ? 1.008 : 1.005}) translateY(${isLatest ? "-1.5px" : "-1px"})` },
                            "100%": { transform: "scaleY(1) translateY(0px)" },
                          },
                          [`@keyframes barGlow${index}`]: {
                            "0%": { boxShadow: "0 7px 16px rgba(41,70,135,0.1)" },
                            "50%": { boxShadow: "0 8px 18px rgba(41,70,135,0.12)" },
                            "100%": { boxShadow: "0 7px 16px rgba(41,70,135,0.1)" },
                          },
                          [`@keyframes barGlowSoft${index}`]: {
                            "0%": { boxShadow: "0 6px 12px rgba(49,77,139,0.08)" },
                            "50%": { boxShadow: "0 7px 14px rgba(49,77,139,0.1)" },
                            "100%": { boxShadow: "0 6px 12px rgba(49,77,139,0.08)" },
                          },
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 3,
                            background: "rgba(255,255,255,0.32)",
                          },
                          "&::after": {
                            content: '""',
                            position: "absolute",
                            inset: 0,
                            background: isLatest
                              ? "linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 18%, transparent 18%, transparent 100%)"
                              : "linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.015) 16%, transparent 16%, transparent 100%)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            position: "absolute",
                            top: 8,
                            left: "50%",
                            width: "46%",
                            height: 2,
                            borderRadius: "999px",
                            transform: "translateX(-50%)",
                            backgroundColor: isLatest ? "rgba(255,255,255,0.42)" : "rgba(255,255,255,0.28)",
                          }}
                        />
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
  animateIn,
}: {
  label: string;
  value: number;
  percent: number;
  color: string;
  helper: string;
  animateIn: boolean;
}) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.28 }}>
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: C.slate }} noWrap>
          {label}
        </Typography>
        <Typography sx={{ fontSize: "0.76rem", color: C.muted, fontWeight: 800, flexShrink: 0 }}>
          {value} ({percent}%)
        </Typography>
      </Box>
      <Box sx={{ height: 8, borderRadius: "999px", backgroundColor: "#E2E8F0", overflow: "hidden" }}>
        <Box
          sx={{
            height: "100%",
            width: animateIn ? `${percent}%` : "0%",
            borderRadius: "999px",
            backgroundColor: color,
            transition: "width 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </Box>
      <Typography sx={{ mt: 0.22, fontSize: "0.7rem", color: C.muted, fontWeight: 600, lineHeight: 1.25 }}>
        {helper}
      </Typography>
    </Box>
  );
}

function MemberTable({ members }: { members: Member[] }) {
  return (
    <TableContainer sx={MODULE_TABLE_CONTAINER_SX}>
      <Table size="small" sx={{ minWidth: { xs: 760, md: 0 } }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: C.surface }}>
            {["Member", "Mobile", "Plan / Slot", "Renewal Date", "Payment Due"].map((h) => (
              <TableCell key={h} sx={{ ...MODULE_TABLE_HEAD_CELL_SX, py: 1.2, px: 2 }}>
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {members.map((m) => (
            <TableRow key={m._id} sx={{ ...MODULE_TABLE_ROW_SX, "&:last-child td": { border: 0 } }}>
              <TableCell sx={{ py: 1.2, px: 2 }}>
                <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: C.navy }}>{m.name}</Typography>
              </TableCell>
              <TableCell sx={{ py: 1.2, px: 2 }}>
                <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 600 }}>{m.mobile}</Typography>
              </TableCell>
              <TableCell sx={{ py: 1.2, px: 2 }}>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: C.slate }}>{m.planSnapshot.name}</Typography>
                <Typography sx={{ mt: 0.15, fontSize: "0.72rem", color: C.muted, fontWeight: 600 }}>{m.slotSnapshot.label}</Typography>
              </TableCell>
              <TableCell sx={{ py: 1.2, px: 2 }}>
                <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 600 }}>
                  {m.status === "ended" ? "Not Applicable" : fmtDate(m.endDate)}
                </Typography>
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
        if (type === "total") {
          const response = await membersApi.getAll({ page: 1, limit: 500 });
          setMembers(response.data || []);
        } else if (type === "active" || type === "expired") {
          const response = await membersApi.getAll({
            page: 1,
            limit: 500,
            status: type,
          });
          setMembers(response.data || []);
        }
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
    total: { title: "All Members", color: C.navy, badgeSx: MODULE_NEUTRAL_CHIP_SX },
    active: { title: "Active Members", color: C.green, badgeSx: MODULE_SUCCESS_CHIP_SX },
    expiring: { title: "Renewal Due Soon", color: C.orange, badgeSx: MODULE_WARNING_CHIP_SX },
    expired: { title: "Expired Members", color: C.red, badgeSx: { ...MODULE_WARNING_CHIP_SX, color: C.red, border: "1px solid #E8C9BF", backgroundColor: "#FBEFEA" } },
  };

  const { title, color, badgeSx } = configMap[type];

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
          ...MODULE_DIALOG_PAPER_SX,
          borderRadius: fullScreen ? 0 : "18px",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle sx={{ ...MODULE_DIALOG_TITLE_SX, display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(180deg, rgba(255,255,255,0.995) 0%, rgba(252,248,243,0.97) 100%)" }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1rem", color }}>{title}</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label={type === "expiring" ? `${data?.expiryAlerts.length ?? 0} members` : isLoadingMembers ? "Loading..." : `${members.length} members`}
            size="small"
            sx={badgeSx}
          />
          <IconButton size="small" onClick={onClose} sx={{ color: C.muted }}>
            <CloseOutlined fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.995) 0%, rgba(253,250,246,0.985) 100%)" }}>
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
          <Box sx={{ p: { xs: 1.5, sm: 2 }, display: "flex", flexDirection: "column", gap: 1 }}>
            <Skeleton variant="rounded" height={48} sx={{ borderRadius: "12px" }} />
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} variant="rounded" height={56} sx={{ borderRadius: "12px" }} />
            ))}
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
  const [animateInsights, setAnimateInsights] = useState(false);
  const [collectionsTrendVisible, setCollectionsTrendVisible] = useState(false);
  const collectionsTrendRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      setAnimateInsights(false);
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

  useEffect(() => {
    if (isLoading || error || !data) return;

    const frame = window.requestAnimationFrame(() => {
      setAnimateInsights(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isLoading, error, data]);

  useEffect(() => {
    if (isLoading || error || collectionsTrendVisible || !collectionsTrendRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        setCollectionsTrendVisible(true);
        observer.disconnect();
      },
      {
        threshold: 0.3,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    observer.observe(collectionsTrendRef.current);

    return () => observer.disconnect();
  }, [isLoading, error, collectionsTrendVisible]);

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

  const jumpToSection = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (!target) return;
    const headerOffset = 78;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: targetTop, behavior: "smooth" });
  };

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <Box sx={MODULE_PAGE_SX}>
      <Grid id="dashboard-overview" container spacing={1.5} sx={{ scrollMarginTop: "20px" }}>
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
          <SectionCard
            sectionId="business-pulse"
            title="Business Pulse"
            subtitle="Collections, pending dues, and renewal activity."
            action={<SectionJumpLink label="Collections Trend" direction="down" onClick={() => jumpToSection("collections-trend")} />}
          >
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
          <SectionCard title="Utilization">
            {isLoading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.1 }}>
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} height={52} sx={{ borderRadius: "10px" }} />
                ))}
              </Box>
            ) : !plans.length && !data?.slotActivity.length ? (
              <EmptyState title="No usage data yet" subtitle="Plan and slot usage appears once members are assigned." />
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.15 }}>
                <Box>
                  <Typography sx={{ fontSize: "0.76rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.55 }}>
                    Plans
                  </Typography>
                  <Box sx={{ mt: 0.8, display: "flex", flexDirection: "column", gap: 0.85 }}>
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
                          animateIn={animateInsights}
                        />
                      );
                    })}
                  </Box>
                </Box>

                <Box sx={{ pt: 1, borderTop: `1px solid ${C.border}` }}>
                  <Typography sx={{ fontSize: "0.76rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.55 }}>
                    Slots
                  </Typography>
                  <Box sx={{ mt: 0.8, display: "flex", flexDirection: "column", gap: 0.85 }}>
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
                            animateIn={animateInsights}
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
            sectionId="collections-trend"
            title="Collections Trend"
            subtitle="Monthly payment totals with quick context."
            action={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <SectionJumpLink label="Business Pulse" direction="up" onClick={() => jumpToSection("dashboard-overview")} />
                {trend ? (
                  <Chip
                    icon={trend.up ? <TrendingUpOutlined /> : <TrendingDownOutlined />}
                    label={`${trend.up ? "+" : ""}${trend.pct}% vs previous`}
                    size="small"
                    sx={{
                      ...(trend.up ? MODULE_SUCCESS_CHIP_SX : MODULE_WARNING_CHIP_SX),
                      "& .MuiChip-icon": { color: "inherit" },
                    }}
                  />
                ) : null}
              </Box>
            }
          >
            <Box ref={collectionsTrendRef} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
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
                <RevenueTimeline data={chartData} trend={trend} highestAmount={highestAmount} animateIn={collectionsTrendVisible} />
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
