"use client";

import { useState, useEffect, useRef, type WheelEvent } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Skeleton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  CheckCircleOutlined,
  SaveOutlined,
  BusinessOutlined,
  AccessTimeOutlined,
  LabelOutlined,
} from "@mui/icons-material";
import { settingsApi, SettingsFormData } from "@/lib/api/settings.api";
import { useToast } from "@/context/ToastContext";
import ErrorState from "@/components/ui/ErrorState";
import {
  MODULE_CARD_SX,
  MODULE_COLORS,
  MODULE_FIELD_SX,
  MODULE_INLINE_PANEL_SX,
  MODULE_PAGE_SX,
  ModuleDashboardStat,
} from "@/components/ui/moduleStyles";

const BUSINESS_TYPES = [
  { value: "gym",             label: "Gym" },
  { value: "yoga_studio",     label: "Yoga Studio" },
  { value: "coaching_center", label: "Coaching Center" },
  { value: "library",         label: "Library" },
  { value: "sports_facility", label: "Sports Facility" },
  { value: "clinic",          label: "Clinic" },
  { value: "other",           label: "Other" },
];

const DEFAULT_FORM: SettingsFormData = {
  businessName: "",
  businessType: "gym",
  email: "",
  phone: "",
  address: "",
  expiryAlertDays: 7,
  terminology: {
    planLabel: "Plan",
    slotLabel: "Slot",
    memberLabel: "Member",
  },
};

const C = {
  ink: MODULE_COLORS.ink,
  slate: MODULE_COLORS.slate,
  muted: MODULE_COLORS.muted,
  border: MODULE_COLORS.border,
  surface: MODULE_COLORS.surface,
  green: MODULE_COLORS.green,
  amber: MODULE_COLORS.amber,
  accent: MODULE_COLORS.accent,
};

function preventNumberScroll(event: WheelEvent<HTMLInputElement>) {
  event.currentTarget.blur();
}

