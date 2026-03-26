# Crystal People — Phase 2D Development Prompt

## Context

You are continuing development of **Crystal People**, an internal performance management web app for Crystal Group (~100 employees). The stack is:

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **Google Sheets** as the backend database (11 sheets + SEQUENCES)
- **JWT auth** with 4 roles: `employee`, `manager`, `hr`, `md`
- Two employee types: `white_collar` (goals) and `blue_collar` (tasks)
- Monthly review cycle: Employee self-scores → Manager scores → Employee acknowledges → HR locks

### What's Already Built (Phases 1 → 2C)

| Feature | Status |
|---|---|
| JWT auth (login, logout, me, forgot/reset password, first-login) | Done |
| Employee CRUD + bulk import (HR) | Done |
| Weekly Reflection → Manager Check-In → Employee Acknowledgement | Done |
| Goal CRUD (white-collar) | Done |
| Task CRUD (blue-collar) — API + employee "My Tasks" page | Done |
| Monthly Self-Score — employee scores all dimensions + behaviours | Done |
| Manager Score Team — manager scores each report independently | Done |
| Config API (GET/POST) | Done |
| Dashboard with role-specific monthly status cards | Done |
| Sidebar navigation with role-based visibility | Done |
| All Google Sheets utilities (read, write, append, update, batch, cache, sequences) | Done |

### What Phase 2D Adds (6 Features)

1. **Employee Acknowledgement of Monthly Review** — employee reads manager scores/notes, taps "Acknowledge"
2. **Manager Review Notes + AI Validation** — manager writes summary comment, AI flags harsh/vague language
3. **Weekly Context in Monthly Scoring** — show all weekly reflections + check-ins alongside the scoring screen
4. **HR Lock Cycle** — HR reviews pending cycles and locks scores
5. **Team Tasks UI** — manager-facing page to assign/view/deactivate tasks for blue-collar reports
6. **Notifications foundation** — in-app notification bell with read/unread state

---

## Existing Types Reference

These types are already defined in `src/lib/types.ts`. **Do NOT redefine them.** Use them as-is.

```typescript
// ─── Union Types ─────────────────────────────────────────────────────
export type Role = "employee" | "manager" | "hr" | "md";
export type EmployeeType = "white_collar" | "blue_collar";
export type EmployeeStatus = "active" | "inactive";
export type CycleStatus = "pending" | "self_scored" | "manager_scored" | "acknowledged" | "locked";
export type GoalStatus = "active" | "completed" | "dropped";
export type TaskStatus = "active" | "inactive";
export type NotificationType = "window_open" | "window_close" | "reminder_day_3" | "reminder_day_6" | "reminder_day_10" | "weekly_reminder" | "escalation" | "manual";
export type NotificationStatus = "pending" | "sent" | "read";

// ─── Domain Models ───────────────────────────────────────────────────
export interface ReviewCycle {
  Cycle_ID: string;
  Employee_ID: string;
  Month: string;
  Year: string;
  Self_Scores: string;      // JSON
  Manager_Scores: string;   // JSON
  Self_Comments: string;
  Manager_Comments: string;
  Review_Notes: string;
  Next_Month_Focus: string;
  Status: CycleStatus;
  Acknowledged_At: string;
  Flagged_Dimensions: string; // JSON array
  AI_Note_Flag: string;     // "TRUE" | "FALSE"
  Locked_Average: string;
}

export interface Employee {
  Employee_ID: string; Name: string; Email: string; Password_Hash?: string;
  Mobile: string; Department: string; Role: Role; Employee_Type: EmployeeType;
  Manager_ID: string; Join_Date: string; Status: EmployeeStatus;
  First_Login_Done: string;
}

export interface WeeklyReflection {
  Reflection_ID: string; Employee_ID: string; Week_Start_Date: string;
  Accomplishments: string; Next_Week_Plan: string; Blockers: string;
  Mood: string; Submitted_At: string; Acknowledged_At: string;
}

export interface WeeklyCheckin {
  Checkin_ID: string; Manager_ID: string; Employee_ID: string;
  Week_Start_Date: string; Main_Thing_On_Mind: string; Committed_To: string;
  Did_Well: string; Improve: string; Concern: string; Submitted_At: string;
}

export interface Notification {
  Notification_ID: string; Employee_ID: string; Type: NotificationType;
  Message: string; Status: NotificationStatus; Created_At: string; Sent_At: string;
}

export interface ScoreDimension {
  key: string; label: string; type: "goal" | "task" | "behaviour";
  selfScore?: number; managerScore?: number;
}

export interface ConfigMap {
  current_month: number; current_year: number;
  window_open_day: number; window_close_day: number;
  reminder_day_1: number; reminder_day_2: number;
  hr_visibility_day: number; md_visibility_day: number;
  min_goals: number; max_goals: number;
}
```

