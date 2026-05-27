"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";
import {
  DashboardOutlined,
  PeopleOutlined,
  FitnessCenterOutlined,
  AccessTimeOutlined,
  AttachMoneyOutlined,
  SettingsOutlined,
  PeopleAltOutlined,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";

const SIDEBAR_WIDTH = 240;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  ownerOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <DashboardOutlined />,
  },
  {
    label: "Members",
    path: "/members",
    icon: <PeopleOutlined />,
  },
  {
    label: "Plans",
    path: "/plans",
    icon: <FitnessCenterOutlined />,
    ownerOnly: true,
  },
  {
    label: "Slots",
    path: "/slots",
    icon: <AccessTimeOutlined />,
    ownerOnly: true,
  },
  {
    label: "Pricing Rules",
    path: "/pricing",
    icon: <AttachMoneyOutlined />,
    ownerOnly: true,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: <SettingsOutlined />,
    ownerOnly: true,
  },
  {
    label: "Users",
    path: "/users",
    icon: <PeopleAltOutlined />,
    ownerOnly: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.ownerOnly || user?.role === "owner"
  );

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  return (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        backgroundColor: "primary.main",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
      }}
    >
      {/* App Branding */}
      <Box sx={{ px: 3, py: 3 }}>
        <Typography
          variant="h6"
          sx={{
            color: "white",
            fontWeight: 700,
            fontSize: "1rem",
            lineHeight: 1.3,
          }}
        >
          Membership
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: "rgba(255,255,255,0.7)",
            fontWeight: 400,
            fontSize: "0.85rem",
          }}
        >
          Tracker
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      {/* Navigation */}
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {visibleItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => router.push(item.path)}
              sx={{
                borderRadius: 1.5,
                py: 1,
                backgroundColor: isActive(item.path)
                  ? "rgba(255,255,255,0.15)"
                  : "transparent",
                "&:hover": {
                  backgroundColor: isActive(item.path)
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(255,255,255,0.08)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.path)
                    ? "white"
                    : "rgba(255,255,255,0.6)",
                  minWidth: 36,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: "0.875rem",
                  fontWeight: isActive(item.path) ? 600 : 400,
                  color: isActive(item.path)
                    ? "white"
                    : "rgba(255,255,255,0.7)",
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* User Info at bottom */}
      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
      <Box sx={{ px: 2.5, py: 2 }}>
        <Typography
          variant="body2"
          sx={{ color: "white", fontWeight: 500, fontSize: "0.8rem" }}
        >
          {user?.name}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "rgba(255,255,255,0.6)",
            textTransform: "capitalize",
            fontSize: "0.75rem",
          }}
        >
          {user?.role}
        </Typography>
      </Box>
    </Box>
  );
}