"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Box } from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import Sidebar, { SIDEBAR_WIDTH } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import AppLoadingScreen from "@/components/ui/AppLoadingScreen";
import { getModuleLoadingCopy } from "@/components/ui/getModuleLoadingCopy";
import { NavigationLoadingProvider } from "@/context/NavigationLoadingContext";

const getPageTitle = (pathname: string): string => {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/members/new")) return "Add Member";
  if (pathname.match(/\/members\/.+/)) return "Member Details";
  if (pathname === "/members") return "Members";
  if (pathname === "/plans") return "Plans";
  if (pathname === "/slots") return "Slots";
  if (pathname === "/pricing") return "Pricing Rules";
  if (pathname === "/audit-trail") return "Audit Trail";
  if (pathname === "/settings") return "Settings";
  if (pathname === "/users") return "Users";
  return "Membership Tracker";
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
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

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    const routesToWarm = [
      "/dashboard",
      "/members",
      "/members/new",
      ...(user?.role === "owner"
        ? ["/plans", "/slots", "/pricing", "/users", "/settings", "/audit-trail"]
        : []),
    ];

    const warmRoutes = () => {
      routesToWarm.forEach((route) => {
        router.prefetch(route);
      });
    };

    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(warmRoutes, { timeout: 1200 });
    } else {
      timeoutId = setTimeout(warmRoutes, 250);
    }

    return () => {
      if (idleId !== null && typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthenticated, isLoading, router, user?.role]);

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
            width: 0,
            marginLeft: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
            backgroundColor: "background.default",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            overflowX: "clip",
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
              p: { xs: 1, sm: 1.5, md: 2 },
              pt: { xs: 0.9, sm: 1.1, md: 1.25 },
              minWidth: 0,
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
              title={getModuleLoadingCopy(pendingPath).title || getPageTitle(pendingPath)}
              subtitle={getModuleLoadingCopy(pendingPath).subtitle}
            />
          </Box>
        ) : null}
      </Box>
    </NavigationLoadingProvider>
  );
}
