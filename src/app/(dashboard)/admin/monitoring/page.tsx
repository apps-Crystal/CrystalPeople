"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Lock, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { PageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, monthLabel } from "@/lib/utils";
import type { Employee, ReviewCycle, ConfigMap } from "@/lib/types";

interface TeamMember {
  employee: Employee;
  cycle: ReviewCycle | null;
}

type StatusFilter = "all" | "pending" | "self_scored" | "manager_scored" | "acknowledged" | "locked";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "self_scored", label: "Self-Scored" },
  { value: "manager_scored", label: "Manager-Scored" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "locked", label: "Locked" },
];

export default function MonitoringPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [config, setConfig] = useState<ConfigMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [lockingId, setLockingId] = useState<string | null>(null);
  const [bulkLocking, setBulkLocking] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ locked_count: number } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [teamRes, configRes] = await Promise.all([
        fetch("/api/monthly/score-team"),
        fetch("/api/config"),
      ]);
      if (teamRes.ok) { const d = await teamRes.json(); setTeam(d.team ?? []); }
      if (configRes.ok) { const d = await configRes.json(); setConfig(d.config); }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleLock(cycleId: string) {
    setLockingId(cycleId);
    try {
      const res = await fetch("/api/monthly/lock-cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycle_id: cycleId }),
      });
      if (res.ok) { await fetchData(); }
    } finally {
      setLockingId(null);
    }
  }

  async function handleBulkLock() {
    if (!config) return;
    setBulkLocking(true);
    setBulkResult(null);
    try {
      const res = await fetch("/api/monthly/bulk-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: config.current_month, year: config.current_year }),
      });
      if (res.ok) {
        const d = await res.json();
        setBulkResult(d);
        await fetchData();
      }
    } finally {
      setBulkLocking(false);
    }
  }

  if (loading) return <PageLoader />;

  const currentLabel = config ? monthLabel(config.current_month, config.current_year) : "";

  const total = team.length;
  const selfScored = team.filter(t => t.cycle?.Status === "self_scored").length;
  const managerScored = team.filter(t => t.cycle?.Status === "manager_scored").length;
  const acknowledged = team.filter(t => t.cycle?.Status === "acknowledged").length;
  const locked = team.filter(t => t.cycle?.Status === "locked").length;
  const pending = total - selfScored - managerScored - acknowledged - locked;

  const filtered = team.filter(t => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return !t.cycle || t.cycle.Status === "pending";
    return t.cycle?.Status === statusFilter;
  });

  const canBulkLock = team.some(
    t => t.cycle?.Status === "acknowledged" || t.cycle?.Status === "manager_scored"
  );

  return (
    <div className="max-w-4xl space-y-5">
      <PageHeader
        title={`Review Monitor — ${currentLabel}`}
        action={
          <Button
            onClick={handleBulkLock}
            loading={bulkLocking}
            disabled={!canBulkLock}
            size="sm"
            variant="primary"
          >
            <Lock size={13} className="mr-1.5" />
            Lock All Acknowledged
          </Button>
        }
      />

      {bulkResult && (
        <div className="flex items-center gap-2 text-xs text-success bg-success/10 border border-success/20 rounded-sm px-3 py-2">
          <CheckCircle2 size={13} /> Locked {bulkResult.locked_count} cycle{bulkResult.locked_count !== 1 ? "s" : ""} successfully.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Total", value: total },
          { label: "Pending", value: pending, color: "text-text-secondary" },
          { label: "Self-Scored", value: selfScored, color: "text-warning" },
          { label: "Mgr-Scored", value: managerScored, color: "text-blue-600" },
          { label: "Acknowledged", value: acknowledged, color: "text-accent-600" },
          { label: "Locked", value: locked, color: "text-success" },
        ].map(s => (
          <div key={s.label} className="enterprise-card p-3 text-center">
            <p className="text-[10px] text-text-secondary uppercase tracking-wide leading-tight">{s.label}</p>
            <p className={cn("text-xl font-bold mt-1", s.color ?? "text-text-primary")}>{s.value}</p>
            {total > 0 && (
              <p className="text-[10px] text-text-secondary">
                {Math.round((s.value / total) * 100)}%
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-sm border transition-colors",
              statusFilter === f.value
                ? "bg-primary-700 text-white border-primary-700"
                : "bg-surface text-text-secondary border-border hover:border-primary-300 hover:text-text-primary"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Users size={20} />} title="No employees" description="No employees match this filter." />
      ) : (
        <div className="enterprise-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-primary-50">
                  <th className="px-4 py-2 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Name</th>
                  <th className="px-4 py-2 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wide hidden md:table-cell">Dept</th>
                  <th className="px-4 py-2 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wide hidden md:table-cell">Type</th>
                  <th className="px-4 py-2 text-left text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                  <th className="px-4 py-2 text-center text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Score</th>
                  <th className="px-4 py-2 text-right text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(({ employee, cycle }) => {
                  const canLock = cycle?.Status === "acknowledged" || cycle?.Status === "manager_scored";
                  const isLocked = cycle?.Status === "locked";
                  return (
                    <tr key={employee.Employee_ID} className="hover:bg-primary-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-text-primary">{employee.Name}</p>
                        <p className="text-[11px] text-text-secondary md:hidden">{employee.Department}</p>
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs hidden md:table-cell">{employee.Department}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-[11px] text-text-secondary">
                          {employee.Employee_Type === "white_collar" ? "White-collar" : "Blue-collar"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {cycle ? (
                          <Badge variant={cycle.Status as "pending" | "self_scored" | "manager_scored" | "acknowledged" | "locked"} />
                        ) : (
                          <Badge variant="pending" label="Not Started" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {cycle?.Locked_Average ? (
                          <RatingBadge score={Number(cycle.Locked_Average)} size="sm" />
                        ) : (
                          <span className="text-text-secondary text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isLocked ? (
                          <CheckCircle2 size={16} className="text-success inline-block" />
                        ) : canLock ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={lockingId === cycle?.Cycle_ID}
                            onClick={() => cycle?.Cycle_ID && handleLock(cycle.Cycle_ID)}
                          >
                            <Lock size={11} className="mr-1" />
                            Lock
                          </Button>
                        ) : (
                          <span className="text-text-secondary text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
