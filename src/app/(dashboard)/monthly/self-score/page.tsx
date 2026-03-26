"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Target, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { PageLoader } from "@/components/ui/Spinner";
import { cn, monthLabel } from "@/lib/utils";
import type { ReviewCycle, ScoreDimension, ConfigMap } from "@/lib/types";

interface SelfScoreData {
  cycle: ReviewCycle | null;
  dimensions: ScoreDimension[];
  windowOpen: boolean;
  config: ConfigMap;
}

const SCORE_COLORS: Record<number, string> = {
  1: "bg-red-100 text-red-700 border-red-300 hover:bg-red-200",
  2: "bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200",
  3: "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200",
  4: "bg-teal-100 text-teal-700 border-teal-300 hover:bg-teal-200",
  5: "bg-green-100 text-green-700 border-green-300 hover:bg-green-200",
};

const SCORE_SELECTED: Record<number, string> = {
  1: "bg-red-500 text-white border-red-500 scale-110",
  2: "bg-orange-500 text-white border-orange-500 scale-110",
  3: "bg-blue-500 text-white border-blue-500 scale-110",
  4: "bg-teal-500 text-white border-teal-500 scale-110",
  5: "bg-green-500 text-white border-green-500 scale-110",
};

const TYPE_LABEL: Record<string, string> = {
  goal: "Goal",
  task: "Task",
  behaviour: "Behaviour",
};

const TYPE_COLOR: Record<string, string> = {
  goal: "bg-primary-50 text-primary-700 border-primary-200",
  task: "bg-accent-500/10 text-accent-600 border-accent-500/30",
  behaviour: "bg-warning/10 text-warning border-warning/30",
};

