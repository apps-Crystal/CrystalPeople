import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Role, RatingBand, ConfigMap, ScoreDimension, Employee, Goal, Task, Assignment } from "./types";

// ─── Tailwind merge ───────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function fmtDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateTime(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

/** Returns the Monday of the week containing the given date (ISO string). */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  // Use local date parts to avoid UTC offset shifting the day (e.g. IST = UTC+5:30)
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Returns true if today is Friday. */
export function isFriday(date: Date = new Date()): boolean {
  return date.getDay() === 5;
}

/** Returns a readable label for a week given its Monday date string. */
export function getWeekLabel(mondayStr: string): string {
  const monday = new Date(mondayStr + "T00:00:00");
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `Week of ${monday.toLocaleDateString("en-IN", opts)} – ${sunday.toLocaleDateString("en-IN", { ...opts, year: "numeric" })}`;
}

// ─── Score computation ────────────────────────────────────────────────────────

export function computeAverage(scores: number[]): number {
  const valid = scores.filter((s) => !isNaN(s) && s >= 1 && s <= 5);
  if (valid.length === 0) return 0;
  const sum = valid.reduce((a, b) => a + b, 0);
  return Math.round((sum / valid.length) * 100) / 100;
}

export function getRatingBand(avg: number): RatingBand {
  if (avg >= 4.5) return "Outstanding";
  if (avg >= 3.5) return "Exceeds Expectation";
  if (avg >= 2.5) return "Meets Expectation";
  if (avg >= 1.5) return "Below Expectation";
  return "Unsatisfactory";
}

export function getRatingColor(avg: number): string {
  if (avg >= 4.5) return "text-green-600 bg-green-50";
  if (avg >= 3.5) return "text-teal-600 bg-teal-50";
  if (avg >= 2.5) return "text-blue-600 bg-blue-50";
  if (avg >= 1.5) return "text-orange-600 bg-orange-50";
  return "text-red-600 bg-red-50";
}

export function getRatingDot(avg: number): string {
  if (avg >= 4.5) return "bg-green-500";
  if (avg >= 3.5) return "bg-teal-500";
  if (avg >= 2.5) return "bg-blue-500";
  if (avg >= 1.5) return "bg-orange-500";
  return "bg-red-500";
}

// ─── Window logic ─────────────────────────────────────────────────────────────

/**
 * Determines if the review window is open for a given role.
 * Employee: can self-score between window_open_day and window_close_day.
 * Manager: can score between window_open_day and window_close_day + 3.
 * HR: can lock anytime after window_close_day.
 */
export function isWindowOpen(
  role: Role,
  config: ConfigMap,
  today: Date = new Date()
): boolean {
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  if (
    month !== config.current_month ||
    year !== config.current_year
  ) {
    return false;
  }

  if (role === "employee") {
    return day >= config.window_open_day && day <= config.window_close_day;
  }
  if (role === "manager") {
    return (
      day >= config.window_open_day &&
      day <= config.window_close_day + 3
    );
  }
  if (role === "hr" || role === "md") {
    return day >= config.window_open_day;
  }
  return false;
}

// ─── Score dimensions builder ─────────────────────────────────────────────────

const BEHAVIOUR_DIMENSIONS: ScoreDimension[] = [
  { key: "behaviour_attendance", label: "Attendance & Punctuality", type: "behaviour" },
  { key: "behaviour_teamwork", label: "Teamwork & Collaboration", type: "behaviour" },
  { key: "behaviour_ownership", label: "Ownership & Initiative", type: "behaviour" },
];

/**
 * Returns the full list of dimensions to score for an employee,
 * abstracting away white_collar (goals) vs blue_collar (tasks).
 */
