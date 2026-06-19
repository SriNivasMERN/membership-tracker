"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AddOutlined,
  TaskAltOutlined,
  EditOutlined,
  DeleteOutlined,
  ScheduleOutlined,
  BlockOutlined,
  WbSunnyOutlined,
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
  MODULE_TABLE_CONTAINER_SX,
  MODULE_TABLE_HEAD_CELL_SX,
  MODULE_TABLE_ROW_SX,
  ModuleDashboardStat,
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

function getSessionTone(session: string) {
  const key = session.trim().toLowerCase();

  if (key.includes("morning")) {
    return {
      color: "#9A611E",
      border: "#E8CFA8",
      background: "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(252,244,233,0.97) 100%)",
    };
  }

  if (key.includes("afternoon")) {
    return {
      color: "#5E5347",
      border: "#E2D6C8",
      background: "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(249,244,237,0.97) 100%)",
    };
  }

  if (key.includes("evening") || key.includes("night")) {
    return {
      color: "#355072",
      border: "#C9D5E2",
      background: "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(239,245,251,0.97) 100%)",
    };
  }

  return {
    color: C.slate,
    border: C.border,
    background: "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(249,244,237,0.97) 100%)",
  };
}

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
  const dialogContentRef = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

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

  useEffect(() => {
    if (apiError) {
      dialogContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [apiError]);

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
      fullScreen={fullScreen}
      maxWidth="xs"
      fullWidth
      PaperProps={{ elevation: 0, sx: MODULE_DIALOG_PAPER_SX }}
    >
      <DialogTitle sx={MODULE_DIALOG_TITLE_SX}>
        {isEdit ? "Edit Slot" : "Add New Slot"}
      </DialogTitle>

      <DialogContent ref={dialogContentRef} sx={MODULE_DIALOG_CONTENT_SX}>
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
          {isSubmitting ? <CircularProgress size={20} color="inherit" /> : isEdit ? "Save Changes" : "Create Slot"}
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
  const getActionIconSx = (tone: "primary" | "toggle" | "danger") => ({
    ...MODULE_ACTION_ICON_SX,
    color:
      tone === "danger"
        ? "#8A6B65"
        : tone === "toggle"
          ? "#8F5D26"
          : "#667085",
    "&:hover": {
      color:
        tone === "danger"
          ? "#A13C32"
          : tone === "toggle"
            ? C.amber
            : C.navy,
      backgroundColor:
        tone === "danger"
          ? "rgba(251,239,234,0.95)"
          : tone === "toggle"
            ? "rgba(252,244,233,0.96)"
            : "rgba(248,242,235,0.96)",
      transform: "translateY(-1px)",
    },
  });

  return (
    <Box sx={MODULE_PAGE_SX}>
      <Paper
        elevation={0}
        sx={{
          ...MODULE_CARD_SX,
          p: { xs: 1.2, sm: 1.35 },
          background:
            "radial-gradient(circle at top left, rgba(240,230,217,0.5) 0%, rgba(255,255,255,0) 30%), linear-gradient(180deg, rgba(255,255,255,0.995) 0%, rgba(252,247,241,0.985) 100%)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "stretch",
            justifyContent: "space-between",
            flexDirection: { xs: "column", xl: "row" },
            gap: 1.1,
          }}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
              gap: 1.1,
            }}
          >
            {!isLoading ? (
              <>
                <ModuleDashboardStat
                  label="Overall Slots"
                  value={String(slots.length)}
                  helper="All configured time slots"
                  icon={<ScheduleOutlined sx={{ fontSize: 18 }} />}
                  compact
                />
                <ModuleDashboardStat
                  label="Active"
                  value={String(activeSlots)}
                  helper="Available for new assignments"
                  icon={<TaskAltOutlined sx={{ fontSize: 18 }} />}
                  tone="success"
                  compact
                />
                <ModuleDashboardStat
                  label="Inactive"
                  value={String(inactiveSlots)}
                  helper="Currently hidden from new entries"
                  icon={<BlockOutlined sx={{ fontSize: 18 }} />}
                  tone="warning"
                  compact
                />
                <ModuleDashboardStat
                  label="Morning Slots"
                  value={String(earlySlots)}
                  helper="Start before noon"
                  icon={<WbSunnyOutlined sx={{ fontSize: 18 }} />}
                  compact
                />
              </>
            ) : (
              <>
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} variant="rounded" height={96} sx={{ borderRadius: "14px" }} />
                ))}
              </>
            )}
          </Box>
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() => {
              setEditingSlot(null);
              setFormOpen(true);
            }}
            sx={{ px: 1.75, minHeight: 44, minWidth: { xs: "auto", xl: 148 }, alignSelf: { xs: "flex-start", xl: "center" } }}
          >
            Add Slot
          </Button>
        </Box>
      </Paper>

      {error ? <ErrorState message={error} onRetry={fetchSlots} /> : null}

      <Paper
        elevation={0}
        sx={{
          ...MODULE_CARD_SX,
          overflow: "hidden",
        }}
      >
        <TableContainer sx={MODULE_TABLE_CONTAINER_SX}>
          <Table sx={{ minWidth: { xs: 680, sm: 720, md: 0 } }}>
            <TableHead>
              <TableRow
                sx={{
                  background:
                    "linear-gradient(180deg, rgba(252,247,241,0.98) 0%, rgba(247,240,231,0.96) 100%)",
                }}
              >
                {["Slot", "Start Time", "End Time", "Session", "Status", "Actions"].map((heading) => (
                  <TableCell
                    key={heading}
                    sx={{
                      ...MODULE_TABLE_HEAD_CELL_SX,
                      whiteSpace: "nowrap",
                      textAlign: heading === "Actions" ? "center" : "left",
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
                  const sessionTone = getSessionTone(session);
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
                        <Typography
                          sx={{
                            fontSize: "0.88rem",
                            color: C.navy,
                            fontWeight: 700,
                            fontVariantNumeric: "tabular-nums",
                            letterSpacing: 0.04,
                          }}
                        >
                          {slot.startTime}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 1.6 }}>
                        <Typography
                          sx={{
                            fontSize: "0.88rem",
                            color: C.slate,
                            fontWeight: 700,
                            fontVariantNumeric: "tabular-nums",
                            letterSpacing: 0.04,
                          }}
                        >
                          {slot.endTime}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 1.6 }}>
                        <Typography
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            px: 0.85,
                            py: 0.25,
                            borderRadius: "999px",
                            border: `1px solid ${sessionTone.border}`,
                            background: sessionTone.background,
                            fontSize: "0.76rem",
                            color: sessionTone.color,
                            fontWeight: 700,
                            lineHeight: 1.1,
                          }}
                        >
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

                      <TableCell sx={{ py: 1.6, textAlign: "center" }}>
                        <Box sx={{ display: "flex", gap: 0.45, justifyContent: "center" }}>
                          <Tooltip title="Edit slot">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingSlot(slot);
                                setFormOpen(true);
                              }}
                              sx={getActionIconSx("primary")}
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
                              sx={getActionIconSx("toggle")}
                            >
                              {slot.isActive ? (
                                <BlockOutlined sx={{ fontSize: 17 }} />
                              ) : (
                                <TaskAltOutlined sx={{ fontSize: 17 }} />
                              )}
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
                              sx={getActionIconSx("danger")}
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
