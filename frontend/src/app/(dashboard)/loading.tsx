"use client";

import { usePathname } from "next/navigation";
import AppLoadingScreen from "@/components/ui/AppLoadingScreen";

const getLoadingCopy = (pathname: string) => {
  if (pathname === "/dashboard") {
    return {
      title: "Dashboard",
      subtitle: "Preparing business overview...",
    };
  }

  if (pathname === "/members") {
    return {
      title: "Members",
      subtitle: "Preparing member records...",
    };
  }

  if (pathname.startsWith("/members/new")) {
    return {
      title: "Add Member",
      subtitle: "Preparing member setup...",
    };
  }

  if (pathname.startsWith("/members/")) {
    return {
      title: "Member Details",
      subtitle: "Preparing member workspace...",
    };
  }

  if (pathname === "/plans") {
    return {
      title: "Plans",
      subtitle: "Preparing membership plans...",
    };
  }

  if (pathname === "/slots") {
    return {
      title: "Slots",
      subtitle: "Preparing slot schedule...",
    };
  }

  if (pathname === "/pricing") {
    return {
      title: "Pricing Rules",
      subtitle: "Preparing pricing logic...",
    };
  }

  if (pathname === "/settings") {
    return {
      title: "Settings",
      subtitle: "Preparing business settings...",
    };
  }

  if (pathname === "/users") {
    return {
      title: "Users",
      subtitle: "Preparing user access...",
    };
  }

  return {
    title: "Membership Tracker",
    subtitle: "Preparing workspace...",
  };
};

export default function Loading() {
  const pathname = usePathname();
  const copy = getLoadingCopy(pathname);

  return <AppLoadingScreen title={copy.title} subtitle={copy.subtitle} />;
}
