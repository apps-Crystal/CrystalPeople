# Phase 2C — Goals / Tasks Management + Monthly Self-Score & Manager Scoring

## Context

You are continuing development on **Crystal People**, an internal performance management system built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Google Sheets** as the backend database. The codebase lives at the project root.

### What's Already Built (Phase 2A + 2B)
- JWT-based authentication with 4 roles: `employee`, `manager`, `hr`, `md`
- Employee CRUD with bulk import (HR/MD only)
- Sidebar navigation with role-based menu items
- Weekly Reflection cycle (employee submits → manager reviews → manager check-in → employee acknowledges)
- All Google Sheets CRUD utilities (`readSheet`, `appendRowByFields`, `updateRowWhere`, `getNextSeq`, `generateId`, `cachedReadSheet`, `invalidateCache`)
- Scoring utilities (`computeAverage`, `getRatingBand`, `getRatingColor`, `getScoreDimensions`, `isWindowOpen`, `parseConfigRows`, `safeJsonParse`)
- RatingBadge, Badge, Modal, Card, Button, Input, PageHeader, Spinner, ComingSoon, EmptyState UI components
- Middleware with role guards and first-login redirect

### Existing Types (src/lib/types.ts)
```typescript
export type Role = "employee" | "manager" | "hr" | "md";
export type EmployeeType = "white_collar" | "blue_collar";
export type CycleStatus = "pending" | "self_scored" | "manager_scored" | "acknowledged" | "locked";
export type GoalStatus = "active" | "completed" | "dropped";
export type TaskStatus = "active" | "inactive";
export type RatingBand = "Outstanding" | "Exceeds Expectation" | "Meets Expectation" | "Below Expectation" | "Unsatisfactory";

interface ReviewCycle {
  Cycle_ID: string;
  Employee_ID: string;
  Month: string;       // "1"-"12"
  Year: string;        // "2026"
  Self_Scores: string; // JSON: { "GOAL-0001": 4, "behaviour_attendance": 3, ... }
  Manager_Scores: string;
  Self_Comments: string;
  Manager_Comments: string;
  Review_Notes: string;
  Next_Month_Focus: string;
  Status: CycleStatus; // pending → self_scored → manager_scored → acknowledged → locked
  Acknowledged_At: string;
  Flagged_Dimensions: string; // JSON array of dimension keys where gap > 1
  AI_Note_Flag: "TRUE" | "FALSE";
  Locked_Average: string;
}

interface Goal {
  Goal_ID: string;
  Employee_ID: string;
  Manager_ID: string;
  Month: string;
  Year: string;
  Title: string;
  Description: string;
  Target: string;
  Status: GoalStatus;  // active | completed | dropped
  Drop_Reason: string;
  Self_Score: string;
  Manager_Score: string;
  Created_At: string;
}

interface Task {
  Task_ID: string;
  Employee_ID: string;
  Manager_ID: string;
  Task_Description: string;
  Target: string;
  Status: TaskStatus;    // active | inactive
  Monthly_Scores: string; // JSON: [{ month: 3, year: 2026, self_score: 4, manager_score: 3 }]
  Created_At: string;
  Updated_At: string;
}

interface ScoreDimension {
  key: string;
  label: string;
  type: "goal" | "task" | "behaviour";
  selfScore?: number;
  managerScore?: number;
}

interface ConfigMap {
  current_month: number;
  current_year: number;
  window_open_day: number;   // default 1
  window_close_day: number;  // default 11
  reminder_day_1: number;
  reminder_day_2: number;
  hr_visibility_day: number;
  md_visibility_day: number;
  min_goals: number;         // default 3
  max_goals: number;         // default 5
}
```

