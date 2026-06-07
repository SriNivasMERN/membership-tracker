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
        gap: { xs: 1.5, sm: 1 },
        mb: 3,
      }}
    >
      <Box>
        <Typography
          variant="h5"
          fontWeight={800}
          color="text.primary"
          sx={{ letterSpacing: "-0.02em" }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500, maxWidth: 640 }}
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
          sx={{ flexShrink: 0, alignSelf: { xs: "flex-start", sm: "auto" }, px: 1.75 }}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
}
