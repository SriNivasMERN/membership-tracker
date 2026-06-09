"use client";

import { Paper, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export const MODULE_COLORS = {
  ink: "#243A57",
  slate: "#27405E",
  muted: "#2F4764",
  border: "#EEE6DB",
  surface: "#FDFBF8",
  surfaceSoft: "#FFFDFB",
  background:
    "radial-gradient(circle at top left, rgba(236,228,218,0.18) 0%, rgba(255,255,255,0) 34%), linear-gradient(180deg, rgba(254,251,248,0.995) 0%, rgba(250,246,241,0.96) 100%)",
  green: "#356548",
  amber: "#A36A2C",
  accent: "#355072",
  red: "#A13C32",
};

export const MODULE_PAGE_SX: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  gap: 2.25,
  p: { xs: 0.25, md: 0.5 },
  borderRadius: "24px",
  background: MODULE_COLORS.background,
};

export const MODULE_FIELD_SX: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    background: "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(254,252,249,0.985) 100%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
    border: "1px solid rgba(221,211,197,0.78)",
  },
  "& .MuiInputLabel-root": {
    fontWeight: 700,
    color: MODULE_COLORS.slate,
  },
  "& .MuiInputBase-input": {
    fontWeight: 600,
    color: MODULE_COLORS.ink,
  },
  "& .MuiFormHelperText-root": {
    fontWeight: 600,
    color: MODULE_COLORS.slate,
    opacity: 1,
    letterSpacing: 0,
    fontSize: "0.83rem",
  },
};

export const MODULE_CARD_SX: SxProps<Theme> = {
  borderRadius: "16px",
  border: `1px solid ${MODULE_COLORS.border}`,
  boxShadow: "0 16px 32px rgba(36,58,87,0.08)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.995) 0%, rgba(253,250,246,0.985) 100%)",
};

export const MODULE_DIALOG_PAPER_SX: SxProps<Theme> = {
  borderRadius: "18px",
  border: `1px solid ${MODULE_COLORS.border}`,
  boxShadow: "0 24px 44px rgba(36,58,87,0.14)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.996) 0%, rgba(253,250,246,0.988) 100%)",
};

export const MODULE_DIALOG_TITLE_SX: SxProps<Theme> = {
  px: 3,
  pt: 2.5,
  pb: 1.2,
  fontWeight: 800,
  fontSize: "1rem",
  color: MODULE_COLORS.ink,
  borderBottom: `1px solid ${MODULE_COLORS.border}`,
};

export const MODULE_DIALOG_CONTENT_SX: SxProps<Theme> = {
  px: 3,
  pb: 1.5,
};

export const MODULE_DIALOG_ACTIONS_SX: SxProps<Theme> = {
  px: 3,
  pb: 3,
  pt: 2,
  gap: 1,
  borderTop: `1px solid ${MODULE_COLORS.border}`,
};

export const MODULE_INLINE_PANEL_SX: SxProps<Theme> = {
  p: 1.5,
  borderRadius: "12px",
  border: `1px solid ${MODULE_COLORS.border}`,
  background: "linear-gradient(180deg, rgba(255,255,255,0.995) 0%, rgba(250,246,241,0.97) 100%)",
};

export const MODULE_TABLE_HEAD_CELL_SX: SxProps<Theme> = {
  fontWeight: 800,
  fontSize: "0.72rem",
  color: MODULE_COLORS.slate,
  py: 1.45,
  borderBottom: `1px solid ${MODULE_COLORS.border}`,
  letterSpacing: 0.4,
  textTransform: "uppercase",
};

export const MODULE_TABLE_ROW_SX: SxProps<Theme> = {
  "&:hover": {
    backgroundColor: "rgba(255,250,245,0.9)",
  },
};

export const MODULE_ACTION_ICON_SX: SxProps<Theme> = {
  color: "#667085",
  "&:hover": {
    color: MODULE_COLORS.ink,
    backgroundColor: "rgba(255,251,246,0.95)",
  },
};

export const MODULE_SUCCESS_CHIP_SX: SxProps<Theme> = {
  height: 26,
  fontSize: "0.72rem",
  fontWeight: 800,
  backgroundColor: "#F4FAF5",
  color: MODULE_COLORS.green,
  border: "1px solid #C9DFCF",
};

export const MODULE_NEUTRAL_CHIP_SX: SxProps<Theme> = {
  height: 26,
  fontSize: "0.72rem",
  fontWeight: 800,
  backgroundColor: "#FBF7F1",
  color: MODULE_COLORS.ink,
  border: "1px solid #DDD1C1",
};

export const MODULE_WARNING_CHIP_SX: SxProps<Theme> = {
  height: 26,
  fontSize: "0.72rem",
  fontWeight: 800,
  backgroundColor: "#FCF4E9",
  color: MODULE_COLORS.amber,
  border: "1px solid #E2CCAF",
};

export function ModuleSummaryStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
}) {
  const styles =
    tone === "success"
      ? {
          backgroundColor: "#F4FAF5",
          borderColor: "#C9DFCF",
          valueColor: MODULE_COLORS.green,
          labelColor: "#4A5A6E",
          shadow: "0 14px 28px rgba(53,101,72,0.08)",
        }
      : tone === "warning"
        ? {
            backgroundColor: "#FCF4E9",
            borderColor: "#E2CCAF",
            valueColor: MODULE_COLORS.amber,
            labelColor: "#4A5A6E",
            shadow: "0 14px 28px rgba(163,106,44,0.08)",
          }
        : {
            backgroundColor: "#FBF7F1",
            borderColor: "#D9CCBB",
            valueColor: MODULE_COLORS.ink,
            labelColor: "#4A5A6E",
            shadow: "0 14px 28px rgba(36,58,87,0.08)",
          };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.4,
        borderRadius: "14px",
        border: `1px solid ${styles.borderColor}`,
        background: `linear-gradient(180deg, rgba(255,255,255,0.96) 0%, ${styles.backgroundColor} 100%)`,
        minWidth: 132,
        boxShadow: styles.shadow,
      }}
    >
      <Typography
        sx={{
          fontSize: "0.71rem",
          fontWeight: 700,
          color: styles.labelColor,
          textTransform: "uppercase",
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 0.5,
          fontSize: "1.08rem",
          fontWeight: 800,
          color: styles.valueColor,
          lineHeight: 1.15,
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

export function ModuleInfoStrip({
  title,
  message,
  sx,
}: {
  title: string;
  message: string;
  sx?: SxProps<Theme>;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: "14px",
        border: "1px solid #DDD1C1",
        background: "linear-gradient(135deg, rgba(255,251,246,0.99) 0%, rgba(250,245,239,0.97) 100%)",
        boxShadow: "0 10px 18px rgba(36,58,87,0.06), inset 0 1px 0 rgba(255,255,255,0.86)",
        ...sx,
      }}
    >
      <Typography
        sx={{
          fontSize: "0.76rem",
          color: MODULE_COLORS.slate,
          fontWeight: 800,
          letterSpacing: 0.35,
          textTransform: "uppercase",
          mb: 0.45,
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.82rem",
          color: MODULE_COLORS.slate,
          fontWeight: 600,
          lineHeight: 1.55,
        }}
      >
        {message}
      </Typography>
    </Paper>
  );
}
