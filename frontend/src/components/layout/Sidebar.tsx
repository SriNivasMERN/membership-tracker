"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
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

export const SIDEBAR_WIDTH = 240;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  ownerOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard",     path: "/dashboard", icon: <DashboardOutlined /> },
  { label: "Members",       path: "/members",   icon: <PeopleOutlined /> },
  { label: "Plans",         path: "/plans",     icon: <FitnessCenterOutlined />, ownerOnly: true },
  { label: "Slots",         path: "/slots",     icon: <AccessTimeOutlined />,    ownerOnly: true },
  { label: "Pricing Rules", path: "/pricing",   icon: <AttachMoneyOutlined />,   ownerOnly: true },
  { label: "Settings",      path: "/settings",  icon: <SettingsOutlined />,      ownerOnly: true },
  { label: "Users",         path: "/users",     icon: <PeopleAltOutlined />,     ownerOnly: true },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const visibleItems = navItems.filter(
    (item) => !item.ownerOnly || user?.role === "owner"
  );

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    if (isMobile) onMobileClose();
  };

  const drawerContent = (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        backgroundColor: "primary.main",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box>
        {/* Branding */}
        <Box sx={{ px: 3, pt: 3, pb: 2 }}>
          <Typography
            variant="h6"
            sx={{ color: "white", fontWeight: 700, fontSize: "1rem", lineHeight: 1.3, textAlign: "center" }}
          >
            Membership Tracker
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", mt: 1.5 }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: "16px",
                border: "1px solid rgba(191,219,254,0.45)",
                backgroundColor: "rgba(239,246,255,0.16)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              <Typography sx={{ color: "#E0F2FE", fontWeight: 800, fontSize: "0.96rem", letterSpacing: 0.5 }}>
                MT
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: 2.5 }}>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
        {/* Navigation */}
        <List sx={{ px: 1.5, py: 2 }}>
          {visibleItems.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: 1.5,
                  py: 1.05,
                  backgroundColor: isActive(item.path)
                    ? "rgba(255,255,255,0.15)"
                    : "transparent",
                  transition: "background-color 0.15s ease, transform 0.15s ease",
                  "&:hover": {
                    backgroundColor: isActive(item.path)
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(255,255,255,0.08)",
                    transform: "translateX(1px)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path) ? "white" : "rgba(255,255,255,0.6)",
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
                    color: isActive(item.path) ? "white" : "rgba(255,255,255,0.7)",
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      <Box sx={{ mt: "auto" }}>
        {/* User info */}
        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
        <Box sx={{ px: 2.5, py: 2.25 }}>
          <Typography
            variant="body2"
            sx={{ color: "white", fontWeight: 600, fontSize: "0.82rem" }}
          >
            {user?.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.6)",
              textTransform: "capitalize",
              fontSize: "0.75rem",
              fontWeight: 500,
            }}
          >
            {user?.role}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile - temporary drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            border: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop - permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            border: "none",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
