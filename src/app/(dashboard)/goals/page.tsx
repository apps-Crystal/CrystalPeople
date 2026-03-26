"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Target, ChevronDown, ChevronRight, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { Select } from "@/components/ui/Input";
import { cn, monthLabel } from "@/lib/utils";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import type { Goal, Employee, ConfigMap } from "@/lib/types";

const STATUS_VARIANT: Record<string, "active" | "complete" | "dropped"> = {
  active: "active",
  completed: "complete",
  dropped: "dropped",
};

export default function GoalsPage() {
  const { user } = useCurrentUser();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [config, setConfig] = useState<ConfigMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add goal modal
  const [addOpen, setAddOpen] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addTarget, setAddTarget] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Drop modal
  const [dropGoal, setDropGoal] = useState<Goal | null>(null);
  const [dropReason, setDropReason] = useState("");
  const [dropError, setDropError] = useState("");
  const [dropLoading, setDropLoading] = useState(false);

  // For managers: employee selector
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  // Edit
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const isManager = user?.role === "manager" || user?.role === "hr" || user?.role === "md";

  const fetchGoals = useCallback(async (empId: string) => {
    if (!empId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/goals?employee_id=${empId}`);
      if (res.ok) {
        const data = await res.json();
        setGoals(data.goals ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load: config + team members (runs once)
  useEffect(() => {
    if (!user) return;

    fetch("/api/config").then(r => r.json()).then(d => setConfig(d.config));

    if (isManager) {
      fetch("/api/employees").then(r => r.json()).then(data => {
        const emps = (data.employees ?? []) as Employee[];
        const team = user.role === "manager"
          ? emps.filter(e => e.Manager_ID === user.userId && e.Status === "active" && e.Employee_ID !== user.userId)
          : emps.filter(e => e.Status === "active" && e.Employee_ID !== user.userId);
        const whiteCollar = team.filter(e => e.Employee_Type === "white_collar");
        setTeamMembers(whiteCollar);
        if (whiteCollar.length > 0) {
          setSelectedEmployeeId(whiteCollar[0].Employee_ID);
        } else {
          setLoading(false);
        }
      });
    } else {
      fetchGoals(user.userId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch goals whenever selectedEmployeeId changes
  useEffect(() => {
    if (isManager && selectedEmployeeId) {
      fetchGoals(selectedEmployeeId);
    }
  }, [selectedEmployeeId, isManager, fetchGoals]);

  const activeCount = goals.filter(g => g.Status === "active").length;
  const maxGoals = config?.max_goals ?? 5;
  const minGoals = config?.min_goals ?? 3;

  const targetEmpId = isManager ? selectedEmployeeId : user?.userId ?? "";
  const selectedEmployee = teamMembers.find(e => e.Employee_ID === selectedEmployeeId);

  async function handleAddGoal() {
    setAddError("");
    if (addTitle.trim().length < 5) { setAddError("Title must be at least 5 characters"); return; }
    if (addDesc.trim().length < 10) { setAddError("Description must be at least 10 characters"); return; }
    if (!addTarget.trim()) { setAddError("Target is required"); return; }
    setAddLoading(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: addTitle, description: addDesc, target: addTarget,
          employee_id: targetEmpId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error ?? "Failed to add goal"); return; }
      setAddOpen(false);
      setAddTitle(""); setAddDesc(""); setAddTarget("");
      await fetchGoals(targetEmpId);
    } finally {
      setAddLoading(false);
    }
  }

  async function handleComplete(goal: Goal) {
    await fetch(`/api/goals/${goal.Goal_ID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    await fetchGoals(targetEmpId);
  }

  async function handleDrop() {
    if (!dropGoal) return;
    setDropError("");
    if (dropReason.trim().length < 10) { setDropError("Drop reason must be at least 10 characters"); return; }
    setDropLoading(true);
    try {
      const res = await fetch(`/api/goals/${dropGoal.Goal_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dropped", drop_reason: dropReason }),
      });
      const data = await res.json();
      if (!res.ok) { setDropError(data.error ?? "Failed to drop goal"); return; }
      setDropGoal(null); setDropReason("");
      await fetchGoals(targetEmpId);
    } finally {
      setDropLoading(false);
    }
  }

  function openEdit(goal: Goal) {
    if (expandedId === goal.Goal_ID) { setExpandedId(null); return; }
    setExpandedId(goal.Goal_ID);
    setEditTitle(goal.Title);
    setEditDesc(goal.Description);
    setEditTarget(goal.Target);
    setEditError("");
  }

  async function handleEdit(goal: Goal) {
    setEditError("");
    if (editTitle.trim().length < 5) { setEditError("Title must be at least 5 characters"); return; }
    if (editDesc.trim().length < 10) { setEditError("Description must be at least 10 characters"); return; }
    setEditLoading(true);
    try {
      const res = await fetch(`/api/goals/${goal.Goal_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, description: editDesc, target: editTarget }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error ?? "Failed to update goal"); return; }
      setExpandedId(null);
      await fetchGoals(targetEmpId);
    } finally {
      setEditLoading(false);
    }
  }

  if (loading) return <PageLoader />;

  const currentLabel = config ? monthLabel(config.current_month, config.current_year) : "";

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        title={isManager ? "Team Goals" : "My Goals"}
        subtitle={isManager ? `Assign & manage goals for white-collar employees — ${currentLabel}` : currentLabel}
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">{activeCount}/{maxGoals} goals</span>
            <Button
              size="sm"
              icon={<Plus size={13} />}
              onClick={() => { setAddOpen(true); setAddError(""); }}
              disabled={activeCount >= maxGoals || (isManager && !selectedEmployeeId)}
            >
              {isManager ? "Assign Goal" : "Add Goal"}
            </Button>
          </div>
        }
      />

      {error && (
        <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {/* Manager: employee selector */}
      {isManager && (
        <div className="enterprise-card p-4">
          {teamMembers.length === 0 ? (
            <p className="text-xs text-text-secondary">No white-collar employees in your team.</p>
          ) : (
            <Select
              label="Select Team Member"
              value={selectedEmployeeId}
              onChange={e => {
                setSelectedEmployeeId(e.target.value);
              }}
              options={teamMembers.map(e => ({ value: e.Employee_ID, label: `${e.Name} — ${e.Department}` }))}
            />
          )}
        </div>
      )}

      {/* Min goals notice */}
      {activeCount < minGoals && (
        <div className="flex items-start gap-2 text-xs bg-warning/10 border border-warning/20 rounded-sm px-3 py-2.5 text-warning">
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
          <span>{isManager ? `${selectedEmployee?.Name ?? "This employee"} needs` : "You need"} at least <strong>{minGoals}</strong> active goals before self-scoring opens. {activeCount}/{minGoals} set.</span>
        </div>
      )}

      {goals.length === 0 ? (
        <EmptyState
          icon={<Target size={20} />}
          title="No goals yet"
          description={isManager
            ? `Assign ${minGoals}–${maxGoals} goals to ${selectedEmployee?.Name ?? "this employee"} for ${currentLabel}.`
            : `Add ${minGoals}–${maxGoals} goals for ${currentLabel} to participate in your monthly review.`}
          action={
            (!isManager || selectedEmployeeId)
              ? { label: isManager ? "Assign First Goal" : "Add First Goal", onClick: () => setAddOpen(true) }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {goals.map(goal => (
            <GoalCard
              key={goal.Goal_ID}
              goal={goal}
              expanded={expandedId === goal.Goal_ID}
              onToggle={() => openEdit(goal)}
              editTitle={editTitle} editDesc={editDesc} editTarget={editTarget}
              editError={editError} editLoading={editLoading}
              onEditTitle={setEditTitle} onEditDesc={setEditDesc} onEditTarget={setEditTarget}
              onSave={() => handleEdit(goal)}
              onComplete={() => handleComplete(goal)}
              onDrop={() => { setDropGoal(goal); setDropReason(""); setDropError(""); }}
              userRole={user?.role ?? "employee"}
            />
          ))}
        </div>
      )}

      {/* Add Goal Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={isManager ? `Assign Goal to ${selectedEmployee?.Name ?? ""}` : "Add Goal"}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" loading={addLoading} onClick={handleAddGoal}>Add Goal</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">{activeCount} of {maxGoals} goals used this month</p>
          {addError && (
            <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
              <AlertCircle size={12} /> {addError}
            </div>
          )}
          <Input
            label="Goal Title"
            value={addTitle}
            onChange={e => setAddTitle(e.target.value)}
            placeholder="e.g. Improve customer response time"
          />
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">Description</label>
            <textarea
              value={addDesc}
              onChange={e => setAddDesc(e.target.value)}
              rows={3}
              placeholder="Describe what you plan to achieve and how..."
              className="enterprise-input w-full resize-none text-sm py-2"
            />
            {addDesc.length > 0 && addDesc.trim().length < 10 && (
              <p className="text-[11px] text-warning">Minimum 10 characters</p>
            )}
          </div>
          <Input
            label="Target / Success Metric"
            value={addTarget}
            onChange={e => setAddTarget(e.target.value)}
            placeholder="e.g. Response time under 2 hours by end of month"
          />
        </div>
      </Modal>

      {/* Drop Goal Modal */}
      <Modal
        open={!!dropGoal}
        onClose={() => setDropGoal(null)}
        title="Drop Goal"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDropGoal(null)}>Cancel</Button>
            <Button variant="danger" size="sm" loading={dropLoading} onClick={handleDrop}>Drop Goal</Button>
          </>
        }
      >
        <div className="space-y-4">
          {dropGoal && (
            <div className="rounded-sm bg-primary-50 border border-border px-3 py-2">
              <p className="text-xs font-medium text-text-primary">{dropGoal.Title}</p>
            </div>
          )}
          {dropError && (
            <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
              <AlertCircle size={12} /> {dropError}
            </div>
          )}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Reason for dropping *
            </label>
            <textarea
              value={dropReason}
              onChange={e => setDropReason(e.target.value)}
              rows={3}
              placeholder="Explain why this goal is being dropped..."
              className="enterprise-input w-full resize-none text-sm py-2"
            />
            {dropReason.length > 0 && dropReason.trim().length < 10 && (
              <p className="text-[11px] text-warning">Minimum 10 characters</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── GoalCard ─────────────────────────────────────────────────────────────────

function GoalCard({
  goal, expanded, onToggle,
  editTitle, editDesc, editTarget, editError, editLoading,
  onEditTitle, onEditDesc, onEditTarget, onSave,
  onComplete, onDrop, userRole,
}: {
  goal: Goal; expanded: boolean; onToggle: () => void;
  editTitle: string; editDesc: string; editTarget: string;
  editError: string; editLoading: boolean;
  onEditTitle: (v: string) => void; onEditDesc: (v: string) => void; onEditTarget: (v: string) => void;
  onSave: () => void; onComplete: () => void; onDrop: () => void;
  userRole: string;
}) {
  const isActive = goal.Status === "active";
  const canEdit = isActive && !goal.Self_Score;

  return (
    <div className={cn("enterprise-card overflow-hidden", expanded && "ring-1 ring-primary-300")}>
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-primary-50/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-text-primary">{goal.Title}</p>
            <Badge variant={STATUS_VARIANT[goal.Status] ?? "default"} />
          </div>
          <p className="text-xs text-text-secondary mt-1 line-clamp-2">{goal.Description}</p>
          {goal.Target && (
            <p className="text-[11px] text-text-secondary mt-1">
              <span className="font-semibold">Target:</span> {goal.Target}
            </p>
          )}
          {(goal.Self_Score || goal.Manager_Score) && (
            <div className="flex items-center gap-3 mt-2">
              {goal.Self_Score && (
                <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                  Self: <RatingBadge score={Number(goal.Self_Score)} />
                </span>
              )}
              {goal.Manager_Score && (
                <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                  Manager: <RatingBadge score={Number(goal.Manager_Score)} />
                </span>
              )}
            </div>
          )}
          {goal.Drop_Reason && goal.Status === "dropped" && (
            <p className="text-[11px] text-text-secondary mt-1 italic">Reason: {goal.Drop_Reason}</p>
          )}
        </div>
        {canEdit && (
          expanded ? <ChevronDown size={14} className="text-text-secondary flex-shrink-0 mt-0.5" />
                   : <ChevronRight size={14} className="text-text-secondary flex-shrink-0 mt-0.5" />
        )}
      </button>

      {/* Edit form */}
      {expanded && canEdit && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3 bg-primary-50/30">
          {editError && (
            <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
              <AlertCircle size={12} /> {editError}
            </div>
          )}
          <Input label="Title" value={editTitle} onChange={e => onEditTitle(e.target.value)} />
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">Description</label>
            <textarea
              value={editDesc}
              onChange={e => onEditDesc(e.target.value)}
              rows={3}
              className="enterprise-input w-full resize-none text-sm py-2"
            />
          </div>
          <Input label="Target" value={editTarget} onChange={e => onEditTarget(e.target.value)} />
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" loading={editLoading} onClick={onSave}>Save Changes</Button>
            <Button
              size="sm" variant="ghost"
              icon={<CheckCircle2 size={13} className="text-success" />}
              onClick={onComplete}
            >
              Mark Complete
            </Button>
            <Button
              size="sm" variant="ghost"
              icon={<XCircle size={13} className="text-danger" />}
              onClick={onDrop}
            >
              Drop
            </Button>
          </div>
        </div>
      )}

      {/* Actions for active goals that have been scored (read-only) */}
      {isActive && goal.Self_Score && !expanded && (
        <div className="border-t border-border px-4 py-2 flex items-center gap-2">
          <Button size="sm" variant="ghost" icon={<CheckCircle2 size={13} className="text-success" />} onClick={onComplete}>
            Mark Complete
          </Button>
          <Button size="sm" variant="ghost" icon={<XCircle size={13} className="text-danger" />} onClick={onDrop}>
            Drop
          </Button>
        </div>
      )}
    </div>
  );
}
