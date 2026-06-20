"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  AdminPanelSettingsOutlined,
  HistoryOutlined,
  ManageAccountsOutlined,
  PersonOutlineOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import {
  MODULE_CARD_SX,
  MODULE_COLORS,
  MODULE_FIELD_SX,
  MODULE_PAGE_SX,
  MODULE_TABLE_CONTAINER_SX,
  MODULE_TABLE_HEAD_CELL_SX,
  MODULE_TABLE_ROW_SX,
  ModuleDashboardStat,
} from "@/components/ui/moduleStyles";
import { auditTrailApi } from "@/lib/api/auditTrail.api";
import {
  AuditAction,
  AuditTrailEntry,
  AuditTrailSummary,
} from "@/types/auditTrail.types";

const C = {
  ink: MODULE_COLORS.ink,
  slate: MODULE_COLORS.slate,
  muted: MODULE_COLORS.muted,
  border: MODULE_COLORS.border,
  green: MODULE_COLORS.green,
  amber: MODULE_COLORS.amber,
  red: MODULE_COLORS.red,
  accent: MODULE_COLORS.accent,
};

const MODULE_OPTIONS = [
  { value: "", label: "All Modules" },
  { value: "members", label: "Members" },
  { value: "plans", label: "Plans" },
  { value: "slots", label: "Slots" },
  { value: "pricing", label: "Pricing Rules" },
  { value: "users", label: "Users" },
  { value: "settings", label: "Settings" },
];

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "create", label: "Created" },
  { value: "update", label: "Updated" },
  { value: "delete", label: "Deleted" },
  { value: "activate", label: "Activated" },
  { value: "deactivate", label: "Deactivated" },
  { value: "payment", label: "Payment" },
  { value: "renew", label: "Renewed" },
  { value: "end", label: "Ended" },
  { value: "revert", label: "Reverted" },
  { value: "credentials", label: "Credentials" },
  { value: "save", label: "Saved" },
];

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "owner", label: "Owner" },
  { value: "staff", label: "Staff" },
];

const ACTION_LEFT_OFFSET = 1.1;
const MODULE_CONTENT_WIDTH = 170;

function formatDateTime(value: string) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function formatModule(value: string) {
  return MODULE_OPTIONS.find((item) => item.value === value)?.label || value;
}

function formatAction(value: AuditAction) {
  return ACTION_OPTIONS.find((item) => item.value === value)?.label || value;
}

function getActionColor(action: AuditAction) {
  if (action === "delete" || action === "end") return C.red;
  if (action === "payment" || action === "activate" || action === "renew" || action === "save") return C.green;
  if (action === "deactivate" || action === "revert" || action === "credentials") return C.amber;
  return C.accent;
}

