"use client";

import { usePathname } from "next/navigation";
import AppLoadingScreen from "@/components/ui/AppLoadingScreen";
import { getModuleLoadingCopy } from "@/components/ui/getModuleLoadingCopy";

export default function Loading() {
  const pathname = usePathname();
  const copy = getModuleLoadingCopy(pathname);

  return <AppLoadingScreen title={copy.title} subtitle={copy.subtitle} />;
}