---

## Existing Utilities Reference

These functions exist in `src/lib/utils.ts`. Use them — do NOT recreate.

```typescript
export function computeAverage(scores: number[]): number;
export function getRatingBand(avg: number): RatingBand;
export function getRatingColor(avg: number): string;
export function getRatingDot(avg: number): string;
export function isWindowOpen(role: Role, config: ConfigMap, today?: Date): boolean;
export function getScoreDimensions(employee: Employee, goals: Goal[], tasks: Task[]): ScoreDimension[];
export function parseConfigRows(rows: { Key: string; Value: string }[]): ConfigMap;
export function safeJsonParse<T>(str: string, fallback: T): T;
export function monthLabel(month: number, year: number): string;
export function getWeekStart(date?: Date): string;
export function getWeekLabel(mondayStr: string): string;
export function fmtDate(dateStr: string): string;
export function fmtDateTime(dateStr: string): string;
export function cn(...inputs: ClassValue[]): string;
```

## Existing Google Sheets Helpers

In `src/lib/sheets.ts`:

```typescript
export async function readSheet(sheetName: string): Promise<Record<string, string>[]>;
export async function cachedReadSheet(sheetName: string, ttlMs?: number): Promise<Record<string, string>[]>;
export function invalidateCache(sheetName: string): void;
export async function appendRowByFields(sheetName: string, fields: Record<string, string>): Promise<void>;
export async function appendBatchRows(sheetName: string, rows: Record<string, string>[]): Promise<void>;
export async function updateRowWhere(sheetName: string, matchCol: string, matchVal: string, updates: Record<string, string>): Promise<boolean>;
export async function updateAllRowsWhere(sheetName: string, matchCol: string, matchVal: string, updates: Record<string, string>): Promise<number>;
export async function getNextSeq(sheetName: string): Promise<number>;
export async function getNextSeqBatch(sheetName: string, count: number): Promise<number[]>;
export function generateId(prefix: string, seq: number): string;
```

## Existing Auth Helper

In `src/lib/auth.ts`:

```typescript
export interface SessionUser {
  userId: string; email: string; name: string; role: Role;
  employeeType: EmployeeType; managerId: string; firstLoginDone: boolean;
}
export async function getSession(): Promise<SessionUser | null>;
```

## Existing Sheet Schema

In `src/lib/sheet-schema.ts` — the `SHEET_SCHEMA` object defines columns for every sheet. The `Review_Cycles` sheet already has columns: `Cycle_ID, Employee_ID, Month, Year, Self_Scores, Manager_Scores, Self_Comments, Manager_Comments, Review_Notes, Next_Month_Focus, Status, Acknowledged_At, Flagged_Dimensions, AI_Note_Flag, Locked_Average`.

The `Notifications` sheet already has columns: `Notification_ID, Employee_ID, Type, Message, Status, Created_At, Sent_At`.

## Existing UI Components

Available in `src/components/ui/`: `Badge`, `Button`, `Card`, `ComingSoon`, `EmptyState`, `Input`, `Modal`, `PageHeader`, `RatingBadge`, `Spinner` (includes `PageLoader`).

## Existing Page Patterns

All pages follow this pattern:
- `"use client"` at top
- Use `useState`, `useEffect`, `useCallback` from React
- Fetch data from APIs using `fetch()` in `useEffect`
- Use `PageLoader` while loading, `EmptyState` when no data
- Use `PageHeader` for page title
- Use Tailwind utility classes for styling
- Use `lucide-react` icons

---

## FEATURE 1: Employee Acknowledgement of Monthly Review

### Flow

After the manager scores an employee (`Status = "manager_scored"`), the employee sees the manager's review. They can read the manager's scores alongside their self-scores, see the flagged dimensions, read the review notes & next month focus, and then tap **"Acknowledge"** to confirm they've read it. This sets `Status = "acknowledged"` and `Acknowledged_At` to the current timestamp.

