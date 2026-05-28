"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Skeleton,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  EditOutlined,
  DeleteOutlined,
  PowerSettingsNewOutlined,
} from "@mui/icons-material";
import { useToast } from "@/context/ToastContext";
import { slotsApi } from "@/lib/api/slots.api";
import { Slot, SlotFormData } from "@/types/slot.types";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PageHeader from "@/components/layout/PageHeader";

const EMPTY_FORM: SlotFormData = {
  label: "",
  startTime: "06:00",
  endTime: "08:00",
};

// ─── Slot Form Dialog ─────────────────────────────────────────────────────────

function SlotFormDialog({
  open,
  slot,
  onClose,
  onSaved,
}: {
  open: boolean;
  slot: Slot | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const isEdit = !!slot;

  const [form, setForm] = useState<SlotFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof SlotFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (slot) {
        setForm({ label: slot.label, startTime: slot.startTime, endTime: slot.endTime });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
      setApiError(null);
    }
  }, [open, slot]);

  const validate = (): boolean => {
    const e: Partial<Record<keyof SlotFormData, string>> = {};
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!form.label.trim() || form.label.trim().length < 2) e.label = "Label must be at least 2 characters";
    if (form.label.trim().length > 50) e.label = "Label cannot exceed 50 characters";
    if (!timeRegex.test(form.startTime)) e.startTime = "Must be HH:MM format (e.g. 06:00)";
    if (!timeRegex.test(form.endTime)) e.endTime = "Must be HH:MM format (e.g. 08:00)";
    if (!e.startTime && !e.endTime && form.startTime >= form.endTime) {
      e.endTime = "End time must be after start time";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setApiError(null);
    try {
      const payload = { label: form.label.trim(), startTime: form.startTime, endTime: form.endTime };
      if (isEdit && slot) {
        await slotsApi.update(slot._id, payload);
        showToast("Slot updated successfully");
      } else {
        await slotsApi.create(payload);
        showToast("Slot created successfully");
      }
      onSaved();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setApiError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof SlotFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ elevation: 0, sx: { borderRadius: "16px", border: "1px solid #E2E8F0" } }}
    >
      <DialogTitle sx={{ pb: 1, pt: 2.5, px: 3, fontWeight: 700, fontSize: "1rem", color: "#111827" }}>
        {isEdit ? "Edit Slot" : "Add New Slot"}
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 1 }}>
        {apiError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{apiError}</Alert>}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
          <TextField
            label="Slot Label"
            value={form.label}
            onChange={(e) => handleChange("label", e.target.value)}
            error={!!errors.label}
            helperText={errors.label || "e.g. Morning Batch, Evening Batch"}
            fullWidth
            autoFocus
          />
          <TextField
            label="Start Time"
            value={form.startTime}
            onChange={(e) => handleChange("startTime", e.target.value)}
            error={!!errors.startTime}
            helperText={errors.startTime || "24-hour format - e.g. 06:00"}
            fullWidth
            placeholder="06:00"
          />
          <TextField
            label="End Time"
            value={form.endTime}
            onChange={(e) => handleChange("endTime", e.target.value)}
            error={!!errors.endTime}
            helperText={errors.endTime || "24-hour format - e.g. 08:00"}
            fullWidth
            placeholder="08:00"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Slot"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SlotsPage() {
  const { showToast } = useToast();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"delete" | "toggle" | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  const fetchSlots = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await slotsApi.getAll();
      setSlots(response.data || []);
    } catch {
      setError("Failed to load slots. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const handleConfirm = async () => {
    if (!selectedSlot || !confirmAction) return;
    setIsActioning(true);
    try {
      if (confirmAction === "toggle") {
        await slotsApi.toggle(selectedSlot._id, selectedSlot.isActive);
        showToast(selectedSlot.isActive ? `${selectedSlot.label} deactivated` : `${selectedSlot.label} activated`);
      } else {
        await slotsApi.delete(selectedSlot._id);
        showToast(`${selectedSlot.label} deleted`);
      }
      setConfirmOpen(false);
      fetchSlots();
    } catch {
      showToast("Action failed. Please try again.", "error");
    } finally {
      setIsActioning(false);
    }
  };

  const activeSlots = slots.filter((s) => s.isActive).length;

  return (
    <Box>
      <PageHeader
        title="Slots"
        subtitle={isLoading ? "Loading..." : `${slots.length} slot${slots.length !== 1 ? "s" : ""} - ${activeSlots} active`}
        action={{ label: "Add Slot", onClick: () => { setEditingSlot(null); setFormOpen(true); } }}
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ borderRadius: "12px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                {["Slot Label", "Start Time", "End Time", "Status", "Actions"].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#6B7280", py: 1.5, borderBottom: "1px solid #E2E8F0" }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    {[1,2,3,4,5].map((j) => (
                      <TableCell key={j} sx={{ py: 2 }}><Skeleton height={20} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : slots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 8, textAlign: "center" }}>
                    <Typography sx={{ fontSize: "0.9rem", color: "#6B7280", fontWeight: 500, mb: 1 }}>
                      No slots created yet
                    </Typography>
                    <Typography sx={{ fontSize: "0.8rem", color: "#9CA3AF" }}>
                      Click Add Slot to create your first time slot
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                slots.map((slot) => (
                  <TableRow
                    key={slot._id}
                    sx={{ "&:last-child td": { border: 0 }, "&:hover": { backgroundColor: "#FAFAFA" }, opacity: slot.isActive ? 1 : 0.6 }}
                  >
                    <TableCell sx={{ py: 2 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: "0.88rem", color: "#111827" }}>
                        {slot.label}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography sx={{ fontSize: "0.85rem", color: "#374151", fontWeight: 500 }}>
                        {slot.startTime}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography sx={{ fontSize: "0.85rem", color: "#374151", fontWeight: 500 }}>
                        {slot.endTime}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Chip
                        label={slot.isActive ? "Active" : "Inactive"}
                        size="small"
                        sx={{
                          height: 24, fontSize: "0.72rem", fontWeight: 700,
                          backgroundColor: slot.isActive ? "#F0FDF4" : "#F9FAFB",
                          color: slot.isActive ? "#15803D" : "#6B7280",
                          border: `1px solid ${slot.isActive ? "#BBF7D0" : "#E5E7EB"}`,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="Edit slot">
                          <IconButton size="small" onClick={() => { setEditingSlot(slot); setFormOpen(true); }}
                            sx={{ color: "#6B7280", "&:hover": { color: "#1D4ED8", backgroundColor: "#EFF6FF" } }}>
                            <EditOutlined sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={slot.isActive ? "Deactivate" : "Activate"}>
                          <IconButton size="small" onClick={() => { setSelectedSlot(slot); setConfirmAction("toggle"); setConfirmOpen(true); }}
                            sx={{ color: "#6B7280", "&:hover": { color: slot.isActive ? "#B45309" : "#15803D", backgroundColor: slot.isActive ? "#FFFBEB" : "#F0FDF4" } }}>
                            <PowerSettingsNewOutlined sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete slot">
                          <IconButton size="small" onClick={() => { setSelectedSlot(slot); setConfirmAction("delete"); setConfirmOpen(true); }}
                            sx={{ color: "#6B7280", "&:hover": { color: "#DC2626", backgroundColor: "#FEF2F2" } }}>
                            <DeleteOutlined sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <SlotFormDialog open={formOpen} slot={editingSlot} onClose={() => setFormOpen(false)} onSaved={fetchSlots} />

      <ConfirmDialog
        open={confirmOpen}
        title={confirmAction === "delete" ? "Delete Slot" : selectedSlot?.isActive ? "Deactivate Slot" : "Activate Slot"}
        message={
          confirmAction === "delete"
            ? `Are you sure you want to delete "${selectedSlot?.label}"? This cannot be undone.`
            : selectedSlot?.isActive
            ? `Deactivating "${selectedSlot?.label}" will hide it from new member registration. Existing members are not affected.`
            : `Activating "${selectedSlot?.label}" will make it available for new member registration.`
        }
        confirmLabel={confirmAction === "delete" ? "Delete" : selectedSlot?.isActive ? "Deactivate" : "Activate"}
        confirmColor={confirmAction === "delete" ? "error" : "primary"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
        isLoading={isActioning}
      />
    </Box>
  );
}