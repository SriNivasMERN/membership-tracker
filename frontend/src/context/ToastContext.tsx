"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Snackbar, Alert, AlertColor } from "@mui/material";

interface ToastContextValue {
  showToast: (message: string, severity?: AlertColor) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<AlertColor>("success");

  const showToast = useCallback(
    (msg: string, sev: AlertColor = "success") => {
      setMessage(msg);
      setSeverity(sev);
      setOpen(true);
    },
    []
  );

  const handleClose = (_: unknown, reason?: string) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={severity === "error" ? 5000 : 3000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity={severity}
          variant="filled"
          sx={{
            fontWeight: 600,
            fontSize: "0.85rem",
            borderRadius: "10px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            minWidth: 280,
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}