### API: POST /api/monthly/acknowledge

**File:** `src/app/api/monthly/acknowledge/route.ts`

```
POST /api/monthly/acknowledge
Body: { cycle_id: string }
Auth: employee only (must be the cycle's employee)
```

**Logic:**
1. `getSession()` — must be authenticated
2. Read `Review_Cycles` sheet, find cycle by `Cycle_ID`
3. Verify `cycle.Employee_ID === session.userId`
4. Verify `cycle.Status === "manager_scored"` (only this status allows acknowledgement)
5. Update the row:
   - `Status` → `"acknowledged"`
   - `Acknowledged_At` → `new Date().toISOString()`
6. `invalidateCache("Review_Cycles")`
7. Return `{ cycle: updatedCycle }`

**Error responses:**
- 401 if not authenticated
- 403 if `session.userId !== cycle.Employee_ID`
- 400 if `cycle.Status !== "manager_scored"` — return `"Review has not been scored by manager yet"` or `"Already acknowledged"`
- 404 if cycle not found

### API: GET /api/monthly/my-review

**File:** `src/app/api/monthly/my-review/route.ts`

```
GET /api/monthly/my-review?month=3&year=2026
Auth: employee only
```

**Logic:**
1. `getSession()` — must be authenticated
2. Get config for default month/year
3. Find the cycle for `session.userId` + month + year
4. If no cycle or `status === "pending"`, return `{ cycle: null, dimensions: [] }`
5. Load employee, goals, tasks → build dimensions via `getScoreDimensions()`
6. Populate `selfScore` and `managerScore` into each dimension from the cycle's JSON
7. Return `{ cycle, dimensions, employee }`

This API lets the employee view their complete review — both self-scores and manager scores side by side.

### Page: Monthly Review Acknowledgement

**File:** `src/app/(dashboard)/monthly/my-review/page.tsx`

**UI Sections:**
1. **Header**: "Monthly Review — {monthLabel}" with status badge
2. **Score comparison table**: For each dimension, show:
   - Dimension name (with type badge: Goal/Task/Behaviour)
   - Self Score (left column)
   - Manager Score (right column)
   - Flag icon if dimension is in `Flagged_Dimensions`
3. **Summary section**:
   - "Locked Average: X.XX" with `RatingBadge`
   - "Rating Band: Exceeds Expectation" etc.
4. **Manager's Review Notes** (read-only card) — show `Review_Notes` if present
5. **Next Month Focus** (read-only card) — show `Next_Month_Focus` if present
6. **Manager's Comments** (read-only card) — show `Manager_Comments`
7. **Acknowledge button**: Only visible when `Status === "manager_scored"`. On click → POST to `/api/monthly/acknowledge`. After success, show "Acknowledged on {date}" instead of the button.
8. If `Status === "self_scored"`, show a message: "Waiting for manager to complete scoring."
9. If `Status === "acknowledged"` or `"locked"`, show "You acknowledged this review on {date}."

