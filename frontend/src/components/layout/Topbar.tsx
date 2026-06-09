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
          "linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.95) 40%, rgba(239,246,255,0.94) 100%)",
        backdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(191,219,254,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: { xs: 2, sm: 3 },
        zIndex: 99,
        boxShadow: "0 8px 22px rgba(15,23,42,0.06)",
      }}
    >
      {/* Left - hamburger on mobile + page title */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, position: "relative", zIndex: 1 }}>
        <IconButton
          onClick={onMenuClick}
          size="small"
          sx={{
            display: { xs: "flex", md: "none" },
            color: "#475569",
            border: "1px solid rgba(191,219,254,0.65)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(239,246,255,0.88) 100%)",
            boxShadow: "0 8px 18px rgba(30,58,95,0.08)",
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
            color: "#0F172A",
            textShadow: "0 1px 0 rgba(255,255,255,0.55)",
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
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          pointerEvents: "none",
          zIndex: 1,
          minWidth: 0,
          width: "min(420px, 40%)",
          justifyContent: "center",
        }}
      >
        <Typography
          sx={{
            fontSize: "1rem",
            fontWeight: 800,
            letterSpacing: 0.04,
            color: "#334155",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textShadow: "0 1px 0 rgba(255,255,255,0.7)",
            opacity: 0.96,
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
              width: 40,
              height: 40,
              borderRadius: "14px",
              color: "#B91C1C",
              border: "1px solid rgba(252,165,165,0.7)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(254,242,242,0.94) 100%)",
              boxShadow:
                "0 10px 22px rgba(185,28,28,0.12), inset 0 1px 0 rgba(255,255,255,0.95)",
              animation: "powerFloat 3.4s ease-in-out infinite",
              "&:hover": {
                background:
                  "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(254,226,226,0.98) 100%)",
                boxShadow:
                  "0 12px 24px rgba(185,28,28,0.16), inset 0 1px 0 rgba(255,255,255,0.98)",
              },
              "@keyframes powerFloat": {
                "0%": { transform: "translateY(0px)", boxShadow: "0 10px 22px rgba(185,28,28,0.12), inset 0 1px 0 rgba(255,255,255,0.95)" },
                "50%": { transform: "translateY(-1.5px)", boxShadow: "0 14px 24px rgba(185,28,28,0.15), inset 0 1px 0 rgba(255,255,255,0.95)" },
                "100%": { transform: "translateY(0px)", boxShadow: "0 10px 22px rgba(185,28,28,0.12), inset 0 1px 0 rgba(255,255,255,0.95)" },
              },
            }}
          >
            <PowerSettingsNewRounded
              sx={{
                fontSize: 20,
                filter: "drop-shadow(0 0 8px rgba(239,68,68,0.18))",
              }}
            />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