### Google Sheets Schema (src/lib/sheet-schema.ts)
```typescript
Review_Cycles: ["Cycle_ID","Employee_ID","Month","Year","Self_Scores","Manager_Scores","Self_Comments","Manager_Comments","Review_Notes","Next_Month_Focus","Status","Acknowledged_At","Flagged_Dimensions","AI_Note_Flag","Locked_Average"],
Goals: ["Goal_ID","Employee_ID","Manager_ID","Month","Year","Title","Description","Target","Status","Drop_Reason","Self_Score","Manager_Score","Created_At"],
Tasks: ["Task_ID","Employee_ID","Manager_ID","Task_Description","Target","Status","Monthly_Scores","Created_At","Updated_At"],
Config: ["Key","Value"],
SEQUENCES: ["SHEET_NAME","LAST_SEQ"],
```

### Existing Scoring Utilities (src/lib/utils.ts)
```typescript
// Already implemented — use these, do NOT rewrite:
computeAverage(scores: number[]): number           // mean of valid 1-5 scores, rounded 2dp
getRatingBand(avg: number): RatingBand             // thresholds: 4.5/3.5/2.5/1.5
getRatingColor(avg: number): string                // Tailwind classes
getScoreDimensions(employee, goals, tasks): ScoreDimension[]
  // white_collar → active goals + 3 behaviours
  // blue_collar  → active tasks + 3 behaviours
  // Behaviours: Attendance & Punctuality, Teamwork & Collaboration, Ownership & Initiative
isWindowOpen(role, config, today?): boolean
  // employee: day between window_open_day and window_close_day
  // manager: day between window_open_day and window_close_day + 3
  // hr/md: day >= window_open_day
parseConfigRows(rows): ConfigMap
safeJsonParse<T>(str, fallback): T
```

### Existing Sheets Utilities (src/lib/sheets.ts)
```typescript
readSheet(sheetName): Promise<Record<string,string>[]>
cachedReadSheet(sheetName, ttlMs?): Promise<...>
appendRowByFields(sheetName, fields): Promise<void>
appendBatchRows(sheetName, rows): Promise<void>
updateRowWhere(sheetName, matchCol, matchVal, updates): Promise<void>
getNextSeq(sheetName): Promise<number>
generateId(prefix, seq): string  // e.g. generateId("GOAL", 1) → "GOAL-0001"
invalidateCache(sheetName): void
```

### Sidebar Navigation (already wired — just replace ComingSoon pages)
| Menu Item | Route | Roles |
|---|---|---|
| My Goals | `/goals` | all |
| My Tasks | `/tasks` | all |
| Monthly Self-Score | `/monthly/self-score` | all |
| Score My Team | `/monthly/score-team` | manager, hr, md |

---

## Phase 2C Scope — Build These Features

### FEATURE 1: Goal Management (White-Collar Employees)

#### 1A. API: `/api/goals/route.ts`

**GET /api/goals**
- Auth required. Accepts query params: `employee_id`, `month`, `year`
- If caller is `employee`: return only their own goals for the given month/year (default to Config `current_month`/`current_year`)
- If caller is `manager`: can fetch goals for any employee who reports to them (validate via Employees sheet `Manager_ID`)
- If caller is `hr` or `md`: can fetch goals for any employee
- Return `{ goals: Goal[] }`

**POST /api/goals**
- Auth required. Body: `{ title, description, target, employee_id? }`
- If caller is `employee`: creates goal for themselves. `employee_id` is ignored, use `session.userId`.
- If caller is `manager/hr/md` and `employee_id` is provided: creates goal for that employee (validate reporting relationship for managers)
- Auto-set: `Goal_ID` via `generateId("GOAL", await getNextSeq("Goals"))`, `Month`/`Year` from Config, `Status = "active"`, `Created_At = new Date().toISOString()`
- `Manager_ID` = the employee's manager from the Employees sheet
- **Validation**: Employee must not already have `max_goals` active goals for the current month/year. Title min 5 chars, description min 10 chars. Return 400 with clear message if violated.
- Return `{ goal: Goal }`

#### 1B. API: `/api/goals/[id]/route.ts`

