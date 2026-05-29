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
        py: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 1,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "16px",
          backgroundColor: "#F1F5F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94A3B8",
          mb: 1,
        }}
      >
        {icon || <InboxOutlined sx={{ fontSize: 28 }} />}
      </Box>

      <Typography
        sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#374151" }}
      >
        {title}
      </Typography>

      {subtitle && (
        <Typography
          sx={{
            fontSize: "0.82rem",
            color: "#9CA3AF",
            fontWeight: 500,
            maxWidth: 320,
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
          sx={{ mt: 1.5, borderRadius: "8px" }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}