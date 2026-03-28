"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { RatingBadge } from "@/components/ui/RatingBadge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface MDDashboardData {
  role: string;
  orgStats: {
    totalEmployees: number;
    reviewCompletion: {
      total: number;
      selfScored: number;
      managerScored: number;
      acknowledged: number;
      locked: number;
    };
    topScore: number;
    avgOrgScore: number;
  };
  departmentBreakdown: {
    department: string;
    total: number;
    selfScored: number;
    managerScored: number;
    acknowledged: number;
    locked: number;
    avgScore: number;
  }[];
  managerStats: {
    managerId: string;
    managerName: string;
    department: string;
    teamSize: number;
    reviewsCompleted: number;
    avgTeamScore: number;
  }[];
  topPerformers: {
    employeeId: string;
    name: string;
    department: string;
    avgScore: number;
    ratingBand: string;
  }[];
  monthlyTrend: { month: number; year: number; label: string; avgScore: number }[];
}


export function MDDashboard({ data }: { data: MDDashboardData }) {
  const { orgStats, departmentBreakdown, managerStats, topPerformers, monthlyTrend } = data;

  const completionPct =
    orgStats.reviewCompletion.total > 0
      ? Math.round(
          ((orgStats.reviewCompletion.acknowledged + orgStats.reviewCompletion.locked) /
            orgStats.reviewCompletion.total) *
            100
        )
      : 0;

  return (
    <div className="space-y-5">
      <PageHeader title="Executive Dashboard" />

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="enterprise-card p-4 text-center">
          <p className="text-2xl font-bold text-primary-900">{orgStats.totalEmployees}</p>
          <p className="text-[11px] text-text-secondary uppercase tracking-wide mt-1">Total Employees</p>
        </div>
        <div className="enterprise-card p-4 text-center">
          <p className="text-2xl font-bold text-primary-900">{completionPct}%</p>
          <p className="text-[11px] text-text-secondary uppercase tracking-wide mt-1">Review Completion</p>
        </div>
        <div className="enterprise-card p-4 text-center">
          {orgStats.topScore > 0 ? (
            <RatingBadge score={orgStats.topScore} size="lg" />
          ) : (
            <p className="text-2xl font-bold text-text-secondary">—</p>
          )}
          <p className="text-[11px] text-text-secondary uppercase tracking-wide mt-1">Top Score</p>
        </div>
        <div className="enterprise-card p-4 text-center">
          {orgStats.avgOrgScore > 0 ? (
            <RatingBadge score={orgStats.avgOrgScore} size="lg" />
          ) : (
            <p className="text-2xl font-bold text-text-secondary">—</p>
          )}
          <p className="text-[11px] text-text-secondary uppercase tracking-wide mt-1">Avg Org Score</p>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="enterprise-card p-5">
        <h2 className="font-semibold text-sm text-primary-900 mb-3">Department Breakdown</h2>
        {departmentBreakdown.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide border-b border-border">
                <th className="text-left pb-2">Department</th>
                <th className="text-center pb-2">Total</th>
                <th className="text-center pb-2">Self</th>
                <th className="text-center pb-2">Manager</th>
                <th className="text-center pb-2">Acknowledged</th>
                <th className="text-center pb-2">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {departmentBreakdown.map((row, i) => (
                <tr
                  key={row.department}
                  className={`border-b border-border/50 hover:bg-primary-50/50 transition-colors ${
                    i % 2 === 0 ? "even:bg-primary-50/30" : ""
                  }`}
                >
                  <td className="py-2 font-medium text-text-primary">{row.department}</td>
                  <td className="py-2 text-center text-text-primary">{row.total}</td>
                  <td className="py-2 text-center text-text-secondary">{row.selfScored}</td>
                  <td className="py-2 text-center text-text-secondary">{row.managerScored}</td>
                  <td className="py-2 text-center text-text-secondary">{row.acknowledged}</td>
                  <td className="py-2 text-center">
                    {row.avgScore > 0 ? (
                      <RatingBadge score={row.avgScore} />
                    ) : (
                      <span className="text-text-secondary">—</span>
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

      {/* Manager Performance */}
      <div className="enterprise-card p-5">
        <h2 className="font-semibold text-sm text-primary-900 mb-3">Manager Performance</h2>
        {managerStats.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide border-b border-border">
                <th className="text-left pb-2">Manager</th>
                <th className="text-left pb-2">Department</th>
                <th className="text-center pb-2">Team Size</th>
                <th className="text-center pb-2">Reviews Done</th>
                <th className="text-center pb-2">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {managerStats.map((mgr) => (
                <tr
                  key={mgr.managerId}
                  className="border-b border-border/50 hover:bg-primary-50/50 transition-colors cursor-pointer"
                  onClick={() => { window.location.href = "/monthly/score-team"; }}
                >
                  <td className="py-2 font-medium text-text-primary">{mgr.managerName}</td>
                  <td className="py-2 text-text-secondary text-xs">{mgr.department}</td>
                  <td className="py-2 text-center text-text-primary">{mgr.teamSize}</td>
                  <td className="py-2 text-center text-text-secondary">
                    {mgr.reviewsCompleted}/{mgr.teamSize}
                  </td>
                  <td className="py-2 text-center">
                    {mgr.avgTeamScore > 0 ? (
                      <RatingBadge score={mgr.avgTeamScore} />
                    ) : (
                      <span className="text-text-secondary">—</span>
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

      {/* Two-column: Top Performers | Monthly Score Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Performers */}
        <div className="enterprise-card p-5">
          <h2 className="font-semibold text-sm text-primary-900 mb-3">Top Performers This Month</h2>
          {topPerformers.length > 0 ? (
            <div className="space-y-2">
              {topPerformers.map((p, i) => (
                <div key={p.employeeId} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-base w-6 flex-shrink-0 text-center">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{p.name}</p>
                    <p className="text-[10px] text-text-secondary">{p.department}</p>
                  </div>
                  <RatingBadge score={p.avgScore} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-secondary text-center py-6">No scored reviews yet</p>
          )}
        </div>

        {/* Monthly Score Trend */}
        <div className="enterprise-card p-5">
          <h2 className="font-semibold text-sm text-primary-900 mb-3">Monthly Score Trend</h2>
          {monthlyTrend.some((t) => t.avgScore > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9 }}
                  tickFormatter={(v: string) => v.split(" ")[0]}
                />
                <YAxis domain={[1, 5]} tick={{ fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ fontSize: "11px" }}
                  formatter={(value) => [typeof value === "number" ? value.toFixed(2) : value, "Avg Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 3 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[180px]">
              <p className="text-xs text-text-secondary text-center">No data yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
