import { cn } from "@/lib/utils";

interface SpinnerProps { size?: "sm" | "md" | "lg"; className?: string; }

const SIZE_CLASSES = {
  sm: "w-4 h-4 border-2",
  md: "w-5 h-5 border-2",
  lg: "w-8 h-8 border-2",
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div className={cn("animate-spin rounded-full border-primary-600 border-t-transparent", SIZE_CLASSES[size], className)} />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-text-secondary">Loading…</p>
      </div>
    </div>
  );
}