**PATCH /api/goals/[id]**
- Auth required. Body can include: `{ title?, description?, target?, status?, drop_reason? }`
- Only the employee who owns the goal OR their manager/hr/md can update it
- If `status` is being changed to `"dropped"`, `drop_reason` is required (min 10 chars)
- If `status` is being changed to `"completed"`, just update the status
- Cannot edit goals that belong to a locked Review_Cycle (`Status === "locked"`)
- Return `{ goal: Goal }` with updated fields

**DELETE /api/goals/[id]**
- Only `hr` and `md` can delete goals. Return 403 for others.
- Only delete if the goal has no scores (Self_Score and Manager_Score are both empty)
- Return `{ success: true }`

#### 1C. Page: `/goals/page.tsx` (My Goals)

Build a client component (`"use client"`) page that:

1. **Fetches** the employee's goals for current month/year on mount
2. **Displays** a card-based list:
   - Each goal card shows: Title, Description, Target, Status badge (active=blue, completed=green, dropped=gray)
   - If scores exist, show Self Score and Manager Score with RatingBadge component
3. **Add Goal** button (top right):
   - Opens a Modal with form: Title (text), Description (textarea), Target (text)
   - Validates min lengths before submit
   - Shows "X of {max_goals} goals used" counter
   - Disabled if at max_goals
4. **Edit** inline: click a goal card to expand/edit Title, Description, Target
5. **Drop Goal**: each active goal has a "Drop" action → opens modal asking for Drop_Reason (textarea, min 10 chars) → PATCH with status="dropped"
6. **Complete Goal**: each active goal has a "Mark Complete" action → PATCH with status="completed"
7. Show an EmptyState if no goals exist with a prompt to add goals

**Style**: Use the existing Card, Badge, Modal, Button, Input components. Match the look of the weekly reflection page.

---

### FEATURE 2: Task Management (Blue-Collar Employees)

#### 2A. API: `/api/tasks/route.ts`

**GET /api/tasks**
- Auth required. Accepts query params: `employee_id`
- Returns all tasks for the employee (active + inactive)
- Same role-based access as goals: employees see own, managers see their reports, hr/md see all
- Return `{ tasks: Task[] }`

**POST /api/tasks**
- Auth required. Body: `{ task_description, target, employee_id? }`
- Only `manager`, `hr`, `md` can create tasks (tasks are assigned by managers, not self-created)
- `employee_id` is required. Validate the employee exists and is `blue_collar`
- Auto-set: `Task_ID` via `generateId("TASK", ...)`, `Manager_ID` from session, `Status = "active"`, `Monthly_Scores = "[]"`, `Created_At` and `Updated_At`
- Validation: task_description min 10 chars, target min 5 chars
- Return `{ task: Task }`

#### 2B. API: `/api/tasks/[id]/route.ts`

**PATCH /api/tasks/[id]**
- Only manager who owns the task, hr, or md can update
- Can update: `task_description`, `target`, `status` (active/inactive)
- Return updated task

#### 2C. Page: `/tasks/page.tsx` (My Tasks)

Build a client component page:

1. **For employees (blue_collar)**: Show their assigned tasks in a card list
   - Each card: Task Description, Target, Status badge
   - If the current month has scores, show them
   - Read-only — employees cannot add/edit/delete tasks
2. **For managers/hr/md**: Show a dropdown to select a team member → display their tasks
   - "Add Task" button to assign a new task to the selected employee
   - Edit/deactivate actions on each task card
3. **For white_collar employees**: Show a friendly message "Tasks are for blue-collar employees. Visit My Goals instead." with a link to `/goals`

---

### FEATURE 3: Monthly Self-Score

#### 3A. API: `/api/monthly/self-score/route.ts`

**GET /api/monthly/self-score**
- Auth required (any role). Query params: `month`, `year` (default to Config current)
- Fetch the employee's ReviewCycle for this month/year
- Fetch their goals (if white_collar) or tasks (if blue_collar) for this month/year
- Build dimensions using `getScoreDimensions(employee, goals, tasks)`
- If a ReviewCycle exists, populate dimensions with existing Self_Scores from JSON
- Return `{ cycle: ReviewCycle | null, dimensions: ScoreDimension[], windowOpen: boolean }`
- `windowOpen` = `isWindowOpen("employee", config)`

