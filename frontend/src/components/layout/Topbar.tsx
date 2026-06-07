"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
} from "@mui/material";
import {
  LogoutOutlined,
  PersonOutlined,
  MenuOutlined,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { SIDEBAR_WIDTH } from "./Sidebar";

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
}

export default function Topbar({ title, onMenuClick }: TopbarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    router.replace("/login");
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: { xs: 0, md: SIDEBAR_WIDTH },
        right: 0,
        height: 64,
        backgroundColor: "rgba(255,255,255,0.94)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid #E2E8F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: { xs: 2, sm: 3 },
        zIndex: 99,
        boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
      }}
    >
      {/* Left - hamburger on mobile + page title */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          onClick={onMenuClick}
          size="small"
          sx={{
            display: { xs: "flex", md: "none" },
            color: "text.secondary",
          }}
        >
          <MenuOutlined />
        </IconButton>
        <Typography
          variant="h6"
          fontWeight={700}
          color="text.primary"
          sx={{ fontSize: { xs: "1rem", sm: "1.15rem" } }}
        >
          {title}
        </Typography>
      </Box>

      {/* Right - user name + avatar */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: { xs: "none", sm: "block" }, fontWeight: 600 }}
        >
          {user?.name}
        </Typography>
        <IconButton onClick={handleMenuOpen} size="small">
          <Avatar
            sx={{
              width: 36,
              height: 36,
              backgroundColor: "primary.main",
              fontSize: "0.85rem",
              fontWeight: 700,
            }}
          >
            {user?.name ? getInitials(user.name) : "U"}
          </Avatar>
        </IconButton>
      </Box>

      {/* Dropdown */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          elevation: 0,
          sx: {
            minWidth: 200,
            mt: 0.5,
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: "#111827" }}>
            {user?.name}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 500 }}>
            {user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={handleMenuClose}
          sx={{ fontSize: "0.85rem", fontWeight: 500, py: 1.25 }}
        >
          <ListItemIcon>
            <PersonOutlined fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem
          onClick={handleLogout}
          sx={{ fontSize: "0.85rem", fontWeight: 500, py: 1.25, color: "#DC2626" }}
        >
          <ListItemIcon>
            <LogoutOutlined fontSize="small" sx={{ color: "#DC2626" }} />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </Box>
  );
}
