"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, ChevronDown, ChevronRight, AlertCircle, ClipboardList, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { Select } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/components/auth/AuthProvider";
import type { Task, Employee } from "@/lib/types";

export default function TeamTasksPage() {
  const { user } = useCurrentUser();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskLoading, setTaskLoading] = useState(false);
  const [error, setError] = useState("");

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

  // Inactive tasks section
  const [inactiveExpanded, setInactiveExpanded] = useState(false);

  const isManager = user?.role === "manager" || user?.role === "hr" || user?.role === "md";

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const data = await res.json();
        const emps = (data.employees ?? []) as Employee[];

        // Filter for blue-collar employees
        let blueCollar = emps.filter(e => e.Employee_Type === "blue_collar" && e.Status === "active");

        // If manager, filter for their direct reports
        if (user?.role === "manager") {
          blueCollar = blueCollar.filter(e => e.Manager_ID === user.userId && e.Employee_ID !== user.userId);
        }

        setEmployees(blueCollar);
        if (blueCollar.length > 0) {
          setSelectedEmployeeId(blueCollar[0].Employee_ID);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user?.role, user?.userId]);

  const fetchTasks = useCallback(async (empId: string) => {
    if (!empId) return;
    setTaskLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tasks?employee_id=${empId}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks ?? []);
      } else {
        setError("Failed to load tasks");
      }
    } finally {
      setTaskLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || !isManager) return;
    fetchEmployees();
  }, [user, isManager, fetchEmployees]);

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchTasks(selectedEmployeeId);
    }
  }, [selectedEmployeeId, fetchTasks]);

  async function handleAddTask() {
    setAddError("");
    if (addDesc.trim().length < 10) {
      setAddError("Task description must be at least 10 characters");
      return;
    }
    if (addTarget.trim().length < 5) {
      setAddError("Target must be at least 5 characters");
      return;
    }
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
      if (!res.ok) {
        setAddError(data.error ?? "Failed to add task");
        return;
      }
      setAddOpen(false);
      setAddDesc("");
      setAddTarget("");
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
        body: JSON.stringify({
          task_description: editDesc,
          target: editTarget,
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error ?? "Failed to update task");
        return;
      }
      setEditTask(null);
      await fetchTasks(selectedEmployeeId);
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDeactivateTask(taskId: string) {
    setEditLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "inactive" }),
      });
      if (res.ok) {
        await fetchTasks(selectedEmployeeId);
      }
    } finally {
      setEditLoading(false);
    }
  }

  async function handleReactivateTask(taskId: string) {
    setEditLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (res.ok) {
        await fetchTasks(selectedEmployeeId);
      }
    } finally {
      setEditLoading(false);
    }
  }

  if (!user || !isManager) {
    return <PageLoader />;
  }

  if (loading) {
    return <PageLoader />;
  }

  const selectedEmployee = employees.find(e => e.Employee_ID === selectedEmployeeId);
  const activeTasks = tasks.filter(t => t.Status === "active");
  const inactiveTasks = tasks.filter(t => t.Status === "inactive");

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        title="Team Tasks"
        subtitle="Blue-collar task management"
        action={
          selectedEmployeeId ? (
            <Button size="sm" icon={<Plus size={13} />} onClick={() => { setAddOpen(true); setAddError(""); }}>
              Add Task
            </Button>
          ) : undefined
        }
      />

      {error && (
        <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {/* Employee selector */}
      <div className="enterprise-card p-4">
        {employees.length === 0 ? (
          <p className="text-xs text-text-secondary">No blue-collar employees available.</p>
        ) : (
          <Select
            label="Select Employee"
            value={selectedEmployeeId}
            onChange={e => setSelectedEmployeeId(e.target.value)}
            options={employees.map(e => ({ value: e.Employee_ID, label: `${e.Name} — ${e.Department}` }))}
          />
        )}
      </div>

      {/* Task list */}
      {selectedEmployeeId && (
        <>
          {taskLoading ? (
            <PageLoader />
          ) : activeTasks.length === 0 && inactiveTasks.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={20} />}
              title="No tasks assigned yet"
              description={`Assign tasks to ${selectedEmployee?.Name ?? "this employee"} to start tracking their performance.`}
              action={{ label: "Add First Task", onClick: () => setAddOpen(true) }}
            />
          ) : (
            <div className="space-y-4">
              {/* Active tasks */}
              {activeTasks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide px-4 py-2">Active Tasks</h3>
                  <div className="space-y-2">
                    {activeTasks.map(task => (
                      <div key={task.Task_ID} className="enterprise-card p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-text-primary">{task.Task_Description}</p>
                              <Badge variant="active" />
                            </div>
                            <p className="text-[11px] text-text-secondary mt-2">
                              <span className="font-semibold">Target:</span> {task.Target}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleDeactivateTask(task.Task_ID)}
                              loading={editLoading}
                            >
                              Deactivate
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => openEdit(task)}>
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inactive tasks (collapsible) */}
              {inactiveTasks.length > 0 && (
                <div className="enterprise-card overflow-hidden">
                  <button
                    onClick={() => setInactiveExpanded(!inactiveExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary-50/50 transition-colors"
                  >
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      Inactive Tasks ({inactiveTasks.length})
                    </span>
                    {inactiveExpanded ? (
                      <ChevronDown size={14} className="text-text-secondary" />
                    ) : (
                      <ChevronRight size={14} className="text-text-secondary" />
                    )}
                  </button>
                  {inactiveExpanded && (
                    <div className="border-t border-border divide-y divide-border">
                      {inactiveTasks.map(task => (
                        <div key={task.Task_ID} className="px-4 py-3 flex items-start gap-3 bg-primary-50/20">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-text-primary">{task.Task_Description}</p>
                              <Badge variant="inactive" />
                            </div>
                            <p className="text-[11px] text-text-secondary mt-2">
                              <span className="font-semibold">Target:</span> {task.Target}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleReactivateTask(task.Task_ID)}
                            loading={editLoading}
                          >
                            Reactivate
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add Task Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={`Assign Task to ${selectedEmployee?.Name ?? ""}`}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" loading={addLoading} onClick={handleAddTask}>
              Assign Task
            </Button>
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
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Task Description *
            </label>
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
            <Button variant="secondary" size="sm" onClick={() => setEditTask(null)}>
              Cancel
            </Button>
            <Button size="sm" loading={editLoading} onClick={handleEditTask}>
              Save Changes
            </Button>
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
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Task Description
            </label>
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
