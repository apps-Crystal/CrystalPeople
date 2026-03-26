"use client";

import { usePathname } from "next/navigation";
import { AuthProvider, useCurrentUser } from "@/components/auth/AuthProvider";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

// Routes that render without sidebar/header
const BARE_PATHS = ["/auth/", "/welcome"];

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading } = useCurrentUser();

  const isBare = BARE_PATHS.some(p => pathname.startsWith(p));

  if (isBare) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-secondary">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 p-6 overflow-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ShellInner>{children}</ShellInner>
    </AuthProvider>
  );
}
