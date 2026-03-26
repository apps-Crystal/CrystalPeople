import { cn } from "@/lib/utils";
import { getRatingBand } from "@/lib/utils";

interface RatingBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getRatingClass(score: number): string {
  if (score >= 4.5) return "rating-badge-5";
  if (score >= 3.5) return "rating-badge-4";
  if (score >= 2.5) return "rating-badge-3";
  if (score >= 1.5) return "rating-badge-2";
  return "rating-badge-1";
}

const SIZE_CLASSES = {
  sm: "text-[11px] px-1.5 py-0.5",
  md: "text-xs px-2 py-0.5",
  lg: "text-sm px-3 py-1",
};

export function RatingBadge({ score, showLabel = false, size = "sm", className }: RatingBadgeProps) {
  if (!score || score === 0) {
    return (
      <span className={cn("rating-badge bg-primary-50 text-text-secondary border border-border", SIZE_CLASSES[size], className)}>
        —
      </span>
    );
  }
  return (
    <span className={cn("rating-badge", getRatingClass(score), SIZE_CLASSES[size], className)}>
      {score.toFixed(1)}
      {showLabel && (
        <span className="ml-1 font-normal opacity-70 text-[10px]">{getRatingBand(score)}</span>
      )}
    </span>
  );
}

export function RatingDot({ score }: { score: number }) {
  const dotColor =
    score >= 4.5 ? "bg-success" :
    score >= 3.5 ? "bg-primary-600" :
    score >= 2.5 ? "bg-accent-500" :
    score >= 1.5 ? "bg-warning" :
    "bg-danger";
  return <span className={cn("inline-block w-2 h-2 rounded-full", dotColor)} />;
}
