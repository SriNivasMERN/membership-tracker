"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Pagination,
  Skeleton,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  SearchOutlined,
  VisibilityOutlined,
  DeleteOutlined,
  PersonOffOutlined,
} from "@mui/icons-material";
import { Member } from "@/types/member.types";
import { membersApi } from "@/lib/api/members.api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PageHeader from "@/components/layout/PageHeader";

const ROWS_PER_PAGE = 10;

export default function MembersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await membersApi.getAll({
        page,
        limit: ROWS_PER_PAGE,
        search: search || undefined,
      });
      setMembers(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || 0);
    } catch {
      setError("Failed to load members. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await membersApi.delete(deleteId);
      showToast("Member deleted successfully");
      setDeleteId(null);
      fetchMembers();
    } catch {
      showToast("Failed to delete member", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN")}`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <Box>
      <PageHeader
        title="Members"
        subtitle={`${total} total members`}
        action={{
          label: "Add Member",
          onClick: () => router.push("/members/new"),
        }}
      />

      {/* Search */}
      <Box sx={{ mb: 2.5 }}>
        <TextField
          placeholder="Search by name or mobile..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          size="small"
          sx={{ width: 320 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{ border: "1px solid #E8EDF3", boxShadow: "none" }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Mobile</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Slot</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Final Price</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Pending</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              // Loading skeleton rows
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : members.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                  <PersonOffOutlined
                    sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                  />
                  <Typography color="text.secondary" variant="body2">
                    {search
                      ? "No members found matching your search"
                      : "No members yet. Add your first member."}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow
                  key={member._id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => router.push(`/members/${member._id}`)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {member.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {member.mobile}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {member.planSnapshot.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {member.slotSnapshot.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {member.slotSnapshot.startTime} -{" "}
                      {member.slotSnapshot.endTime}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(member.endDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={member.status} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatCurrency(member.finalPrice)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={
                        member.pendingAmount > 0
                          ? "error.main"
                          : "success.main"
                      }
                      fontWeight={500}
                    >
                      {member.pendingAmount > 0
                        ? formatCurrency(member.pendingAmount)
                        : "Paid"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box
                      sx={{ display: "flex", justifyContent: "flex-end" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip title="View details">
                        <IconButton
                          size="small"
                          onClick={() =>
                            router.push(`/members/${member._id}`)
                          }
                        >
                          <VisibilityOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {user?.role === "owner" && (
                        <Tooltip title="Delete member">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteId(member._id)}
                          >
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Member"
        message="This member will be removed from the active list. The record will be retained for history. This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}