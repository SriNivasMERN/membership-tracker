"use client";

import { createContext, useContext } from "react";

type NavigationLoadingContextValue = {
  startNavigation: (path: string) => void;
};

const NavigationLoadingContext = createContext<NavigationLoadingContextValue>({
  startNavigation: () => {},
});

export function NavigationLoadingProvider({
  value,
  children,
}: {
  value: NavigationLoadingContextValue;
  children: React.ReactNode;
}) {
  return (
    <NavigationLoadingContext.Provider value={value}>
      {children}
    </NavigationLoadingContext.Provider>
  );
}

export function useNavigationLoading() {
  return useContext(NavigationLoadingContext);
}
