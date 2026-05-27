import { Box, Typography, Button } from "@mui/material";
import { AddOutlined } from "@mui/icons-material";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function PageHeader({
  title,
  subtitle,
  action,
}: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        mb: 3,
      }}
    >
      <Box>
        <Typography variant="h5" fontWeight={600} color="text.primary">
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && (
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={action.onClick}
          sx={{ flexShrink: 0 }}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
}