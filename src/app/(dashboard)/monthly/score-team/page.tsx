"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertCircle, Users, ChevronLeft, TriangleAlert, CheckCircle2,
  ChevronDown, ChevronRight, Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { cn, monthLabel, computeAverage, getWeekLabel } from "@/lib/utils";
import type { Employee, ReviewCycle, ScoreDimension, ConfigMap, WeeklyReflection, WeeklyCheckin } from "@/lib/types";

interface TeamMember {
  employee: Employee;
  cycle: ReviewCycle | null;
  dimensions: ScoreDimension[];
}

interface SingleEmployee {
  employee: Employee;
  cycle: ReviewCycle | null;
  dimensions: ScoreDimension[];
}

interface WeekContext {
  week_start: string;
  reflection: WeeklyReflection | null;
  checkin: WeeklyCheckin | null;
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

const TYPE_LABEL: Record<string, string> = { goal: "Goal", task: "Task", behaviour: "Behaviour" };
const TYPE_COLOR: Record<string, string> = {
  goal: "bg-primary-50 text-primary-700 border-primary-200",
  task: "bg-accent-500/10 text-accent-600 border-accent-500/30",
  behaviour: "bg-warning/10 text-warning border-warning/30",
};

const MOOD_EMOJI: Record<string, string> = {
  great: "😄", good: "🙂", neutral: "😐", stressed: "😟", bad: "😞",
};

function cycleStatusRow(status: string | null | undefined): string {
  if (!status || status === "pending") return "border-l-4 border-l-border";
  if (status === "self_scored") return "border-l-4 border-l-warning";
  if (status === "manager_scored") return "border-l-4 border-l-success";
  if (status === "acknowledged" || status === "locked") return "border-l-4 border-l-primary-600";
  return "";
}

export default function ScoreTeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [config, setConfig] = useState<ConfigMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [singleData, setSingleData] = useState<SingleEmployee | null>(null);
  const [singleLoading, setSingleLoading] = useState(false);