**Sidebar link:** Add "My Review" link to the sidebar under the existing "Monthly Self-Score" link. Show for all roles except `hr` (who don't get scored this way).

---

## FEATURE 2: Manager Review Notes + AI Validation

### What Already Exists

The `POST /api/monthly/manager-score` route already accepts `review_notes` and `next_month_focus` in the body and stores them in the Review_Cycles row. The `Review_Cycles` schema already has `Review_Notes`, `Next_Month_Focus`, and `AI_Note_Flag` columns.

### What to Add

**AI Note Validation endpoint:**

**File:** `src/app/api/monthly/validate-notes/route.ts`

```
POST /api/monthly/validate-notes
Body: { review_notes: string, employee_name: string }
Auth: manager, hr, md
```

**Logic:**
1. Validate auth + role
2. Send the review notes text to an AI analysis function (see below)
3. Return `{ isClean: boolean, flags: string[], suggestion: string }`

**AI Analysis Function:**

**File:** `src/lib/ai-review.ts`

Create a utility that uses a simple rule-based approach (no external AI API needed) to flag problematic language in review notes. This avoids needing an API key.

```typescript
export interface ReviewValidation {
  isClean: boolean;
  flags: string[];
  suggestion: string;
}

export function validateReviewNotes(text: string, employeeName: string): ReviewValidation;
```

**Rules to check:**
1. **Harsh language**: Flag words/phrases like "terrible", "awful", "incompetent", "useless", "worst", "pathetic", "hopeless", "lazy", "stupid", "disappointing". Return flag: "Contains harsh language: '{word}'"
2. **Vague feedback**: Flag if the note is under 30 characters or contains only generic phrases like "good job", "keep it up", "needs improvement", "do better", "okay work". Return flag: "Feedback is too vague — provide specific examples"
3. **Personal attacks**: Flag "you always", "you never", "your attitude", "your problem". Return flag: "Avoid personal generalizations — focus on specific behaviours or outcomes"
4. **Unconstructive negativity**: Flag if there are ≥3 negative words and zero positive/constructive words. Return flag: "Feedback appears one-sided — include constructive suggestions"
5. **Name usage**: Flag if the text contains the employee's first name in a negative context (e.g., "{Name} failed", "{Name} didn't"). Return flag: "Avoid associating the employee's name directly with negative outcomes"

**Suggestion generation**: If any flags are raised, return a general suggestion like: "Consider reframing feedback to focus on specific actions and outcomes. Use 'I observed...' or 'The result was...' instead of generalizations."

If no flags → `{ isClean: true, flags: [], suggestion: "" }`

### UI Integration in Score Team Page

In the existing `src/app/(dashboard)/monthly/score-team/page.tsx`, when the manager is scoring an individual employee:

1. The `review_notes` textarea already exists (or add it if missing). Below it, add a **"Check Notes"** button.
2. On click → POST to `/api/monthly/validate-notes` with the current text + employee name.
3. If `isClean: false`, show a yellow warning card below the textarea listing each flag as a bullet point, plus the suggestion.
4. The manager can choose to **"Edit Notes"** or **"Keep Original"**. This is advisory only — it does NOT block submission.
5. When the manager submits scores, also set `AI_Note_Flag` to `"TRUE"` if the notes were flagged (regardless of whether they kept the original).

---

## FEATURE 3: Weekly Context in Monthly Scoring

### Purpose

Per the SOP (§7.3): "When the manager opens the monthly scoring screen, they see all weekly reflections and their own check-in notes for that employee for the month."

### API: GET /api/monthly/weekly-context

**File:** `src/app/api/monthly/weekly-context/route.ts`

```
GET /api/monthly/weekly-context?employee_id=EMP-0005&month=3&year=2026
Auth: manager, hr, md
```

**Logic:**
1. Validate auth + role
2. Validate reporting relationship for managers
3. Determine the 4-5 week start dates that fall within the given month/year:
   - Get the first Monday on or after the 1st of the month
   - Collect all Mondays through the end of the month
4. Read `Weekly_Reflections` filtered by `Employee_ID` + those week dates
5. Read `Weekly_Checkins` filtered by `Manager_ID === the employee's manager` + `Employee_ID` + those week dates
6. Return:
```json
{
  "weeks": [
    {
      "week_start": "2026-03-02",
      "reflection": { ... } | null,
      "checkin": { ... } | null
    },
    ...
  ]
}
```

### UI Integration in Score Team Page

In the scoring view for an individual employee (when `employeeId` is set in the Score Team page):

1. Add a collapsible section titled **"Weekly Context — {monthLabel}"** above the scoring dimensions.
2. Fetch from `/api/monthly/weekly-context?employee_id={id}&month={m}&year={y}` when the employee scoring view loads.
3. Display each week as an accordion card:
   - **Week header**: `getWeekLabel(week_start)` + mood emoji (from reflection)
   - **Reflection section** (if exists):
     - Accomplishments
     - Next Week Plan
     - Blockers (if non-empty)
   - **Your Check-In** (if exists):
     - What was on their mind
     - What you committed to
     - What they did well
     - One thing to improve
   - If neither exists for a week, show "No submissions this week" in muted text
4. Default state: **collapsed** (so it doesn't overwhelm the scoring view). Toggle with a chevron.

---

## FEATURE 4: HR Lock Cycle

### Flow

After the employee acknowledges (`Status = "acknowledged"`), HR can lock the cycle. Locking means the score is finalized and cannot be changed. HR can also lock cycles that are in `manager_scored` status if the employee hasn't acknowledged within a reasonable time.

### API: POST /api/monthly/lock-cycle

**File:** `src/app/api/monthly/lock-cycle/route.ts`

```
POST /api/monthly/lock-cycle
Body: { cycle_id: string }
Auth: hr, md only
```

**Logic:**
1. `getSession()` — must be `hr` or `md`
2. Read `Review_Cycles`, find by `Cycle_ID`
3. Verify `cycle.Status` is `"manager_scored"` or `"acknowledged"` (only these can be locked)
4. Update:
   - `Status` → `"locked"`
5. `invalidateCache("Review_Cycles")`
6. Return `{ cycle: updatedCycle }`

**Error responses:**
- 403 if not hr/md
- 400 if status is not `manager_scored` or `acknowledged`
- 404 if cycle not found

### API: POST /api/monthly/bulk-lock

**File:** `src/app/api/monthly/bulk-lock/route.ts`

```
POST /api/monthly/bulk-lock
Body: { month: number, year: number }
Auth: hr, md only
```

**Logic:**
1. Read all `Review_Cycles` for the given month/year
2. Filter those with `Status === "acknowledged"` or `Status === "manager_scored"`
3. Update each one to `Status = "locked"`
4. Return `{ locked_count: number, skipped_count: number }`

### Page: HR Review Monitor

**File:** Update `src/app/(dashboard)/admin/monitoring/page.tsx` (currently a placeholder)

**UI:**
1. **Header**: "Review Monitor — {monthLabel}" with month/year selector
2. **Summary cards row**:
   - Total employees (active)
   - Self-scored count + %
   - Manager-scored count + %
   - Acknowledged count + %
   - Locked count + %
   - Pending (not started) count
3. **Table**: List all employees with columns:
   - Name | Department | Type | Manager | Status (color-coded badge) | Locked Average | Action
4. **Status filter**: Tabs or dropdown to filter by status (All / Pending / Self-Scored / Manager-Scored / Acknowledged / Locked)
5. **Actions per row**:
   - If `acknowledged` or `manager_scored` → "Lock" button
   - If `locked` → show green checkmark
   - If `pending` or `self_scored` → show "—" (no action)
6. **Bulk Lock button**: At the top, "Lock All Acknowledged" — calls `/api/monthly/bulk-lock`
7. **Data fetch**: GET `/api/monthly/score-team` (already works for hr/md returning all employees)

### Sidebar: Update for HR/MD

Add "Review Monitor" link under the admin section. The navigation link already exists but points to the placeholder. Just replace the placeholder page.

---

## FEATURE 5: Team Tasks UI (Manager)

### Purpose

Managers need a UI to assign, view, and deactivate tasks for their blue-collar reports. The API already exists (`/api/tasks` GET/POST and `/api/tasks/[id]` PATCH). This feature is the UI.

### Page: Team Tasks

**File:** Update `src/app/(dashboard)/team/tasks/page.tsx` (currently a placeholder)

**UI Sections:**

1. **Header**: "Team Tasks" with `PageHeader`
2. **Employee selector**: Dropdown or card list showing only blue-collar direct reports. For each, show: name, department, active task count.
3. **When an employee is selected**, show:
   - **Active Tasks list**: Each task as a card with:
     - Task Description
     - Target
     - Status badge (Active)
     - "Deactivate" button → PATCH `/api/tasks/{id}` with `{ status: "inactive" }`
     - "Edit" button → opens modal to edit description/target
   - **Inactive Tasks** (collapsed section): Previously deactivated tasks, each with a "Reactivate" button
   - **Add Task button**: Opens a modal with:
     - Task Description (textarea, min 10 chars)
     - Target (input, min 5 chars)
     - "Assign Task" submit button → POST `/api/tasks` with `{ employee_id, task_description, target }`
4. **Empty state**: If the selected employee has no tasks, show `EmptyState` with "No tasks assigned yet" and the Add Task button.

**Data flow:**
- On page load: GET `/api/tasks?employee_id={selected}` to load tasks
- On add: POST `/api/tasks` → refresh list
- On deactivate/reactivate: PATCH `/api/tasks/{id}` → refresh list
- On edit: PATCH `/api/tasks/{id}` → refresh list

**Access control:**
- Only `manager`, `hr`, `md` can access this page
- Managers see only their direct reports who are `blue_collar`
- HR/MD see all blue-collar employees

---

## FEATURE 6: Notifications Foundation

### API: GET /api/notifications

**File:** `src/app/api/notifications/route.ts`

```
GET /api/notifications?limit=20
Auth: any authenticated user
```

**Logic:**
1. Read `Notifications` sheet
2. Filter by `Employee_ID === session.userId`
3. Sort by `Created_At` descending
4. Limit to `limit` param (default 20)
5. Return `{ notifications, unread_count }` where `unread_count` = count where `Status !== "read"`

### API: PATCH /api/notifications/read

**File:** `src/app/api/notifications/read/route.ts`

```
PATCH /api/notifications/read
Body: { notification_ids: string[] }
Auth: any authenticated user
```

**Logic:**
1. For each notification_id, verify it belongs to `session.userId`
2. Update `Status` → `"read"` using `updateRowWhere`
3. Return `{ updated: number }`

### API: POST /api/notifications/create

**File:** `src/app/api/notifications/create/route.ts`

```
POST /api/notifications/create
Body: { employee_id: string, type: NotificationType, message: string }
Auth: hr, md, or system (internal use)
```

**Logic:**
1. Only hr/md can create manual notifications
2. Generate `NOTIF-XXXX` ID via `getNextSeq("Notifications")`
3. Append row with `Status = "pending"`, `Created_At = now`, `Sent_At = ""`
4. Return `{ notification }`

### Notification Bell Component

**File:** `src/components/ui/NotificationBell.tsx`

A header icon component:
1. On mount, fetch GET `/api/notifications?limit=10`
2. Show a bell icon (from `lucide-react` — use `Bell`)
3. If `unread_count > 0`, show a red dot/badge with the count
4. On click, open a dropdown panel showing recent notifications:
   - Each notification: icon by type + message + relative time
   - Unread items have a subtle highlight (e.g., `bg-primary-50`)
   - Clicking a notification marks it as read (PATCH `/api/notifications/read`)
   - "Mark all as read" link at bottom
5. Use a 60-second polling interval to refresh the count (or refresh on page navigation)

**Integration:** Add `<NotificationBell />` to the existing header component (the one that shows the user name/role in the top-right). Place it to the left of the user avatar.

### Auto-create Notifications (internal utility)

**File:** `src/lib/notifications.ts`

```typescript
export async function createNotification(
  employeeId: string,
  type: NotificationType,
  message: string
): Promise<void>;
```

This helper appends directly to the Notifications sheet. It should be called from:
1. `POST /api/monthly/manager-score` — after scoring → notify the employee: "Your manager has completed your {monthLabel} review. Please acknowledge."
2. `POST /api/monthly/lock-cycle` — after locking → notify the employee: "Your {monthLabel} review has been locked with a score of {lockedAverage}."
3. `POST /api/monthly/acknowledge` — after acknowledging → notify the manager: "{employeeName} has acknowledged their {monthLabel} review."

Add these notification calls to the respective existing routes.

---

## Implementation Rules

1. **Do NOT modify** `src/lib/types.ts`, `src/lib/utils.ts`, `src/lib/sheets.ts`, or `src/lib/sheet-schema.ts` unless explicitly required by a feature.
2. **Follow existing patterns** exactly — look at `src/app/api/monthly/manager-score/route.ts` and `src/app/api/monthly/self-score/route.ts` as templates.
3. **Auth pattern**: Always start with `const session = await getSession(); if (!session) return ...401`.
4. **Role checks**: Use `session.role` for authorization. Managers see only their reports, HR/MD see all.
5. **Sheet operations**: Use `readSheet()` for fresh reads, `cachedReadSheet()` for Employees/Config only. Always `invalidateCache()` after writes.
6. **Error handling**: Return proper status codes (400, 401, 403, 404) with `{ error: "message" }`.
7. **All pages** must be `"use client"` and use the existing UI component library.
8. **Imports**: Use `@/lib/...` and `@/components/ui/...` path aliases.
9. **Tailwind**: Use the project's existing color tokens (`primary-*`, `accent-*`, `warning`, `success`, `border`, `muted`).
10. **No new npm packages** unless absolutely necessary. The rule-based AI validation must NOT require any external API keys.

---

## File Checklist

### New API Routes (7 files)
- [ ] `src/app/api/monthly/acknowledge/route.ts`
- [ ] `src/app/api/monthly/my-review/route.ts`
- [ ] `src/app/api/monthly/validate-notes/route.ts`
- [ ] `src/app/api/monthly/weekly-context/route.ts`
- [ ] `src/app/api/monthly/lock-cycle/route.ts`
- [ ] `src/app/api/monthly/bulk-lock/route.ts`
- [ ] `src/app/api/notifications/route.ts` (GET)
- [ ] `src/app/api/notifications/read/route.ts` (PATCH)
- [ ] `src/app/api/notifications/create/route.ts` (POST)

### New Library Files (2 files)
- [ ] `src/lib/ai-review.ts`
- [ ] `src/lib/notifications.ts`

### New Pages (1 file)
- [ ] `src/app/(dashboard)/monthly/my-review/page.tsx`

### Updated Pages (2 files — replace placeholders)
- [ ] `src/app/(dashboard)/admin/monitoring/page.tsx` — replace ComingSoon with HR Review Monitor
- [ ] `src/app/(dashboard)/team/tasks/page.tsx` — replace ComingSoon with Team Tasks UI

### New Components (1 file)
- [ ] `src/components/ui/NotificationBell.tsx`

### Updated Files (3 files)
- [ ] `src/app/(dashboard)/monthly/score-team/page.tsx` — add Weekly Context section + AI validate button
- [ ] `src/app/(dashboard)/layout.tsx` (or wherever the sidebar is) — add "My Review" nav link
- [ ] Header component — add `<NotificationBell />`

### Updated API Routes (3 files — add notification calls)
- [ ] `src/app/api/monthly/manager-score/route.ts` — add notification to employee after scoring
- [ ] `src/app/api/monthly/lock-cycle/route.ts` — add notification to employee after locking (same file as new)
- [ ] `src/app/api/monthly/acknowledge/route.ts` — add notification to manager after acknowledging (same file as new)

---

## Test Scenarios

### T1: Employee Acknowledgement
1. Login as employee (amit@crystalgroup.com)
2. Navigate to `/monthly/my-review`
3. If cycle is `manager_scored`, all scores + notes should display
4. Click "Acknowledge" → status changes to `acknowledged`, timestamp shown
5. Refresh → button gone, shows "Acknowledged on {date}"

### T2: Acknowledge Prevents Double-Ack
1. After acknowledging, POST again → should return error "Already acknowledged"

### T3: Acknowledge Rejects Wrong Status
1. If cycle is `self_scored` (not yet manager-scored), POST → error

### T4: AI Note Validation
1. Login as manager
2. Go to Score Team → select employee → write review notes: "You are terrible and lazy"
3. Click "Check Notes" → should show flags for harsh language
4. Change to "I observed delays in delivery timelines this month" → should pass clean

### T5: Weekly Context Display
1. Login as manager, go to Score Team → select employee
2. Weekly Context section should show 4 weeks of reflections + check-ins
3. If no reflection for a week, show "No submissions this week"

### T6: HR Lock Cycle
1. Login as HR
2. Navigate to Review Monitor
3. See all employees with their cycle statuses
4. Lock an `acknowledged` cycle → status changes to `locked`
5. Bulk lock → all `acknowledged` cycles locked at once

### T7: Team Tasks UI
1. Login as manager (priya@crystalgroup.com)
2. Navigate to Team Tasks
3. See blue-collar reports listed
4. Select Vikram → see 2 existing tasks
5. Add a new task → appears in the list
6. Deactivate a task → moves to inactive section
7. Reactivate → moves back

### T8: Notifications
1. Manager scores employee → employee sees notification
2. Employee acknowledges → manager sees notification
3. HR locks → employee sees notification
4. Bell shows unread count, clicking marks as read

---

## Important Notes

- The `window_close_day` in Config is currently set to `28` (from testing). Keep it at 28 for testing, reset to `11` before go-live.
- Vikram Singh (EMP-0007) has Manager_ID = EMP-0004 (Priya) from testing. This is correct for blue-collar task testing.
- The existing `POST /api/monthly/manager-score` already stores `Review_Notes` and `Next_Month_Focus` — do not duplicate this logic. Feature 2 only adds the AI validation endpoint and the "Check Notes" button in the UI.
- Review_Cycles `AI_Note_Flag` column already exists. Set it to `"TRUE"` when notes are flagged.
