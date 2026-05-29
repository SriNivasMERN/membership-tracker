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
        sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#374151" }}
      >
        Failed to load data
      </Typography>

      <Typography
        sx={{
          fontSize: "0.82rem",
          color: "#9CA3AF",
          fontWeight: 500,
          maxWidth: 320,
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
          sx={{ mt: 1.5, borderRadius: "8px" }}
        >
          Try Again
        </Button>
      )}
    </Box>
  );
}