export function getScoreDimensions(
  employee: Employee,
  goals: Goal[],
  tasks: Task[]
): ScoreDimension[] {
  if (employee.Employee_Type === "white_collar") {
    const goalDims: ScoreDimension[] = goals
      .filter((g) => g.Status === "active")
      .map((g) => ({
        key: g.Goal_ID,
        label: g.Title,
        type: "goal",
      }));
    return [...goalDims, ...BEHAVIOUR_DIMENSIONS];
  } else {
    const taskDims: ScoreDimension[] = tasks
      .filter((t) => t.Status === "active")
      .map((t) => ({
        key: t.Task_ID,
        label: t.Task_Description,
        type: "task",
      }));
    return [...taskDims, ...BEHAVIOUR_DIMENSIONS];
  }
}

// ─── Config parser ────────────────────────────────────────────────────────────

export function parseConfigRows(rows: { Key: string; Value: string }[]): ConfigMap {
  const map: Record<string, string> = {};
  rows.forEach((r) => (map[r.Key] = r.Value));
  return {
    current_month: parseInt(map.current_month ?? "3", 10),
    current_year: parseInt(map.current_year ?? "2026", 10),
    window_open_day: parseInt(map.window_open_day ?? "1", 10),
    window_close_day: parseInt(map.window_close_day ?? "11", 10),
    reminder_day_1: parseInt(map.reminder_day_1 ?? "3", 10),
    reminder_day_2: parseInt(map.reminder_day_2 ?? "6", 10),
    hr_visibility_day: parseInt(map.hr_visibility_day ?? "7", 10),
    md_visibility_day: parseInt(map.md_visibility_day ?? "10", 10),
    min_goals: parseInt(map.min_goals ?? "3", 10),
    max_goals: parseInt(map.max_goals ?? "5", 10),
  };
}

// ─── Safe JSON parse ──────────────────────────────────────────────────────────

export function safeJsonParse<T>(str: string, fallback: T): T {
  if (!str || str.trim() === "") return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

// ─── Month label ──────────────────────────────────────────────────────────────

export function monthLabel(month: number, year: number): string {
  return new Date(year, month - 1, 1).toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

// ─── Self-score window: last 7 days of config month ───────────────────────────

export function isSelfScoreWindowOpen(
  config: ConfigMap,
  today: Date = new Date()
): { open: boolean; opensOnDay: number; lastDay: number } {
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const lastDay = new Date(config.current_year, config.current_month, 0).getDate();
  const windowStart = lastDay - 6;
  const inCurrentMonth =
    month === config.current_month && year === config.current_year;
  const open = inCurrentMonth && day >= windowStart && day <= lastDay;
  return { open, opensOnDay: windowStart, lastDay };
}

// ─── Manager score window: days 1-7 of the month AFTER config month ───────────

export interface ManagerScoreWindow {
  open: boolean;
  scoreMonth: number; // month being scored (previous)
  scoreYear: number;
  opensNextMonth: number;
  opensNextYear: number;
}

export function getManagerScoreWindow(
  config: ConfigMap,
  today: Date = new Date()
): ManagerScoreWindow {
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  // The next month after config.current_month
  let nextMonth = config.current_month + 1;
  let nextYear = config.current_year;
  if (nextMonth > 12) { nextMonth = 1; nextYear++; }

  const inNextMonth = month === nextMonth && year === nextYear;
  const open = inNextMonth && day >= 1 && day <= 7;

  // The month being scored is config.current_month (previous relative to window)
  return {
    open,
    scoreMonth: config.current_month,
    scoreYear: config.current_year,
    opensNextMonth: nextMonth,
    opensNextYear: nextYear,
  };
}

// ─── Assignment-based score dimensions ────────────────────────────────────────

export function getScoreDimensionsFromAssignments(
  assignments: Assignment[]
): ScoreDimension[] {
  const dims: ScoreDimension[] = assignments
    .filter((a) => a.Status === "active" || a.Status === "completed")
    .map((a) => ({
      key: a.Assignment_ID,
      label: a.Title,
      type: a.Type as "goal" | "task",
    }));
  return [...dims, ...BEHAVIOUR_DIMENSIONS];
}
