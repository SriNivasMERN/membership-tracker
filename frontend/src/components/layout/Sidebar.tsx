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
        <Box sx={{ px: 3, pt: 3 }}>
          <Typography
            variant="h6"
            sx={{ color: "white", fontWeight: 700, fontSize: "1rem", lineHeight: 1.3 }}
          >
            Membership Tracker
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
        {/* Navigation */}
        <List sx={{ px: 1.5, py: 2 }}>
          {visibleItems.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigate(item.path)}
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
