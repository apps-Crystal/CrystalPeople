"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { RatingBadge } from "@/components/ui/RatingBadge";

export interface ManagerDashboardData {
  role: string;
  stats: { teamSize: number; reviewsPending: number; reflectionsThisWeek: number };
  teamReviewStatus: {
    employeeId: string;
    name: string;
    department: string;
    employeeType: string;
    cycleStatus: string | null;
    selfScore: number | null;
    managerScore: number | null;
  }[];
  assignedTasksOverview: { employeeId: string; name: string; activeTasks: number; completedTasks: number }[];
  weeklyReflections: { employeeId: string; name: string; submitted: boolean; mood: string | null }[];
  myOwnStatus: {
    selfScoreStatus: string | null;
    myAssignments: { active: number; completed: number };
  };
}

function cycleStatusVariant(
  status: string | null
): "pending" | "self_scored" | "manager_scored" | "acknowledged" | "locked" | "default" {
  if (!status) return "pending";
  const map: Record<string, "pending" | "self_scored" | "manager_scored" | "acknowledged" | "locked" | "default"> = {
    pending: "pending",
    self_scored: "self_scored",
    manager_scored: "manager_scored",
    acknowledged: "acknowledged",
    locked: "locked",
  };
  return map[status] ?? "default";
}

function moodEmoji(mood: string | null): string {
  if (!mood) return "—";
  // Handle numeric string
  const n = parseInt(mood, 10);
  if (!isNaN(n)) {
    if (n <= 1) return "😟";
    if (n === 2) return "😕";
    if (n === 3) return "😐";
    if (n === 4) return "🙂";
    return "😊";
  }
  // Handle string values
  const lower = mood.toLowerCase();
  if (lower === "bad" || lower === "stressed") return "😟";
  if (lower === "below" || lower === "low") return "😕";
  if (lower === "neutral" || lower === "ok") return "😐";
  if (lower === "good") return "🙂";
  if (lower === "great" || lower === "excellent") return "😊";
  return "😐";
}

export function ManagerDashboard({ data }: { data: ManagerDashboardData }) {
  const { stats, teamReviewStatus, assignedTasksOverview, weeklyReflections, myOwnStatus } = data;

  return (
    <div className="space-y-5">
      <PageHeader title="Team Dashboard" />

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="enterprise-card p-4 text-center">
          <p className="text-2xl font-bold text-primary-900">{stats.teamSize}</p>
          <p className="text-[11px] text-text-secondary uppercase tracking-wide mt-1">Team Size</p>
        </div>
        <div className="enterprise-card p-4 text-center">
          <p className="text-2xl font-bold text-primary-900">{stats.reviewsPending}</p>
          <p className="text-[11px] text-text-secondary uppercase tracking-wide mt-1">Reviews Pending</p>
        </div>
        <div className="enterprise-card p-4 text-center">
          <p className="text-2xl font-bold text-primary-900">{stats.reflectionsThisWeek}</p>
          <p className="text-[11px] text-text-secondary uppercase tracking-wide mt-1">Reflections This Week</p>
        </div>
      </div>

      {/* Team Review Status */}
      <div className="enterprise-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-primary-900">Team Review Status</h2>
          <Link href="/monthly/score-team" className="text-xs text-primary-600 hover:underline">
            Score Team →
          </Link>
        </div>
        {teamReviewStatus.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide border-b border-border">
                <th className="text-left pb-2">Name</th>
                <th className="text-left pb-2">Department</th>
                <th className="text-center pb-2">Status</th>
                <th className="text-center pb-2">Self Score</th>
              </tr>
            </thead>
            <tbody>
              {teamReviewStatus.map((emp) => (
                <tr
                  key={emp.employeeId}
                  className="border-b border-border/50 hover:bg-primary-50/50 transition-colors cursor-pointer"
                  onClick={() => { window.location.href = "/monthly/score-team"; }}
                >
                  <td className="py-2 font-medium text-text-primary">{emp.name}</td>
                  <td className="py-2 text-text-secondary text-xs">{emp.department}</td>
                  <td className="py-2 text-center">
                    <Badge variant={cycleStatusVariant(emp.cycleStatus)} />
                  </td>
                  <td className="py-2 text-center">
                    {emp.selfScore != null ? (
                      <RatingBadge score={emp.selfScore} />
                    ) : (
                      <span className="text-text-secondary text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-text-secondary text-center py-6">No data yet</p>
        )}
      </div>

      {/* Assigned Tasks Overview */}
      <div className="enterprise-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-primary-900">Assigned Tasks Overview</h2>
          <Link href="/assignments" className="text-xs font-medium text-primary-600 border border-primary-200 rounded-sm px-2 py-1 hover:bg-primary-50 transition-colors">
            Assign Tasks →
          </Link>
        </div>
        {assignedTasksOverview.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide border-b border-border">
                <th className="text-left pb-2">Employee</th>
                <th className="text-center pb-2">Active Tasks</th>
                <th className="text-center pb-2">Completed Tasks</th>
              </tr>
            </thead>
            <tbody>
              {assignedTasksOverview.map((row) => (
                <tr key={row.employeeId} className="border-b border-border/50 hover:bg-primary-50/50 transition-colors">
                  <td className="py-2 font-medium text-text-primary">{row.name}</td>
                  <td className="py-2 text-center text-text-primary">{row.activeTasks}</td>
                  <td className="py-2 text-center text-text-secondary">{row.completedTasks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-text-secondary text-center py-6">No data yet</p>
        )}
      </div>

      {/* Weekly Reflections */}
      <div className="enterprise-card p-5">
        <h2 className="font-semibold text-sm text-primary-900 mb-3">Weekly Reflections</h2>
        {weeklyReflections.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {weeklyReflections.map((m) => (
              <div
                key={m.employeeId}
                className={`rounded-sm border p-3 text-center ${
                  m.submitted
                    ? "border-success/30 bg-success/5"
                    : "border-border bg-primary-50/50"
                }`}
              >
                <p className="text-lg mb-1">{m.submitted ? moodEmoji(m.mood) : "❌"}</p>
                <p className="text-xs font-medium text-text-primary truncate">{m.name}</p>
                <p className={`text-[10px] mt-0.5 ${m.submitted ? "text-success" : "text-text-secondary"}`}>
                  {m.submitted ? "Submitted" : "Pending"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-secondary text-center py-6">No data yet</p>
        )}
      </div>

      {/* My Own Status */}
      <div className="enterprise-card p-4">
        <h2 className="font-semibold text-sm text-primary-900 mb-3">My Own Status</h2>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[11px] text-text-secondary uppercase tracking-wide mb-1">My Review</p>
            <Badge variant={cycleStatusVariant(myOwnStatus.selfScoreStatus)} />
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-[11px] text-text-secondary uppercase tracking-wide mb-1">My Assignments</p>
            <p className="text-sm text-text-primary">
              <span className="font-semibold text-primary-900">{myOwnStatus.myAssignments.active}</span> active ·{" "}
              <span className="text-text-secondary">{myOwnStatus.myAssignments.completed} completed</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
