"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import {
  CheckCircle2, AlertCircle, Calendar, ChevronDown, ChevronRight,
  Flag, TriangleAlert,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { PageLoader } from "@/components/ui/Spinner";
import { cn, monthLabel, getRatingBand, safeJsonParse, fmtDateTime } from "@/lib/utils";
import type { ReviewCycle, ScoreDimension, ConfigMap } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelfScoreData {
  cycle: ReviewCycle | null;
  dimensions: ScoreDimension[];
  windowOpen: boolean;
  opensOnDay: number;
  lastDay: number;
  config: ConfigMap;
  history: ReviewCycle[];
}

interface ReviewData {
  cycle: ReviewCycle | null;
  dimensions: ScoreDimension[];
}

// ─── Style maps ───────────────────────────────────────────────────────────────

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

const TYPE_LABEL: Record<string, string> = { goal: "Goal", task: "Task", behaviour: "Behaviour" };
const TYPE_COLOR: Record<string, string> = {
  goal: "bg-primary-50 text-primary-700 border-primary-200",
  task: "bg-accent-500/10 text-accent-600 border-accent-500/30",
  behaviour: "bg-warning/10 text-warning border-warning/30",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MonthlyReviewPage() {
  const [selfData, setSelfData] = useState<SelfScoreData | null>(null);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"self" | "review">("self");

  // Self-score form state
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Acknowledge state
  const [ackLoading, setAckLoading] = useState(false);
  const [ackError, setAckError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [selfRes, reviewRes] = await Promise.all([
        fetch("/api/monthly/self-score"),
        fetch("/api/monthly/my-review"),
      ]);
      if (selfRes.ok) {
        const json: SelfScoreData = await selfRes.json();
        setSelfData(json);
        const existing: Record<string, number> = {};
        json.dimensions?.forEach(d => { if (d.selfScore !== undefined) existing[d.key] = d.selfScore; });
        setScores(existing);
        if (json.cycle?.Self_Comments) setComments(json.cycle.Self_Comments);
        // Auto-switch to review tab when manager has scored
        if (json.cycle?.Status === "manager_scored") setActiveTab("review");
      }
      if (reviewRes.ok) {
        const json: ReviewData = await reviewRes.json();
        setReviewData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleSubmit() {
    setSubmitError("");
    if (comments.trim().length < 20) { setSubmitError("Comments must be at least 20 characters"); return; }
    const missingDim = selfData?.dimensions.find(d => scores[d.key] === undefined);
    if (missingDim) { setSubmitError(`Please score: ${missingDim.label}`); return; }
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
      await fetchAll();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAcknowledge() {
    const cycle = reviewData?.cycle;
    if (!cycle) return;
    setAckError("");
    setAckLoading(true);
    try {
      const res = await fetch("/api/monthly/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycle_id: cycle.Cycle_ID }),
      });
      const json = await res.json();
      if (!res.ok) { setAckError(json.error ?? "Failed to acknowledge"); return; }
      setReviewData(prev => prev ? { ...prev, cycle: json.cycle } : prev);
    } finally {
      setAckLoading(false);
    }
  }

  if (loading) return <PageLoader />;
  if (!selfData) return null;

  const { cycle, dimensions, windowOpen, opensOnDay, lastDay, config, history } = selfData;
  const currentLabel = monthLabel(config.current_month, config.current_year);
  const alreadyScored = cycle && cycle.Status !== "pending";
  const allScored = dimensions.every(d => scores[d.key] !== undefined);
  const commentsValid = comments.trim().length >= 20;
  const noAssignments = dimensions.filter(d => d.type !== "behaviour").length === 0;
  const monthName = currentLabel.split(" ")[0];

  const reviewCycle = reviewData?.cycle ?? null;
  const reviewDimensions = reviewData?.dimensions ?? [];
  const hasPendingAck = reviewCycle?.Status === "manager_scored";

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Monthly Review" subtitle={currentLabel} />
        {alreadyScored && <Badge variant={cycle.Status as "self_scored" | "manager_scored" | "acknowledged" | "locked" | "pending"} />}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("self")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === "self"
              ? "border-primary-600 text-primary-700"
              : "border-transparent text-text-secondary hover:text-text-primary"
          )}
        >
          Self-Assessment
        </button>
        <button
          onClick={() => setActiveTab("review")}
          className={cn(
            "relative px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === "review"
              ? "border-primary-600 text-primary-700"
              : "border-transparent text-text-secondary hover:text-text-primary"
          )}
        >
          Manager Review
          {hasPendingAck && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-warning" />
          )}
        </button>
      </div>

      {/* ── Self-Assessment Tab ── */}
      {activeTab === "self" && (
        <div className="space-y-5">
          {/* Window status banner */}
          {!alreadyScored && (
            <div className={cn(
              "flex items-center gap-2 text-xs px-3 py-2 rounded-sm border",
              windowOpen
                ? "bg-success/5 border-success/20 text-success"
                : "bg-warning/5 border-warning/20 text-warning"
            )}>
              <Calendar size={13} className="flex-shrink-0" />
              {windowOpen
                ? `Scoring open — closes ${monthName} ${lastDay}`
                : `Scoring opens ${monthName} ${opensOnDay}`
              }
            </div>
          )}

          {noAssignments && !alreadyScored && (
            <div className="enterprise-card p-5 space-y-2">
              <AlertCircle size={20} className="text-warning" />
              <p className="text-sm font-semibold text-text-primary">No assignments for {currentLabel}</p>
              <p className="text-xs text-text-secondary">Your manager hasn&apos;t assigned any work items yet for this month.</p>
            </div>
          )}

          {submitted && (
            <div className="flex items-center gap-2 text-xs text-success bg-success/10 border border-success/20 rounded-sm px-3 py-2">
              <CheckCircle2 size={13} /> Self-assessment submitted successfully!
            </div>
          )}

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
            </div>
          ) : (
            <div className="space-y-5">
              {submitError && (
                <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
                  <AlertCircle size={13} className="flex-shrink-0" /> {submitError}
                </div>
              )}

              <div className="enterprise-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Rate each dimension (1–5)</h3>
                </div>
                <div className="divide-y divide-border">
                  {dimensions.map(dim => (
                    <div key={dim.key} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className={cn("inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-sm border", TYPE_COLOR[dim.type])}>
                            {TYPE_LABEL[dim.type]}
                          </span>
                          <span className="text-sm font-medium text-text-primary">{dim.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {[1, 2, 3, 4, 5].map(n => {
                            const isSelected = scores[dim.key] === n;
                            return (
                              <button
                                key={n}
                                type="button"
                                disabled={!windowOpen}
                                onClick={() => setScores(prev => ({ ...prev, [dim.key]: n }))}
                                className={cn(
                                  "w-8 h-8 rounded-sm border text-xs font-bold transition-all",
                                  !windowOpen && "opacity-40 cursor-not-allowed",
                                  windowOpen && (isSelected ? SCORE_SELECTED[n] : (SCORE_COLORS[n] + " opacity-70"))
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

              <div className="enterprise-card p-4 space-y-2">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Self-Comments *
                </label>
                <textarea
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  disabled={!windowOpen}
                  rows={4}
                  placeholder="Describe your achievements, challenges, and areas of growth this month..."
                  className="enterprise-input w-full resize-y min-h-[90px] text-sm py-2 disabled:opacity-50"
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
                disabled={!windowOpen || !allScored || !commentsValid || noAssignments}
                size="lg"
                className="w-full"
              >
                {submitting ? "Submitting…" : "Submit Self-Assessment"}
              </Button>
              {!windowOpen && (
                <p className="text-[11px] text-text-secondary text-center">
                  Scoring window opens on day {opensOnDay} of {currentLabel}
                </p>
              )}
              {windowOpen && !allScored && !noAssignments && (
                <p className="text-[11px] text-text-secondary text-center">
                  Score all {dimensions.length} dimensions to enable submit
                </p>
              )}
            </div>
          )}

          <PastReviews history={history} />
        </div>
      )}

      {/* ── Manager Review Tab ── */}
      {activeTab === "review" && (
        <ManagerReviewTab
          cycle={reviewCycle}
          dimensions={reviewDimensions}
          ackLoading={ackLoading}
          ackError={ackError}
          onAcknowledge={handleAcknowledge}
        />
      )}
    </div>
  );
}

// ─── Manager Review Tab ───────────────────────────────────────────────────────

function ManagerReviewTab({
  cycle, dimensions, ackLoading, ackError, onAcknowledge,
}: {
  cycle: ReviewCycle | null;
  dimensions: ScoreDimension[];
  ackLoading: boolean;
  ackError: string;
  onAcknowledge: () => void;
}) {
  if (!cycle || cycle.Status === "pending") {
    return (
      <div className="enterprise-card p-6 text-center space-y-2">
        <AlertCircle size={20} className="text-text-secondary mx-auto" />
        <p className="text-sm font-semibold text-text-primary">No manager review yet</p>
        <p className="text-xs text-text-secondary">
          Complete your self-assessment first. Once your manager scores you, the review will appear here.
        </p>
      </div>
    );
  }

  if (cycle.Status === "self_scored") {
    return (
      <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 border border-warning/20 rounded-sm px-3 py-2">
        <AlertCircle size={13} /> Waiting for your manager to complete scoring.
      </div>
    );
  }

  const flagged = safeJsonParse<string[]>(cycle.Flagged_Dimensions, []);
  const lockedAvg = Number(cycle.Locked_Average ?? 0);
  const band = lockedAvg > 0 ? getRatingBand(lockedAvg) : null;

  return (
    <div className="space-y-5">
      {(cycle.Status === "acknowledged" || cycle.Status === "locked") && (
        <div className="flex items-center gap-2 text-xs text-success bg-success/10 border border-success/20 rounded-sm px-3 py-2">
          <CheckCircle2 size={13} />
          You acknowledged this review{cycle.Acknowledged_At ? ` on ${fmtDateTime(cycle.Acknowledged_At)}` : ""}.
        </div>
      )}

      {/* Score comparison table */}
      <div className="enterprise-card overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-0">
          <div className="px-4 py-2 bg-primary-50 border-b border-border text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Dimension</div>
          <div className="px-4 py-2 bg-primary-50 border-b border-border text-[11px] font-semibold text-text-secondary uppercase tracking-wide text-center min-w-[64px]">Self</div>
          <div className="px-4 py-2 bg-primary-50 border-b border-border text-[11px] font-semibold text-text-secondary uppercase tracking-wide text-center min-w-[80px]">Manager</div>

          {dimensions.map(dim => {
            const isFlagged = flagged.includes(dim.key);
            return (
              <Fragment key={dim.key}>
                <div className={cn("px-4 py-3 flex items-center gap-2 border-b border-border", isFlagged && "bg-amber-50")}>
                  <span className={cn("inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-sm border flex-shrink-0", TYPE_COLOR[dim.type])}>
                    {TYPE_LABEL[dim.type]}
                  </span>
                  <span className="text-sm text-text-primary">{dim.label}</span>
                  {isFlagged && <TriangleAlert size={12} className="text-amber-500 flex-shrink-0 ml-auto" />}
                </div>
                <div className={cn("px-4 py-3 flex items-center justify-center border-b border-border", isFlagged && "bg-amber-50")}>
                  <RatingBadge score={dim.selfScore ?? 0} size="md" />
                </div>
                <div className={cn("px-4 py-3 flex items-center justify-center border-b border-border", isFlagged && "bg-amber-50")}>
                  <RatingBadge score={dim.managerScore ?? 0} size="md" />
                </div>
              </Fragment>
            );
          })}
        </div>

        {lockedAvg > 0 && (
          <div className="px-4 py-3 bg-primary-50 border-t border-border flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Locked Average</span>
            <div className="flex items-center gap-2">
              <RatingBadge score={lockedAvg} size="md" showLabel />
              {band && <span className="text-xs text-text-secondary">— {band}</span>}
            </div>
          </div>
        )}
      </div>

      {flagged.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2">
          <Flag size={13} className="flex-shrink-0 mt-0.5" />
          <span>
            <span className="font-semibold">{flagged.length} flagged dimension{flagged.length > 1 ? "s" : ""}:</span>{" "}
            A gap of more than 1 point was noted between your self-score and your manager&apos;s score.
          </span>
        </div>
      )}

      {cycle.Manager_Comments && (
        <div className="enterprise-card p-4 space-y-1">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Manager&apos;s Comments</p>
          <p className="text-sm text-text-primary whitespace-pre-wrap">{cycle.Manager_Comments}</p>
        </div>
      )}

      {cycle.Next_Month_Focus && (
        <div className="enterprise-card p-4 space-y-1">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Next Month Focus</p>
          <p className="text-sm text-text-primary whitespace-pre-wrap">{cycle.Next_Month_Focus}</p>
        </div>
      )}

      {cycle.Status === "manager_scored" && (
        <div className="enterprise-card p-4 space-y-3">
          <p className="text-sm text-text-primary">
            Your manager has completed their review. Read the scores and notes above, then acknowledge to confirm you&apos;ve seen them.
          </p>
          {ackError && (
            <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
              <AlertCircle size={13} /> {ackError}
            </div>
          )}
          <Button onClick={onAcknowledge} loading={ackLoading} size="md" className="w-full">
            Acknowledge Review
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Past Reviews ─────────────────────────────────────────────────────────────

function PastReviews({ history }: { history: ReviewCycle[] }) {
  const [open, setOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="enterprise-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-text-primary hover:bg-primary-50 transition-colors"
      >
        <span>Past Reviews {history.length > 0 ? `(${history.length})` : ""}</span>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {open && (
        <div className="border-t border-border">
          {history.length === 0 ? (
            <p className="text-xs text-text-secondary px-4 py-5">No past reviews yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {history.map(c => {
                const isExpanded = expandedIds.has(c.Cycle_ID);
                const selfScores = safeJsonParse<Record<string, number>>(c.Self_Scores, {});
                const mgrScores = safeJsonParse<Record<string, number>>(c.Manager_Scores, {});
                const label = monthLabel(Number(c.Month), Number(c.Year));
                return (
                  <div key={c.Cycle_ID}>
                    <button
                      onClick={() => toggle(c.Cycle_ID)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary-50/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded
                          ? <ChevronDown size={12} className="text-text-secondary" />
                          : <ChevronRight size={12} className="text-text-secondary" />
                        }
                        <span className="text-sm font-medium text-text-primary">{label}</span>
                        <Badge variant={c.Status as "self_scored" | "manager_scored" | "acknowledged" | "locked" | "pending"} />
                      </div>
                      {c.Locked_Average && <RatingBadge score={Number(c.Locked_Average)} size="sm" />}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 bg-primary-50/30">
                        {Object.keys(selfScores).length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">Scores</p>
                            <div className="space-y-1.5">
                              {Object.entries(selfScores).map(([key, selfScore]) => (
                                <div key={key} className="flex items-center justify-between">
                                  <span className="text-xs text-text-secondary font-mono truncate max-w-[180px]">{key}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-text-secondary">Self:</span>
                                    <RatingBadge score={selfScore} size="sm" />
                                    {mgrScores[key] !== undefined && (
                                      <>
                                        <span className="text-[11px] text-text-secondary">Mgr:</span>
                                        <RatingBadge score={mgrScores[key]} size="sm" />
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {c.Self_Comments && (
                          <div>
                            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-1">Your Comments</p>
                            <p className="text-xs text-text-primary whitespace-pre-wrap leading-relaxed">{c.Self_Comments}</p>
                          </div>
                        )}
                        {c.Next_Month_Focus && (
                          <div>
                            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-1">Next Month Focus</p>
                            <p className="text-xs text-text-primary whitespace-pre-wrap leading-relaxed">{c.Next_Month_Focus}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
