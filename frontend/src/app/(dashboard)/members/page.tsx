"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Skeleton,
  Tooltip,
} from "@mui/material";
import {
  SearchOutlined,
  AddOutlined,
  VisibilityOutlined,
  DeleteOutlined,
  ClearOutlined,
} from "@mui/icons-material";
import { membersApi } from "@/lib/api/members.api";
import { Member } from "@/types/member.types";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import PageHeader from "@/components/layout/PageHeader";
import { useToast } from "@/context/ToastContext";

export default function MembersPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await membersApi.getAll({
        page,
        search: search.trim() || undefined,
        limit: 10,
      });
      setMembers(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || 0);
    } catch {
      setError("Failed to load members.");
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchMembers();
    }, 300);
    return () => clearTimeout(delay);
  }, [fetchMembers]);

  const handleDelete = async () => {
    if (!deletingMember) return;
    setIsDeleting(true);
    try {
      await membersApi.delete(deletingMember._id);
      showToast("Member deleted successfully");
      setDeleteOpen(false);
      fetchMembers();
    } catch {
      showToast("Failed to delete member.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatCurrency = (n: number) => `Rs.${n.toLocaleString("en-IN")}`;

  return (
    <Box>
      <PageHeader
        title="Members"
        subtitle={
          isLoading
            ? "Loading..."
            : `${total} member${total !== 1 ? "s" : ""} total`
        }
        action={{
          label: "Add Member",
          onClick: () => router.push("/members/new"),
        }}
      />

      {/* Search */}
      <Box sx={{ mb: 2.5 }}>
        <TextField
          placeholder="Search by name or mobile..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          size="small"
          sx={{ width: { xs: "100%", sm: 340 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined sx={{ fontSize: 18, color: "#9CA3AF" }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => { setSearch(""); setPage(1); }}>
                  <ClearOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        {error ? (
          <ErrorState message={error} onRetry={fetchMembers} />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                  {["Name", "Mobile", "Plan", "End Date", "Pending", "Status", "Actions"].map((h) => (
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
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[1,2,3,4,5,6,7].map((j) => (
                        <TableCell key={j} sx={{ py: 2 }}>
                          <Skeleton height={20} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ border: 0, p: 0 }}>
                      <EmptyState
                        title={search ? "No members found" : "No members yet"}
                        subtitle={
                          search
                            ? `No results for "${search}". Try a different search.`
                            : "Add your first member to get started."
                        }
                        actionLabel={search ? undefined : "Add Member"}
                        onAction={search ? undefined : () => router.push("/members/new")}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow
                      key={member._id}
                      sx={{
                        "&:last-child td": { border: 0 },
                        "&:hover": { backgroundColor: "#FAFAFA" },
                        cursor: "pointer",
                      }}
                      onClick={() => router.push(`/members/${member._id}`)}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.88rem", color: "#111827" }}>
                          {member.name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography sx={{ fontSize: "0.85rem", color: "#374151" }}>
                          {member.mobile}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography sx={{ fontSize: "0.85rem", color: "#374151" }}>
                          {member.planSnapshot.name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography sx={{ fontSize: "0.85rem", color: "#374151" }}>
                          {formatDate(member.endDate)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography
                          sx={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: member.pendingAmount > 0 ? "#DC2626" : "#16A34A",
                          }}
                        >
                          {member.pendingAmount > 0
                            ? formatCurrency(member.pendingAmount)
                            : "Paid"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <StatusBadge status={member.status} />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Box
                          sx={{ display: "flex", gap: 0.5 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Tooltip title="View details">
                            <IconButton
                              size="small"
                              onClick={() => router.push(`/members/${member._id}`)}
                              sx={{ color: "#6B7280", "&:hover": { color: "#1D4ED8", backgroundColor: "#EFF6FF" } }}
                            >
                              <VisibilityOutlined sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete member">
                            <IconButton
                              size="small"
                              onClick={() => { setDeletingMember(member); setDeleteOpen(true); }}
                              sx={{ color: "#6B7280", "&:hover": { color: "#DC2626", backgroundColor: "#FEF2F2" } }}
                            >
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
        )}

        {/* Pagination */}
        {!isLoading && !error && totalPages > 1 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 2.5,
              py: 1.5,
              borderTop: "1px solid #F1F5F9",
            }}
          >
            <Typography sx={{ fontSize: "0.78rem", color: "#6B7280", fontWeight: 500 }}>
              Page {page} of {totalPages}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                sx={{ borderRadius: "8px", fontSize: "0.78rem" }}
              >
                Previous
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                sx={{ borderRadius: "8px", fontSize: "0.78rem" }}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Member"
        message={`Are you sure you want to delete "${deletingMember?.name}"? All their payment history will also be removed. This cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        isLoading={isDeleting}
      />
    </Box>
  );
}