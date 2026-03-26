"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { AlertCircle, CheckCircle2, Flag, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { PageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, monthLabel, computeAverage, getRatingBand, safeJsonParse, fmtDateTime } from "@/lib/utils";
import type { ReviewCycle, ScoreDimension, Employee } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = { goal: "Goal", task: "Task", behaviour: "Behaviour" };
const TYPE_COLOR: Record<string, string> = {
  goal: "bg-primary-50 text-primary-700 border-primary-200",
  task: "bg-accent-500/10 text-accent-600 border-accent-500/30",
  behaviour: "bg-warning/10 text-warning border-warning/30",
};

interface ReviewData {
  cycle: ReviewCycle | null;
  dimensions: ScoreDimension[];
  employee: Employee;
}

export default function MyReviewPage() {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ackLoading, setAckLoading] = useState(false);
  const [ackError, setAckError] = useState("");

  const fetchReview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/monthly/my-review");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReview(); }, [fetchReview]);

  async function handleAcknowledge() {
    if (!data?.cycle) return;
    setAckError("");
    setAckLoading(true);
    try {
      const res = await fetch("/api/monthly/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycle_id: data.cycle.Cycle_ID }),
      });
      const json = await res.json();
      if (!res.ok) { setAckError(json.error ?? "Failed to acknowledge"); return; }
      setData(prev => prev ? { ...prev, cycle: json.cycle } : prev);
    } finally {
      setAckLoading(false);
    }
  }

  if (loading) return <PageLoader />;

  const cycle = data?.cycle ?? null;
  const dimensions = data?.dimensions ?? [];

  if (!cycle) {
    return (
      <div className="max-w-2xl space-y-5">
        <PageHeader title="My Monthly Review" />
        <EmptyState
          icon={<AlertCircle size={20} />}
          title="No review yet"
          description="Your review for this month hasn't started. Complete your self-assessment first."
        />
      </div>
    );
  }

  const label = monthLabel(Number(cycle.Month), Number(cycle.Year));
  const flagged = safeJsonParse<string[]>(cycle.Flagged_Dimensions, []);
  const lockedAvg = Number(cycle.Locked_Average ?? 0);
  const band = lockedAvg > 0 ? getRatingBand(lockedAvg) : null;

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        title={`Monthly Review — ${label}`}
        action={<Badge variant={cycle.Status as "self_scored" | "manager_scored" | "acknowledged" | "locked"} />}
      />

      {/* Status messages */}
      {cycle.Status === "self_scored" && (
        <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 border border-warning/20 rounded-sm px-3 py-2">
          <AlertCircle size={13} /> Waiting for your manager to complete scoring.
        </div>
      )}
      {(cycle.Status === "acknowledged" || cycle.Status === "locked") && (
        <div className="flex items-center gap-2 text-xs text-success bg-success/10 border border-success/20 rounded-sm px-3 py-2">
          <CheckCircle2 size={13} />
          You acknowledged this review{cycle.Acknowledged_At ? ` on ${fmtDateTime(cycle.Acknowledged_At)}` : ""}.
        </div>
      )}

      {/* Score comparison table — only show when manager has scored */}
      {(cycle.Status === "manager_scored" || cycle.Status === "acknowledged" || cycle.Status === "locked") && (
        <div className="enterprise-card overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] gap-0">
            <div className="px-4 py-2 bg-primary-50 border-b border-border text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Dimension</div>
            <div className="px-4 py-2 bg-primary-50 border-b border-border text-[11px] font-semibold text-text-secondary uppercase tracking-wide text-center min-w-[64px]">Self</div>
            <div className="px-4 py-2 bg-primary-50 border-b border-border text-[11px] font-semibold text-text-secondary uppercase tracking-wide text-center min-w-[80px]">Manager</div>

            {dimensions.map(dim => {
              const isFlagged = flagged.includes(dim.key);
              return (
                <Fragment key={dim.key}>
                  <div key={`${dim.key}-label`} className={cn("px-4 py-3 flex items-center gap-2 border-b border-border", isFlagged && "bg-amber-50")}>
                    <span className={cn("inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-sm border flex-shrink-0", TYPE_COLOR[dim.type])}>
                      {TYPE_LABEL[dim.type]}
                    </span>
                    <span className="text-sm text-text-primary">{dim.label}</span>
                    {isFlagged && <TriangleAlert size={12} className="text-amber-500 flex-shrink-0 ml-auto" />}
                  </div>
                  <div key={`${dim.key}-self`} className={cn("px-4 py-3 flex items-center justify-center border-b border-border", isFlagged && "bg-amber-50")}>
                    <RatingBadge score={dim.selfScore ?? 0} size="md" />
                  </div>
                  <div key={`${dim.key}-mgr`} className={cn("px-4 py-3 flex items-center justify-center border-b border-border", isFlagged && "bg-amber-50")}>
                    <RatingBadge score={dim.managerScore ?? 0} size="md" />
                  </div>
                </Fragment>
              );
            })}
          </div>

          {/* Summary */}
          {lockedAvg > 0 && (
            <div className="px-4 py-3 bg-primary-50 border-t border-border flex items-center justify-between">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
                Locked Average
              </span>
              <div className="flex items-center gap-2">
                <RatingBadge score={lockedAvg} size="md" showLabel />
                {band && <span className="text-xs text-text-secondary">— {band}</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Flagged dimensions notice */}
      {flagged.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2">
          <Flag size={13} className="flex-shrink-0 mt-0.5" />
          <span>
            <span className="font-semibold">{flagged.length} flagged dimension{flagged.length > 1 ? "s" : ""}:</span>{" "}
            A gap of more than 1 point was noted between your self-score and your manager&apos;s score.
          </span>
        </div>
      )}

      {/* Manager's Comments */}
      {cycle.Manager_Comments && (
        <div className="enterprise-card p-4 space-y-1">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Manager&apos;s Comments</p>
          <p className="text-sm text-text-primary whitespace-pre-wrap">{cycle.Manager_Comments}</p>
        </div>
      )}

      {/* Next Month Focus */}
      {cycle.Next_Month_Focus && (
        <div className="enterprise-card p-4 space-y-1">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Next Month Focus</p>
          <p className="text-sm text-text-primary whitespace-pre-wrap">{cycle.Next_Month_Focus}</p>
        </div>
      )}

      {/* Acknowledge section */}
      {cycle.Status === "manager_scored" && (
        <div className="enterprise-card p-4 space-y-3">
          <p className="text-sm text-text-primary">
            Your manager has completed their review. Please read the scores and notes above, then acknowledge to confirm you&apos;ve seen them.
          </p>
          {ackError && (
            <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
              <AlertCircle size={13} /> {ackError}
            </div>
          )}
          <Button onClick={handleAcknowledge} loading={ackLoading} size="md" className="w-full">
            Acknowledge Review
          </Button>
  