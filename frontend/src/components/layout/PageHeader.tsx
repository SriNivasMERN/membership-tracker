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
        alignItems: { xs: "flex-start", sm: "center" },
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        gap: { xs: 1.5, sm: 0 },
        mb: 3,
      }}
    >
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
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
          sx={{ flexShrink: 0, borderRadius: "10px", alignSelf: { xs: "flex-start", sm: "auto" } }}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
}