export default function SelfScorePage() {
  const [data, setData] = useState<SelfScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/monthly/self-score");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        // Pre-populate existing scores
        if (json.dimensions) {
          const existing: Record<string, number> = {};
          (json.dimensions as ScoreDimension[]).forEach(d => {
            if (d.selfScore !== undefined) existing[d.key] = d.selfScore;
          });
          setScores(existing);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSubmit() {
    setSubmitError("");
    if (comments.trim().length < 20) {
      setSubmitError("Comments must be at least 20 characters");
      return;
    }
    const missingDim = data?.dimensions.find(d => scores[d.key] === undefined);
    if (missingDim) {
      setSubmitError(`Please score: ${missingDim.label}`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/monthly/self-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores, comments }),
      });
      const json = await res.json();
      if (!res.ok) { setSubmitError(json.error ?? "Submission failed"); return; }
      setSubmitted(true);
      await fetchData();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageLoader />;
  if (!data) return null;

  const { cycle, dimensions, windowOpen, config } = data;
  const currentLabel = monthLabel(config.current_month, config.current_year);
  const alreadyScored = cycle && cycle.Status !== "pending";
  const allScored = dimensions.every(d => scores[d.key] !== undefined);
  const commentsValid = comments.trim().length >= 20;

  // Window closed for employee
  if (!windowOpen && !alreadyScored) {
    return (
      <div className="max-w-lg space-y-4">
        <PageHeader title="Monthly Self-Assessment" subtitle={currentLabel} />
        <div className="enterprise-card p-5 space-y-3">
          <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
            <AlertCircle size={20} className="text-warning" />
          </div>
          <p className="text-sm font-semibold text-text-primary">Scoring window is closed</p>
          <p className="text-xs text-text-secondary leading-relaxed">
            The self-scoring window for <strong>{currentLabel}</strong> is currently closed.
            It opens on day <strong>{config.window_open_day}</strong> and closes on day <strong>{config.window_close_day}</strong>.
          </p>
        </div>
      </div>
    );
  }

  // No goals/tasks — can't score
  const noScoringItems = dimensions.filter(d => d.type !== "behaviour").length === 0;
  if (noScoringItems && !alreadyScored) {
    const isGoalBased = true; // will be refined per employee type
    return (
      <div className="max-w-lg space-y-4">
        <PageHeader title="Monthly Self-Assessment" subtitle={currentLabel} />
        <div className="enterprise-card p-5 space-y-3">
          <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
            {isGoalBased ? <Target size={20} className="text-primary-600" /> : <ClipboardList size={20} className="text-primary-600" />}
          </div>
          <p className="text-sm font-semibold text-text-primary">No goals set for {currentLabel}</p>
          <p className="text-xs text-text-secondary leading-relaxed">
            You need at least <strong>{config.min_goals}</strong> active goals before self-scoring.
          </p>
          <Link href="/goals" className="inline-flex items-center gap-1.5 text-xs text-primary-600 font-medium hover:underline">
            Go to My Goals →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Monthly Self-Assessment" subtitle={currentLabel} />
        {alreadyScored && <Badge variant="self_scored" label="Self-Scored ✓" size="md" />}
      </div>

      {/* Read-only view after scoring */}
      {alreadyScored ? (
        <div className="space-y-4">
          <div className="enterprise-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Your Scores</h3>
            </div>
            <div className="divide-y divide-border">
              {dimensions.map(dim => (
                <div key={dim.key} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-sm border", TYPE_COLOR[dim.type])}>
                      {TYPE_LABEL[dim.type]}
                    </span>
                    <span className="text-sm text-text-primary">{dim.label}</span>
                  </div>
                  <RatingBadge score={dim.selfScore ?? 0} size="md" />
                </div>
              ))}
            </div>
          </div>
          {cycle?.Self_Comments && (
            <div className="enterprise-card p-4">
              <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">Your Comments</p>
              <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{cycle.Self_Comments}</p>
            </div>
          )}
          {cycle?.Status === "manager_scored" && cycle.Next_Month_Focus && (
            <div className="enterprise-card p-4 border-l-4 border-l-accent-500">
              <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">Next Month Focus (from Manager)</p>
              <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{cycle.Next_Month_Focus}</p>
            </div>
          )}
          {cycle?.Status === "manager_scored" && (
            <div className="enterprise-card p-4 bg-success/5 border border-success/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} className="text-success" />
                <span className="text-xs font-semibold text-success">Manager has scored you</span>
              </div>
              <p className="text-xs text-text-secondary">
                Average score: <strong>{cycle.Locked_Average}</strong>
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Scoring form */
        <div className="space-y-5">
          {submitError && (
            <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
              <AlertCircle size={13} className="flex-shrink-0" /> {submitError}
            </div>
          )}

          {/* Dimensions */}
          <div className="enterprise-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Rate each dimension (1–5)</h3>
            </div>
            <div className="divide-y divide-border">
              {dimensions.map(dim => (
                <div key={dim.key} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-sm border", TYPE_COLOR[dim.type])}>
                          {TYPE_LABEL[dim.type]}
                        </span>
                        <span className="text-sm font-medium text-text-primary">{dim.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {[1, 2, 3, 4, 5].map(n => {
                        const isSelected = scores[dim.key] === n;
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setScores(prev => ({ ...prev, [dim.key]: n }))}
                            className={cn(
                              "w-8 h-8 rounded-sm border text-xs font-bold transition-all",
                              isSelected ? SCORE_SELECTED[n] : (SCORE_COLORS[n] + " opacity-70")
                            )}
                          >
                            {n}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="enterprise-card p-4 space-y-2">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Self-Comments *
            </label>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={4}
              placeholder="Describe your achievements, challenges, and areas of growth this month..."
              className="enterprise-input w-full resize-y min-h-[90px] text-sm py-2"
            />
            <div className="flex items-center justify-between">
              {comments.length > 0 && comments.trim().length < 20 && (
                <p className="text-[11px] text-warning">Minimum 20 characters ({comments.trim().length}/20)</p>
              )}
              <p className={cn("text-[11px] ml-auto", commentsValid ? "text-success" : "text-text-secondary")}>
                {comments.trim().length} characters
              </p>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={!allScored || !commentsValid}
            size="lg"
            className="w-full"
          >
            {submitting ? "Submitting…" : "Submit Self-Assessment"}
          </Button>
          {!allScored && (
            <p className="text-[11px] text-text-secondary text-center">
              Score all {dimensions.length} dimensions to enable submit
            </p>
          )}
        </div>
      )}
    </div>
  );
}
