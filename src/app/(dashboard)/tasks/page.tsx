"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, ClipboardList, AlertCircle, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { Select } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import type { Task, Employee, ConfigMap } from "@/lib/types";

interface TaskMonthScore {
  month: number; year: number; self_score: number; manager_score: number;
}

function safeParseScores(str: string): TaskMonthScore[] {
  try { return JSON.parse(str) ?? []; } catch { return []; }
}

export default function TasksPage() {
  const { user } = useCurrentUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [config, setConfig] = useState<ConfigMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // For managers: employee selector
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  // Add task modal
  const [addOpen, setAddOpen] = useState(false);
  const [addDesc, setAddDesc] = useState("");
  const [addTarget, setAddTarget] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Edit task modal
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "inactive">("active");
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const isManager = user?.role === "manager" || user?.role === "hr" || user?.role === "md";
  const isWhiteCollar = user?.employeeType === "white_collar" && user?.role === "employee";

  const fetchTasks = useCallback(async (empId?: string) => {
    const id = empId ?? selectedEmployeeId ?? (isManager ? "" : user?.userId);
    if (!id && isManager) return;
    setLoading(true);
    try {
      const url = id ? `/api/tasks?employee_id=${id}` : "/api/tasks";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedEmployeeId, isManager, user?.userId]);

  useEffect(() => {
    if (!user) return;

    // Fetch config
    fetch("/api/config").then(r => r.json()).then(d => setConfig(d.config));

    if (isManager) {
      // Load team members
      fetch("/api/employees").then(r => r.json()).then(data => {
        const emps = (data.employees ?? []) as Employee[];
        const team = user.role === "manager"
          ? emps.filter(e => e.Manager_ID === user.userId && e.Status === "active" && e.Employee_ID !== user.userId)
          : emps.filter(e => e.Status === "active");
        const blueCollar = team.filter(e => e.Employee_Type === "blue_collar");
        setTeamMembers(blueCollar);
        if (blueCollar.length > 0) {
          setSelectedEmployeeId(blueCollar[0].Employee_ID);
          fetchTasks(blueCollar[0].Employee_ID);
        } else {
          setLoading(false);
        }
      });
    } else {
      fetchTasks();
    }
  }, [user, isManager, fetchTasks]);

  async function handleAddTask() {
    setAddError("");
    if (addDesc.trim().length < 10) { setAddError("Task description must be at least 10 characters"); return; }
    if (addTarget.trim().length < 5) { setAddError("Target must be at least 5 characters"); return; }
    setAddLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_description: addDesc,
          target: addTarget,
          employee_id: selectedEmployeeId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error ?? "Failed to add task"); return; }
      setAddOpen(false);
      setAddDesc(""); setAddTarget("");
      await fetchTasks(selectedEmployeeId);
    } finally {
      setAddLoading(false);
    }
  }

  function openEdit(task: Task) {
    setEditTask(task);
    setEditDesc(task.Task_Description);
    setEditTarget(task.Target);
    setEditStatus(task.Status);
    setEditError("");
  }

  async function handleEditTask() {
    if (!editTask) return;
    setEditError("");
    setEditLoading(true);
    try {
      const res = await fetch(`/api/tasks/${editTask.Task_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_description: editDesc, target: editTarget, status: editStatus }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error ?? "Failed to update task"); return; }
      setEditTask(null);
      await fetchTasks(selectedEmployeeId);
    } finally {
      setEditLoading(false);
    }
  }

  if (!user) return <PageLoader />;

  // White-collar employees: redirect message
  if (isWhiteCollar) {
    return (
      <div className="max-w-md space-y-4">
        <PageHeader title="My Tasks" />
        <div className="enterprise-card p-5 text-center space-y-3">
          <ClipboardList size={32} className="text-text-secondary mx-auto" />
          <p className="text-sm font-medium text-text-primary">Tasks are for blue-collar employees</p>
          <p className="text-xs text-text-secondary">As a white-collar employee, your performance is tracked through goals.</p>
          <Link href="/goals" className="inline-flex items-center gap-1.5 text-xs text-primary-600 font-medium hover:underline">
            <LinkIcon size={11} /> Go to My Goals
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <PageLoader />;

  const selectedEmployee = teamMembers.find(e => e.Employee_ID === selectedEmployeeId);
  const currentMonthScores = config
    ? tasks.map(t => {
        const scores = safeParseScores(t.Monthly_Scores);
        return scores.find(s => s.month === config.current_month && s.year === config.current_year) ?? null;
      })
    : tasks.map(() => null);

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        title="My Tasks"
        subtitle={isManager ? `Blue-collar task management` : undefined}
        action={
          isManager && selectedEmployeeId ? (
            <Button size="sm" icon={<Plus size={13} />} onClick={() => { setAddOpen(true); setAddError(""); }}>
              Assign Task
            </Button>
          ) : undefined
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
            <p className="text-xs text-text-secondary">No blue-collar employees in your team.</p>
          ) : (
            <Select
              label="Select Team Member"
              value={selectedEmployeeId}
              onChange={e => {
                setSelectedEmployeeId(e.target.value);
                fetchTasks(e.target.value);
              }}
              options={teamMembers.map(e => ({ value: e.Employee_ID, label: `${e.Name} — ${e.Department}` }))}
            />
          )}
        </div>
      )}

      {/* Task list */}
      {tasks.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={20} />}
          title={isManager ? "No tasks assigned yet" : "No tasks assigned"}
          description={isManager
            ? `Assign tasks to ${selectedEmployee?.Name ?? "this employee"} to start tracking their performance.`
            : "Your manager hasn't assigned any tasks yet."}
          action={isManager && selectedEmployeeId ? { label: "Assign First Task", onClick: () => setAddOpen(true) } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task, idx) => {
            const monthScore = currentMonthScores[idx];
            return (
              <div key={task.Task_ID} className="enterprise-card p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-text-primary">{task.Task_Description}</p>
                      <Badge variant={task.Status === "active" ? "active" : "inactive"} />
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1">
                      <span className="font-semibold">Target:</span> {task.Target}
                    </p>
                    {monthScore && (
                      <div className="flex items-center gap-3 mt-2">
                        {monthScore.self_score > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                            Self: <RatingBadge score={monthScore.self_score} />
                          </span>
                        )}
                        {monthScore.manager_score > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                            Manager: <RatingBadge score={monthScore.manager_score} />
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {isManager && (
                    <Button size="sm" variant="secondary" onClick={() => openEdit(task)}>Edit</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={`Assign Task to ${selectedEmployee?.Name ?? ""}`}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" loading={addLoading} onClick={handleAddTask}>Assign Task</Button>
          </>
        }
      >
        <div className="space-y-4">
          {addError && (
            <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
              <AlertCircle size={12} /> {addError}
            </div>
          )}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">Task Description *</label>
            <textarea
              value={addDesc}
              onChange={e => setAddDesc(e.target.value)}
              rows={3}
              placeholder="Describe the task in detail..."
              className="enterprise-input w-full resize-none text-sm py-2"
            />
            {addDesc.length > 0 && addDesc.trim().length < 10 && (
              <p className="text-[11px] text-warning">Minimum 10 characters</p>
            )}
          </div>
          <Input
            label="Target / Success Metric *"
            value={addTarget}
            onChange={e => setAddTarget(e.target.value)}
            placeholder="e.g. Complete 50 units daily"
          />
        </div>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        open={!!editTask}
        onClose={() => setEditTask(null)}
        title="Edit Task"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditTask(null)}>Cancel</Button>
            <Button size="sm" loading={editLoading} onClick={handleEditTask}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          {editError && (
            <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
              <AlertCircle size={12} /> {editError}
            </div>
          )}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">Task Description</label>
            <textarea
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              rows={3}
              className="enterprise-input w-full resize-none text-sm py-2"
            />
          </div>
          <Input label="Target" value={editTarget} onChange={e => setEditTarget(e.target.value)} />
          <Select
            label="Status"
            value={editStatus}
            onChange={e => setEditStatus(e.target.value as "active" | "inactive")}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}
