import { cn } from "@/lib/utils";
import type { CycleStatus, GoalStatus, TaskStatus, NotificationStatus } from "@/lib/types";

type BadgeVariant =
  | "pending" | "active" | "locked" | "complete" | "dropped"
  | "inactive" | "self_scored" | "manager_scored" | "acknowledged"
  | "sent" | "read" | "escalation" | "default";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  pending:        "bg-warning/10 text-warning border-warning/30",
  active:         "bg-primary-50 text-primary-700 border-primary-200",
  locked:         "bg-primary-100 text-primary-800 border-primary-300",
  complete:       "bg-success/10 text-success border-success/30",
  dropped:        "bg-primary-50 text-text-secondary border-border",
  inactive:       "bg-primary-50 text-text-secondary border-border",
  self_scored:    "bg-primary-100 text-primary-700 border-primary-200",
  manager_scored: "bg-accent-500/10 text-accent-600 border-accent-500/30",
  acknowledged:   "bg-success/10 text-success border-success/30",
  sent:           "bg-primary-50 text-primary-700 border-primary-200",
  read:           "bg-primary-50 text-text-secondary border-border",
  escalation:     "bg-danger/10 text-danger border-danger/30",
  default:        "bg-primary-50 text-text-secondary border-border",
};

const VARIANT_LABELS: Record<BadgeVariant, string> = {
  pending: "Pending", active: "Active", locked: "Locked", complete: "Complete",
  dropped: "Dropped", inactive: "Inactive", self_scored: "Self-Scored",
  manager_scored: "Manager-Scored", acknowledged: "Acknowledged",
  sent: "Sent", read: "Read", escalation: "Escalation", default: "—",
};

interface BadgeProps {
  variant?: BadgeVariant;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function Badge({ variant = "default", label, size = "sm", className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center font-medium border rounded-sm",
      size === "sm" ? "text-[11px] px-1.5 py-0.5" : "text-xs px-2 py-1",
      VARIANT_CLASSES[variant],
      className
    )}>
      {label ?? VARIANT_LABELS[variant]}
    </span>
  );
}

export function cycleStatusBadge(status: CycleStatus) {
  return <Badge variant={status as BadgeVariant} />;
}
export function goalStatusBadge(status: GoalStatus) {
  const map: Record<GoalStatus, BadgeVariant> = { active: "active", completed: "complete", dropped: "dropped" };
  return <Badge variant={map[status]} />;
}
export function taskStatusBadge(status: TaskStatus) {
  return <Badge variant={status as BadgeVariant} />;
}
export function notifStatusBadge(status: NotificationStatus) {
  return <Badge variant={status as BadgeVariant} />;
}