const FIELD_SX = MODULE_FIELD_SX;

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  subtitle,
  children,
  sx,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  sx?: object;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        ...MODULE_CARD_SX,
        borderRadius: "16px",
        overflow: "hidden",
        ...sx,
      }}
    >
      <Box
        sx={{
          px: 2.3,
          py: 1.2,
          background:
            "linear-gradient(90deg, rgba(252,247,241,0.98) 0%, rgba(255,254,252,0.985) 100%)",
          borderBottom: "1px solid rgba(228,216,200,0.85)",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.accent,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(247,241,233,0.96) 100%)",
            border: "1px solid rgba(221,205,184,0.76)",
            boxShadow: "0 8px 18px rgba(53,80,114,0.12)",
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: C.ink }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: C.slate, fontWeight: 600, opacity: 1, lineHeight: 1.45 }}>
            {subtitle}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ p: 1.75 }}>{children}</Box>
    </Paper>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { showToast } = useToast();
  const pageTopRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState<SettingsFormData>(DEFAULT_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const formatLastSaved = (value: string) =>
    new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await settingsApi.get();
        if (response.data) {
          const s = response.data;
          setForm({
            businessName: s.businessName || "",
            businessType: s.businessType || "gym",
            email: s.email || "",
            phone: s.phone || "",
            address: s.address || "",
            expiryAlertDays: s.expiryAlertDays ?? 7,
            terminology: {
              planLabel: s.terminology?.planLabel || "Plan",
              slotLabel: s.terminology?.slotLabel || "Slot",
              memberLabel: s.terminology?.memberLabel || "Member",
            },
          });
          setIsConfigured(s.isConfigured || false);
          setLastSavedAt(s.updatedAt || null);
        }
      } catch {
        setError("Failed to load settings.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (error) {
      pageTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [error]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.businessName.trim() || form.businessName.trim().length < 2) {
      e.businessName = "Business name must be at least 2 characters";
    }
    if (!form.businessType) e.businessType = "Business type is required";
    if (form.expiryAlertDays < 1 || form.expiryAlertDays > 90) {
      e.expiryAlertDays = "Must be between 1 and 90 days";
    }
    if (!form.terminology.planLabel.trim()) e.planLabel = "Required";
    if (!form.terminology.slotLabel.trim()) e.slotLabel = "Required";
    if (!form.terminology.memberLabel.trim()) e.memberLabel = "Required";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    setError(null);
    try {
      const payload: SettingsFormData = {
        ...form,
        businessName: form.businessName.trim(),
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        address: form.address?.trim() || undefined,
        expiryAlertDays: Number(form.expiryAlertDays),
      };
      if (isConfigured) {
        const response = await settingsApi.update(payload);
        setLastSavedAt(response.data?.updatedAt || null);
      } else {
        const response = await settingsApi.save(payload);
        setIsConfigured(true);
        setLastSavedAt(response.data?.updatedAt || null);
      }
      showToast("Settings saved successfully");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const setField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((p) => ({ ...p, [field]: "" }));
  };

  const setTerminology = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      terminology: { ...prev.terminology, [field]: value },
    }));
    if (fieldErrors[field]) setFieldErrors((p) => ({ ...p, [field]: "" }));
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} variant="rounded" width={132} height={74} sx={{ borderRadius: "14px" }} />
          ))}
        </Box>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={176} sx={{ borderRadius: "16px" }} />
        ))}
      </Box>
    );
  }

  const customLabelsCount = [
    form.terminology.planLabel !== "Plan",
    form.terminology.slotLabel !== "Slot",
    form.terminology.memberLabel !== "Member",
  ].filter(Boolean).length;

  const businessTypeLabel =
    BUSINESS_TYPES.find((type) => type.value === form.businessType)?.label || "Not set";

  return (
    <Box
      ref={pageTopRef}
      sx={{
        ...MODULE_PAGE_SX,
        gap: 1.15,
        mt: { xs: -1, sm: -1.3 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          ...MODULE_CARD_SX,
          p: { xs: 1, sm: 1.1 },
          background:
            "radial-gradient(circle at top left, rgba(240,230,217,0.44) 0%, rgba(255,255,255,0) 30%), linear-gradient(180deg, rgba(255,255,255,0.995) 0%, rgba(252,247,241,0.985) 100%)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "stretch",
            justifyContent: "space-between",
            gap: 0.9,
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
              gap: 0.9,
            }}
          >
            <ModuleDashboardStat
              label="Business Type"
              value={businessTypeLabel}
              helper="Current operating category"
              icon={<BusinessOutlined sx={{ fontSize: 18 }} />}
              compact
            />
            <ModuleDashboardStat
              label="Expiry Alert"
              value={`${form.expiryAlertDays} days`}
              helper="Renewal follow-up window"
              icon={<AccessTimeOutlined sx={{ fontSize: 18 }} />}
              tone="warning"
              compact
            />
            <ModuleDashboardStat
              label="Custom Labels"
              value={String(customLabelsCount)}
              helper="Terms renamed from defaults"
              icon={<LabelOutlined sx={{ fontSize: 18 }} />}
              compact
            />
            <ModuleDashboardStat
              label="Configured"
              value={isConfigured ? "Ready" : "Pending"}
              helper={
                isConfigured ? "Settings already saved" : "Initial setup pending"
              }
              icon={<CheckCircleOutlined sx={{ fontSize: 18 }} />}
              tone="success"
              compact
            />
          </Box>
        </Box>
      </Paper>

      {error ? <ErrorState message={error} /> : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 9fr) minmax(0, 3fr)" },
          gap: 1.15,
          alignItems: "stretch",
        }}
      >
        <Box>
          <Section
            icon={<BusinessOutlined sx={{ fontSize: 20 }} />}
            title="Business Profile"
            subtitle="Business details used across the app"
            sx={{ height: "100%" }}
          >
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Business Name"
                  value={form.businessName}
                  onChange={(e) => setField("businessName", e.target.value)}
                  autoFocus
                  error={!!fieldErrors.businessName}
                  helperText={fieldErrors.businessName}
                  fullWidth
                  sx={FIELD_SX}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Business Type"
                  value={form.businessType}
                  onChange={(e) => setField("businessType", e.target.value)}
                  error={!!fieldErrors.businessType}
                  helperText={fieldErrors.businessType}
                  fullWidth
                  sx={FIELD_SX}
                >
                  {BUSINESS_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email (optional)"
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  fullWidth
                  sx={FIELD_SX}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone (optional)"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  fullWidth
                  sx={FIELD_SX}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Address (optional)"
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  sx={FIELD_SX}
                />
              </Grid>
            </Grid>
          </Section>
        </Box>

        <Box>
          <Section
            icon={<AccessTimeOutlined sx={{ fontSize: 20 }} />}
            title="Expiry Alerts"
            subtitle="Days before members appear in renewal follow-up"
            sx={{ height: "100%" }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.35, height: "100%" }}>
              <TextField
                label="Alert Days Before Expiry"
                type="number"
                value={form.expiryAlertDays}
                onChange={(e) => setField("expiryAlertDays", Number(e.target.value))}
                error={!!fieldErrors.expiryAlertDays}
                helperText={fieldErrors.expiryAlertDays || ""}
                FormHelperTextProps={{
                  sx: {
                    display: fieldErrors.expiryAlertDays ? "block" : "none",
                    mt: 0.75,
                  },
                }}
                fullWidth
                sx={FIELD_SX}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography variant="caption" color={C.muted}>days</Typography>
                    </InputAdornment>
                  ),
                }}
                inputProps={{ min: 1, max: 90, onWheel: preventNumberScroll }}
              />

              <Paper
                elevation={0}
                sx={{
                  ...MODULE_INLINE_PANEL_SX,
                  p: 1.15,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.1,
                  mt: 0.2,
                }}
              >
                <CheckCircleOutlined sx={{ fontSize: 18, color: C.accent, mt: 0.15 }} />
                <Typography sx={{ fontSize: "0.8rem", color: C.slate, fontWeight: 600, lineHeight: 1.55 }}>
                  Members expiring in the next {form.expiryAlertDays} day{form.expiryAlertDays === 1 ? "" : "s"} appear in the dashboard follow-up list.
                </Typography>
              </Paper>
            </Box>
          </Section>
        </Box>

        <Box>
          <Section
            icon={<LabelOutlined sx={{ fontSize: 20 }} />}
            title="Terminology"
            subtitle="Rename core terms used across the app"
            sx={{ height: "100%" }}
          >
            <Box
              sx={{
                ...MODULE_INLINE_PANEL_SX,
                px: 1.5,
                py: 1.05,
                mb: 1.35,
              }}
            >
              <Typography sx={{ fontSize: "0.8rem", color: C.ink, fontWeight: 600, lineHeight: 1.55 }}>
                Example: A library might use "Membership" instead of "Plan" and "Timing" instead of "Slot".
              </Typography>
            </Box>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Plan Label"
                  value={form.terminology.planLabel}
                  onChange={(e) => setTerminology("planLabel", e.target.value)}
                  error={!!fieldErrors.planLabel}
                  helperText={fieldErrors.planLabel || 'Default is "Plan"'}
                  fullWidth
                  sx={FIELD_SX}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Slot Label"
                  value={form.terminology.slotLabel}
                  onChange={(e) => setTerminology("slotLabel", e.target.value)}
                  error={!!fieldErrors.slotLabel}
                  helperText={fieldErrors.slotLabel || 'Default is "Slot"'}
                  fullWidth
                  sx={FIELD_SX}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Member Label"
                  value={form.terminology.memberLabel}
                  onChange={(e) => setTerminology("memberLabel", e.target.value)}
                  error={!!fieldErrors.memberLabel}
                  helperText={fieldErrors.memberLabel || 'Default is "Member"'}
                  fullWidth
                  sx={FIELD_SX}
                />
              </Grid>
            </Grid>
          </Section>
        </Box>

        <Box>
          <Paper
            elevation={0}
            sx={{
              ...MODULE_CARD_SX,
              p: 1.4,
              borderRadius: "16px",
              height: "100%",
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1.15 }}>
              <Button
                variant="contained"
                startIcon={<SaveOutlined />}
                onClick={handleSave}
                disabled={isSaving}
                fullWidth
                sx={{
                  mt: 0.6,
                  minHeight: 44,
                  py: 0.95,
                  borderRadius: "14px",
                  backgroundColor: C.ink,
                  boxShadow: "0 14px 28px rgba(36,58,87,0.18)",
                  "&:hover": {
                    backgroundColor: "#2E4867",
                  },
                }}
              >
                {isSaving ? <CircularProgress size={20} color="inherit" /> : "Save Settings"}
              </Button>

              <Box
                sx={{
                  ...MODULE_INLINE_PANEL_SX,
                  p: 1.15,
                  mt: 0.45,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.76rem",
                    fontWeight: 900,
                    color: C.slate,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                    textAlign: "center",
                  }}
                >
                  Last saved
                </Typography>
                <Box
                  sx={{
                    mt: 0.7,
                    display: "inline-flex",
                    alignItems: "center",
                    px: 1.05,
                    py: 0.55,
                    borderRadius: "999px",
                    border: "1px solid rgba(210,196,176,0.92)",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.995) 0%, rgba(251,245,237,0.985) 100%)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.92)",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.84rem",
                      fontWeight: 800,
                      color: lastSavedAt ? C.accent : C.muted,
                      lineHeight: 1.35,
                      textAlign: "center",
                    }}
                  >
                    {lastSavedAt ? formatLastSaved(lastSavedAt) : "Not saved yet"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
