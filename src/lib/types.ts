// ─── Union Types ─────────────────────────────────────────────────────────────

export type Role = "employee" | "manager" | "hr" | "md";
export type EmployeeType = "white_collar" | "blue_collar";
export type EmployeeStatus = "active" | "inactive";
export type CycleStatus =
  | "pending"
  | "self_scored"
  | "manager_scored"
  | "acknowledged"
  | "locked";
export type GoalStatus = "active" | "completed" | "dropped";
export type TaskStatus = "active" | "inactive";
export type AssignmentStatus = "active" | "completed" | "dropped";
export type AssignmentType = "goal" | "task";
export type GrievanceStatus = "submitted" | "in_review" | "resolved" | "closed";
export type GrievanceCategory =
  | "workplace"
  | "harassment"
  | "policy"
  | "compensation"
  | "other";
export type NotificationType =
  | "window_open"
  | "window_close"
  | "reminder_day_3"
  | "reminder_day_6"
  | "reminder_day_10"
  | "weekly_reminder"
  | "escalation"
  | "manual";
export type NotificationStatus = "pending" | "sent" | "read";
export type RatingBand =
  | "Outstanding"
  | "Exceeds Expectation"
  | "Meets Expectation"
  | "Below Expectation"
  | "Unsatisfactory";

// ─── Domain Models ────────────────────────────────────────────────────────────

export interface Employee {
  Employee_ID: string;
  Name: string;
  Email: string;
  Password_Hash?: string; // never send to client
  Mobile: string;
  Department: string;
  Role: Role;
  Employee_Type: EmployeeType;
  Manager_ID: string;
  Join_Date: string;
  Status: EmployeeStatus;
  First_Login_Done: string; // "TRUE" | "FALSE"
}

export interface Manager {
  Manager_ID: string;
  Employee_ID: string;
}

export interface ReviewCycle {
  Cycle_ID: string;
  Employee_ID: string;
  Month: string;
  Year: string;
  Self_Scores: string; // JSON
  Manager_Scores: string; // JSON
  Self_Comments: string;
  Manager_Comments: string;
  Review_Notes: string;
  Next_Month_Focus: string;
  Status: CycleStatus;
  Acknowledged_At: string;
  Flagged_Dimensions: string; // JSON array
  AI_Note_Flag: string; // "TRUE" | "FALSE"
  Locked_Average: string;
}

export interface Goal {
  Goal_ID: string;
  Employee_ID: string;
  Manager_ID: string;
  Month: string;
  Year: string;
  Title: string;
  Description: string;
  Target: string;
  Status: GoalStatus;
  Drop_Reason: string;
  Self_Score: string;
  Manager_Score: string;
  Created_At: string;
}

export interface Task {
  Task_ID: string;
  Employee_ID: string;
  Manager_ID: string;
  Task_Description: string;
  Target: string;
  Status: TaskStatus;
  Monthly_Scores: string; // JSON
  Created_At: string;
  Updated_At: string;
}

export interface WeeklyReflection {
  Reflection_ID: string;
  Employee_ID: string;
  Week_Start_Date: string;
  Accomplishments: string;
  Next_Week_Plan: string;
  Blockers: string;
  Mood: string;
  Submitted_At: string;
  Acknowledged_At: string;
}

export interface WeeklyCheckin {
  Checkin_ID: string;
  Manager_ID: string;
  Employee_ID: string;
  Week_Start_Date: string;
  Main_Thing_On_Mind: string;
  Committed_To: string;
  Did_Well: string;
  Improve: string;
  Concern: string;
  Submitted_At: string;
}

export interface Assignment {
  Assignment_ID: string;
  Employee_ID: string;
  Manager_ID: string;
  Month: string;
  Year: string;
  Title: string;
  Description: string;
  Target: string;
  Type: AssignmentType;
  Status: AssignmentStatus;
  Drop_Reason: string;
  Due_Date: string;
  Progress_Note: string;
  Self_Score: string;
  Manager_Score: string;
  Created_At: string;
  Completed_At: string;
}

export interface Grievance {
  Grievance_ID: string;
  Employee_ID: string;
  Subject: string;
  Description: string;
  Category: GrievanceCategory;
  Status: GrievanceStatus;
  Filed_At: string;
  Reviewed_By: string;
  Resolution_Notes: string;
  Resolved_At: string;
}

export interface OrgChange {
  Change_ID: string;
  Changed_By: string;
  Employee_ID: string;
  Field_Changed: string;
  Old_Value: string;
  New_Value: string;
  Changed_At: string;
}

export interface Notification {
  Notification_ID: string;
  Employee_ID: string;
  Type: NotificationType;
  Message: string;
  Status: NotificationStatus;
  Created_At: string;
  Sent_At: string;
}

export interface Config {
  Key: string;
  Value: string;
}

// ─── Computed / UI types ──────────────────────────────────────────────────────

export interface ScoreDimension {
  key: string;
  label: string;
  type: "goal" | "task" | "behaviour";
  selfScore?: number;
  managerScore?: number;
}

export interface ScoreSummary {
  employeeId: string;
  month: number;
  year: number;
  average: number;
  band: RatingBand;
  bandColor: string;
  cycleStatus: CycleStatus;
}

export interface ConfigMap {
  current_month: number;
  current_year: number;
  window_open_day: number;
  window_close_day: number;
  reminder_day_1: number;
  reminder_day_2: number;
  hr_visibility_day: number;
  md_visibility_day: number;
  min_goals: number;
  max_goals: number;
}

export interface TaskMonthlyScore {
  month: number;
  year: number;
  self_score: number;
  manager_score: number;
}

export interface IncrementRow {
  employeeId: string;
  name: string;
  department: string;
  lockedAverage: number;
  band: RatingBand;
  suggestedPct: number | null;
  approvedPct: number | null;
  overrideReason: string;
}
