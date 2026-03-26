"use client";

import { useState } from "react";
import { LogOut, ChevronDown, User, ShieldAlert, RefreshCw } from "lucide-react";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import { NotificationBell } from "@/components/ui/NotificationBell";

const ROLE_LABELS: Record<string, string> = {
  employee: "Employee",
  manager: "Manager",
  hr: "HR",
  md: "MD / CEO",
};

export function Header() {
  const { user } = useCurrentUser();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth/login";
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 w-full items-center justify-between border-b border-border bg-surface px-4 shadow-sm flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium px-2 py-0.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-sm">
          Crystal People
        </span>
        <span className="text-sm font-medium px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded-sm flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
          System Online
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => { setRefreshing(true); window.location.reload(); }}
          disabled={refreshing}
          title="Refresh"
          className="text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>

        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(o => !o)}
            className="flex items-center gap-2 h-8 px-2 rounded-sm hover:bg-primary-50 border border-transparent hover:border-border transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-primary-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() ?? <User className="w-3 h-3" />}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-text-primary leading-none">{user?.name ?? "Loading…"}</div>
              <div className="text-[10px] text-text-secondary leading-none mt-0.5">{user?.role ? ROLE_LABELS[user.role] : ""}</div>
            </div>
            <ChevronDown className="w-3 h-3 text-text-secondary" />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-56 bg-surface border border-border rounded-sm shadow-lg z-20 py-1">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-semibold text-text-primary">{user?.name}</p>
                  <p className="text-[11px] text-text-secondary">{user?.email}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ShieldAlert className="w-3 h-3 text-primary-500" />
                    <span className="text-[10px] text-primary-600 font-medium">
                      {user?.role ? ROLE_LABELS[user.role] : ""}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {loggingOut ? "Signing out…" : "Sign Out"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
