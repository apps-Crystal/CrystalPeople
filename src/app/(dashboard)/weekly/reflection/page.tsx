"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner, PageLoader } from "@/components/ui/Spinner";
import { cn, getWeekStart, getWeekLabel, fmtDateTime } from "@/lib/utils";
import type { WeeklyReflection } from "@/lib/types";

// ─── Mood config ─────────────────────────────────────────────────────────────

const MOODS = [
  { value: 1, emoji: "😞", label: "Low" },
  { value: 2, emoji: "😕", label: "Below Avg" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Great" },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReflectionPage() {
  const week = getWeekStart();

  const [reflection, setReflection] = useState<WeeklyReflection | null>(null);
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

  const fetchCurrent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/weekly/reflection?week=${week}`);
      if (!res.ok) return;
      const data = await res.json();
      setReflection(data.reflection ?? null);
    } finally {
      setLoading(false);
    }
  }, [week]);

  useEffect(() => { fetchCurrent(); }, [fetchCurrent]);

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
          <PageHeader title="My Weekly Reflection" />
          <p className="text-xs text-text-secondary mt-0.5">{getWeekLabel(week)}</p>
        </div>
        {reflection && (
          <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-sm border bg-success/10 text-success border-success/20">
            Submitted ✓
          </span>
        )}
      </div>

      {/* ── Submitted view ── */}
      {reflection ? (
        <div className="space-y-4">
          <ReadOnlyReflection reflection={reflection} />
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

function PastReflectionRow({ reflection }: { reflection: WeeklyReflection }) {
  const [open, setOpen] = useState(false);
  const moodItem = MOODS.find(m => m.value === Number(reflection.Mood));
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs hover:bg-primary-50/50 transition-colors"
      >
        <div className="text-left">
          <span className="font-medium text-text-primary">{getWeekLabel(reflection.Week_Start_Date)}</span>
          {reflection.Submitted_At && (
            <p className="text-[10px] text-text-secondary mt-0.5">{fmtDateTime(reflection.Submitted_At)}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {moodItem && <span className="text-base">{moodItem.emoji}</span>}
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
