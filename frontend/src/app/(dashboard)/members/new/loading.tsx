import AppLoadingScreen from "@/components/ui/AppLoadingScreen";
import { getModuleLoadingCopy } from "@/components/ui/getModuleLoadingCopy";

export default function Loading() {
  const copy = getModuleLoadingCopy("/members/new");
  return <AppLoadingScreen title={copy.title} subtitle={copy.subtitle} />;
}
