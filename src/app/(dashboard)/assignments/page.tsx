"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Briefcase, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { cn, fmtDateTime } from "@/lib/utils";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import type { Employee, Assignment } from "@/lib/types";

const TYPE_COLOR: Record<string, string> = {
  goal: "bg-primary-50 text-primary-700 border-primary-200",
  task: "bg-accent-500/10 text-accent-600 border-accent-500/30",
};

/** Safely parse a fetch Response as JSON — returns {} if body is non-JSON (e.g. 500 HTML). */
async function safeJson(res: Response): Promise<Record<string, string>> {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return {}; }
}

const STATUS_VARIANT: Record<string, "active" | "inactive" | "complete"> = {
  active: "active",
  completed: "complete",
  dropped: "inactive",
};

interface EnrichedAssignment extends Assignment {
  employeeName?: string;
  department?: string;
}

export default function AssignmentsPage() {
  const { user } = useCurrentUser();
  const isManager = user?.role === "manager" || user?.role === "hr" || user?.role === "md";

  // Team selector (manager view)
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  // Data
  const [assignments, setAssignments] = useState<EnrichedAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Add assignment modal
  const [addOpen, setAddOpen] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addTarget, setAddTarget] = useState("");
  const [addType, setAddType] = useState<"goal" | "task">("goal");
  const [addDueDate, setAddDueDate] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Manager edit / drop modal
  const [editAssignment, setEditAssignment] = useState<EnrichedAssignment | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "completed" | "dropped">("active");
  const [editDropReason, setEditDropReason] = useState("");
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Employee progress update modal
  const [progressAssignment, setProgressAssignment] = useState<EnrichedAssignment | null>(null);
  const [progressNote, setProgressNote] = useState("");
  const [progressMarkDone, setProgressMarkDone] = useState(false);
  const [progressError, setProgressError] = useState("");
  const [progressLoading, setProgressLoading] = useState(false);

  const fetchAssignments = useCallback(async (empId: string) => {
    if (!empId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/assignments?employee_id=${empId}`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load: team members for managers (runs once on user load)
  useEffect(() => {
    if (!user) return;
    if (isManager) {
      fetch("/api/employees")
        .then(r => r.json())
        .then(data => {
          const emps = (data.employees ?? []) as Employee[];
          const team = user.role === "manager"
            ? emps.filter(e => e.Manager_ID === user.userId && e.Status === "active" && e.Employee_ID !== user.userId)
            : emps.filter(e => e.Status === "active" && e.Employee_ID !== user.userId && (e.Role === "employee" || e.Role === "manager"));
          setTeamMembers(team);
          if (team.length > 0) {
            setSelectedEmployeeId(team[0].Employee_ID);
          } else {
            setLoading(false);
          }
        });
    } else {
      fetchAssignments(user.userId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch assignments when selected employee changes
  useEffect(() => {
    if (isManager && selectedEmployeeId) {
      fetchAssignments(selectedEmployeeId);
    }
  }, [selectedEmployeeId, isManager, fetchAssignments]);

  function openEdit(a: EnrichedAssignment) {
    setEditAssignment(a);
    setEditTitle(a.Title);
    setEditDescription(a.Description);
    setEditTarget(a.Target);
    setEditDueDate(a.Due_Date ?? "");
    setEditStatus(a.Status);
    setEditDropReason(a.Drop_Reason);
    setEditError("");
  }

  function openProgress(a: EnrichedAssignment) {
    setProgressAssignment(a);
    setProgressNote(a.Progress_Note ?? "");
    setProgressMarkDone(false);
    setProgressError("");
  }

  async function handleAdd() {
    setAddError("");
    if (addTitle.trim().length < 3) { setAddError("Title must be at least 3 characters"); return; }
    if (addDescription.trim().length < 5) { setAddError("Description must be at least 5 characters"); return; }
    if (addTarget.trim().length < 3) { setAddError("Target must be at least 3 characters"); return; }
    setAddLoading(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: selectedEmployeeId,
          title: addTitle,
          description: addDescription,
          target: addTarget,
          type: addType,
          due_date: addDueDate,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok) { setAddError(data.error ?? "Failed to assign"); return; }
      setAddOpen(false);
      setAddTitle(""); setAddDescription(""); setAddTarget(""); setAddType("goal"); setAddDueDate("");
      await fetchAssignments(selectedEmployeeId);
    } finally {
      setAddLoading(false);
    }
  }

  async function handleEdit() {
    if (!editAssignment) return;
    setEditError("");
    if (editStatus === "dropped" && editDropReason.trim().length < 5) {
      setEditError("Drop reason must be at least 5 characters");
      return;
    }
    setEditLoading(true);
    try {
      const res = await fetch(`/api/assignments/${editAssignment.Assignment_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          target: editTarget,
          due_date: editDueDate,
          status: editStatus,
          drop_reason: editDropReason,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok) { setEditError(data.error ?? "Failed to update"); return; }
      setEditAssignment(null);
      await fetchAssignments(isManager ? selectedEmployeeId : (user?.userId ?? ""));
    } finally {
      setEditLoading(false);
    }
  }

  async function handleProgress() {
    if (!progressAssignment) return;
    setProgressError("");
    if (!progressNote.trim() && !progressMarkDone) {
      setProgressError("Add a progress note or mark as completed.");
      return;
    }
    setProgressLoading(true);
    const savedId = progressAssignment.Assignment_ID;
    try {
      const body: Record<string, string> = { progress_note: progressNote };
      if (progressMarkDone) body.status = "completed";
      const res = await fetch(`/api/assignments/${savedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await safeJson(res);
      if (!res.ok) { setProgressError(data.error ?? "Failed to update"); return; }
      // Optimistically update local state so UI changes immediately
      setAssignments(prev => prev.map(a =>
        a.Assignment_ID === savedId
          ? { ...a, Progress_Note: progressNote, ...(progressMarkDone ? { Status: "completed" as const, Completed_At: new Date().toISOString() } : {}) }
          : a
      ));
      setProgressAssignment(null);
    } finally {
      setProgressLoading(false);
    }
  }

  if (!user) return <PageLoader />;
  if (loading) return <PageLoader />;

  const selectedEmployee = teamMembers.find(e => e.Employee_ID === selectedEmployeeId);
  const activeAssignments = assignments.filter(a => a.Status === "active");
  const otherAssignments = assignments.filter(a => a.Status !== "active");

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        title="Assignments"
        subtitle={isManager ? "Manage work assignments for your team" : "Your assigned work items"}
        action={
          isManager && selectedEmployeeId ? (
            <Button size="sm" icon={<Plus size={13} />} onClick={() => { setAddOpen(true); setAddError(""); }}>
              Assign
            </Button>
          ) : undefined
        }
      />

      {/* Manager: employee selector */}
      {isManager && (
        <div className="enterprise-card p-4">
          {teamMembers.length === 0 ? (
            <p className="text-xs text-text-secondary">No active employees found.</p>
          ) : (
            <Select
              label="Select Team Member"
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              options={teamMembers.map(e => ({
                value: e.Employee_ID,
                label: `${e.Name} — ${e.Department}`,
              }))}
            />
          )}
        </div>
      )}

      {/* Assignment list */}
      {assignments.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={20} />}
          title={isManager ? "No assignments yet" : "No assignments"}
          description={
            isManager
              ? `Use the Assign button to create work items for ${selectedEmployee?.Name ?? "this employee"}.`
              : "Your manager hasn't assigned any work items yet."
          }
          action={isManager && selectedEmployeeId ? { label: "Assign First Item", onClick: () => setAddOpen(true) } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {activeAssignments.length > 0 && (
            <div className="space-y-2">
              {activeAssignments.map(a => (
                <AssignmentCard
                  key={a.Assignment_ID}
                  assignment={a}
                  isManager={isManager}
                  onEdit={openEdit}
                  onProgress={openProgress}
                />
              ))}
            </div>
          )}
          {otherAssignments.length > 0 && (
            <CompletedSection assignments={otherAssignments} isManager={isManager} onEdit={openEdit} onProgress={openProgress} />
          )}
        </div>
      )}

      {/* Add Assignment Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={`Assign Work to ${selectedEmployee?.Name ?? ""}`}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" loading={addLoading} onClick={handleAdd}>Assign</Button>
          </>
        }
      >
        <div className="space-y-4">
          {addError && (
            <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
              <AlertCircle size={12} /> {addError}
            </div>
          )}
          <Input
            label="Title *"
            value={addTitle}
            onChange={e => setAddTitle(e.target.value)}
            placeholder="e.g. Improve customer response time"
          />
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">Description *</label>
            <textarea
              value={addDescription}
              onChange={e => setAddDescription(e.target.value)}
              rows={3}
              placeholder="Describe what needs to be accomplished..."
              className="enterprise-input w-full resize-none text-sm py-2"
            />
          </div>
          <Input
            label="Target / Success Metric *"
            value={addTarget}
            onChange={e => setAddTarget(e.target.value)}
            placeholder="e.g. Respond to all tickets within 2 hours"
          />
          <Select
            label="Type"
            value={addType}
            onChange={e => setAddType(e.target.value as "goal" | "task")}
            options={[
              { value: "goal", label: "Goal — outcome-based, white-collar focus" },
              { value: "task", label: "Task — activity-based, blue-collar focus" },
            ]}
          />
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">Due Date <span className="normal-case font-normal">(optional)</span></label>
            <input
              type="date"
              value={addDueDate}
              onChange={e => setAddDueDate(e.target.value)}
              className="enterprise-input w-full text-sm py-2"
            />
          </div>
        </div>
      </Modal>

      {/* Edit Assignment Modal (manager) */}
      <Modal
        open={!!editAssignment}
        onClose={() => setEditAssignment(null)}
        title="Edit Assignment"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditAssignment(null)}>Cancel</Button>
            <Button size="sm" loading={editLoading} onClick={handleEdit}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          {editError && (
            <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
              <AlertCircle size={12} /> {editError}
            </div>
          )}
          <Input label="Title" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">Description</label>
            <textarea
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              rows={3}
              className="enterprise-input w-full resize-none text-sm py-2"
            />
          </div>
          <Input label="Target" value={editTarget} onChange={e => setEditTarget(e.target.value)} />
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">Due Date <span className="normal-case font-normal">(optional)</span></label>
            <input
              type="date"
              value={editDueDate}
              onChange={e => setEditDueDate(e.target.value)}
              className="enterprise-input w-full text-sm py-2"
            />
          </div>
          <Select
            label="Status"
            value={editStatus}
            onChange={e => setEditStatus(e.target.value as "active" | "completed" | "dropped")}
            options={[
              { value: "active", label: "Active" },
              { value: "completed", label: "Completed" },
              { value: "dropped", label: "Dropped" },
            ]}
          />
          {editStatus === "dropped" && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">Drop Reason *</label>
              <textarea
                value={editDropReason}
                onChange={e => setEditDropReason(e.target.value)}
                rows={2}
                placeholder="Why is this assignment being dropped?"
                className="enterprise-input w-full resize-none text-sm py-2"
              />
            </div>
          )}
          {editAssignment?.Progress_Note && (
            <div className="rounded-sm bg-primary-50 border border-border px-3 py-2">
              <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-1">Employee Progress Note</p>
              <p className="text-xs text-text-primary whitespace-pre-wrap">{editAssignment.Progress_Note}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Update Progress Modal (employee) */}
      <Modal
        open={!!progressAssignment}
        onClose={() => setProgressAssignment(null)}
        title="Update Progress"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setProgressAssignment(null)}>Cancel</Button>
            <Button size="sm" loading={progressLoading} onClick={handleProgress}>Save Update</Button>
          </>
        }
      >
        <div className="space-y-4">
          {progressError && (
            <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
              <AlertCircle size={12} /> {progressError}
            </div>
          )}
          {progressAssignment && (
            <div className="rounded-sm bg-primary-50 border border-border px-3 py-2">
              <p className="text-xs font-semibold text-text-primary">{progressAssignment.Title}</p>
              <p className="text-[11px] text-text-secondary mt-0.5"><span className="font-semibold">Target:</span> {progressAssignment.Target}</p>
            </div>
          )}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">Progress Note</label>
            <textarea
              value={progressNote}
              onChange={e => setProgressNote(e.target.value)}
              rows={4}
              placeholder="Describe what you've done, any progress made, blockers encountered..."
              className="enterprise-input w-full resize-none text-sm py-2"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={progressMarkDone}
              onChange={e => setProgressMarkDone(e.target.checked)}
              className="w-4 h-4 rounded-sm accent-primary-600"
            />
            <span className="text-sm text-text-primary group-hover:text-primary-700">Mark as completed</span>
          </label>
          {progressMarkDone && (
            <p className="text-[11px] text-text-secondary bg-success/5 border border-success/20 rounded-sm px-3 py-2">
              This will mark the assignment as completed. Your manager will be able to review and score it.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}

// ─── Assignment Card ───────────────────────────────────────────────────────────

function AssignmentCard({ assignment: a, isManager, onEdit, onProgress }: {
  assignment: EnrichedAssignment;
  isManager: boolean;
  onEdit: (a: EnrichedAssignment) => void;
  onProgress: (a: EnrichedAssignment) => void;
}) {
  return (
    <div className="enterprise-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-sm border",
              TYPE_COLOR[a.Type]
            )}>
              {a.Type === "goal" ? "Goal" : "Task"}
            </span>
            <p className="text-sm font-semibold text-text-primary">{a.Title}</p>
            <Badge variant={STATUS_VARIANT[a.Status] ?? "active"} />
          </div>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">{a.Description}</p>
          <p className="text-[11px] text-text-secondary mt-1">
            <span className="font-semibold">Target:</span> {a.Target}
          </p>
          {a.Due_Date && (
            <p className="text-[11px] mt-1">
              <span className="font-semibold text-text-secondary">Due:</span>{" "}
              <span className={new Date(a.Due_Date) < new Date() && a.Status === "active" ? "text-danger font-medium" : "text-text-secondary"}>
                {new Date(a.Due_Date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                {new Date(a.Due_Date) < new Date() && a.Status === "active" ? " · Overdue" : ""}
              </span>
            </p>
          )}
          {a.Progress_Note && (
            <div className="mt-2 rounded-sm bg-primary-50 border border-border px-2.5 py-2">
              <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide mb-0.5">Progress Note</p>
              <p className="text-[11px] text-text-primary whitespace-pre-wrap leading-relaxed">{a.Progress_Note}</p>
            </div>
          )}
          {a.Drop_Reason && (
            <p className="text-[11px] text-warning mt-1">
              <span className="font-semibold">Drop reason:</span> {a.Drop_Reason}
            </p>
          )}
          {a.Created_At && (
            <p className="text-[10px] text-text-secondary mt-1.5">
              Assigned · {fmtDateTime(a.Created_At)}
              {a.Completed_At && (
                <span className="ml-2 text-success">· Completed {fmtDateTime(a.Completed_At)}</span>
              )}
            </p>
          )}
          {(a.Self_Score || a.Manager_Score) && (
            <div className="flex items-center gap-3 mt-2">
              {a.Self_Score && (
                <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                  Self: <RatingBadge score={Number(a.Self_Score)} />
                </span>
              )}
              {a.Manager_Score && (
                <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                  Manager: <RatingBadge score={Number(a.Manager_Score)} />
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {isManager && a.Status === "active" && (
            <Button size="sm" variant="secondary" onClick={() => onEdit(a)}>Edit</Button>
          )}
          {!isManager && a.Status === "active" && (
            <Button size="sm" variant="secondary" onClick={() => onProgress(a)}>Update</Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Completed/Dropped Section ────────────────────────────────────────────────

function CompletedSection({ assignments, isManager, onEdit, onProgress }: {
  assignments: EnrichedAssignment[];
  isManager: boolean;
  onEdit: (a: EnrichedAssignment) => void;
  onProgress: (a: EnrichedAssignment) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="enterprise-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-text-secondary hover:bg-primary-50 transition-colors"
      >
        <span>Past Assignments ({assignments.length})</span>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {open && (
        <div className="border-t border-border divide-y divide-border">
          {assignments.map(a => (
            <div key={a.Assignment_ID} className="p-4">
              <AssignmentCard assignment={a} isManager={isManager} onEdit={onEdit} onProgress={onProgress} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
