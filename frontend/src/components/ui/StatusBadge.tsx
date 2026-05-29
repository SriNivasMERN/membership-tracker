import { Chip } from "@mui/material";
import { MemberStatus } from "@/types/member.types";

interface StatusBadgeProps {
  status: MemberStatus;
}

const statusConfig = {
  active: {
    label: "Active",
    backgroundColor: "#F0FDF4",
    color: "#15803D",
    border: "1px solid #BBF7D0",
  },
  expiring_soon: {
    label: "Expiring Soon",
    backgroundColor: "#FFFBEB",
    color: "#B45309",
    border: "1px solid #FDE68A",
  },
  expired: {
    label: "Expired",
    backgroundColor: "#FEF2F2",
    color: "#B91C1C",
    border: "1px solid #FECACA",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        height: 24,
        fontSize: "0.72rem",
        fontWeight: 700,
        backgroundColor: config.backgroundColor,
        color: config.color,
        border: config.border,
      }}
    />
  );
}