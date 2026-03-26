"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Info, AlertCircle, Clock, Megaphone } from "lucide-react";
import { cn, fmtDateTime } from "@/lib/utils";
import type { Notification, NotificationType } from "@/lib/types";

function typeIcon(type: NotificationType) {
  switch (type) {
    case "window_open":
    case "window_close":
      return <Clock size={12} className="text-primary-500 flex-shrink-0" />;
    case "escalation":
      return <AlertCircle size={12} className="text-danger flex-shrink-0" />;
    case "manual":
      return <Megaphone size={12} className="text-accent-600 flex-shrink-0" />;
    default:
      return <Info size={12} className="text-text-secondary flex-shrink-0" />;
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) {
        const d = await res.json();
        setNotifications(d.notifications ?? []);
        setUnreadCount(d.unread_count ?? 0);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function markRead(ids: string[]) {
    await fetch("/api/notifications/read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_ids: ids }),
    });
    setNotifications(prev => prev.map(n => ids.includes(n.Notification_ID) ? { ...n, Status: "read" } : n));
    setUnreadCount(prev => Math.max(0, prev - ids.filter(id => notifications.find(n => n.Notification_ID === id && n.Status !== "read")).length));
  }

  async function markAllRead() {
    const unreadIds = notifications.filter(n => n.Status !== "read").map(n => n.Notification_ID);
    if (unreadIds.length === 0) return;
    await markRead(unreadIds);
  }

  async function handleNotifClick(notif: Notification) {
    if (notif.Status !== "read") {
      await markRead([notif.Notification_ID]);
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative text-text-secondary hover:text-text-primary transition-colors"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-danger rounded-full leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-sm shadow-lg z-30 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-primary-50">
            <span className="text-xs font-semibold text-text-primary">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-primary-600 hover:text-primary-800 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-text-secondary">
              No notifications yet.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifications.map(notif => (
                <button
                  key={notif.Notification_ID}
                  onClick={() => handleNotifClick(notif)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-primary-50/50 transition-colors",
                    notif.Status !== "read" && "bg-primary-50"
                  )}
                >
                  <div className="mt-0.5">{typeIcon(notif.Type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs leading-snug", notif.Status !== "read" ? "text-text-primary font-medium" : "text-text-secondary")}>
                      {notif.Message}
                    </p>
                    <p className="text-[10px] text-text-secondary mt-0.5">
                      {notif.Created_At ? fmtDateTime(notif.Created_At) : ""}
                    </p>
                  </div>
                  {notif.Status !== "read" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0 mt-1" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
