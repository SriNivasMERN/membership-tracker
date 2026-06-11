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
  { label: "Users",         path: "/users",     icon: <PeopleAltOutlined />,     ownerOnly: true },
  { label: "Settings",      path: "/settings",  icon: <SettingsOutlined />,      ownerOnly: true },
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
        width: `calc(${SIDEBAR_WIDTH}px - 6px)`,
        ml: "6px",
        mb: "6px",
        backgroundColor: "primary.main",
        borderTop: "1px solid rgba(255,255,255,0.12)",
        borderTopRightRadius: "18px",
        borderBottomRightRadius: "18px",
        minHeight: "calc(100vh - 6px)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        boxShadow: "0 16px 28px rgba(15,23,42,0.12)",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          borderLeft: "1px solid rgba(255,255,255,0.12)",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          borderTopRightRadius: "18px",
          borderBottomRightRadius: "18px",
          boxShadow: "inset 1px 0 0 rgba(15,23,42,0.2), inset 0 -1px 0 rgba(15,23,42,0.2)",
        },
      }}
    >
      <Box>
        {/* Branding */}
        <Box
          sx={{
            px: 3,
            pt: 3,
            pb: 0,
            minHeight: 146,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: "white", fontWeight: 700, fontSize: "1rem", lineHeight: 1.3, textAlign: "center" }}
          >
            Membership Tracker
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
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

      <Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
        {/* Navigation */}
        <List
          sx={{
            px: 1.1,
            py: 2,
            display: "flex",
            flexDirection: "column",
            gap: 0.3,
          }}
        >
          {visibleItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: "18px",
                  px: 1.75,
                  py: 1.08,
                  background: isActive(item.path)
                    ? "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(214,228,245,0.12) 100%)"
                    : "transparent",
                  border: isActive(item.path)
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "1px solid transparent",
                  boxShadow: isActive(item.path)
                    ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 24px rgba(15,23,42,0.14)"
                    : "none",
                  transition: "background 0.18s ease, transform 0.15s ease, border-color 0.18s ease, box-shadow 0.18s ease",
                  "&:hover": {
                    background: isActive(item.path)
                      ? "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(214,228,245,0.15) 100%)"
                      : "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.025) 100%)",
                    borderColor: isActive(item.path)
                      ? "rgba(255,255,255,0.085)"
                      : "rgba(255,255,255,0.05)",
                    boxShadow: isActive(item.path)
                      ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 26px rgba(15,23,42,0.16)"
                      : "none",
                    transform: "translateX(2px)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path) ? "#F8FAFC" : "rgba(241,245,249,0.72)",
                    minWidth: 38,
                    transition: "color 0.18s ease",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    fontWeight: isActive(item.path) ? 700 : 500,
                    letterSpacing: -0.12,
                    color: isActive(item.path) ? "#F8FAFC" : "rgba(241,245,249,0.8)",
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
            backgroundColor: "transparent",
            boxShadow: "none",
            overflow: "hidden",
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
            backgroundColor: "transparent",
            boxShadow: "none",
            overflow: "hidden",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
