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
  Avatar,
  useMediaQuery,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme } from "@mui/material/styles";
import {
  AddOutlined,
  EditOutlined,
  GroupOutlined,
  PersonOutlineOutlined,
  TaskAltOutlined,
  BlockOutlined,
} from "@mui/icons-material";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api/axios.instance";
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
  MODULE_INLINE_PANEL_SX,
  MODULE_NEUTRAL_CHIP_SX,
  MODULE_PAGE_SX,
  MODULE_SUCCESS_CHIP_SX,
  MODULE_TABLE_CONTAINER_SX,
  ModuleDashboardStat,
  MODULE_TABLE_HEAD_CELL_SX,
  MODULE_TABLE_ROW_SX,
} from "@/components/ui/moduleStyles";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffUser {
  _id: string;
  name: string;
  email: string;
  role: "owner" | "staff";
  isActive: boolean;
  createdAt: string;
}

const C = {
  navy: MODULE_COLORS.ink,
  slate: MODULE_COLORS.slate,
  muted: MODULE_COLORS.muted,
  border: MODULE_COLORS.border,
  surface: MODULE_COLORS.surface,
  green: MODULE_COLORS.green,
  amber: MODULE_COLORS.amber,
};

// ─── API ──────────────────────────────────────────────────────────────────────

const usersApi = {
  getAll: () => api.get("/users").then((r) => r.data),

  create: (data: {
    name: string;
    email: string;
    password: string;
    role: "staff";
  }) => api.post("/users", data).then((r) => r.data),

  update: (id: string, data: { name: string }) =>
    api.put(`/users/${id}`, data).then((r) => r.data),

  updateCredentials: (
    id: string,
    data: { email?: string; newPassword?: string }
  ) => api.patch(`/users/${id}/credentials`, data).then((r) => r.data),

  toggle: (id: string, currentIsActive: boolean) =>
    api
      .patch(`/users/${id}/toggle`, { isActive: !currentIsActive })
      .then((r) => r.data),
};

// ─── Add User Dialog ──────────────────────────────────────────────────────────

function AddUserDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const dialogContentRef = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setPassword("");
      setErrors({});
      setApiError(null);
    }
  }, [open]);

  useEffect(() => {
    if (apiError) {
      dialogContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [apiError]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2)
      e.name = "Name must be at least 2 characters";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Invalid email format";
    if (!password || password.length < 8)
      e.password = "Password must be at least 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setApiError(null);
    try {
      await usersApi.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: "staff",
      });
      showToast("Staff account created successfully");
      onSaved();
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setApiError(e.response?.data?.message || "Failed to create user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: MODULE_DIALOG_PAPER_SX,
      }}
    >
      <DialogTitle sx={MODULE_DIALOG_TITLE_SX}>
        Add Staff Account
      </DialogTitle>

      <DialogContent ref={dialogContentRef} sx={MODULE_DIALOG_CONTENT_SX}>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {apiError}
          </Alert>
        )}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
          <TextField
            label="Full Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((p) => ({ ...p, name: "" }));
            }}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            autoFocus
            sx={MODULE_FIELD_SX}
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((p) => ({ ...p, email: "" }));
            }}
            error={!!errors.email}
            helperText={errors.email}
            fullWidth
            sx={MODULE_FIELD_SX}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((p) => ({ ...p, password: "" }));
            }}
            error={!!errors.password}
            helperText={errors.password || "Minimum 8 characters"}
            fullWidth
            sx={MODULE_FIELD_SX}
          />
          <Box sx={MODULE_INLINE_PANEL_SX}>
            <Typography sx={{ fontSize: "0.78rem", color: C.slate, fontWeight: 700, lineHeight: 1.5 }}>
              Staff accounts can view and manage members but cannot access
              settings or manage other users.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={MODULE_DIALOG_ACTIONS_SX}>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "Create Account"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Edit User Dialog ─────────────────────────────────────────────────────────

