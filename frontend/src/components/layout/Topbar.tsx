"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  PowerSettingsNewRounded,
  MenuOutlined,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { settingsApi } from "@/lib/api/settings.api";
import { SIDEBAR_WIDTH } from "./Sidebar";
import { MODULE_COLORS } from "@/components/ui/moduleStyles";

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
}

export default function Topbar({ title, onMenuClick }: TopbarProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [businessName, setBusinessName] = useState("Membership Tracker");

  useEffect(() => {
    const loadBusinessName = async () => {
      try {
        const response = await settingsApi.get();
        const name = response?.data?.businessName?.trim();
        if (name) setBusinessName(name);
      } catch {
        // Keep the fallback label if settings are unavailable.
      }
    };

    void loadBusinessName();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: { xs: 0, md: SIDEBAR_WIDTH },
        right: 0,
        height: 64,
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.995) 0%, rgba(253,250,246,0.988) 46%, rgba(248,242,234,0.975) 100%)",
        backdropFilter: "blur(18px)",
        borderTop: `1px solid ${MODULE_COLORS.border}`,
        borderBottom: `1px solid ${MODULE_COLORS.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: { xs: 2, sm: 3 },
        zIndex: 99,
        boxShadow: "0 12px 26px rgba(36,58,87,0.08)",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.18) 100%)",
          pointerEvents: "none",
        },
      }}
    >
      {/* Left - hamburger on mobile + page title */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, position: "relative", zIndex: 1 }}>
        <IconButton
          onClick={onMenuClick}
          size="small"
          sx={{
            display: { xs: "flex", md: "none" },
            width: 44,
            height: 44,
            color: MODULE_COLORS.slate,
            border: `1px solid ${MODULE_COLORS.border}`,
            background: "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(251,246,240,0.96) 100%)",
            boxShadow: "0 8px 18px rgba(36,58,87,0.08)",
          }}
        >
          <MenuOutlined />
        </IconButton>
        <Typography
          variant="h6"
          fontWeight={700}
          color="text.primary"
          sx={{
            fontSize: { xs: "1rem", sm: "1.15rem" },
            letterSpacing: -0.2,
            color: "#111827",
            textShadow: "0 1px 0 rgba(255,255,255,0.78)",
          }}
        >
          {title}
        </Typography>
      </Box>

      {/* Center - business name */}
      <Box
        sx={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          display: { xs: "none", sm: "flex" },
          alignItems: "center",
          pointerEvents: "none",
          zIndex: 1,
          minWidth: 0,
          width: { sm: "min(320px, 42%)", md: "min(420px, 40%)" },
          justifyContent: "center",
        }}
      >
        <Typography
          sx={{
            fontSize: "1.01rem",
            fontWeight: 800,
            letterSpacing: -0.01,
            color: MODULE_COLORS.slate,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textShadow: "0 1px 0 rgba(255,255,255,0.88)",
            opacity: 0.99,
          }}
        >
          {businessName}
        </Typography>
      </Box>

      {/* Right - logout only */}
      <Box sx={{ display: "flex", alignItems: "center", position: "relative", zIndex: 1 }}>
        <Tooltip title="Sign out">
          <IconButton
            onClick={handleLogout}
            size="small"
            sx={{
              width: 44,
              height: 44,
              borderRadius: "14px",
              color: "#B91C1C",
              border: "1px solid rgba(244,180,173,0.82)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(252,243,240,0.96) 100%)",
              boxShadow:
                "0 10px 22px rgba(185,28,28,0.10), inset 0 1px 0 rgba(255,255,255,0.96)",
              "&:hover": {
                background:
                  "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(251,233,229,0.98) 100%)",
                boxShadow:
                  "0 12px 24px rgba(185,28,28,0.14), inset 0 1px 0 rgba(255,255,255,0.98)",
              },
            }}
          >
            <PowerSettingsNewRounded
              sx={{
                fontSize: 20,
                filter: "drop-shadow(0 0 6px rgba(239,68,68,0.12))",
              }}
            />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
