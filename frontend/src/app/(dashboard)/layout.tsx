"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import Sidebar, { SIDEBAR_WIDTH } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

const getPageTitle = (pathname: string): string => {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/members/new")) return "Add Member";
  if (pathname.match(/\/members\/.+/)) return "Member Details";
  if (pathname === "/members") return "Members";
  if (pathname === "/plans") return "Plans";
  if (pathname === "/slots") return "Slots";
  if (pathname === "/pricing") return "Pricing Rules";
  if (pathname === "/settings") return "Settings";
  if (pathname === "/users") return "Users";
  return "Membership Tracker";
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Box
        sx={{
          flex: 1,
          marginLeft: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
          backgroundColor: "background.default",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Topbar
          title={getPageTitle(pathname)}
          onMenuClick={() => setMobileOpen(true)}
        />
        <Box
          sx={{
            flex: 1,
            mt: "64px",
            p: { xs: 2, sm: 3 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
