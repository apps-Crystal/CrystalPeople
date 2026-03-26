"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, ClipboardList, Briefcase,
  Users, Shield, TrendingUp,
  ChevronLeft, Menu, LogOut, Star, ChevronDown, ShieldAlert, Clock,
} from "lucide-react";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import type { Role } from "@/lib/types";

interface NavChild { name: string; href: string; roles?: Role[]; comingSoon?: boolean; }
interface NavItem {
  name: string; href?: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: (Role | "All")[];
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["All"] },
  { name: "Weekly Reflection", href: "/weekly/reflection", icon: ClipboardList, roles: ["employee","manager","hr","md"] },
  { name: "Monthly Review", href: "/monthly/self-score", icon: Star, roles: ["employee","manager","hr","md"] },
  { name: "My Assignments", href: "/assignments", icon: Briefcase, roles: ["employee","manager","hr","md"] },
  { name: "Grievances", href: "/grievances", icon: ShieldAlert, roles: ["employee","manager","hr","md"] },
  {
    name: "My Team", icon: Users, roles: ["manager","hr","md"],
    children: [
      { name: "Team Overview", href: "/team", comingSoon: true },
      { name: "Weekly Check-In", href: "/weekly/checkin" },
      { name: "Score My Team", href: "/monthly/score-team" },
      { name: "Assignments", href: "/assignments" },
    ],
  },
  {
    name: "HR Admin", icon: Shield, roles: ["hr","md"],
    children: [
      { name: "Employees", href: "/admin/employees" },
      { name: "Grievances", href: "/admin/grievances" },
      { name: "Review Monitor", href: "/admin/monitoring" },
      { name: "Org Changes", href: "/admin/org-changes", comingSoon: true },
      { name: "Increments", href: "/admin/increments", comingSoon: true },
      { name: "Reports", href: "/admin/reports", comingSoon: true },
      { name: "Notifications", href: "/admin/notifications", comingSoon: true },
      { name: "Config", href: "/admin/config", comingSoon: true },
    ],
  },
  {
    name: "Executive", icon: TrendingUp, roles: ["md"],
    children: [
      { name: "Exec Dashboard", href: "/executive", comingSoon: true },
      { name: "Approve Increments", href: "/executive/increments", comingSoon: true },
      { name: "Rating Overrides", href: "/executive/overrides", comingSoon: true },
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
      <div className="flex-1 overflow-y-auto py-4 px-2 overflow-x-hidden">
        <nav className="space-y-1">
          {navItems.filter(item => canAccess(item.roles)).map((item) => {
            // Filter out coming-soon children for active nav rendering
            const activeChildren = item.children?.filter(c => !c.comingSoon && (!c.roles || canAccess(c.roles as Role[])));
            // Hide groups where all children are coming soon
            if (!item.href && activeChildren?.length === 0) return null;

            const isActive = item.href
              ? pathname === item.href
              : (activeChildren?.some(c => pathname === c.href || pathname.startsWith(c.href + "/")) ?? false);

            return (
              <div key={item.name} className="flex flex-col relative group/navitem">
                {item.href ? (
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
                ) : (
                  <div className="mb-1">
                    <div
                      onClick={() => isCollapsed && setIsCollapsed(false)}
                      title={item.name}
                      className={`group flex items-center py-2 text-sm font-medium rounded-sm text-primary-100 hover:bg-primary-800 hover:text-white cursor-pointer ${isCollapsed ? "justify-center px-0" : "justify-between px-2"}`}
                    >
                      <div className="flex items-center min-w-0">
                        <item.icon className={`h-5 w-5 flex-shrink-0 text-primary-300 group-hover:text-primary-100 ${isCollapsed ? "" : "mr-3"}`} />
                        {!isCollapsed && <span className="truncate">{item.name}</span>}
                      </div>
                      {!isCollapsed && <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />}
                    </div>
                    {!isCollapsed && activeChildren && (
                      <div className="mt-1 space-y-1 pl-9">
                        {activeChildren.map((child) => {
                            const isChildActive = pathname === child.href || pathname.startsWith(child.href + "/");
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={`flex items-center px-2 py-1.5 text-xs font-medium rounded-sm transition-colors ${isChildActive ? "text-accent-400 font-semibold" : "text-primary-200 hover:text-white hover:bg-primary-800/50"}`}
                              >
                                <span className="truncate">{child.name}</span>
                              </Link>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
                {isCollapsed && (
                  <div className="absolute left-14 top-1 hidden group-hover/navitem:block bg-primary-800 text-white text-xs px-2 py-1 rounded-sm whitespace-nowrap z-[60] shadow-lg border border-primary-700">
                    {item.name}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Coming Soon section */}
        {!isCollapsed && (() => {
          const comingSoonItems = navItems
            .filter(item => canAccess(item.roles))
            .flatMap(item =>
              item.children
                ? item.children.filter(c => c.comingSoon && (!c.roles || canAccess(c.roles as Role[]))).map(c => ({ ...c, group: item.name }))
                : []
            );
          if (comingSoonItems.length === 0) return null;
          return (
            <div className="mt-4 pt-4 border-t border-primary-800/60">
              <div className="flex items-center gap-1.5 px-2 mb-2">
                <Clock className="h-3 w-3 text-primary-500" />
                <span className="text-[10px] font-semibold text-primary-500 uppercase tracking-widest">Coming Soon</span>
              </div>
              <div className="space-y-0.5">
                {comingSoonItems.map(item => (
                  <div
                    key={item.href}
                    title={`${item.name} — Coming soon`}
                    className="flex items-center justify-between px-2 py-1.5 rounded-sm cursor-default"
                  >
                    <span className="text-xs text-primary-600 truncate">{item.name}</span>
                    <span className="text-[9px] font-medium text-primary-600 bg-primary-800 px-1.5 py-0.5 rounded-sm flex-shrink-0 ml-1">Soon</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
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
