"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, X, AlertCircle, Edit2, Info } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner, PageLoader } from "@/components/ui/Spinner";
import { cn, getWeekStart, getWeekLabel, fmtDateTime } from "@/lib/utils";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import type { TeamMemberStatus } from "@/app/api/weekly/team-status/route";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Reflection {
  Reflection_ID: string;
  Accomplishments: string;
  Next_Week_Plan: string;
  Blockers: string;
  Mood: string;
  Submitted_At: string;
}

interface FullCheckin {
  Checkin_ID: string;
  Main_Thing_On_Mind: string;
  Committed_To: string;
  Did_Well: string;
  Improve: string;
  Concern: string;
  Submitted_At: string;
}

const MOODS = [
  { value: 1, emoji: "😞", label: "Low" },
  { value: 2, emoji: "😕", label: "Below Avg" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Great" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckinPage() {
  const { user } = useCurrentUser();
  const week = getWeekStart();

  const [team, setTeam] = useState<TeamMemberStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ member: TeamMemberStatus } | null>(null);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/weekly/team-status");
      if (!res.ok) return;
      const data = await res.json();
      setTeam(data.status ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  function handleSaved() {
    setModal(null);
    fetchTeam();
  }

  if (loading) return <PageLoader />;

  const reflectedCount = team.filter(m => m.reflection_submitted).length;
  const checkinCount = team.filter(m => m.checkin_submitted).length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageHeader title="Team Weekly Check-In" />
          <p className="text-xs text-text-secondary mt-0.5">{getWeekLabel(week)}</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatBox label="Reflections Submitted" value={`${reflectedCount}/${team.length}`} color="blue" />
        <StatBox label="Check-Ins Written" value={`${checkinCount}/${team.length}`} color="green" />
        <StatBox label="Check-Ins Pending" value={String(team.length - checkinCount)} color={(team.length - checkinCount) > 0 ? "orange" : "green"} />
      </div>

      {/* Team table */}
      <div className="enterprise-card overflow-hidden">
        {team.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-secondary">
            No team members found.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-primary-50">
                  <th className="text-left px-4 py-2.5 font-semibold text-text-secondary uppercase tracking-wide text-[11px]">Employee</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-text-secondary uppercase tracking-wide text-[11px]">Department</th>
                  <th className="text-center px-3 py-2.5 font-semibold text-text-secondary uppercase tracking-wide text-[11px]">Reflection</th>
                  <th className="text-center px-3 py-2.5 font-semibold text-text-secondary uppercase tracking-wide text-[11px]">Check-In</th>
                  <th className="px-3 py-2.5 w-28" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {team.map(member => (
                  <tr key={member.employee_id} className="hover:bg-primary-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-text-primary">{member.name}</p>
                      <p className="text-[11px] text-text-secondary font-mono">{member.employee_id}</p>
                    </td>
                    <td className="px-3 py-3 text-text-secondary">{member.department}</td>
                    <td className="px-3 py-3 text-center">
                      <StatusDot active={member.reflection_submitted} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <StatusDot active={member.checkin_submitted} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => setModal({ member })}
                        className={cn(
                          "flex items-center gap-1.5 h-7 px-3 text-[11px] font-semibold rounded-sm transition-colors ml-auto",
                          member.checkin_submitted
                            ? "border border-border text-text-secondary hover:text-text-primary hover:bg-primary-50"
                            : "bg-primary-600 hover:bg-primary-700 text-white"
                        )}
                      >
                        <Edit2 size={11} /> {member.checkin_submitted ? "Edit Check-In" : "Write Check-In"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <WriteCheckinModal
          member={modal.member}
          userRole={user?.role ?? "manager"}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ─── Write Check-In Modal ─────────────────────────────────────────────────────

function WriteCheckinModal({ member, userRole, onClose, onSaved }: {
  member: TeamMemberStatus;
  userRole: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const week = getWeekStart();
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [reflLoading, setReflLoading] = useState(true);

  const [mainThingOnMind, setMainThingOnMind] = useState("");
  const [committedTo, setCommittedTo] = useState("");
  const [didWell, setDidWell] = useState("");
  const [improve, setImprove] = useState("");
  const [concern, setConcern] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setReflLoading(true);
      // Fetch reflection and existing checkin in parallel
      const [reflRes, chkRes] = await Promise.all([
        fetch(`/api/weekly/reflection/for-manager?employee_id=${member.employee_id}&week=${week}`),
        fetch(`/api/weekly/checkin?employee_id=${member.employee_id}&week=${week}`),
      ]);
      if (reflRes.ok) {
        const data = await reflRes.json();
        setReflection(data.reflection ?? null);
      }
      // Pre-fill form if checkin already exists
      if (chkRes.ok) {
        const data = await chkRes.json();
        const chk: FullCheckin | null = data.checkin ?? null;
        if (chk) {
          setMainThingOnMind(chk.Main_Thing_On_Mind ?? "");
          setCommittedTo(chk.Committed_To ?? "");
          setDidWell(chk.Did_Well ?? "");
          setImprove(chk.Improve ?? "");
          setConcern(chk.Concern ?? "");
        }
      }
      setReflLoading(false);
    })();
  }, [member.employee_id, week]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/weekly/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: member.employee_id,
          main_thing_on_mind: mainThingOnMind,
          committed_to: committedTo,
          did_well: didWell,
          improve,
          concern,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to submit"); return; }
      onSaved();
    } finally {
      setSubmitting(false);
    }
  }

  const moodItem = reflection ? MOODS.find(m => m.value === Number(reflection.Mood)) : null;

  return (
    <ModalWrapper title={`Check-In: ${member.name}`} onClose={onClose}>
      <div className="space-y-5">
        {/* Employee's reflection */}
        <div>
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Employee&apos;s Reflection This Week
          </p>
          {reflLoading ? (
            <div className="py-4 flex justify-center"><Spinner /></div>
          ) : reflection ? (
            <div className="rounded-sm bg-primary-50 border border-border p-3 space-y-2.5">
              <ReflectionReadField label="Accomplishments" value={reflection.Accomplishments} />
              <ReflectionReadField label="Next Week Plan" value={reflection.Next_Week_Plan} />
              {reflection.Blockers && <ReflectionReadField label="Blockers" value={reflection.Blockers} />}
              {moodItem && (
                <p className="text-xs text-text-secondary">
                  Mood: <span className="text-base">{moodItem.emoji}</span> {moodItem.label}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-sm bg-primary-50 border border-border p-3">
              <p className="text-xs text-text-secondary italic">Reflection content not available for preview.</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <CheckinField
            label="What was the main thing on this employee's mind this week? *"
            note="Not shown to employee"
            value={mainThingOnMind}
            onChange={setMainThingOnMind}
            required
          />
          <CheckinField
            label="What did you commit to doing for them? *"
            note="Not shown to employee"
            value={committedTo}
            onChange={setCommittedTo}
            required
          />
          <CheckinField
            label="What did they do well this week? *"
            note="Shown to employee"
            noteColor="text-success"
            value={didWell}
            onChange={setDidWell}
            required
          />
          <CheckinField
            label="One thing to work on or improve *"
            note="Shown to employee"
            noteColor="text-success"
            value={improve}
            onChange={setImprove}
            required
          />
          {(userRole === "hr" || userRole === "md") && (
            <CheckinField
              label="Any concern to watch? (optional)"
              note="HR and MD only — never shown to employee"
              noteColor="text-danger"
              value={concern}
              onChange={setConcern}
            />
          )}
          {userRole === "manager" && (
            <div className="flex items-start gap-2 text-[11px] text-text-secondary bg-primary-50 border border-border rounded-sm px-3 py-2">
              <Info size={11} className="flex-shrink-0 mt-0.5" />
              The &quot;concern&quot; field is only available to HR and MD.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
              <AlertCircle size={13} className="flex-shrink-0" /> {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-8 px-4 text-xs font-semibold border border-border rounded-sm text-text-secondary hover:bg-primary-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="h-8 px-4 text-xs font-semibold bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-sm shadow-sm flex items-center gap-2">
              {submitting && <Spinner size="sm" />} Submit Check-In
            </button>
          </div>
        </form>
      </div>
    </ModalWrapper>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function StatBox({ label, value, color }: { label: string; value: string; color: "blue" | "green" | "orange" }) {
  const colors = {
    blue: "text-primary-700 bg-primary-50 border-primary-200",
    green: "text-success bg-success/5 border-success/20",
    orange: "text-warning bg-warning/5 border-warning/20",
  };
  return (
    <div className={cn("enterprise-card p-3 border", colors[color])}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[11px] font-medium mt-0.5 opacity-80 uppercase tracking-wide">{label}</p>
    </div>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="flex justify-center">
      {active ? (
        <CheckCircle2 size={15} className="text-success" />
      ) : (
        <span className="w-3.5 h-3.5 rounded-full border-2 border-border block" />
      )}
    </span>
  );
}

function CheckinField({ label, note, noteColor = "text-text-secondary", value, onChange, required }: {
  label: string; note?: string; noteColor?: string;
  value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wide">{label}</label>
        {note && <span className={cn("text-[10px]", noteColor)}>{note}</span>}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={2}
        required={required}
        className="enterprise-input w-full resize-y min-h-[60px] text-sm py-2"
      />
    </div>
  );
}

function ReflectionReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-xs text-text-primary whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  );
}

function ViewField({ label, value, highlighted }: {
  label: string; value: string; hidden: boolean; highlighted?: boolean;
}) {
  return (
    <div className={cn("rounded-sm border p-3", highlighted ? "bg-success/5 border-success/20" : "bg-primary-50 border-border")}>
      <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  );
}

function ModalWrapper({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="enterprise-card enterprise-shadow w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between border-b border-border px-5 py-3 sticky top-0 bg-white z-10">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-sm text-text-secondary hover:text-text-primary hover:bg-primary-50">
            <X size={14} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
