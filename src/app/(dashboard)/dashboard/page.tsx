import Link from "next/link";
import { getSession } from "@/lib/auth";
import { readSheet, cachedReadSheet } from "@/lib/sheets";
import { getWeekStart, getWeekLabel, parseConfigRows, monthLabel, computeAverage, safeJsonParse } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { MessageSquare, Users, TrendingUp, Clock, CheckCircle } from "lucide-react";
import type { WeeklyReflection, WeeklyCheckin, Employee, ReviewCycle } from "@/lib/types";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const { role, name, userId } = session;
  const week = getWeekStart();

  const [reflections, checkins, employees, configRows, cycles] = await Promise.all([
    readSheet("Weekly_Reflections") as unknown as Promise<WeeklyReflection[]>,
    readSheet("Weekly_Checkins") as unknown as Promise<WeeklyCheckin[]>,
    readSheet("Employees") as unknown as Promise<Employee[]>,
    cachedReadSheet("Config") as unknown as Promise<{ Key: string; Value: string }[]>,
    readSheet("Review_Cycles") as unknown as Promise<ReviewCycle[]>,
  ]);

  const config = parseConfigRows(configRows as { Key: string; Value: string }[]);
  const curLabel = monthLabel(config.current_month, config.current_year);
  const curMonth = String(config.current_month);
  const curYear = String(config.current_year);

  const myReflection = (reflections as WeeklyReflection[]).find(
    r => r.Employee_ID === userId && r.Week_Start_Date === week
  ) ?? null;
  const myCheckin = (checkins as WeeklyCheckin[]).find(
    c => c.Employee_ID === userId && c.Week_Start_Date === week
  ) ?? null;

  // My monthly cycle
  const myCycle = (cycles as ReviewCycle[]).find(
    c => c.Employee_ID === userId && c.Month === curMonth && c.Year === curYear
  ) ?? null;

  // Team scoring stats (for managers/hr/md)
  let teamSize = 0, teamReflected = 0, teamCheckedIn = 0;
  let teamScoredCount = 0;
  if (role === "manager" || role === "hr" || role === "md") {
    const team = (employees as Employee[]).filter(e =>
      role === "manager"
        ? e.Manager_ID === userId && e.Status === "active" && e.Employee_ID !== userId
        : e.Status === "active" && e.Employee_ID !== userId
    );
    teamSize = team.length;
    const reflMap = new Set((reflections as WeeklyReflection[]).filter(r => r.Week_Start_Date === week).map(r => r.Employee_ID));
    const chkMap = new Set((checkins as WeeklyCheckin[]).filter(c => c.Week_Start_Date === week).map(c => c.Employee_ID));
    teamReflected = team.filter(e => reflMap.has(e.Employee_ID)).length;
    teamCheckedIn = team.filter(e => chkMap.has(e.Employee_ID)).length;
    teamScoredCount = team.filter(e => {
      const c = (cycles as ReviewCycle[]).find(
        cyc => cyc.Employee_ID === e.Employee_ID && cyc.Month === curMonth && cyc.Year === curYear
      );
      return c && (c.Status === "manager_scored" || c.Status === "acknowledged" || c.Status === "locked");
    }).length;
  }

  const hasFeedback = !!myCheckin && !myReflection?.Acknowledged_At;
  const weekLabel = getWeekLabel(week);

  // Compute self average for display
  const selfAvg = myCycle?.Self_Scores
    ? computeAverage(Object.values(safeJsonParse<Record<string, number>>(myCycle.Self_Scores, {})))
    : 0;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-lg font-bold text-text-primary">
          Good {getGreeting()}, {name.split(" ")[0]}
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">{weekLabel}</p>
      </div>

      {/* Weekly status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/weekly/reflection" className="enterprise-card p-4 hover:shadow-md transition-shadow block group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-8 h-8 rounded-sm bg-primary-50 flex items-center justify-center">
              <MessageSquare size={15} className="text-primary-600" />
            </div>
            {myReflection
              ? <Badge variant="complete" label="Done ✓" />
              : <Badge variant="pending" label="Pending" />
            }
          </div>
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Weekly Reflection</p>
          <p className="text-sm font-medium text-text-primary mt-1 group-hover:text-primary-600 transition-colors">
            {myReflection
              ? hasFeedback ? "New feedback — tap to view →" : "Reflection submitted ✓"
              : "Submit your reflection →"
            }
          </p>
        </Link>

        {(role === "manager" || role === "hr" || role === "md") && (
          <Link href="/weekly/checkin" className="enterprise-card p-4 hover:shadow-md transition-shadow block group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-sm bg-primary-50 flex items-center justify-center">
                <Users size={15} className="text-primary-600" />
              </div>
              <Badge
                variant={teamCheckedIn === teamSize && teamSize > 0 ? "complete" : "pending"}
                label={`${teamCheckedIn}/${teamSize}`}
              />
            </div>
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Team Check-Ins</p>
            <p className="text-sm font-medium text-text-primary mt-1 group-hover:text-primary-600 transition-colors">
              {teamSize === 0
                ? "No team members"
                : teamCheckedIn === teamSize
                  ? "All check-ins complete ✓"
                  : `${teamSize - teamCheckedIn} pending →`}
            </p>
          </Link>
        )}

        {/* Monthly Self-Assessment card */}
        {role === "employee" ? (
          <MonthlyEmployeeCard cycle={myCycle} curLabel={curLabel} selfAvg={selfAvg} windowOpen={
            new Date().getDate() >= config.window_open_day &&
            new Date().getDate() <= config.window_close_day &&
            new Date().getMonth() + 1 === config.current_month &&
            new Date().getFullYear() === config.current_year
          } />
        ) : (
          <Link href="/monthly/score-team" className="enterprise-card p-4 hover:shadow-md transition-shadow block group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-sm bg-primary-50 flex items-center justify-center">
                <TrendingUp size={15} className="text-primary-600" />
              </div>
              <Badge
                variant={teamScoredCount === teamSize && teamSize > 0 ? "complete" : "pending"}
                label={`${teamScoredCount}/${teamSize}`}
              />
            </div>
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Team Monthly Scoring</p>
            <p className="text-sm font-medium text-text-primary mt-1 group-hover:text-primary-600 transition-colors">
              {teamSize === 0
                ? "No team members"
                : teamScoredCount === teamSize
                  ? "All scored ✓"
                  : `${teamSize - teamScoredCount} of ${teamSize} scored →`}
            </p>
          </Link>
        )}
      </div>

      {/* Pending actions */}
      <div className="enterprise-card p-5">
        <h2 className="font-semibold text-sm text-primary-900 mb-3">Pending Actions</h2>
        <div className="space-y-1">
          {!myReflection && (
            <PendingItem href="/weekly/reflection" icon={<MessageSquare size={14} />}
              title="Submit Weekly Reflection" subtitle={weekLabel} urgency="medium" />
          )}
          {hasFeedback && (
            <PendingItem href="/weekly/reflection" icon={<CheckCircle size={14} />}
              title="Acknowledge Manager Feedback" subtitle="Your manager submitted a check-in" urgency="high" />
          )}
          {role === "employee" && !myCycle && (
            <PendingItem href="/monthly/self-score" icon={<TrendingUp size={14} />}
              title="Complete Monthly Self-Assessment" subtitle={curLabel} urgency="medium" />
          )}
          {role === "employee" && myCycle?.Status === "manager_scored" && (
            <PendingItem href="/monthly/self-score" icon={<TrendingUp size={14} />}
              title="Manager has scored you — view results" subtitle={curLabel} urgency="high" />
          )}
          {(role === "manager" || role === "hr" || role === "md") && teamReflected > teamCheckedIn && (
            <PendingItem href="/weekly/checkin" icon={<Users size={14} />}
              title={`${teamReflected - teamCheckedIn} check-in${teamReflected - teamCheckedIn !== 1 ? "s" : ""} to write`}
              subtitle={`${teamReflected} team member${teamReflected !== 1 ? "s" : ""} submitted reflections`}
              urgency="medium" />
          )}
          {(role === "manager" || role === "hr" || role === "md") && teamScoredCount < teamSize && teamSize > 0 && (
            <PendingItem href="/monthly/score-team" icon={<TrendingUp size={14} />}
              title={`${teamSize - teamScoredCount} team member${teamSize - teamScoredCount !== 1 ? "s" : ""} to score`}
              subtitle={curLabel} urgency="medium" />
          )}
          {(role === "hr" || role === "md") && (
            <PendingItem href="/admin/employees" icon={<Clock size={14} />}
              title="Employee Management" subtitle="Manage your workforce" urgency="low" />
          )}
          {myReflection && !hasFeedback && role === "employee" && myCycle?.Status === "acknowledged" && (
            <p className="text-xs text-text-secondary py-4 text-center">You&apos;re all caught up this month. 🎉</p>
          )}
        </div>
      </div>

      {/* Monthly review card */}
      {role === "employee" && (
        <div className="enterprise-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-primary-900">This Month&apos;s Review — {curLabel}</h2>
            {myCycle
              ? <Badge variant={myCycle.Status as "self_scored" | "manager_scored" | "acknowledged"} />
              : <Badge variant="pending" label="Not started" />
            }
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-sm bg-primary-50 p-3 text-center">
              <p className="text-[11px] text-text-secondary mb-2 uppercase tracking-wide">Self Score</p>
              {selfAvg > 0
                ? <RatingBadge score={selfAvg} size="lg" />
                : <p className="text-xl font-bold text-text-secondary">—</p>
              }
            </div>
            <div className="rounded-sm bg-primary-50 p-3 text-center">
              <p className="text-[11px] text-text-secondary mb-2 uppercase tracking-wide">Manager Score</p>
              {myCycle?.Locked_Average
                ? <RatingBadge score={Number(myCycle.Locked_Average)} size="lg" />
                : <p className="text-xl font-bold text-text-secondary">—</p>
              }
            </div>
            <div className="rounded-sm bg-primary-50 p-3 text-center">
              <p className="text-[11px] text-text-secondary mb-2 uppercase tracking-wide">Average</p>
              {myCycle?.Locked_Average
                ? <RatingBadge score={Number(myCycle.Locked_Average)} size="lg" showLabel />
                : <p className="text-xl font-bold text-text-secondary">—</p>
              }
            </div>
          </div>
          {!myCycle && (
            <p className="text-xs text-text-secondary mt-3 text-center">
              Monthly scoring opens on day {config.window_open_day}. Set up your goals first.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MonthlyEmployeeCard({
  cycle, curLabel, selfAvg, windowOpen,
}: {
  cycle: ReviewCycle | null; curLabel: string; selfAvg: number; windowOpen: boolean;
}) {
  if (!cycle && windowOpen) {
    return (
      <Link href="/monthly/self-score" className="enterprise-card p-4 hover:shadow-md transition-shadow block group">
        <div className="flex items-start justify-between mb-3">
          <div className="w-8 h-8 rounded-sm bg-primary-50 flex items-center justify-center">
            <TrendingUp size={15} className="text-primary-600" />
          </div>
          <Badge variant="pending" label="Open" />
        </div>
        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Monthly Self-Assessment</p>
        <p className="text-sm font-medium text-primary-600 mt-1 group-hover:underline">
          Score yourself for {curLabel} →
        </p>
      </Link>
    );
  }

  if (cycle?.Status === "self_scored") {
    return (
      <div className="enterprise-card p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-8 h-8 rounded-sm bg-primary-50 flex items-center justify-center">
            <TrendingUp size={15} className="text-primary-600" />
          </div>
          <Badge variant="self_scored" />
        </div>
        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Monthly Self-Assessment</p>
        <p className="text-sm font-medium text-text-secondary mt-1">Submitted — waiting for manager review</p>
      </div>
    );
  }

  if (cycle?.Status === "manager_scored") {
    return (
      <Link href="/monthly/self-score" className="enterprise-card p-4 hover:shadow-md transition-shadow block group border-l-4 border-l-accent-500">
        <div className="flex items-start justify-between mb-3">
          <div className="w-8 h-8 rounded-sm bg-primary-50 flex items-center justify-center">
            <TrendingUp size={15} className="text-accent-500" />
          </div>
          <Badge variant="manager_scored" />
        </div>
        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Monthly Self-Assessment</p>
        <p className="text-sm font-medium text-text-primary mt-1 group-hover:text-primary-600 transition-colors">
          Manager scored you — tap to view →
        </p>
      </Link>
    );
  }

  if (cycle?.Status === "acknowledged" || cycle?.Status === "locked") {
    return (
      <Link href="/monthly/self-score" className="enterprise-card p-4 hover:shadow-md transition-shadow block group">
        <div className="flex items-start justify-between mb-3">
          <div className="w-8 h-8 rounded-sm bg-primary-50 flex items-center justify-center">
            <TrendingUp size={15} className="text-success" />
          </div>
          <Badge variant="acknowledged" />
        </div>
        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Monthly Self-Assessment</p>
        <p className="text-sm font-medium text-text-primary mt-1">
          Review complete for {curLabel}
        </p>
        {cycle.Locked_Average && (
          <div className="mt-2">
            <RatingBadge score={Number(cycle.Locked_Average)} showLabel size="md" />
          </div>
        )}
      </Link>
    );
  }

  return (
    <div className="enterprise-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-sm bg-primary-50 flex items-center justify-center">
          <TrendingUp size={15} className="text-primary-600" />
        </div>
        <Badge variant="default" label="Closed" />
      </div>
      <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Monthly Self-Assessment</p>
      <p className="text-sm font-medium text-text-secondary mt-1">Scoring window not open</p>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function PendingItem({ href, icon, title, subtitle, urgency }: {
  href: string; icon: React.ReactNode; title: string; subtitle: string;
  urgency: "high" | "medium" | "low";
}) {
  const dot = urgency === "high" ? "bg-danger" : urgency === "medium" ? "bg-warning" : "bg-border";
  return (
    <Link href={href} className="flex items-center gap-3 py-2.5 px-3 rounded-sm hover:bg-primary-50 transition-colors group">
      <div className="w-8 h-8 rounded-sm bg-primary-50 group-hover:bg-white flex items-center justify-center text-primary-600 flex-shrink-0 transition-colors border border-transparent group-hover:border-border">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate group-hover:text-primary-600 transition-colors">{title}</p>
        <p className="text-xs text-text-secondary">{subtitle}</p>
      </div>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
    </Link>
  );
}
