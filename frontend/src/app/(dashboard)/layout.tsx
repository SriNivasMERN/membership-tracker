"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

const SIDEBAR_WIDTH = 240;
const TOPBAR_HEIGHT = 64;

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
  // Local ready flag - prevents flash before auth check completes
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Give AuthContext one tick to restore session before rendering
    const timer = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready && !isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [ready, isLoading, isAuthenticated, router]);

  if (!ready || isLoading) {
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

  const pageTitle = getPageTitle(pathname);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Box
        sx={{
          flex: 1,
          marginLeft: `${SIDEBAR_WIDTH}px`,
          backgroundColor: "background.default",
          minHeight: "100vh",
        }}
      >
        <Topbar title={pageTitle} />
        <Box
          sx={{
            marginTop: `${TOPBAR_HEIGHT}px`,
            p: 3,
            minHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}