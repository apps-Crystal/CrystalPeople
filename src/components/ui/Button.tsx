import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:   "bg-primary-600 hover:bg-primary-700 text-white border-primary-600 hover:border-primary-700",
  secondary: "bg-surface hover:bg-primary-50 text-text-primary border-border hover:border-primary-300",
  ghost:     "bg-transparent hover:bg-primary-50 text-text-secondary border-transparent",
  danger:    "bg-danger hover:bg-danger/90 text-white border-danger",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5 gap-1.5 h-7",
  md: "text-sm px-4 py-2 gap-2 h-9",
  lg: "text-sm px-5 py-2.5 gap-2 h-10",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-sm border transition-colors shadow-sm",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
    >
      {loading ? (
        <Loader2 size={13} className="animate-spin flex-shrink-0" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