**POST /api/monthly/self-score**
- Auth required (any role — employees self-score)
- Body: `{ scores: Record<string, number>, comments: string }`
  - `scores` = `{ "GOAL-0001": 4, "behaviour_attendance": 3, ... }` — one entry per dimension key
  - `comments` = free text self-comments (min 20 chars)
- **Validation**:
  - Window must be open for employees (`isWindowOpen("employee", config)`)
  - All dimensions must have a score between 1-5 (no missing dimensions)
  - Comments min 20 chars
  - If a cycle already exists with `Status !== "pending"`, return 400 "Already self-scored"
- **Logic**:
  - If no ReviewCycle row exists yet for this employee+month+year, create one:
    - `Cycle_ID` via `generateId("CYC", ...)`
    - `Self_Scores` = JSON.stringify(scores)
    - `Self_Comments` = comments
    - `Status` = "self_scored"
    - All other fields empty
  - If a ReviewCycle exists with Status="pending", update it:
    - `Self_Scores` = JSON.stringify(scores)
    - `Self_Comments` = comments
    - `Status` = "self_scored"
  - Also update individual goal/task scores:
    - For each goal dimension: update the Goal row's `Self_Score` field
    - For each task dimension: update the Task's `Monthly_Scores` JSON array, adding/updating the entry for this month/year
- Return `{ cycle: ReviewCycle }`

#### 3B. Page: `/monthly/self-score/page.tsx`

Build a client component page:

1. **On mount**: Fetch GET `/api/monthly/self-score` to get dimensions and current state
2. **If window is closed**: Show a message "The self-scoring window for {monthLabel} is closed. It opens on day {window_open_day} and closes on day {window_close_day}."
3. **If already self-scored**: Show read-only view of submitted scores with status badge "Self-Scored ✓"
4. **If window is open and status is pending**:
   - Page header: "Monthly Self-Assessment — {monthLabel(month, year)}"
   - For each dimension, show a row:
     - Left: dimension label + type badge (Goal/Task/Behaviour)
     - Right: 5-star or 1-5 number selector (clickable buttons styled like rating pills: 1=red, 2=orange, 3=blue, 4=teal, 5=green)
   - Below dimensions: "Self-Comments" textarea (placeholder: "Describe your achievements, challenges, and areas of growth this month...")
   - Submit button — disabled until all dimensions scored and comments ≥ 20 chars
   - On submit: POST, show success toast, transition to read-only view
5. **Empty state**: If employee has no goals/tasks (and is white_collar/blue_collar respectively), show "You need at least {min_goals} active goals before you can self-score. Go to My Goals to add them." with link

---

### FEATURE 4: Manager Score Team

#### 4A. API: `/api/monthly/score-team/route.ts`

**GET /api/monthly/score-team**
- Auth: manager, hr, md only
- Query params: `month`, `year` (default from Config)
- Fetch all employees reporting to this manager (or all employees for hr/md)
- For each employee, fetch their ReviewCycle for this month/year
- Return `{ team: Array<{ employee: Employee, cycle: ReviewCycle | null, dimensions: ScoreDimension[] }> }`

**GET /api/monthly/score-team?employee_id=EMP-XXXX**
- Fetch single employee's cycle + dimensions for scoring
- Return `{ employee: Employee, cycle: ReviewCycle | null, dimensions: ScoreDimension[] }`

#### 4B. API: `/api/monthly/manager-score/route.ts`

**POST /api/monthly/manager-score**
- Auth: manager, hr, md only
- Body: `{ employee_id, scores: Record<string, number>, comments: string, review_notes: string, next_month_focus: string }`
  - `scores` = manager scores per dimension key
  - `comments` = manager comments on performance
  - `review_notes` = private notes (visible to HR/MD only, NOT to employee)
  - `next_month_focus` = what to focus on next month (visible to employee)
