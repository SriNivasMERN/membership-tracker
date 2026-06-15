"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Box } from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import Sidebar, { SIDEBAR_WIDTH } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import AppLoadingScreen from "@/components/ui/AppLoadingScreen";
import { NavigationLoadingProvider } from "@/context/NavigationLoadingContext";

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

const getLoadingSubtitle = (pathname: string): string => {
  if (pathname === "/dashboard") return "Preparing business overview...";
  if (pathname.startsWith("/members/new")) return "Preparing member setup...";
  if (pathname.match(/\/members\/.+/)) return "Preparing member workspace...";
  if (pathname === "/members") return "Preparing member records...";
  if (pathname === "/plans") return "Preparing membership plans...";
  if (pathname === "/slots") return "Preparing slot schedule...";
  if (pathname === "/pricing") return "Preparing pricing logic...";
  if (pathname === "/settings") return "Preparing business settings...";
  if (pathname === "/users") return "Preparing user access...";
  return "Preparing workspace...";
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
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <AppLoadingScreen fullScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <NavigationLoadingProvider
      value={{
        startNavigation: (nextPath) => setPendingPath(nextPath),
      }}
    >
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          onNavigateStart={(nextPath) => setPendingPath(nextPath)}
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
              p: { xs: 1.5, sm: 2 },
              pt: { xs: 1, sm: 1.25 },
            }}
          >
            {children}
          </Box>
        </Box>
        {pendingPath ? (
          <Box
            sx={{
              position: "fixed",
              inset: 0,
              zIndex: 1400,
            }}
          >
            <AppLoadingScreen
              fullScreen
              title={getPageTitle(pendingPath)}
              subtitle={getLoadingSubtitle(pendingPath)}
            />
          </Box>
        ) : null}
      </Box>
    </NavigationLoadingProvider>
  );
}