function EditUserDialog({
  open,
  user,
  onClose,
  onSaved,
}: {
  open: boolean;
  user: StaffUser | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const dialogContentRef = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const isOwner = user?.role === "owner";

  useEffect(() => {
    if (open && user) {
      setName(user.name);
      setEmail(user.email);
      setNewPassword("");
      setErrors({});
      setApiError(null);
    }
  }, [open, user]);

  useEffect(() => {
    if (apiError) {
      dialogContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [apiError]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2)
      e.name = "Name must be at least 2 characters";
    if (!isOwner) {
      if (!email.trim()) e.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        e.email = "Invalid email format";
      if (newPassword && newPassword.length < 8)
        e.newPassword = "Password must be at least 8 characters";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;
    setIsSubmitting(true);
    setApiError(null);
    try {
      // Update name if changed
      if (name.trim() !== user.name) {
        await usersApi.update(user._id, { name: name.trim() });
      }

      // Update credentials if changed - staff only
      if (!isOwner) {
        const credentialChanges: { email?: string; newPassword?: string } = {};
        if (email.trim().toLowerCase() !== user.email) {
          credentialChanges.email = email.trim().toLowerCase();
        }
        if (newPassword) {
          credentialChanges.newPassword = newPassword;
        }
        if (Object.keys(credentialChanges).length > 0) {
          await usersApi.updateCredentials(user._id, credentialChanges);
        }
      }

      showToast("User updated successfully");
      onSaved();
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setApiError(e.response?.data?.message || "Failed to update user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: MODULE_DIALOG_PAPER_SX,
      }}
    >
      <DialogTitle sx={MODULE_DIALOG_TITLE_SX}>
        Edit User
      </DialogTitle>

      <DialogContent ref={dialogContentRef} sx={MODULE_DIALOG_CONTENT_SX}>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {apiError}
          </Alert>
        )}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
          <TextField
            label="Full Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((p) => ({ ...p, name: "" }));
            }}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            autoFocus
            sx={MODULE_FIELD_SX}
          />

          {!isOwner && (
            <>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: "" }));
                }}
                error={!!errors.email}
                helperText={errors.email}
                fullWidth
                sx={MODULE_FIELD_SX}
              />
              <TextField
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword)
                    setErrors((p) => ({ ...p, newPassword: "" }));
                }}
                error={!!errors.newPassword}
                helperText={
                  errors.newPassword || "Leave blank to keep current password"
                }
                fullWidth
                sx={MODULE_FIELD_SX}
              />
            </>
          )}

          {isOwner && (
            <Box sx={MODULE_INLINE_PANEL_SX}>
              <Typography
                sx={{ fontSize: "0.78rem", color: C.slate, fontWeight: 700, lineHeight: 1.5 }}
              >
                Only name can be edited for owner accounts. Email and password
                changes for the owner are not supported here.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={MODULE_DIALOG_ACTIONS_SX}>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await usersApi.getAll();
      setUsers(response.data || []);
    } catch {
      setError("Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggle = async () => {
    if (!selectedUser) return;
    setIsActioning(true);
    try {
      await usersApi.toggle(selectedUser._id, selectedUser.isActive);
      showToast(
        selectedUser.isActive
          ? `${selectedUser.name} deactivated`
          : `${selectedUser.name} activated`
      );
      setConfirmOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(e.response?.data?.message || "Action failed.", "error");
    } finally {
      setIsActioning(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const staffCount = users.filter((u) => u.role === "staff").length;
  const totalActiveUsers = users.filter((u) => u.isActive).length;
  const ownerCount = users.filter((u) => u.role === "owner").length;
  const inactiveUsers = users.filter((u) => !u.isActive).length;
  const getActionIconSx = (tone: "primary" | "toggle") => ({
    ...MODULE_ACTION_ICON_SX,
    color: tone === "toggle" ? "#8F5D26" : "#667085",
    "&:hover": {
      color: tone === "toggle" ? C.amber : C.navy,
      backgroundColor:
        tone === "toggle" ? "rgba(252,244,233,0.96)" : "rgba(248,242,235,0.96)",
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
                  label="Overall Users"
                  value={String(users.length)}
                  helper="All staff and owner accounts"
                  icon={<GroupOutlined sx={{ fontSize: 18 }} />}
                  compact
                />
                <ModuleDashboardStat
                  label="Active"
                  value={String(totalActiveUsers)}
                  helper="Accounts that can sign in"
                  icon={<TaskAltOutlined sx={{ fontSize: 18 }} />}
                  tone="success"
                  compact
                />
                <ModuleDashboardStat
                  label="Staff"
                  value={String(staffCount)}
                  helper="Operational team accounts"
                  icon={<PersonOutlineOutlined sx={{ fontSize: 18 }} />}
                  compact
                />
                <ModuleDashboardStat
                  label="Owners"
                  value={String(ownerCount)}
                  helper={inactiveUsers > 0 ? `${inactiveUsers} inactive users` : "Primary access holders"}
                  icon={<BlockOutlined sx={{ fontSize: 18 }} />}
                  tone="warning"
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
            onClick={() => setAddOpen(true)}
            sx={{ px: 1.75, minHeight: 44, minWidth: { xs: "auto", xl: 148 }, alignSelf: { xs: "flex-start", xl: "center" } }}
          >
            Add Staff
          </Button>
        </Box>
      </Paper>

      {error ? <ErrorState message={error} onRetry={fetchUsers} /> : null}

      <Paper
        elevation={0}
        sx={{
          ...MODULE_CARD_SX,
          overflow: "hidden",
        }}
      >
        <TableContainer sx={MODULE_TABLE_CONTAINER_SX}>
          <Table sx={{ minWidth: { xs: 820, md: 0 } }}>
            <TableHead>
              <TableRow
                sx={{
                  background:
                    "linear-gradient(180deg, rgba(252,247,241,0.98) 0%, rgba(247,240,231,0.96) 100%)",
                }}
              >
                {["User", "Email", "Role", "Status", "Joined", "Actions"].map(
                  (h) => (
                    <TableCell
                      key={h}
                      sx={{
                        ...MODULE_TABLE_HEAD_CELL_SX,
                        whiteSpace: "nowrap",
                        textAlign: h === "Actions" ? "center" : "left",
                      }}
                    >
                      {h}
                    </TableCell>
                  )
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <TableCell key={j} sx={{ py: 2 }}>
                        <Skeleton height={20} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ border: 0, p: 0 }}>
                    <EmptyState
                      title="No users found"
                      subtitle="Add a staff account to let your team manage day-to-day operations."
                      actionLabel="Add Staff"
                      onAction={() => setAddOpen(true)}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const isCurrentUser = u._id === currentUser?.userId;
                  const isOwner = u.role === "owner";
                  return (
                    <TableRow
                      key={u._id}
                      sx={{
                        ...MODULE_TABLE_ROW_SX,
                        "&:last-child td": { border: 0 },
                        opacity: u.isActive ? 1 : 0.6,
                      }}
                    >
                      <TableCell sx={{ py: 1.6 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              fontSize: "0.8rem",
                              fontWeight: 800,
                              color: "#FFFFFF",
                              background: isOwner
                                ? "linear-gradient(180deg, #243A57 0%, #314B70 100%)"
                                : "linear-gradient(180deg, #355072 0%, #45648C 100%)",
                              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
                            }}
                          >
                            {getInitials(u.name)}
                          </Avatar>
                          <Box>
                            <Typography
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.88rem",
                                color: "#111827",
                              }}
                            >
                              {u.name}
                              {isCurrentUser && (
                                <Typography
                                  component="span"
                                  sx={{
                                    fontSize: "0.72rem",
                                    color: C.muted,
                                    ml: 1,
                                    fontWeight: 600,
                                  }}
                                >
                                  (you)
                                </Typography>
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ py: 1.6 }}>
                        <Typography
                          sx={{ fontSize: "0.85rem", color: C.slate, fontWeight: 700 }}
                        >
                          {u.email}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 1.6 }}>
                        <Chip
                          label={isOwner ? "Owner" : "Staff"}
                          size="small"
                          sx={
                            isOwner
                              ? {
                                  ...MODULE_NEUTRAL_CHIP_SX,
                                  background:
                                    "linear-gradient(180deg, rgba(255,255,255,0.998) 0%, rgba(249,244,237,0.992) 100%)",
                                  border: "1px solid #D8CCBC",
                                  color: C.navy,
                                }
                              : {
                                  ...MODULE_NEUTRAL_CHIP_SX,
                                  background:
                                    "linear-gradient(180deg, rgba(255,255,255,0.998) 0%, rgba(243,247,252,0.992) 100%)",
                                  border: "1px solid #CAD8E6",
                                  color: "#355072",
                                }
                          }
                        />
                      </TableCell>

                      <TableCell sx={{ py: 1.6 }}>
                        <Chip
                          label={u.isActive ? "Active" : "Inactive"}
                          size="small"
                          sx={u.isActive ? MODULE_SUCCESS_CHIP_SX : MODULE_NEUTRAL_CHIP_SX}
                        />
                      </TableCell>

                      <TableCell sx={{ py: 1.6 }}>
                        <Typography
                          sx={{
                            fontSize: "0.84rem",
                            color: C.slate,
                            fontWeight: 700,
                          }}
                        >
                          {formatDate(u.createdAt)}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 1.6, textAlign: "center" }}>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.45,
                            justifyContent: "flex-start",
                            alignItems: "center",
                            width: 58,
                            mx: "auto",
                          }}
                        >
                          <Tooltip title="Edit user">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingUser(u);
                                setEditOpen(true);
                              }}
                              sx={getActionIconSx("primary")}
                            >
                              <EditOutlined sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>

                          {!isOwner && !isCurrentUser && (
                            <Tooltip
                              title={u.isActive ? "Deactivate" : "Activate"}
                            >
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setConfirmOpen(true);
                                }}
                                sx={getActionIconSx("toggle")}
                              >
                                {u.isActive ? (
                                  <BlockOutlined sx={{ fontSize: 17 }} />
                                ) : (
                                  <TaskAltOutlined sx={{ fontSize: 17 }} />
                                )}
                              </IconButton>
                            </Tooltip>
                          )}
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

      <AddUserDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={fetchUsers}
      />

      <EditUserDialog
        open={editOpen}
        user={editingUser}
        onClose={() => setEditOpen(false)}
        onSaved={fetchUsers}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={selectedUser?.isActive ? "Deactivate User" : "Activate User"}
        message={
          selectedUser?.isActive
            ? `Deactivating "${selectedUser?.name}" will prevent them from logging in. Their data is preserved.`
            : `Activating "${selectedUser?.name}" will allow them to log in again.`
        }
        confirmLabel={selectedUser?.isActive ? "Deactivate" : "Activate"}
        confirmColor={selectedUser?.isActive ? "error" : "primary"}
        onConfirm={handleToggle}
        onCancel={() => setConfirmOpen(false)}
        isLoading={isActioning}
      />
    </Box>
  );
}