- **Validation**:
  - Window must be open for manager role
  - Employee must have a ReviewCycle with `Status === "self_scored"` (employee must self-score first)
  - All dimension scores 1-5, comments min 20 chars
  - Manager must be the employee's manager (or hr/md)
- **Logic**:
  - Update ReviewCycle:
    - `Manager_Scores` = JSON.stringify(scores)
    - `Manager_Comments` = comments
    - `Review_Notes` = review_notes
    - `Next_Month_Focus` = next_month_focus
    - `Status` = "manager_scored"
    - `Flagged_Dimensions` = JSON array of dimension keys where `|self_score - manager_score| > 1`
    - `Locked_Average` = `computeAverage(Object.values(scores)).toString()`
  - Update individual goal/task Manager_Score fields (same pattern as self-score)
- Return `{ cycle: ReviewCycle }`

#### 4C. Page: `/monthly/score-team/page.tsx`

Build a client component page:

1. **Team list view** (default):
   - Show a table/card list of team members with columns:
     - Name, Department, Employee Type, Cycle Status (badge), Self-Score Average (if available)
   - Each row is clickable → navigates to scoring view for that employee
   - Color-code rows: gray=pending (no self-score yet), yellow=self_scored (ready to score), green=manager_scored, blue=acknowledged
   - Show stats at top: "3 of 8 team members scored"

2. **Individual scoring view** (when employee selected):
   - Header: "Scoring {employee.Name} — {monthLabel}"
   - **Left panel**: Employee's self-scores displayed read-only for reference
   - **Right panel**: Manager scoring form
     - For each dimension:
       - Dimension label + type badge
       - Employee's self-score shown (dimmed, for reference)
       - Manager score selector (1-5 pills, same style as self-score)
       - If gap > 1, highlight the row in amber with a small warning icon
     - Manager Comments textarea (min 20 chars)
     - Review Notes textarea (label: "Private notes — visible to HR/MD only")
     - Next Month Focus textarea
   - Submit button → POST → return to team list with success notification
   - If employee hasn't self-scored yet, show "Waiting for self-assessment" message instead of the form

---

### FEATURE 5: Config Sheet Seeding

Ensure the **Config** sheet in Google Sheets has these default rows (if not already present). You can seed them via a one-time API endpoint or check on app start:

| Key | Value |
|---|---|
| current_month | 3 |
| current_year | 2026 |
| window_open_day | 1 |
| window_close_day | 25 |
| reminder_day_1 | 3 |
| reminder_day_2 | 6 |
| hr_visibility_day | 7 |
| md_visibility_day | 10 |
| min_goals | 3 |
| max_goals | 5 |

**IMPORTANT**: For testing purposes, set `window_close_day` to **25** so the window is open during our testing period (today is March 25, 2026). We'll adjust to the real value (11) before go-live.

Create **GET/POST /api/config/route.ts**:
- GET: returns current ConfigMap (any authenticated user)
- POST: updates config values (hr and md only). Body: `{ key: string, value: string }`

---

### FEATURE 6: Dashboard Integration

Update the **dashboard page** (`/dashboard/page.tsx`) to include monthly scoring status:

**For employees**:
- Add a card: "Monthly Self-Assessment"
  - If window open + status pending: "Self-scoring window is open — score yourself now" with link to `/monthly/self-score`
  - If status self_scored: "Self-assessment submitted. Waiting for manager review."
  - If status manager_scored: "Manager has scored you — tap to view & acknowledge" with link
  - If status acknowledged: "Review complete for {monthLabel}" with average + rating badge

**For managers**:
- Add a card: "Team Monthly Scoring"
  - Show "X of Y team members scored" progress
  - Link to `/monthly/score-team`

---

## Implementation Rules

