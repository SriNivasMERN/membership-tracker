import { Chip } from "@mui/material";
import { MemberStatus } from "@/types/member.types";

interface StatusBadgeProps {
  status: MemberStatus;
}

const statusConfig = {
  active: {
    label: "Active",
    color: "success" as const,
  },
  expiring_soon: {
    label: "Expiring Soon",
    color: "warning" as const,
  },
  expired: {
    label: "Expired",
    color: "error" as const,
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 500, fontSize: "0.75rem" }}
    />
  );
}