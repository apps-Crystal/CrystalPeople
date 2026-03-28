"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, ClipboardList, Briefcase,
  Users, Shield, TrendingUp,
  ChevronLeft, Menu, LogOut, Star, ShieldAlert,
  Clock, BarChart3, BarChart2, Settings,
} from "lucide-react";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import type { Role } from "@/lib/types";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  roles: (Role | "All")[];
  comingSoon?: boolean;
}

interface NavSection {
  label: string;
  roles: (Role | "All")[];
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "My",
    roles: ["All"],
    items: [
      { name: "Dashboard", href: "/overview", icon: BarChart2, roles: ["All"] },
      { name: "Quick Actions", href: "/dashboard", icon: LayoutDashboard, roles: ["All"] },
      { name: "My Reflection", href: "/weekly/reflection", icon: ClipboardList, roles: ["employee","manager","hr","md"] },
      { name: "My Review", href: "/monthly/self-score", icon: Star, roles: ["employee","manager","hr","md"] },
      { name: "My Tasks", href: "/assignments", icon: Briefcase, roles: ["employee"] },
      { name: "My Grievances", href: "/grievances", icon: ShieldAlert, roles: ["employee","manager","hr","md"] },
      { name: "Settings", href: "/settings", icon: Settings, roles: ["All"] },
    ],
  },
  {
    label: "My Team",
    roles: ["manager","hr","md"],
    items: [
      { name: "Weekly Check-In", href: "/weekly/checkin", icon: Users, roles: ["manager","hr","md"] },
      { name: "Review My Team", href: "/monthly/score-team", icon: TrendingUp, roles: ["manager","hr","md"] },
      { name: "Assigned Tasks", href: "/assignments", icon: Briefcase, roles: ["manager","hr","md"] },
      { name: "Team Overview", href: "/team", icon: BarChart3, roles: ["manager","hr","md"], comingSoon: true },
    ],
  },
  {
    label: "HR Admin",
    roles: ["hr","md"],
    items: [
      { name: "Employees", href: "/admin/employees", icon: Users, roles: ["hr","md"] },
      { name: "Grievances", href: "/admin/grievances", icon: ShieldAlert, roles: ["hr","md"] },
      { name: "Review Monitor", href: "/admin/monitoring", icon: Shield, roles: ["hr","md"] },
      { name: "Org Changes", href: "/admin/org-changes", icon: Users, roles: ["hr","md"], comingSoon: true },
      { name: "Increments", href: "/admin/increments", icon: TrendingUp, roles: ["hr","md"], comingSoon: true },
      { name: "Reports", href: "/admin/reports", icon: BarChart3, roles: ["hr","md"], comingSoon: true },
      { name: "Notifications", href: "/admin/notifications", icon: ClipboardList, roles: ["hr","md"], comingSoon: true },
      { name: "Config", href: "/admin/config", icon: Shield, roles: ["hr","md"], comingSoon: true },
    ],
  },
  {
    label: "Executive",
    roles: ["md"],
    items: [
      { name: "Exec Dashboard", href: "/executive", icon: TrendingUp, roles: ["md"], comingSoon: true },
      { name: "Approve Increments", href: "/executive/increments", icon: TrendingUp, roles: ["md"], comingSoon: true },
      { name: "Rating Overrides", href: "/executive/overrides", icon: Shield, roles: ["md"], comingSoon: true },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const role = user?.role ?? "employee";

  const canAccess = (roles: (Role | "All")[]) =>
    roles.includes("All") || roles.includes(role as Role);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth/login";
  }

  const visibleSections = navSections.filter(s => canAccess(s.roles));

  return (
    <div className={`flex flex-col bg-primary-900 border-r border-primary-800 text-white shadow-xl h-screen sticky top-0 transition-all duration-300 z-50 custom-scrollbar overflow-y-auto ${isCollapsed ? "w-16" : "w-60"}`}>

      {/* Logo */}
      <div className={`flex h-14 items-center border-b border-primary-800 bg-primary-900 shadow-sm flex-shrink-0 ${isCollapsed ? "justify-center" : "justify-between px-4"}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2 font-bold text-base tracking-tight overflow-hidden whitespace-nowrap">
            <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-sm bg-accent-500">
              <span className="text-primary-900 font-black text-xs">CP</span>
            </div>
            <span className="truncate text-white">Crystal People</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-primary-800 rounded-sm text-primary-300 hover:text-white transition-colors flex-shrink-0"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2 overflow-x-hidden">
        <nav className="space-y-4">
          {visibleSections.map((section, si) => {
            const visibleItems = section.items.filter(item => canAccess(item.roles));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label}>
                {/* Section header */}
                {!isCollapsed && (
                  <p className="px-2 mb-1 text-[10px] font-bold text-primary-500 uppercase tracking-widest">
                    {section.label}
                  </p>
                )}
                {isCollapsed && si > 0 && (
                  <div className="border-t border-primary-800/60 mb-1" />
                )}
                <div className="space-y-0.5">
                  {visibleItems.map(item => {
                    if (item.comingSoon) {
                      if (isCollapsed) return null;
                      return (
                        <div
                          key={item.href + item.name}
                          title={`${item.name} — Coming soon`}
                          className="flex items-center justify-between px-2 py-1.5 rounded-sm cursor-default"
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5 flex-shrink-0 text-primary-700" />
                            <span className="text-xs text-primary-600 truncate">{item.name}</span>
                          </div>
                          <span className="flex items-center gap-0.5 text-[9px] font-medium text-primary-600 flex-shrink-0 ml-1">
                            <Clock className="h-2.5 w-2.5" /> Soon
                          </span>
                        </div>
                      );
                    }

                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                    return (
                      <div key={item.href + item.name} className="relative group/navitem">
                        <Link
                          href={item.href}
                          title={item.name}
                          className={`group flex items-center py-2 text-sm font-medium rounded-sm transition-colors ${isCollapsed ? "justify-center px-0" : "px-2"} ${
                            isActive
                              ? (isCollapsed ? "bg-primary-800 text-accent-400" : "bg-primary-800 text-accent-400 border-l-2 border-accent-500")
                              : (isCollapsed ? "text-primary-100 hover:bg-primary-800 hover:text-white" : "text-primary-100 hover:bg-primary-800 hover:text-white border-l-2 border-transparent")
                          }`}
                        >
                          <item.icon className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? "" : "mr-3"} ${isActive ? "text-accent-500" : "text-primary-300 group-hover:text-primary-100"}`} />
                          {!isCollapsed && <span className="truncate">{item.name}</span>}
                        </Link>
                        {isCollapsed && (
                          <div className="absolute left-14 top-1 hidden group-hover/navitem:block bg-primary-800 text-white text-xs px-2 py-1 rounded-sm whitespace-nowrap z-[60] shadow-lg border border-primary-700">
                            {item.name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className={`p-4 border-t border-primary-800 bg-primary-900/50 flex-shrink-0 ${isCollapsed ? "flex flex-col items-center px-2" : ""}`}>
        <div className={`flex items-center gap-3 mb-3 w-full ${isCollapsed ? "justify-center" : ""}`}>
          <div
            title={user?.name ?? ""}
            className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center border border-primary-600 shadow-sm text-xs font-bold text-accent-100 flex-shrink-0"
          >
            {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium text-white leading-tight truncate">{user?.name ?? "Loading…"}</span>
              <span className="text-xs text-accent-400 leading-tight capitalize truncate">{user?.role ?? ""}</span>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Sign out"
          className={`flex w-full items-center py-1.5 text-xs font-medium text-primary-200 hover:text-white hover:bg-primary-800 rounded-sm transition-colors disabled:opacity-50 ${isCollapsed ? "justify-center px-0" : "px-2"}`}
        >
          <LogOut className={`h-4 w-4 flex-shrink-0 ${isCollapsed ? "" : "mr-2"}`} />
          {!isCollapsed && <span>{loggingOut ? "Signing out…" : "Sign out"}</span>}
        </button>
      </div>
    </div>
  );
}
