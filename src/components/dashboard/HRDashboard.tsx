"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface HRDashboardData {
  role: string;
  stats: {
    totalEmployees: number;
    reviewCycleStatus: { total: number; completed: number; pending: number };
    pendingGrievances: number;
    employeesWithoutManager: number;
  };
  reviewMonitor: {
    department: string;
    pending: number;
    selfScored: number;
    managerScored: number;
    acknowledged: number;
    locked: number;
  }[];
  employeesByDepartment: { department: string; count: number }[];
  grievanceQueue: {
    grievanceId: string;
    employeeName: string;
    subject: string;
    category: string;
    status: string;
    filedAt: string;
  }[];
  config: { currentMonth: number; currentYear: number };
}

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function grievanceStatusVariant(
  status: string
): "pending" | "active" | "complete" | "default" {
  if (status === "submitted") return "pending";
  if (status === "in_review") return "active";
  if (status === "resolved" || status === "closed") return "complete";
  return "default";
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function HRDashboard({ data }: { data: HRDashboardData }) {
  const { stats, reviewMonitor, employeesByDepartment, grievanceQueue, config } = data;

  const completionPct =
    stats.reviewCycleStatus.total > 0
      ? Math.round((stats.reviewCycleStatus.completed / stats.reviewCycleStatus.total) * 100)
      : 0;

  return (
    <div className="space-y-5">
      <PageHeader title="HR Dashboard" />

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="enterprise-card p-4 text-center">
          <p className="text-2xl font-bold text-primary-900">{stats.totalEmployees}</p>
          <p className="text-[11px] text-text-secondary uppercase tracking-wide mt-1">Total Employees</p>
        </div>
        <div className="enterprise-card p-4 text-center">
          <p className="text-2xl font-bold text-primary-900">{stats.reviewCycleStatus.completed}</p>
          <p className="text-[11px] text-text-secondary uppercase tracking-wide mt-1">Reviews Completed</p>
        </div>
        <div className="enterprise-card p-4 text-center">
          <p className="text-2xl font-bold text-primary-900">{stats.pendingGrievances}</p>
          <p className="text-[11px] text-text-secondary uppercase tracking-wide mt-1">Pending Grievances</p>
        </div>
        <div className="enterprise-card p-4 text-center">
          <p className="text-2xl font-bold text-primary-900">{stats.employeesWithoutManager}</p>
          <p className="text-[11px] text-text-secondary uppercase tracking-wide mt-1">Without Manager</p>
        </div>
      </div>

      {/* Review Monitor */}
      <div className="enterprise-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-primary-900">Review Monitor</h2>
          <Link href="/admin/monitoring" className="text-xs text-primary-600 hover:underline">
            View Monitor →
          </Link>
        </div>
        {reviewMonitor.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide border-b border-border">
                <th className="text-left pb-2">Department</th>
                <th className="text-center pb-2">Pending</th>
                <th className="text-center pb-2">Self</th>
                <th className="text-center pb-2">Manager</th>
                <th className="text-center pb-2">Acknowledged</th>
                <th className="text-left pb-2 pl-3">Progress</th>
              </tr>
            </thead>
            <tbody>
              {reviewMonitor.map((row) => {
                const total = row.pending + row.selfScored + row.managerScored + row.acknowledged + row.locked;
                const done = row.acknowledged + row.locked;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <tr key={row.department} className="border-b border-border/50 hover:bg-primary-50/50 transition-colors">
                    <td className="py-2 font-medium text-text-primary">{row.department}</td>
                    <td className="py-2 text-center text-text-secondary">{row.pending}</td>
                    <td className="py-2 text-center text-text-secondary">{row.selfScored}</td>
                    <td className="py-2 text-center text-text-secondary">{row.managerScored}</td>
                    <td className="py-2 text-center text-text-secondary">{row.acknowledged}</td>
                    <td className="py-2 pl-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 w-full bg-primary-100 rounded-full h-1.5">
                          <div
                            className="bg-primary-600 h-1.5 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-text-secondary w-8 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-text-secondary text-center py-6">No data yet</p>
        )}
      </div>

      {/* Two-column: Pie chart + Grievance Queue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Employees by Department pie */}
        <div className="enterprise-card p-5">
          <h2 className="font-semibold text-sm text-primary-900 mb-3">Employees by Department</h2>
          {employeesByDepartment.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={employeesByDepartment}
                    dataKey="count"
                    nameKey="department"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                  >
                    {employeesByDepartment.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{ fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap gap-2">
                {employeesByDepartment.map((d, idx) => (
                  <div key={d.department} className="flex items-center gap-1">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="text-[10px] text-text-secondary">{d.department} ({d.count})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-text-secondary text-center py-6">No data yet</p>
          )}
        </div>

        {/* Grievance Queue */}
        <div className="enterprise-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm text-primary-900">Grievance Queue</h2>
            <Link href="/admin/grievances" className="text-xs text-primary-600 hover:underline">
              View All →
            </Link>
          </div>
          {grievanceQueue.length > 0 ? (
            <div className="space-y-2">
              {grievanceQueue.map((g) => (
                <div key={g.grievanceId} className="py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{g.employeeName}</p>
                      <p className="text-[10px] text-text-secondary truncate">{g.subject}</p>
                    </div>
                    <Badge variant={grievanceStatusVariant(g.status)} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-text-secondary capitalize">{g.category}</span>
                    <span className="text-[10px] text-text-secondary">· {fmtDate(g.filedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-secondary text-center py-6">No open grievances</p>
          )}
        </div>
      </div>

      {/* Config section */}
      <div className="enterprise-card p-4">
        <p className="text-[11px] text-text-secondary uppercase tracking-wide">
          Current Review Period — Month {config.currentMonth}, {config.currentYear}
          {" · "}
          Completion: {completionPct}% ({stats.reviewCycleStatus.completed}/{stats.reviewCycleStatus.total})
        </p>
      </div>
    </div>
  );
}
