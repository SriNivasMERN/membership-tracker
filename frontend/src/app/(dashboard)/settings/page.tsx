"use client";

import { useState, useEffect } from "react";
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
  navy: "#1E3A5F",
  slate: "#334155",
  muted: "#64748B",
  border: "#E2E8F0",
  surface: "#F8FAFC",
  green: "#15803D",
  amber: "#92400E",
  sky: "#1D4ED8",
};

const FIELD_SX = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,251,255,0.92) 100%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
    border: "1px solid rgba(191,219,254,0.5)",
  },
  "& .MuiInputLabel-root": {
    fontWeight: 600,
    color: "#475569",
  },
  "& .MuiFormHelperText-root": {
    fontWeight: 600,
    color: "#64748B",
  },
} as const;

function SummaryStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
}) {
  const styles =
    tone === "success"
      ? { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0", valueColor: C.green }
      : tone === "warning"
        ? { backgroundColor: "#FFFBEB", borderColor: "#FDE68A", valueColor: C.amber }
        : { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE", valueColor: C.navy };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.4,
        borderRadius: "14px",
        border: `1px solid ${styles.borderColor}`,
        background: `linear-gradient(180deg, rgba(255,255,255,0.96) 0%, ${styles.backgroundColor} 100%)`,
        minWidth: 132,
        boxShadow: "0 10px 22px rgba(30,58,95,0.08)",
      }}
    >
      <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.45, fontSize: "1.02rem", fontWeight: 900, color: styles.valueColor }}>
        {value}
      </Typography>
    </Paper>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "16px",
        border: "1px solid rgba(191,219,254,0.65)",
        boxShadow: "0 16px 32px rgba(30,58,95,0.08)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,251,255,0.96) 100%)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2.3,
          py: 1.45,
          background: "linear-gradient(90deg, rgba(239,246,255,0.92) 0%, rgba(248,250,252,0.82) 100%)",
          borderBottom: "1px solid rgba(191,219,254,0.55)",
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
            color: C.sky,
            background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(219,234,254,0.9) 100%)",
            border: "1px solid rgba(147,197,253,0.6)",
            boxShadow: "0 8px 18px rgba(59,130,246,0.12)",
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "0.86rem", color: "#111827" }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: C.muted, fontWeight: 600 }}>
            {subtitle}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ p: 2.15 }}>{children}</Box>
    </Paper>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState<SettingsFormData>(DEFAULT_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
        }
      } catch {
        setError("Failed to load settings.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

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
        await settingsApi.update(payload);
      } else {
        await settingsApi.save(payload);
        setIsConfigured(true);
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
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.4,
        p: { xs: 0, md: 0.5 },
        mt: { xs: -1, sm: -1.5 },
        borderRadius: "24px",
        background:
          "radial-gradient(circle at top left, rgba(191,219,254,0.35) 0%, rgba(255,255,255,0) 32%), linear-gradient(180deg, rgba(248,251,255,0.96) 0%, rgba(238,244,251,0.72) 100%)",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", lg: "center" } }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <SummaryStat label="Business Type" value={businessTypeLabel} />
          <SummaryStat label="Expiry Alert" value={`${form.expiryAlertDays} days`} />
          <SummaryStat label="Custom Labels" value={String(customLabelsCount)} tone="warning" />
          <SummaryStat label="Configured" value={isConfigured ? "Ready" : "Pending"} tone="success" />
        </Box>
      </Box>

      {error ? <ErrorState message={error} /> : null}

      <Grid container spacing={1.5}>
        <Grid item xs={12} lg={9}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Section
              icon={<BusinessOutlined sx={{ fontSize: 20 }} />}
              title="Business Profile"
              subtitle="Basic business details used across the app"
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Business Name"
                    value={form.businessName}
                    onChange={(e) => setField("businessName", e.target.value)}
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

            <Section
              icon={<LabelOutlined sx={{ fontSize: 20 }} />}
              title="Terminology"
              subtitle="Customize labels to match your business language throughout the app"
            >
              <Box
                sx={{
                  px: 1.5,
                  py: 1.2,
                  mb: 2,
                  background: "linear-gradient(135deg, rgba(255,251,235,0.96) 0%, rgba(255,255,255,0.98) 50%, rgba(254,243,199,0.82) 100%)",
                  borderRadius: "14px",
                  border: "1px solid #FCD34D",
                  boxShadow: "0 10px 18px rgba(245,158,11,0.08), inset 0 1px 0 rgba(255,255,255,0.86)",
                }}
              >
                <Typography sx={{ fontSize: "0.77rem", color: "#92400E", fontWeight: 700, lineHeight: 1.5 }}>
                  Example - if you run a library, you might use "Membership" instead of "Plan" and "Timing" instead of "Slot".
                </Typography>
              </Box>
              <Grid container spacing={2}>
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
        </Grid>

        <Grid item xs={12} lg={3}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Section
              icon={<AccessTimeOutlined sx={{ fontSize: 20 }} />}
              title="Expiry Alerts"
              subtitle="Choose when members start appearing in the renewal alert list"
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.6 }}>
                <TextField
                  label="Alert Days Before Expiry"
                  type="number"
                  value={form.expiryAlertDays}
                  onChange={(e) => setField("expiryAlertDays", Number(e.target.value))}
                  error={!!fieldErrors.expiryAlertDays}
                  helperText={
                    fieldErrors.expiryAlertDays ||
                    "Members within this window appear in the dashboard renewal alert"
                  }
                  fullWidth
                  sx={FIELD_SX}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography variant="caption" color="text.secondary">days</Typography>
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ min: 1, max: 90 }}
                />

                <Paper
                  elevation={0}
                  sx={{
                    p: 1.6,
                    borderRadius: "14px",
                    border: "1px solid rgba(191,219,254,0.55)",
                    background: "linear-gradient(135deg, rgba(248,250,252,0.96) 0%, rgba(239,246,255,0.9) 100%)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.1,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
                  }}
                >
                  <CheckCircleOutlined sx={{ fontSize: 18, color: "#1D4ED8", mt: 0.15 }} />
                  <Typography sx={{ fontSize: "0.8rem", color: C.slate, fontWeight: 600, lineHeight: 1.55 }}>
                    Members expiring in the next {form.expiryAlertDays} day{form.expiryAlertDays === 1 ? "" : "s"} will appear in the dashboard follow-up list.
                  </Typography>
                </Paper>
              </Box>
            </Section>

            <Paper
              elevation={0}
              sx={{
                p: 1.15,
                borderRadius: "14px",
                border: "1px solid rgba(191,219,254,0.72)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(239,246,255,0.9) 100%)",
                boxShadow: "0 12px 22px rgba(30,58,95,0.08)",
              }}
            >
              <Button
                variant="contained"
                startIcon={<SaveOutlined />}
                onClick={handleSave}
                disabled={isSaving}
                fullWidth
                sx={{
                  py: 0.95,
                  borderRadius: "14px",
                  boxShadow: "0 14px 28px rgba(30,58,95,0.18)",
                }}
              >
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </Paper>

          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
