import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { cachedReadSheet } from "@/lib/sheets";
import { parseConfigRows, getWeekStart, monthLabel, computeAverage, safeJsonParse } from "@/lib/utils";
import type { Employee, ReviewCycle, Assignment, WeeklyReflection, Grievance } from "@/lib/types";

function getRatingBand(avg: number): string {
  if (avg >= 4.5) return "Outstanding";
  if (avg >= 3.5) return "Exceeds Expectation";
  if (avg >= 2.5) return "Meets Expectation";
  if (avg >= 1.5) return "Below Expectation";
  return "Unsatisfactory";
}

function safeAvg(nums: number[]): number {
  const valid = nums.filter((n) => !isNaN(n) && n > 0);
  if (valid.length === 0) return 0;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 100) / 100;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, userId } = session;

  // Batch all sheet reads in one Promise.all
  const [
    employeeRows,
    cycleRows,
    assignmentRows,
    reflectionRows,
    grievanceRows,
    configRows,
  ] = await Promise.all([
    cachedReadSheet("Employees"),
    cachedReadSheet("Review_Cycles"),
    cachedReadSheet("Assignments"),
    cachedReadSheet("Weekly_Reflections"),
    cachedReadSheet("Grievances"),
    cachedReadSheet("Config"),
  ]);

  const employees = employeeRows as unknown as Employee[];
  const cycles = cycleRows as unknown as ReviewCycle[];
  const assignments = assignmentRows as unknown as Assignment[];
  const reflections = reflectionRows as unknown as WeeklyReflection[];
  const grievances = grievanceRows as unknown as Grievance[];
  const config = parseConfigRows(configRows as { Key: string; Value: string }[]);

  const curMonth = String(config.current_month);
  const curYear = String(config.current_year);
  const activeEmployees = employees.filter((e) => e.Status === "active");

  // ─── MD ──────────────────────────────────────────────────────────────────────
  if (role === "md") {
    const totalEmployees = activeEmployees.length;

    const currentCycles = cycles.filter(
      (c) => c.Month === curMonth && c.Year === curYear
    );

    const reviewCompletion = {
      total: totalEmployees,
      selfScored: currentCycles.filter((c) => c.Status === "self_scored").length,
      managerScored: currentCycles.filter((c) => c.Status === "manager_scored").length,
      acknowledged: currentCycles.filter((c) => c.Status === "acknowledged").length,
      locked: currentCycles.filter((c) => c.Status === "locked").length,
    };

    const lockedAvgs = currentCycles
      .filter((c) => c.Locked_Average && c.Locked_Average !== "")
      .map((c) => parseFloat(c.Locked_Average));
    const avgOrgScore = safeAvg(lockedAvgs);
    const topScore = lockedAvgs.length > 0 ? Math.max(...lockedAvgs) : 0;

    // Department breakdown
    const deptMap: Record<
      string,
      { total: number; selfScored: number; managerScored: number; acknowledged: number; locked: number; scores: number[] }
    > = {};

    for (const emp of activeEmployees) {
      const dept = emp.Department || "Unknown";
      if (!deptMap[dept]) {
        deptMap[dept] = { total: 0, selfScored: 0, managerScored: 0, acknowledged: 0, locked: 0, scores: [] };
      }
      deptMap[dept].total++;
      const cycle = currentCycles.find((c) => c.Employee_ID === emp.Employee_ID);
      if (cycle) {
        if (cycle.Status === "self_scored") deptMap[dept].selfScored++;
        if (cycle.Status === "manager_scored") deptMap[dept].managerScored++;
        if (cycle.Status === "acknowledged") deptMap[dept].acknowledged++;
        if (cycle.Status === "locked") deptMap[dept].locked++;
        if (cycle.Locked_Average && cycle.Locked_Average !== "") {
          deptMap[dept].scores.push(parseFloat(cycle.Locked_Average));
        }
      }
    }

    const departmentBreakdown = Object.entries(deptMap).map(([department, d]) => ({
      department,
      total: d.total,
      selfScored: d.selfScored,
      managerScored: d.managerScored,
      acknowledged: d.acknowledged,
      locked: d.locked,
      avgScore: safeAvg(d.scores),
    }));

    // Manager stats — find employees who are managers
    const managerEmployees = activeEmployees.filter((e) => e.Role === "manager");
    const managerStats = managerEmployees.map((mgr) => {
      const team = activeEmployees.filter(
        (e) => e.Manager_ID === mgr.Employee_ID && e.Employee_ID !== mgr.Employee_ID
      );
      const teamCycles = currentCycles.filter((c) =>
        team.some((t) => t.Employee_ID === c.Employee_ID)
      );
      const completed = teamCycles.filter(
        (c) => c.Status === "manager_scored" || c.Status === "acknowledged" || c.Status === "locked"
      ).length;
      const scores = teamCycles
        .filter((c) => c.Locked_Average && c.Locked_Average !== "")
        .map((c) => parseFloat(c.Locked_Average));
      return {
        managerId: mgr.Employee_ID,
        managerName: mgr.Name,
        department: mgr.Department,
        teamSize: team.length,
        reviewsCompleted: completed,
        avgTeamScore: safeAvg(scores),
      };
    });

    // Top performers — top 5 by Locked_Average this month
    const topPerformers = currentCycles
      .filter((c) => c.Locked_Average && c.Locked_Average !== "")
      .map((c) => {
        const emp = activeEmployees.find((e) => e.Employee_ID === c.Employee_ID);
        const avg = parseFloat(c.Locked_Average);
        return {
          employeeId: c.Employee_ID,
          name: emp?.Name ?? c.Employee_ID,
          department: emp?.Department ?? "—",
          avgScore: avg,
          ratingBand: getRatingBand(avg),
        };
      })
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);

    // Monthly trend — last 6 months
    const monthlyTrend: { month: number; year: number; label: string; avgScore: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      let m = config.current_month - i;
      let y = config.current_year;
      while (m <= 0) { m += 12; y--; }
      const ms = String(m);
      const ys = String(y);
      const monthCycles = cycles.filter(
        (c) => c.Month === ms && c.Year === ys && c.Locked_Average && c.Locked_Average !== ""
      );
      const scores = monthCycles.map((c) => parseFloat(c.Locked_Average));
      monthlyTrend.push({
        month: m,
        year: y,
        label: monthLabel(m, y),
        avgScore: safeAvg(scores),
      });
    }

    return NextResponse.json({
      role: "md",
      orgStats: {
        totalEmployees,
        reviewCompletion,
        topScore,
        avgOrgScore,
      },
      departmentBreakdown,
      managerStats,
      topPerformers,
      monthlyTrend,
    });
  }

  // ─── HR ───────────────────────────────────────────────────────────────────────
  if (role === "hr") {
    const totalEmployees = activeEmployees.length;

    const currentCycles = cycles.filter(
      (c) => c.Month === curMonth && c.Year === curYear
    );

    const completedStatuses = new Set(["manager_scored", "acknowledged", "locked"]);
    const completed = currentCycles.filter((c) => completedStatuses.has(c.Status)).length;
    const pending = totalEmployees - completed;

    const pendingGrievances = grievances.filter(
      (g) => g.Status === "submitted" || g.Status === "in_review"
    ).length;

    const employeesWithoutManager = activeEmployees.filter(
      (e) => !e.Manager_ID || e.Manager_ID.trim() === ""
    ).length;

    // Review monitor per department
    const deptMap: Record<
      string,
      { pending: number; selfScored: number; managerScored: number; acknowledged: number; locked: number }
    > = {};
    for (const emp of activeEmployees) {
      const dept = emp.Department || "Unknown";
      if (!deptMap[dept]) {
        deptMap[dept] = { pending: 0, selfScored: 0, managerScored: 0, acknowledged: 0, locked: 0 };
      }
      const cycle = currentCycles.find((c) => c.Employee_ID === emp.Employee_ID);
      if (!cycle) {
        deptMap[dept].pending++;
      } else {
        if (cycle.Status === "self_scored") deptMap[dept].selfScored++;
        else if (cycle.Status === "manager_scored") deptMap[dept].managerScored++;
        else if (cycle.Status === "acknowledged") deptMap[dept].acknowledged++;
        else if (cycle.Status === "locked") deptMap[dept].locked++;
        else deptMap[dept].pending++;
      }
    }

    const reviewMonitor = Object.entries(deptMap).map(([department, d]) => ({
      department,
      ...d,
    }));

    // Employees by department
    const empDeptMap: Record<string, number> = {};
    for (const emp of activeEmployees) {
      const dept = emp.Department || "Unknown";
      empDeptMap[dept] = (empDeptMap[dept] ?? 0) + 1;
    }
    const employeesByDepartment = Object.entries(empDeptMap).map(([department, count]) => ({
      department,
      count,
    }));

    // Grievance queue (open ones)
    const grievanceQueue = grievances
      .filter((g) => g.Status === "submitted" || g.Status === "in_review")
      .slice(0, 10)
      .map((g) => {
        const emp = employees.find((e) => e.Employee_ID === g.Employee_ID);
        return {
          grievanceId: g.Grievance_ID,
          employeeName: emp?.Name ?? g.Employee_ID,
          subject: g.Subject,
          category: g.Category,
          status: g.Status,
          filedAt: g.Filed_At,
        };
      });

    return NextResponse.json({
      role: "hr",
      stats: {
        totalEmployees,
        reviewCycleStatus: { total: totalEmployees, completed, pending },
        pendingGrievances,
        employeesWithoutManager,
      },
      reviewMonitor,
      employeesByDepartment,
      grievanceQueue,
      config: {
        currentMonth: config.current_month,
        currentYear: config.current_year,
      },
    });
  }

  // ─── Manager ──────────────────────────────────────────────────────────────────
  if (role === "manager") {
    const team = activeEmployees.filter(
      (e) => e.Manager_ID === userId && e.Employee_ID !== userId
    );

    const currentCycles = cycles.filter(
      (c) => c.Month === curMonth && c.Year === curYear
    );

    const reviewsPending = team.filter((e) => {
      const cycle = currentCycles.find((c) => c.Employee_ID === e.Employee_ID);
      return !cycle || cycle.Status === "self_scored";
    }).length;

    const weekStart = getWeekStart();
    const thisWeekReflections = reflections.filter(
      (r) => r.Week_Start_Date === weekStart
    );
    const reflectionsThisWeek = team.filter((e) =>
      thisWeekReflections.some((r) => r.Employee_ID === e.Employee_ID)
    ).length;

    const teamReviewStatus = team.map((emp) => {
      const cycle = currentCycles.find((c) => c.Employee_ID === emp.Employee_ID);
      const selfScores = cycle?.Self_Scores
        ? safeJsonParse<Record<string, number>>(cycle.Self_Scores, {})
        : {};
      const selfVals = Object.values(selfScores).filter((v) => !isNaN(v) && v > 0);
      const selfScore =
        selfVals.length > 0 ? computeAverage(selfVals) : null;
      const managerScore =
        cycle?.Locked_Average && cycle.Locked_Average !== ""
          ? parseFloat(cycle.Locked_Average)
          : null;
      return {
        employeeId: emp.Employee_ID,
        name: emp.Name,
        department: emp.Department,
        employeeType: emp.Employee_Type,
        cycleStatus: cycle?.Status ?? null,
        selfScore,
        managerScore,
      };
    });

    // Assigned tasks overview
    const assignedTasksOverview = team.map((emp) => {
      const empAssignments = assignments.filter((a) => a.Employee_ID === emp.Employee_ID);
      return {
        employeeId: emp.Employee_ID,
        name: emp.Name,
        activeTasks: empAssignments.filter((a) => a.Status === "active").length,
        completedTasks: empAssignments.filter((a) => a.Status === "completed").length,
      };
    });

    // Weekly reflections
    const weeklyReflections = team.map((emp) => {
      const ref = thisWeekReflections.find((r) => r.Employee_ID === emp.Employee_ID);
      return {
        employeeId: emp.Employee_ID,
        name: emp.Name,
        submitted: !!ref,
        mood: ref?.Mood ?? null,
      };
    });

    // My own status
    const myOwnCycle = currentCycles.find((c) => c.Employee_ID === userId);
    const myAssignments = assignments.filter((a) => a.Employee_ID === userId);

    return NextResponse.json({
      role: "manager",
      stats: {
        teamSize: team.length,
        reviewsPending,
        reflectionsThisWeek,
      },
      teamReviewStatus,
      assignedTasksOverview,
      weeklyReflections,
      myOwnStatus: {
        selfScoreStatus: myOwnCycle?.Status ?? null,
        myAssignments: {
          active: myAssignments.filter((a) => a.Status === "active").length,
          completed: myAssignments.filter((a) => a.Status === "completed").length,
        },
      },
    });
  }

  // ─── Employee ────────────────────────────────────────────────────────────────
  const currentCycle = cycles.find(
    (c) => c.Employee_ID === userId && c.Month === curMonth && c.Year === curYear
  );

  let selfScore: number | null = null;
  if (currentCycle?.Self_Scores) {
    const parsed = safeJsonParse<Record<string, number>>(currentCycle.Self_Scores, {});
    const vals = Object.values(parsed).filter((v) => !isNaN(v) && v > 0);
    if (vals.length > 0) selfScore = computeAverage(vals);
  }

  const managerScore =
    currentCycle?.Locked_Average && currentCycle.Locked_Average !== ""
      ? parseFloat(currentCycle.Locked_Average)
      : null;

  let averageScore: number | null = null;
  if (selfScore !== null && managerScore !== null) {
    averageScore = Math.round(((selfScore + managerScore) / 2) * 100) / 100;
  }

  const reviewStatus = {
    month: monthLabel(config.current_month, config.current_year),
    status: currentCycle?.Status ?? null,
    selfScore,
    managerScore,
    average: averageScore,
    ratingBand:
      averageScore !== null
        ? getRatingBand(averageScore)
        : managerScore !== null
        ? getRatingBand(managerScore)
        : null,
  };

  // My assignments
  const myAssignments = assignments.filter((a) => a.Employee_ID === userId);
  const activeAssignments = myAssignments.filter((a) => a.Status === "active");
  const completedAssignments = myAssignments.filter((a) => a.Status === "completed");
  const recentActive = activeAssignments.slice(0, 5).map((a) => ({
    assignmentId: a.Assignment_ID,
    title: a.Title,
    target: a.Target,
    type: a.Type,
  }));

  // Weekly reflection
  const weekStart = getWeekStart();
  const thisWeekRef = reflections.find(
    (r) => r.Employee_ID === userId && r.Week_Start_Date === weekStart
  );

  // Past reviews (locked cycles excluding current)
  const pastReviews = cycles
    .filter(
      (c) =>
        c.Employee_ID === userId &&
        (c.Status === "acknowledged" || c.Status === "locked") &&
        !(c.Month === curMonth && c.Year === curYear) &&
        c.Locked_Average &&
        c.Locked_Average !== ""
    )
    .sort((a, b) => {
      const da = parseInt(a.Year) * 100 + parseInt(a.Month);
      const db = parseInt(b.Year) * 100 + parseInt(b.Month);
      return db - da;
    })
    .slice(0, 6)
    .map((c) => {
      const avg = parseFloat(c.Locked_Average);
      const selfScoresParsed = safeJsonParse<Record<string, number>>(c.Self_Scores, {});
      const selfVals = Object.values(selfScoresParsed).filter((v) => !isNaN(v) && v > 0);
      const pastSelfScore = selfVals.length > 0 ? computeAverage(selfVals) : null;
      return {
        month: monthLabel(parseInt(c.Month), parseInt(c.Year)),
        selfScore: pastSelfScore,
        managerScore: avg,
        average: avg,
        ratingBand: getRatingBand(avg),
      };
    });

  // Open grievances
  const openGrievances = grievances.filter(
    (g) =>
      g.Employee_ID === userId &&
      (g.Status === "submitted" || g.Status === "in_review")
  ).length;

  return NextResponse.json({
    role: "employee",
    reviewStatus,
    myAssignments: {
      active: activeAssignments.length,
      completed: completedAssignments.length,
      total: myAssignments.length,
      recentActive,
    },
    weeklyReflection: {
      thisWeekSubmitted: !!thisWeekRef,
      lastSubmittedAt: thisWeekRef?.Submitted_At ?? null,
    },
    pastReviews,
    openGrievances,
  });
}