  // Scoring form state
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [nextMonthFocus, setNextMonthFocus] = useState("");
  const [scoreError, setScoreError] = useState("");
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreSuccess, setScoreSuccess] = useState(false);

  // Weekly context
  const [weeklyContext, setWeeklyContext] = useState<WeekContext[]>([]);
  const [weeklyOpen, setWeeklyOpen] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  // AI note validation
  const [aiChecking, setAiChecking] = useState(false);
  const [aiFlags, setAiFlags] = useState<string[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiChecked, setAiChecked] = useState(false);
  const [notesWereFlagged, setNotesWereFlagged] = useState(false);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    try {
      const [teamRes, configRes] = await Promise.all([
        fetch("/api/monthly/score-team"),
        fetch("/api/config"),
      ]);
      if (teamRes.ok) { const d = await teamRes.json(); setTeam(d.team ?? []); }
      if (configRes.ok) { const d = await configRes.json(); setConfig(d.config); }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  async function selectEmployee(empId: string) {
    setSelected(empId);
    setScores({});
    setComments("");
    setReviewNotes("");
    setNextMonthFocus("");
    setScoreError("");
    setScoreSuccess(false);
    setWeeklyContext([]);
    setWeeklyOpen(false);
    setExpandedWeeks(new Set());
    setAiFlags([]);
    setAiSuggestion("");
    setAiChecked(false);
    setNotesWereFlagged(false);
    setSingleLoading(true);
    try {
      const res = await fetch(`/api/monthly/score-team?employee_id=${empId}`);
      if (res.ok) {
        const data = await res.json();
        setSingleData(data);
        if (data.cycle?.Manager_Scores) {
          try { setScores(JSON.parse(data.cycle.Manager_Scores)); } catch { /* ignore */ }
        }
        if (data.cycle?.Manager_Comments) setComments(data.cycle.Manager_Comments);
        if (data.cycle?.Review_Notes) setReviewNotes(data.cycle.Review_Notes);
        if (data.cycle?.Next_Month_Focus) setNextMonthFocus(data.cycle.Next_Month_Focus);
      }
    } finally {
      setSingleLoading(false);
    }
    // Also fetch weekly context
    if (config) {
      fetch(`/api/monthly/weekly-context?employee_id=${empId}&month=${config.current_month}&year=${config.current_year}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.weeks) setWeeklyContext(d.weeks); })
        .catch(() => { /* ignore */ });
    }
  }

  function toggleWeek(weekStart: string) {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(weekStart)) { next.delete(weekStart); } else { next.add(weekStart); }
      return next;
    });
  }

  async function handleCheckNotes() {
    if (!singleData || !reviewNotes.trim()) return;
    setAiChecking(true);
    setAiFlags([]);
    setAiSuggestion("");
    setAiChecked(false);
    try {
      const res = await fetch("/api/monthly/validate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_notes: reviewNotes,
          employee_name: singleData.employee.Name,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setAiFlags(d.flags ?? []);
        setAiSuggestion(d.suggestion ?? "");
        setAiChecked(true);
        if (!d.isClean) setNotesWereFlagged(true);
      }
    } finally {
      setAiChecking(false);
    }
  }

  async function handleSubmitScore() {
    setScoreError("");
    if (!singleData) return;
    if (comments.trim().length < 20) {
      setScoreError("Manager comments must be at least 20 characters");
      return;
    }
    const missing = singleData.dimensions.find(d => scores[d.key] === undefined);
    if (missing) {
      setScoreError(`Please score: ${missing.label}`);
      return;
    }
    setScoreLoading(true);
    try {
      const res = await fetch("/api/monthly/manager-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: singleData.employee.Employee_ID,
          scores,
          comments,
          review_notes: reviewNotes,
          next_month_focus: nextMonthFocus,
          ai_note_flagged: notesWereFlagged,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setScoreError(data.error ?? "Failed to submit score"); return; }
      setScoreSuccess(true);
      await fetchTeam();
      setTimeout(() => { setSelected(null); setSingleData(null); setScoreSuccess(false); }, 1500);
    } finally {
      setScoreLoading(false);
    }
  }

  if (loading) return <PageLoader />;

  const currentLabel = config ? monthLabel(config.current_month, config.current_year) : "";
  const scored = team.filter(t => t.cycle && t.cycle.Status !== "pending" && t.cycle.Status !== "self_scored").length;
  const readyToScore = team.filter(t => t.cycle?.Status === "self_scored").length;

  // Individual scoring view
  if (selected) {
    if (singleLoading) return <PageLoader />;
    if (!singleData) return null;

    const { employee, cycle, dimensions } = singleData;
    const hasSelfScored = cycle?.Status === "self_scored" || cycle?.Status === "manager_scored" || cycle?.Status === "acknowledged";
    const alreadyManagerScored = cycle?.Status === "manager_scored" || cycle?.Status === "acknowledged" || cycle?.Status === "locked";
    let selfScores: Record<string, number> = {};
    if (cycle?.Self_Scores) { try { selfScores = JSON.parse(cycle.Self_Scores); } catch { /* ignore */ } }

    return (
      <div className="max-w-2xl space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelected(null); setSingleData(null); }}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={14} /> Team List
          </button>
        </div>

        <PageHeader
          title={`Scoring ${employee.Name}`}
          subtitle={`${employee.Department} · ${employee.Employee_Type === "white_collar" ? "White-collar" : "Blue-collar"} · ${currentLabel}`}
          action={cycle && <Badge variant={cycle.Status as "self_scored" | "manager_scored"} />}
        />

        {!hasSelfScored ? (
          <div className="enterprise-card p-5 text-center space-y-2">
            <AlertCircle size={24} className="text-warning mx-auto" />
            <p className="text-sm font-medium text-text-primary">Waiting for self-assessment</p>
            <p className="text-xs text-text-secondary">{employee.Name} hasn&apos;t completed their self-assessment yet.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {scoreSuccess && (
              <div className="flex items-center gap-2 text-xs text-success bg-success/10 border border-success/20 rounded-sm px-3 py-2">
                <CheckCircle2 size={13} /> Score submitted successfully! Returning to team list…
              </div>
            )}
            {scoreError && (
              <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
                <AlertCircle size={13} className="flex-shrink-0" /> {scoreError}
              </div>
            )}

            {/* ── Weekly Context ─────────────────────────────────────────── */}
            {weeklyContext.length > 0 && (
              <div className="enterprise-card overflow-hidden">
                <button
                  onClick={() => setWeeklyOpen(o => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary-50/50 transition-colors"
                >
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Weekly Context — {currentLabel}
                  </span>
                  {weeklyOpen ? <ChevronDown size={14} className="text-text-secondary" /> : <ChevronRight size={14} className="text-text-secondary" />}
                </button>
                {weeklyOpen && (
                  <div className="border-t border-border divide-y divide-border">
                    {weeklyContext.map(week => {
                      const isExpanded = expandedWeeks.has(week.week_start);
                      const moodEmoji = week.reflection?.Mood ? (MOOD_EMOJI[week.reflection.Mood.toLowerCase()] ?? "") : "";
                      const hasData = week.reflection || week.checkin;
                      return (
                        <div key={week.week_start}>
                          <button
                            onClick={() => toggleWeek(week.week_start)}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-primary-50/30 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown size={12} className="text-text-secondary" /> : <ChevronRight size={12} className="text-text-secondary" />}
                              <span className="text-xs font-medium text-text-primary">{getWeekLabel(week.week_start)}</span>
                              {moodEmoji && <span className="text-sm">{moodEmoji}</span>}
                            </div>
                            {!hasData && <span className="text-[11px] text-text-secondary italic">No submissions</span>}
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-3 space-y-3">
                              {!hasData ? (
                                <p className="text-xs text-text-secondary italic">No submissions this week.</p>
                              ) : (
                                <>
                                  {week.reflection && (
                                    <div className="space-y-1.5">
                                      <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Employee Reflection</p>
                                      <div className="text-xs space-y-1">
                                        {week.reflection.Accomplishments && (
                                          <p><span className="font-medium">Accomplishments:</span> {week.reflection.Accomplishments}</p>
                                        )}
                                        {week.reflection.Next_Week_Plan && (
                                          <p><span className="font-medium">Next Week Plan:</span> {week.reflection.Next_Week_Plan}</p>
                                        )}
                                        {week.reflection.Blockers && (
                                          <p><span className="font-medium text-warning">Blockers:</span> {week.reflection.Blockers}</p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  {week.checkin && (
                                    <div className="space-y-1.5 border-t border-border pt-2">
                                      <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Your Check-In</p>
                                      <div className="text-xs space-y-1">
                                        {week.checkin.Main_Thing_On_Mind && (
                                          <p><span className="font-medium">On their mind:</span> {week.checkin.Main_Thing_On_Mind}</p>
                                        )}
                                        {week.checkin.Committed_To && (
                                          <p><span className="font-medium">Committed to:</span> {week.checkin.Committed_To}</p>
                                        )}
                                        {week.checkin.Did_Well && (
                                          <p><span className="font-medium">Did well:</span> {week.checkin.Did_Well}</p>
                                        )}
                                        {week.checkin.Improve && (
                                          <p><span className="font-medium">To improve:</span> {week.checkin.Improve}</p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </>
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

            {/* Scoring grid */}
            <div className="enterprise-card overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto] gap-0">
                {/* Header */}
                <div className="px-4 py-2 bg-primary-50 border-b border-border text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Dimension</div>
                <div className="px-4 py-2 bg-primary-50 border-b border-border text-[11px] font-semibold text-text-secondary uppercase tracking-wide text-center">Self</div>
                <div className="px-4 py-2 bg-primary-50 border-b border-border text-[11px] font-semibold text-text-secondary uppercase tracking-wide text-center">Manager</div>

                {dimensions.map(dim => {
                  const selfScore = selfScores[dim.key];
                  const mgrScore = scores[dim.key];
                  const hasGap = selfScore !== undefined && mgrScore !== undefined && Math.abs(selfScore - mgrScore) > 1;

                  return (
                    <>
                      <div key={`${dim.key}-label`} className={cn("px-4 py-3 flex items-center gap-2 border-b border-border", hasGap && "bg-amber-50")}>
                        <span className={cn("inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-sm border flex-shrink-0", TYPE_COLOR[dim.type])}>
                          {TYPE_LABEL[dim.type]}
                        </span>
                        <span className="text-sm text-text-primary">{dim.label}</span>
                        {hasGap && <TriangleAlert size={12} className="text-amber-500 flex-shrink-0 ml-auto" />}
                      </div>

                      <div key={`${dim.key}-self`} className={cn("px-4 py-3 flex items-center justify-center border-b border-border", hasGap && "bg-amber-50")}>
                        <RatingBadge score={selfScore ?? 0} size="md" />
                      </div>

                      <div key={`${dim.key}-mgr`} className={cn("px-4 py-3 flex items-center justify-center border-b border-border", hasGap && "bg-amber-50")}>
                        {alreadyManagerScored ? (
                          <RatingBadge score={mgrScore ?? 0} size="md" />
                        ) : (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(v => (
                              <button
                                key={v}
                                onClick={() => setScores(prev => ({ ...prev, [dim.key]: v }))}
                                className={cn(
                                  "w-7 h-7 text-xs font-bold rounded-sm border transition-all",
                                  mgrScore === v ? SCORE_SELECTED[v] : SCORE_COLORS[v]
                                )}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })}
              </div>

              {/* Average */}
              {Object.keys(scores).length > 0 && (
                <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-primary-50">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Manager Average</span>
                  <RatingBadge score={computeAverage(Object.values(scores))} size="lg" />
                </div>
              )}
            </div>

            {/* Manager Comments */}
            {!alreadyManagerScored && (
              <div className="space-y-4">
                <div className="enterprise-card p-4 space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      Manager Comments *
                    </label>
                    <textarea
                      value={comments}
                      onChange={e => setComments(e.target.value)}
                      rows={3}
                      placeholder="Overall feedback for this employee (min 20 characters)…"
                      className="enterprise-input w-full resize-none text-sm py-2"
                    />
                    {comments.length > 0 && comments.trim().length < 20 && (
                      <p className="text-[11px] text-warning">Minimum 20 characters</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">
                        Review Notes (Private)
                      </label>
                      {reviewNotes.trim().length > 10 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={aiChecking}
                          onClick={handleCheckNotes}
                        >
                          <Sparkles size={12} className="mr-1" />
                          {aiChecked ? "Re-check Notes" : "Check Notes"}
                        </Button>
                      )}
                    </div>
                    <textarea
                      value={reviewNotes}
                      onChange={e => { setReviewNotes(e.target.value); setAiChecked(false); setNotesWereFlagged(false); }}
                      rows={3}
                      placeholder="Private notes about this review (not shown to employee)…"
                      className="enterprise-input w-full resize-none text-sm py-2"
                    />
                    {aiChecked && aiFlags.length === 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-success mt-1">
                        <CheckCircle2 size={12} /> Notes look good!
                      </div>
                    )}
                    {aiChecked && aiFlags.length > 0 && (
                      <div className="mt-2 space-y-1.5 bg-amber-50 border border-amber-200 rounded-sm p-3">
                        <p className="text-xs font-semibold text-amber-700">Review note concerns:</p>
                        {aiFlags.map((flag, i) => (
                          <p key={i} className="text-xs text-amber-600 flex items-start gap-1.5">
                            <TriangleAlert size={11} className="mt-0.5 flex-shrink-0" /> {flag}
                          </p>
                        ))}
                        {aiSuggestion && (
                          <p className="text-xs text-amber-800 mt-1 font-medium">Suggestion: {aiSuggestion}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      Next Month Focus
                    </label>
                    <textarea
                      value={nextMonthFocus}
                      onChange={e => setNextMonthFocus(e.target.value)}
                      rows={2}
                      placeholder="Key focus areas for next month…"
                      className="enterprise-input w-full resize-none text-sm py-2"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Button variant="secondary" size="sm" onClick={() => { setSelected(null); setSingleData(null); }}>
                    Cancel
                  </Button>
                  <Button size="sm" loading={scoreLoading} onClick={handleSubmitScore}>
                    Submit Score
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Team list view
  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader
        title={`Score My Team — ${currentLabel}`}
        subtitle={`${scored} of ${team.length} scored · ${readyToScore} ready to score`}
      />

      {team.length === 0 ? (
        <EmptyState icon={<Users size={20} />} title="No team members" description="You have no direct reports to score." />
      ) : (
        <div className="space-y-2">
          {team.map(({ employee, cycle }) => {
            const status = cycle?.Status ?? "pending";
            const canScore = status === "self_scored";
            return (
              <button
                key={employee.Employee_ID}
                onClick={() => selectEmployee(employee.Employee_ID)}
                className={cn("enterprise-card w-full text-left p-4 flex items-center gap-3 hover:bg-primary-50/50 transition-colors", cycleStatusRow(status))}
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
                  {employee.Name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-text-primary">{employee.Name}</p>
                    <Badge variant={status as "pending" | "self_scored" | "manager_scored" | "acknowledged" | "locked"} />
                    {canScore && <span className="text-[10px] text-success font-medium">Ready to score</span>}
                  </div>
                  <p className="text-[11px] text-text-secondary">
                    {employee.Department} · {employee.Employee_Type === "white_collar" ? "White-collar" : "Blue-collar"}
                  </p>
                </div>
                {cycle?.Locked_Average && (
                  <RatingBadge score={Number(cycle.Locked_Average)} size="sm" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}