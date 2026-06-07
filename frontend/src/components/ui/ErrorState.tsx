import { Box, Typography, Button } from "@mui/material";
import { ErrorOutlineOutlined, RefreshOutlined } from "@mui/icons-material";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = "Something went wrong. Please try again.",
  onRetry,
}: ErrorStateProps) {
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
          backgroundColor: "#FEF2F2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#DC2626",
          mb: 1,
        }}
      >
        <ErrorOutlineOutlined sx={{ fontSize: 28 }} />
      </Box>

      <Typography
        sx={{ fontWeight: 800, fontSize: "0.98rem", color: "#334155" }}
      >
        Failed to load data
      </Typography>

      <Typography
        sx={{
          fontSize: "0.82rem",
          color: "#64748B",
          fontWeight: 500,
          maxWidth: 340,
          lineHeight: 1.6,
        }}
      >
        {message}
      </Typography>

      {onRetry && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshOutlined />}
          onClick={onRetry}
          sx={{ mt: 1.5, px: 1.5 }}
        >
          Try Again
        </Button>
      )}
    </Box>
  );
}