1. **Use existing utilities** — do NOT rewrite `computeAverage`, `getScoreDimensions`, `isWindowOpen`, `parseConfigRows`, etc. Import from `@/lib/utils`.
2. **Use existing components** — `Card`, `Badge`, `Modal`, `Button`, `Input`, `PageHeader`, `RatingBadge`, `Spinner`, `EmptyState` from `@/components/ui/`.
3. **Follow existing patterns** — look at `/api/weekly/reflection/route.ts` and `/weekly/reflection/page.tsx` for the request/response and page patterns.
4. **Session auth** — every API route starts with `const session = await getSession(); if (!session) return 401;`
5. **ID generation** — always use `generateId(prefix, await getNextSeq(sheetName))` for new IDs.
6. **JSON fields** — Self_Scores, Manager_Scores, Flagged_Dimensions, Monthly_Scores are JSON-stringified strings. Parse with `safeJsonParse()`, stringify with `JSON.stringify()`.
7. **Role guards** — check `session.role` in every endpoint. Employees can only access their own data. Managers can access their reports. HR/MD can access all.
8. **Error handling** — return `{ error: "message" }` with appropriate HTTP status codes (400, 401, 403, 404).
9. **Replace ComingSoon** — the routes `/goals`, `/tasks`, `/monthly/self-score`, `/monthly/score-team` currently render `<ComingSoon>`. Replace them with the real pages.
10. **Client components** — all pages with forms or interactivity must be `"use client"`. Use `fetch()` for API calls.
11. **Config loading** — for window checks, fetch Config sheet and use `parseConfigRows()`. Cache with `cachedReadSheet("Config")`.
12. **Invalidate cache** after writes — call `invalidateCache("Goals")` after goal mutations, `invalidateCache("Review_Cycles")` after cycle mutations, etc.

---

## File Checklist

Create or modify these files:

### New API Routes
- [ ] `src/app/api/goals/route.ts` (GET + POST)
- [ ] `src/app/api/goals/[id]/route.ts` (PATCH + DELETE)
- [ ] `src/app/api/tasks/route.ts` (GET + POST)
- [ ] `src/app/api/tasks/[id]/route.ts` (PATCH)
- [ ] `src/app/api/monthly/self-score/route.ts` (GET + POST)
- [ ] `src/app/api/monthly/score-team/route.ts` (GET)
- [ ] `src/app/api/monthly/manager-score/route.ts` (POST)
- [ ] `src/app/api/config/route.ts` (GET + POST)

### New/Updated Pages
- [ ] `src/app/(dashboard)/goals/page.tsx` — replace ComingSoon
- [ ] `src/app/(dashboard)/tasks/page.tsx` — replace ComingSoon
- [ ] `src/app/(dashboard)/monthly/self-score/page.tsx` — replace ComingSoon
- [ ] `src/app/(dashboard)/monthly/score-team/page.tsx` — replace ComingSoon
- [ ] `src/app/(dashboard)/dashboard/page.tsx` — add monthly status cards

### No Changes Needed
- `src/lib/types.ts` — all types already defined
- `src/lib/sheet-schema.ts` — all schemas already defined
- `src/lib/utils.ts` — all scoring functions already implemented
- `src/lib/sheets.ts` — all CRUD utilities ready
- `src/components/layout/Sidebar.tsx` — routes already wired
- `src/middleware.ts` — role guards already configured

---

## Test Scenarios (for after implementation)

1. **Goal CRUD**: Create 3 goals as employee → verify in sheet → drop 1 with reason → complete 1 → verify max_goals enforcement
2. **Task CRUD**: As manager, assign 3 tasks to a blue_collar employee → verify in sheet → deactivate 1
3. **Self-Score (white_collar)**: Login as white_collar employee with 3+ active goals → self-score all dimensions → verify Review_Cycles row created with Status=self_scored
4. **Self-Score (blue_collar)**: Login as blue_collar employee with active tasks → self-score → verify Task Monthly_Scores JSON updated
5. **Manager Score**: Login as manager → see team list with self_scored status → score an employee → verify gap flagging → verify Status=manager_scored
6. **Window enforcement**: Set window_close_day to a past date → verify employee gets "window closed" message
7. **Visibility rules**: Employee should NOT see Review_Notes field. Only HR/MD should see it.
8. **Dashboard cards**: Verify dashboard shows correct status for each phase of the cycle
