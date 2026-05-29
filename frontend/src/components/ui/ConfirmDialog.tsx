import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: "error" | "primary" | "warning";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  confirmColor = "error",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: "1rem",
          color: "#111827",
          pt: 2.5,
          pb: 1,
          px: 3,
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 1 }}>
        <DialogContentText
          sx={{
            fontSize: "0.88rem",
            color: "#4B5563",
            fontWeight: 500,
            lineHeight: 1.6,
          }}
        >
          {message}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
        <Button
          onClick={onCancel}
          disabled={isLoading}
          color="inherit"
          sx={{ fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmColor}
          variant="contained"
          disabled={isLoading}
          sx={{ fontWeight: 600, borderRadius: "8px", minWidth: 100 }}
        >
          {isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            confirmLabel
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}