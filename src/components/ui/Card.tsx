import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md";
}

const PADDING = { none: "", sm: "p-4", md: "p-5" };

export function Card({ title, subtitle, action, children, className, padding = "md" }: CardProps) {
  return (
    <div className={cn("enterprise-card", className)}>
      {(title || action) && (
        <div className={cn("flex items-center justify-between border-b border-border px-5 py-3")}>
          <div>
            {title && <h3 className="text-sm font-semibold text-text-primary">{title}</h3>}
            {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0 ml-4">{action}</div>}
        </div>
      )}
      <div className={cn(padding === "none" ? "" : PADDING[padding], (title || action) ? "pt-4" : "")}>
        {children}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  color = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "default" | "green" | "blue" | "orange" | "red";
}) {
  const colorMap = {
    default: "text-text-primary",
    green:   "text-success",
    blue:    "text-primary-600",
    orange:  "text-warning",
    red:     "text-danger",
  };
  return (
    <div className="enterprise-card p-5">
      <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">{label}</p>
      <p className={cn("text-2xl font-bold mt-1 tabular-nums", colorMap[color])}>{value}</p>
      {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
    </div>
  );
}
