import { Box, Typography, Button } from "@mui/material";
import { InboxOutlined } from "@mui/icons-material";

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        py: 7,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 1.1,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "18px",
          backgroundColor: "#EFF6FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748B",
          mb: 1,
        }}
      >
        {icon || <InboxOutlined sx={{ fontSize: 28 }} />}
      </Box>

      <Typography
        sx={{ fontWeight: 800, fontSize: "0.98rem", color: "#334155" }}
      >
        {title}
      </Typography>

      {subtitle && (
        <Typography
          sx={{
            fontSize: "0.82rem",
            color: "#64748B",
            fontWeight: 500,
            maxWidth: 340,
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </Typography>
      )}

      {actionLabel && onAction && (
        <Button
          variant="contained"
          size="small"
          onClick={onAction}
          sx={{ mt: 1.5, px: 1.5 }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
