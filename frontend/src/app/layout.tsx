import type { Metadata } from "next";
import ThemeRegistry from "@/components/ui/ThemeRegistry";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Membership Management Tracker",
  description: "Internal membership management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ThemeRegistry>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}