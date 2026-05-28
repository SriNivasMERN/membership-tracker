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
  Avatar,
} from "@mui/material";
import {
  EditOutlined,
  PowerSettingsNewOutlined,
} from "@mui/icons-material";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api/axios.instance";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PageHeader from "@/components/layout/PageHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffUser {
  _id: string;
  name: string;
  email: string;
  role: "owner" | "staff";
  isActive: boolean;
  createdAt: string;
}

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
      maxWidth="xs"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: { borderRadius: "16px", border: "1px solid #E2E8F0" },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          pt: 2.5,
          px: 3,
          fontWeight: 700,
          fontSize: "1rem",
          color: "#111827",
        }}
      >
        Add Staff Account
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 1 }}>
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
          />
          <Box
            sx={{
              p: 1.5,
              backgroundColor: "#EFF6FF",
              borderRadius: "8px",
              border: "1px solid #BFDBFE",
            }}
          >
            <Typography sx={{ fontSize: "0.75rem", color: "#1D4ED8", fontWeight: 600 }}>
              Staff accounts can view and manage members but cannot access
              settings or manage other users.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Account"}
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
      maxWidth="xs"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: { borderRadius: "16px", border: "1px solid #E2E8F0" },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          pt: 2.5,
          px: 3,
          fontWeight: 700,
          fontSize: "1rem",
          color: "#111827",
        }}
      >
        Edit User
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 1 }}>
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
              />
            </>
          )}

          {isOwner && (
            <Box
              sx={{
                p: 1.5,
                backgroundColor: "#F8FAFC",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
              }}
            >
              <Typography
                sx={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 600 }}
              >
                Only name can be edited for owner accounts. Email and password
                changes for the owner are not supported here.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
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
  const activeStaff = users.filter(
    (u) => u.role === "staff" && u.isActive
  ).length;

  return (
    <Box>
      <PageHeader
        title="Users"
        subtitle={
          isLoading
            ? "Loading..."
            : `${staffCount} staff account${staffCount !== 1 ? "s" : ""} - ${activeStaff} active`
        }
        action={{ label: "Add Staff", onClick: () => setAddOpen(true) }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                {["User", "Email", "Role", "Status", "Joined", "Actions"].map(
                  (h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        py: 1.5,
                        borderBottom: "1px solid #E2E8F0",
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
                  <TableCell colSpan={6} sx={{ py: 8, textAlign: "center" }}>
                    <Typography
                      sx={{
                        fontSize: "0.9rem",
                        color: "#6B7280",
                        fontWeight: 500,
                      }}
                    >
                      No users found
                    </Typography>
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
                        "&:last-child td": { border: 0 },
                        "&:hover": { backgroundColor: "#FAFAFA" },
                        opacity: u.isActive ? 1 : 0.6,
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 34,
                              height: 34,
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              backgroundColor: isOwner ? "#1E3A5F" : "#2E75B6",
                            }}
                          >
                            {getInitials(u.name)}
                          </Avatar>
                          <Box>
                            <Typography
                              sx={{
                                fontWeight: 600,
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
                                    color: "#6B7280",
                                    ml: 1,
                                    fontWeight: 500,
                                  }}
                                >
                                  (you)
                                </Typography>
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ py: 2 }}>
                        <Typography
                          sx={{ fontSize: "0.85rem", color: "#374151" }}
                        >
                          {u.email}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          label={isOwner ? "Owner" : "Staff"}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            backgroundColor: isOwner ? "#EFF6FF" : "#F5F3FF",
                            color: isOwner ? "#1D4ED8" : "#6D28D9",
                            border: `1px solid ${isOwner ? "#BFDBFE" : "#DDD6FE"}`,
                          }}
                        />
                      </TableCell>

                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          label={u.isActive ? "Active" : "Inactive"}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            backgroundColor: u.isActive ? "#F0FDF4" : "#F9FAFB",
                            color: u.isActive ? "#15803D" : "#6B7280",
                            border: `1px solid ${u.isActive ? "#BBF7D0" : "#E5E7EB"}`,
                          }}
                        />
                      </TableCell>

                      <TableCell sx={{ py: 2 }}>
                        <Typography
                          sx={{
                            fontSize: "0.82rem",
                            color: "#6B7280",
                            fontWeight: 500,
                          }}
                        >
                          {formatDate(u.createdAt)}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Edit user">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingUser(u);
                                setEditOpen(true);
                              }}
                              sx={{
                                color: "#6B7280",
                                "&:hover": {
                                  color: "#1D4ED8",
                                  backgroundColor: "#EFF6FF",
                                },
                              }}
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
                                sx={{
                                  color: "#6B7280",
                                  "&:hover": {
                                    color: u.isActive ? "#B45309" : "#15803D",
                                    backgroundColor: u.isActive
                                      ? "#FFFBEB"
                                      : "#F0FDF4",
                                  },
                                }}
                              >
                                <PowerSettingsNewOutlined sx={{ fontSize: 17 }} />
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