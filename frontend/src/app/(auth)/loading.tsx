import AppLoadingScreen from "@/components/ui/AppLoadingScreen";
import { getModuleLoadingCopy } from "@/components/ui/getModuleLoadingCopy";

export default function Loading() {
  const copy = getModuleLoadingCopy("/login");
  return (
    <AppLoadingScreen
      fullScreen
      title={copy.title}
      subtitle={copy.subtitle}
    />
  );
}
