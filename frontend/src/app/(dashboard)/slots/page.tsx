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
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
  PowerSettingsNewOutlined,
} from "@mui/icons-material";
import { useToast } from "@/context/ToastContext";
import { slotsApi } from "@/lib/api/slots.api";
import { Slot, SlotFormData } from "@/types/slot.types";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import {
  MODULE_ACTION_ICON_SX,
  MODULE_CARD_SX,
  MODULE_COLORS,
  MODULE_DIALOG_ACTIONS_SX,
  MODULE_DIALOG_CONTENT_SX,
  MODULE_DIALOG_PAPER_SX,
  MODULE_DIALOG_TITLE_SX,
  MODULE_FIELD_SX,
  MODULE_NEUTRAL_CHIP_SX,
  MODULE_PAGE_SX,
  MODULE_SUCCESS_CHIP_SX,
  MODULE_TABLE_HEAD_CELL_SX,
  MODULE_TABLE_ROW_SX,
  ModuleSummaryStat,
} from "@/components/ui/moduleStyles";

const EMPTY_FORM: SlotFormData = {
  label: "",
  startTime: "06:00",
  endTime: "08:00",
};

const C = {
  navy: MODULE_COLORS.ink,
  slate: MODULE_COLORS.slate,
  muted: MODULE_COLORS.muted,
  border: MODULE_COLORS.border,
  surface: MODULE_COLORS.surface,
  green: MODULE_COLORS.green,
  amber: MODULE_COLORS.amber,
};

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
    if (!e.startTime && !e.endTime && form.startTime >= form.endTime) e.endTime = "End time must be after start time";

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
      PaperProps={{ elevation: 0, sx: MODULE_DIALOG_PAPER_SX }}
    >
      <DialogTitle sx={MODULE_DIALOG_TITLE_SX}>
        {isEdit ? "Edit Slot" : "Add New Slot"}
      </DialogTitle>

      <DialogContent sx={MODULE_DIALOG_CONTENT_SX}>
        {apiError ? <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{apiError}</Alert> : null}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
          <TextField
            label="Slot Label"
            value={form.label}
            onChange={(e) => handleChange("label", e.target.value)}
            error={!!errors.label}
            helperText={errors.label || "e.g. Morning Batch, Evening Batch"}
            fullWidth
            autoFocus
            sx={MODULE_FIELD_SX}
          />
          <TextField
            label="Start Time"
            value={form.startTime}
            onChange={(e) => handleChange("startTime", e.target.value)}
            error={!!errors.startTime}
            helperText={errors.startTime || "24-hour format - e.g. 06:00"}
            fullWidth
            placeholder="06:00"
            sx={MODULE_FIELD_SX}
          />
          <TextField
            label="End Time"
            value={form.endTime}
            onChange={(e) => handleChange("endTime", e.target.value)}
            error={!!errors.endTime}
            helperText={errors.endTime || "24-hour format - e.g. 08:00"}
            fullWidth
            placeholder="08:00"
            sx={MODULE_FIELD_SX}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={MODULE_DIALOG_ACTIONS_SX}>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Slot"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

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

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

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

  const activeSlots = slots.filter((slot) => slot.isActive).length;
  const inactiveSlots = slots.filter((slot) => !slot.isActive).length;
  const earlySlots = slots.filter((slot) => slot.startTime < "12:00").length;

  return (
    <Box sx={MODULE_PAGE_SX}>
      <Box sx={{ display: "flex", alignItems: { xs: "flex-start", lg: "center" }, justifyContent: "space-between", flexDirection: { xs: "column", lg: "row" }, gap: 1.5 }}>
        <Box sx={{ flex: 1, display: "flex", justifyContent: { xs: "flex-start", lg: "center" } }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {!isLoading ? (
              <>
                <ModuleSummaryStat label="Overall Slots" value={String(slots.length)} />
                <ModuleSummaryStat label="Active" value={String(activeSlots)} tone="success" />
                <ModuleSummaryStat label="Inactive" value={String(inactiveSlots)} tone="warning" />
                <ModuleSummaryStat label="Morning Slots" value={String(earlySlots)} />
              </>
            ) : (
              <>
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} variant="rounded" width={132} height={74} sx={{ borderRadius: "14px" }} />
                ))}
              </>
            )}
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={() => {
            setEditingSlot(null);
            setFormOpen(true);
          }}
          sx={{ px: 1.75, alignSelf: { xs: "flex-start", lg: "center" } }}
        >
          Add Slot
        </Button>
      </Box>

      {error ? <ErrorState message={error} onRetry={fetchSlots} /> : null}

      <Paper
        elevation={0}
        sx={{
          ...MODULE_CARD_SX,
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: C.surface }}>
                {["Slot", "Start Time", "End Time", "Session", "Status", "Actions"].map((heading) => (
                  <TableCell
                    key={heading}
                    sx={{
                      ...MODULE_TABLE_HEAD_CELL_SX,
                    }}
                  >
                    {heading}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <TableCell key={j} sx={{ py: 2 }}>
                        <Skeleton height={20} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : slots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ border: 0, p: 0 }}>
                    <EmptyState
                      title="No slots created yet"
                      subtitle="Add your first time slot to start assigning members by batch or session."
                      actionLabel="Add Slot"
                      onAction={() => {
                        setEditingSlot(null);
                        setFormOpen(true);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                slots.map((slot) => {
                  const session = slot.startTime < "12:00" ? "Morning" : slot.startTime < "17:00" ? "Afternoon" : "Evening";
                  return (
                    <TableRow
                      key={slot._id}
                      sx={{
                        ...MODULE_TABLE_ROW_SX,
                        "&:last-child td": { border: 0 },
                        opacity: slot.isActive ? 1 : 0.6,
                      }}
                    >
                      <TableCell sx={{ py: 1.6 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: "#111827" }}>
                          {slot.label}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 1.6 }}>
                        <Typography sx={{ fontSize: "0.85rem", color: C.slate, fontWeight: 600 }}>
                          {slot.startTime}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 1.6 }}>
                        <Typography sx={{ fontSize: "0.85rem", color: C.slate, fontWeight: 600 }}>
                          {slot.endTime}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 1.6 }}>
                        <Typography sx={{ fontSize: "0.82rem", color: C.slate, fontWeight: 700 }}>
                          {session}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 1.6 }}>
                        <Chip
                          label={slot.isActive ? "Active" : "Inactive"}
                          size="small"
                          sx={slot.isActive ? MODULE_SUCCESS_CHIP_SX : MODULE_NEUTRAL_CHIP_SX}
                        />
                      </TableCell>

                      <TableCell sx={{ py: 1.6 }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Edit slot">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingSlot(slot);
                                setFormOpen(true);
                              }}
                              sx={MODULE_ACTION_ICON_SX}
                            >
                              <EditOutlined sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title={slot.isActive ? "Deactivate" : "Activate"}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedSlot(slot);
                                setConfirmAction("toggle");
                                setConfirmOpen(true);
                              }}
                              sx={MODULE_ACTION_ICON_SX}
                            >
                              <PowerSettingsNewOutlined sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete slot">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedSlot(slot);
                                setConfirmAction("delete");
                                setConfirmOpen(true);
                              }}
                              sx={MODULE_ACTION_ICON_SX}
                            >
                              <DeleteOutlined sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
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
