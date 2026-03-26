"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, AlertCircle, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Spinner, PageLoader } from "@/components/ui/Spinner";
import { cn, getWeekStart, getWeekLabel, fmtDateTime } from "@/lib/utils";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import type { WeeklyReflection } from "@/lib/types";

// ─── Mood config ─────────────────────────────────────────────────────────────

const MOODS = [
  { value: 1, emoji: "😞", label: "Low" },
  { value: 2, emoji: "😕", label: "Below Avg" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Great" },
] as const;

interface Checkin {
  Checkin_ID: string;
  Did_Well: string;
  Improve: string;
  Submitted_At: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReflectionPage() {
  const { user } = useCurrentUser();
  const week = getWeekStart();

  const [reflection, setReflection] = useState<WeeklyReflection | null>(null);
  const [checkin, setCheckin] = useState<Checkin | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<WeeklyReflection[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form state
  const [accomplishments, setAccomplishments] = useState("");
  const [nextWeekPlan, setNextWeekPlan] = useState("");
  const [blockers, setBlockers] = useState("");
  const [mood, setMood] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Acknowledge state
  const [ackLoading, setAckLoading] = useState(false);
  const [ackDone, setAckDone] = useState(false);

  const fetchCurrent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/weekly/reflection?week=${week}`);
      if (!res.ok) return;
      const data = await res.json();
      setReflection(data.reflection ?? null);
      if (data.reflection?.Acknowledged_At) setAckDone(true);
    } finally {
      setLoading(false);
    }
  }, [week]);

  const fetchCheckin = useCallback(async () => {
    if (!user?.userId) return;
    const res = await fetch(`/api/weekly/checkin?employee_id=${user.userId}`);
    if (res.ok) {
      const data = await res.json();
      setCheckin(data.checkin ?? null);
    }
  }, [user?.userId]);

  useEffect(() => { fetchCurrent(); }, [fetchCurrent]);
  useEffect(() => { if (reflection && user) fetchCheckin(); }, [reflection, user, fetchCheckin]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!mood) { setError("Please select your mood"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/weekly/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accomplishments, next_week_plan: nextWeekPlan, blockers, mood }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to submit"); return; }
      await fetchCurrent();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAcknowledge() {
    setAckLoading(true);
    try {
      const res = await fetch("/api/weekly/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkin_id: checkin?.Checkin_ID }),
      });
      if (res.ok) { setAckDone(true); await fetchCurrent(); }
    } finally {
      setAckLoading(false);
    }
  }

  async function loadHistory() {
    if (historyLoading) return;
    const willOpen = !historyOpen;
    setHistoryOpen(willOpen);
    if (willOpen && history.length === 0) {
      setHistoryLoading(true);
      try {
        const res = await fetch("/api/weekly/reflection/history");
        if (res.ok) {
          const data = await res.json();
          setHistory(
            (data.reflections as WeeklyReflection[]).filter(r => r.Week_Start_Date !== week).slice(0, 8)
          );
        }
      } finally {
        setHistoryLoading(false);
      }
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageHeader title="Weekly Reflection" />
          <p className="text-xs text-text-secondary mt-0.5">{getWeekLabel(week)}</p>
        </div>
        {reflection && <Badge variant="complete" label="Submitted ✓" size="md" />}
      </div>

      {/* ── Submitted view ── */}
      {reflection ? (
        <div className="space-y-4">
          <ReadOnlyReflection reflection={reflection} />

          {checkin ? (
            <div className="enterprise-card p-4 border-l-4 border-l-accent-500">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={14} className="text-accent-500" />
                <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide">Manager Feedback</h3>
                {ackDone || reflection.Acknowledged_At
                  ? <Badge variant="acknowledged" label="Acknowledged ✓" />
                  : <Badge variant="pending" label="Tap to acknowledge" />
                }
              </div>
              <div className="space-y-3">
                <FeedbackField label="What you did well" value={checkin.Did_Well} />
                <FeedbackField label="One thing to improve" value={checkin.Improve} />
              </div>
              <p className="text-[11px] text-text-secondary mt-3">
                Submitted by your manager · {fmtDateTime(checkin.Submitted_At)}
              </p>
              {!ackDone && !reflection.Acknowledged_At && (
                <button
                  onClick={handleAcknowledge}
                  disabled={ackLoading}
                  className="mt-3 flex items-center gap-2 h-8 px-4 text-xs font-semibold bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-sm shadow-sm transition-colors"
                >
                  {ackLoading ? <Spinner size="sm" /> : <CheckCircle2 size={13} />}
                  Acknowledge Feedback
                </button>
              )}
            </div>
          ) : (
            <div className="enterprise-card p-4 bg-primary-50/50">
              <p className="text-xs text-text-secondary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warning flex-shrink-0 animate-pulse" />
                Your manager hasn&apos;t submitted a check-in yet. You&apos;ll be notified once it&apos;s available.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ── Submission form ── */
        <form onSubmit={handleSubmit} className="enterprise-card p-5 space-y-5">
          <p className="text-xs text-text-secondary border-b border-border pb-3">
            Take 5 minutes to reflect on this week before you log off.
          </p>

          <ReflectionField
            label="What did I accomplish this week? *"
            hint="Be specific — what did you complete, ship, or move forward?"
            value={accomplishments}
            onChange={setAccomplishments}
            minLength={10}
          />
          <ReflectionField
            label="What am I working on next week? *"
            hint="What are your top priorities for the coming week?"
            value={nextWeekPlan}
            onChange={setNextWeekPlan}
            minLength={10}
          />
          <ReflectionField
            label="Any blockers or support needed?"
            hint="Optional — what's in your way?"
            value={blockers}
            onChange={setBlockers}
          />

          {/* Mood selector */}
          <div>
            <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">
              How am I feeling this week? *
            </label>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-2 rounded-sm border text-xs transition-all",
                    mood === m.value
                      ? "bg-primary-600 border-primary-600 text-white scale-105"
                      : "border-border text-text-secondary hover:border-primary-300 hover:bg-primary-50"
                  )}
                >
                  <span className="text-2xl leading-none">{m.emoji}</span>
                  <span className="text-[10px] font-medium mt-0.5">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
              <AlertCircle size={13} className="flex-shrink-0" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-sm transition-colors shadow-sm"
          >
            {submitting ? <><Spinner size="sm" /> Submitting…</> : "Submit Reflection"}
          </button>
        </form>
      )}

      {/* ── Past reflections ── */}
      <div className="enterprise-card overflow-hidden">
        <button
          onClick={loadHistory}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-text-primary hover:bg-primary-50 transition-colors"
        >
          <span>Past Reflections</span>
          {historyOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        {historyOpen && (
          <div className="border-t border-border">
            {historyLoading ? (
              <div className="py-8 flex justify-center"><Spinner /></div>
            ) : history.length === 0 ? (
              <p className="text-xs text-text-secondary px-4 py-5">No past reflections yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {history.map(r => <PastReflectionRow key={r.Reflection_ID} reflection={r} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReflectionField({ label, hint, value, onChange, minLength }: {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void; minLength?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wide">{label}</label>
      {hint && <p className="text-[11px] text-text-secondary">{hint}</p>}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        className="enterprise-input w-full resize-y min-h-[80px] text-sm py-2"
      />
      {minLength && value.trim().length > 0 && value.trim().length < minLength && (
        <p className="text-[11px] text-warning">Minimum {minLength} characters</p>
      )}
    </div>
  );
}

function ReadOnlyReflection({ reflection }: { reflection: WeeklyReflection }) {
  const moodItem = MOODS.find(m => m.value === Number(reflection.Mood));
  return (
    <div className="enterprise-card p-4 space-y-4">
      <ReadField label="Accomplishments" value={reflection.Accomplishments} />
      <ReadField label="Next Week Plan" value={reflection.Next_Week_Plan} />
      {reflection.Blockers && <ReadField label="Blockers" value={reflection.Blockers} />}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Mood</span>
        {moodItem && (
          <span className="flex items-center gap-1.5 text-xs">
            <span className="text-xl">{moodItem.emoji}</span>
            <span className="text-text-secondary">{moodItem.label}</span>
          </span>
        )}
      </div>
      <p className="text-[11px] text-text-secondary">Submitted · {fmtDateTime(reflection.Submitted_At)}</p>
    </div>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  );
}

function FeedbackField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-primary-50 border border-border px-3 py-2.5">
      <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  );
}

function PastReflectionRow({ reflection }: { reflection: WeeklyReflection }) {
  const [open, setOpen] = useState(false);
  const moodItem = MOODS.find(m => m.value === Number(reflection.Mood));
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs hover:bg-primary-50/50 transition-colors"
      >
        <span className="font-medium text-text-primary">{getWeekLabel(reflection.Week_Start_Date)}</span>
        <div className="flex items-center gap-2">
          {moodItem && <span className="text-base">{moodItem.emoji}</span>}
          {reflection.Acknowledged_At && <Badge variant="acknowledged" label="Ack'd" />}
          {open ? <ChevronDown size={12} className="text-text-secondary" /> : <ChevronRight size={12} className="text-text-secondary" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 bg-primary-50/30">
          <ReadField label="Accomplishments" value={reflection.Accomplishments} />
          <ReadField label="Next Week Plan" value={reflection.Next_Week_Plan} />
          {reflection.Blockers && <ReadField label="Blockers" value={reflection.Blockers} />}
          <p className="text-[11px] text-text-secondary">{fmtDateTime(reflection.Submitted_At)}</p>
        </div>
      )}
    </div>
  );
}
