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
  Alert,
  Skeleton,
  InputAdornment,
} from "@mui/material";
import {
  SaveOutlined,
  BusinessOutlined,
  AccessTimeOutlined,
  LabelOutlined,
} from "@mui/icons-material";
import { settingsApi, SettingsFormData } from "@/lib/api/settings.api";
import { useToast } from "@/context/ToastContext";
import PageHeader from "@/components/layout/PageHeader";

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
        borderRadius: "12px",
        border: "1px solid #E2E8F0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        overflow: "hidden",
        mb: 3,
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          backgroundColor: "#F8FAFC",
          borderBottom: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box sx={{ color: "#6B7280" }}>{icon}</Box>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: "#111827" }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 500 }}>
            {subtitle}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ p: 3 }}>{children}</Box>
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
      <Box>
        <Skeleton variant="text" width={200} height={36} sx={{ mb: 3 }} />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={180} sx={{ mb: 3, borderRadius: "12px" }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle="Configure your business profile and system preferences"
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Business Info */}
      <Section
        icon={<BusinessOutlined sx={{ fontSize: 20 }} />}
        title="Business Information"
        subtitle="Basic details about your business"
      >
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Business Name"
              value={form.businessName}
              onChange={(e) => setField("businessName", e.target.value)}
              error={!!fieldErrors.businessName}
              helperText={fieldErrors.businessName}
              fullWidth
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
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Phone (optional)"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              fullWidth
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
            />
          </Grid>
        </Grid>
      </Section>

      {/* Expiry Alert */}
      <Section
        icon={<AccessTimeOutlined sx={{ fontSize: 20 }} />}
        title="Expiry Alert Settings"
        subtitle="Control when members appear in the expiring soon list on the dashboard"
      >
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Alert Days Before Expiry"
              type="number"
              value={form.expiryAlertDays}
              onChange={(e) => setField("expiryAlertDays", Number(e.target.value))}
              error={!!fieldErrors.expiryAlertDays}
              helperText={
                fieldErrors.expiryAlertDays ||
                "Members expiring within this many days appear in the dashboard alert"
              }
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography variant="caption" color="text.secondary">days</Typography>
                  </InputAdornment>
                ),
              }}
              inputProps={{ min: 1, max: 90 }}
            />
          </Grid>
        </Grid>
      </Section>

      {/* Terminology */}
      <Section
        icon={<LabelOutlined sx={{ fontSize: 20 }} />}
        title="Terminology"
        subtitle="Customize labels to match your business language. These names appear throughout the app."
      >
        <Box
          sx={{
            p: 2,
            mb: 2.5,
            backgroundColor: "#FFFBEB",
            borderRadius: "10px",
            border: "1px solid #FDE68A",
          }}
        >
          <Typography sx={{ fontSize: "0.78rem", color: "#92400E", fontWeight: 600 }}>
            Example - if you run a library, you might use "Membership" instead of "Plan" and "Timing" instead of "Slot".
          </Typography>
        </Box>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Plan Label"
              value={form.terminology.planLabel}
              onChange={(e) => setTerminology("planLabel", e.target.value)}
              error={!!fieldErrors.planLabel}
              helperText={fieldErrors.planLabel || 'Default is "Plan"'}
              fullWidth
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
            />
          </Grid>
        </Grid>
      </Section>

      {/* Save */}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveOutlined />}
          onClick={handleSave}
          disabled={isSaving}
          sx={{ borderRadius: "10px", px: 4 }}
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </Box>
    </Box>
  );
}