export default function AuditTrailPage() {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const hasFetchedOnceRef = useRef(false);
  const [entries, setEntries] = useState<AuditTrailEntry[]>([]);
  const [summary, setSummary] = useState<AuditTrailSummary>({
    total: 0,
    today: 0,
    ownerActions: 0,
    staffActions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filteredCount, setFilteredCount] = useState(0);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [actorRoleFilter, setActorRoleFilter] = useState("");

  const fetchEntries = useCallback(async () => {
    if (hasFetchedOnceRef.current) {
      setIsFiltering(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const response = await auditTrailApi.getAll({
        page,
        limit: 20,
        search: search.trim() || undefined,
        module: moduleFilter || undefined,
        action: actionFilter || undefined,
        actorRole: actorRoleFilter || undefined,
      });

      setEntries(response.data || []);
      setSummary(
        response.summary || {
          total: 0,
          today: 0,
          ownerActions: 0,
          staffActions: 0,
        }
      );
      setFilteredCount(response.filteredCount || 0);
      setTotalPages(response.pagination?.totalPages || 1);
      hasFetchedOnceRef.current = true;
    } catch {
      setError("Failed to load audit trail. Please refresh.");
    } finally {
      setIsLoading(false);
      setIsFiltering(false);
      window.requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [actionFilter, actorRoleFilter, moduleFilter, page, search]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleClear = () => {
    setSearch("");
    setModuleFilter("");
    setActionFilter("");
    setActorRoleFilter("");
    setPage(1);
  };

  const hasFilters = Boolean(search || moduleFilter || actionFilter || actorRoleFilter);

  const emptyState = useMemo(() => {
    if (hasFilters) {
      return (
        <EmptyState
          title="No matching activity found"
          subtitle="Try a different search or filter."
        />
      );
    }

    return (
        <EmptyState
          title="No activity recorded yet"
          subtitle="Completed business actions will appear here."
        />
    );
  }, [hasFilters]);

  return (
    <Box sx={MODULE_PAGE_SX}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(4, minmax(0, 1fr))",
          },
          gap: 1.5,
        }}
      >
        <ModuleDashboardStat
          label="Total Activities"
          value={String(summary.total)}
          helper="All completed business actions"
          icon={<HistoryOutlined fontSize="small" />}
          compact
        />
        <ModuleDashboardStat
          label="Today"
          value={String(summary.today)}
          helper="Actions recorded today"
          icon={<AdminPanelSettingsOutlined fontSize="small" />}
          tone="success"
          compact
        />
        <ModuleDashboardStat
          label="Owner Actions"
          value={String(summary.ownerActions)}
          helper="Completed by the owner"
          icon={<ManageAccountsOutlined fontSize="small" />}
          tone="warning"
          compact
        />
        <ModuleDashboardStat
          label="Staff Actions"
          value={String(summary.staffActions)}
          helper="Completed by staff users"
          icon={<PersonOutlineOutlined fontSize="small" />}
          compact
        />
      </Box>

      <Paper
        elevation={0}
        sx={{
          ...MODULE_CARD_SX,
          p: 1.25,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "1.8fr 1fr 1fr 1fr auto",
          },
          gap: 1,
          alignItems: "center",
        }}
      >
          {isFiltering ? (
            <Box
              sx={{
                gridColumn: { xs: "1 / -1", md: "1 / -1" },
                display: "flex",
                alignItems: "center",
                gap: 0.9,
                px: 0.2,
                pb: 0.15,
              }}
            >
              <CircularProgress size={16} sx={{ color: C.muted }} />
              <Typography
                sx={{
                  fontSize: "0.78rem",
                  color: C.muted,
                  fontWeight: 700,
                }}
              >
                Updating activity log...
              </Typography>
            </Box>
          ) : null}
          <TextField
            inputRef={searchInputRef}
            placeholder="Search by module, action, user, or description"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            fullWidth
            size="small"
            sx={MODULE_FIELD_SX}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined sx={{ fontSize: 18, color: C.slate }} />
                </InputAdornment>
              ),
              endAdornment: isFiltering ? (
                <InputAdornment position="end">
                  <CircularProgress size={16} sx={{ color: C.muted }} />
                </InputAdornment>
              ) : null,
            }}
          />
          <TextField
            select
            value={moduleFilter}
            onChange={(event) => {
              setModuleFilter(event.target.value);
              setPage(1);
            }}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (value) => {
                if (!value) return "All Modules";
                return (
                  MODULE_OPTIONS.find((option) => option.value === value)?.label ||
                  String(value)
                );
              },
            }}
            sx={MODULE_FIELD_SX}
            label="Module"
          >
            {MODULE_OPTIONS.map((option) => (
              <MenuItem key={option.value || "all-modules"} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            value={actionFilter}
            onChange={(event) => {
              setActionFilter(event.target.value);
              setPage(1);
            }}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (value) => {
                if (!value) return "All Actions";
                return (
                  ACTION_OPTIONS.find((option) => option.value === value)?.label ||
                  String(value)
                );
              },
            }}
            sx={MODULE_FIELD_SX}
            label="Action"
          >
            {ACTION_OPTIONS.map((option) => (
              <MenuItem key={option.value || "all-actions"} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            value={actorRoleFilter}
            onChange={(event) => {
              setActorRoleFilter(event.target.value);
              setPage(1);
            }}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (value) => {
                if (!value) return "All Roles";
                return (
                  ROLE_OPTIONS.find((option) => option.value === value)?.label ||
                  String(value)
                );
              },
            }}
            sx={MODULE_FIELD_SX}
            label="User Role"
          >
            {ROLE_OPTIONS.map((option) => (
              <MenuItem key={option.value || "all-roles"} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant={hasFilters ? "outlined" : "text"}
            color="inherit"
            onClick={handleClear}
            disabled={!hasFilters}
            sx={{
              minHeight: 44,
              px: 1.25,
              borderColor: hasFilters ? C.border : "transparent",
              color: hasFilters ? C.slate : C.muted,
              gridColumn: { xs: "1 / -1", sm: "auto", lg: "auto" },
            }}
          >
            Clear
          </Button>
      </Paper>

      <Paper elevation={0} sx={{ ...MODULE_CARD_SX, overflow: "hidden" }}>
        {isLoading ? (
          <Box sx={{ p: 1.5 }}>
            {[...Array(6)].map((_, index) => (
              <Box
                key={index}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1.1fr 0.9fr 1fr 2fr 1fr",
                  gap: 1.5,
                  py: 1.6,
                  borderBottom:
                    index === 5 ? "none" : `1px solid ${MODULE_COLORS.border}`,
                }}
              >
                {[...Array(5)].map((__, cellIndex) => (
                  <Skeleton key={cellIndex} height={28} />
                ))}
              </Box>
            ))}
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <ErrorState
              message={error}
              onRetry={fetchEntries}
            />
          </Box>
        ) : entries.length === 0 ? (
          <Box sx={{ p: 2 }}>{emptyState}</Box>
        ) : (
          <>
            <TableContainer sx={MODULE_TABLE_CONTAINER_SX}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={MODULE_TABLE_HEAD_CELL_SX}>Date & Time</TableCell>
                    <TableCell sx={MODULE_TABLE_HEAD_CELL_SX}>Module</TableCell>
                    <TableCell sx={MODULE_TABLE_HEAD_CELL_SX}>
                      <Box sx={{ pl: ACTION_LEFT_OFFSET }}>Action</Box>
                    </TableCell>
                    <TableCell sx={MODULE_TABLE_HEAD_CELL_SX}>Description</TableCell>
                    <TableCell sx={MODULE_TABLE_HEAD_CELL_SX}>Done By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((entry) => {
                    const dateTime = formatDateTime(entry.createdAt);
                    const actionColor = getActionColor(entry.action);

                    return (
                      <TableRow key={entry._id} sx={MODULE_TABLE_ROW_SX}>
                        <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${C.border}` }}>
                          <Typography sx={{ fontWeight: 800, color: C.ink, fontSize: "1rem" }}>
                            {dateTime.date}
                          </Typography>
                          <Typography sx={{ mt: 0.35, fontWeight: 600, color: C.slate, fontSize: "0.84rem" }}>
                            {dateTime.time}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${C.border}` }}>
                          <Box
                            sx={{
                              width: MODULE_CONTENT_WIDTH,
                              maxWidth: "100%",
                            }}
                          >
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                px: 1.2,
                                minHeight: 30,
                                borderRadius: "999px",
                                border: `1px solid ${C.border}`,
                                backgroundColor: "rgba(251,247,241,0.94)",
                              }}
                            >
                              <Typography sx={{ fontWeight: 800, color: C.ink, fontSize: "0.83rem" }}>
                                {formatModule(entry.module)}
                              </Typography>
                            </Box>
                            <Typography
                              sx={{
                                mt: 0.6,
                                fontWeight: 600,
                                color: C.slate,
                                fontSize: "0.82rem",
                                lineHeight: 1.45,
                              }}
                            >
                              {entry.entityLabel || "Record update"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${C.border}`, pl: ACTION_LEFT_OFFSET }}>
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              px: 1.3,
                              minHeight: 32,
                              borderRadius: "999px",
                              border: `1px solid ${actionColor}33`,
                              backgroundColor: `${actionColor}10`,
                            }}
                          >
                            <Typography sx={{ fontWeight: 800, color: actionColor, fontSize: "0.86rem" }}>
                              {formatAction(entry.action)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${C.border}` }}>
                          <Typography sx={{ fontWeight: 800, color: C.ink, lineHeight: 1.55 }}>
                            {entry.description || "Action completed"}
                          </Typography>
                          {entry.entityId ? (
                            <Typography sx={{ mt: 0.45, fontWeight: 600, color: C.muted, fontSize: "0.8rem" }}>
                              Ref: {entry.entityId.slice(-8).toUpperCase()}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${C.border}` }}>
                          <Typography sx={{ fontWeight: 800, color: C.ink }}>
                            {entry.performedBy.name}
                          </Typography>
                          <Box
                            sx={{
                              mt: 0.55,
                              display: "inline-flex",
                              alignItems: "center",
                              px: 1.05,
                              minHeight: 26,
                              borderRadius: "999px",
                              border: `1px solid ${entry.performedBy.role === "owner" ? `${C.amber}33` : `${C.accent}33`}`,
                              backgroundColor:
                                entry.performedBy.role === "owner"
                                  ? "rgba(252,244,233,0.92)"
                                  : "rgba(244,247,251,0.92)",
                            }}
                          >
                            <Typography
                              sx={{
                                fontWeight: 800,
                                color: entry.performedBy.role === "owner" ? C.amber : C.accent,
                                fontSize: "0.74rem",
                                textTransform: "capitalize",
                              }}
                            >
                              {entry.performedBy.role}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                borderTop: `1px solid ${C.border}`,
                flexWrap: "wrap",
              }}
            >
              <Typography sx={{ fontWeight: 700, color: C.slate, fontSize: "0.9rem" }}>
                Page {page} of {totalPages}
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                >
                  Next
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
