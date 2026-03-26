// Single source of truth for all Google Sheets column definitions.
// All writes validate against this schema before touching the spreadsheet.

export const SHEET_SCHEMA: Record<string, string[]> = {
  Employees: [
    "Employee_ID",
    "Name",
    "Email",
    "Password_Hash",
    "Mobile",
    "Department",
    "Role",
    "Employee_Type",
    "Manager_ID",
    "Join_Date",
    "Status",
    "First_Login_Done",
    "Reset_Token",
    "Reset_Token_Expiry",
  ],
  Managers: ["Manager_ID", "Employee_ID"],
  Review_Cycles: [
    "Cycle_ID",
    "Employee_ID",
    "Month",
    "Year",
    "Self_Scores",
    "Manager_Scores",
    "Self_Comments",
    "Manager_Comments",
    "Review_Notes",
    "Next_Month_Focus",
    "Status",
    "Acknowledged_At",
    "Flagged_Dimensions",
    "AI_Note_Flag",
    "Locked_Average",
  ],
  Goals: [
    "Goal_ID",
    "Employee_ID",
    "Manager_ID",
    "Month",
    "Year",
    "Title",
    "Description",
    "Target",
    "Status",
    "Drop_Reason",
    "Self_Score",
    "Manager_Score",
    "Created_At",
  ],
  Tasks: [
    "Task_ID",
    "Employee_ID",
    "Manager_ID",
    "Task_Description",
    "Target",
    "Status",
    "Monthly_Scores",
    "Created_At",
    "Updated_At",
  ],
  Weekly_Reflections: [
    "Reflection_ID",
    "Employee_ID",
    "Week_Start_Date",
    "Accomplishments",
    "Next_Week_Plan",
    "Blockers",
    "Mood",
    "Submitted_At",
    "Acknowledged_At",
  ],
  Weekly_Checkins: [
    "Checkin_ID",
    "Manager_ID",
    "Employee_ID",
    "Week_Start_Date",
    "Main_Thing_On_Mind",
    "Committed_To",
    "Did_Well",
    "Improve",
    "Concern",
    "Submitted_At",
  ],
  Org_Changes: [
    "Change_ID",
    "Changed_By",
    "Employee_ID",
    "Field_Changed",
    "Old_Value",
    "New_Value",
    "Changed_At",
  ],
  Notifications: [
    "Notification_ID",
    "Employee_ID",
    "Type",
    "Message",
    "Status",
    "Created_At",
    "Sent_At",
  ],
  Assignments: [
    "Assignment_ID",
    "Employee_ID",
    "Manager_ID",
    "Month",
    "Year",
    "Title",
    "Description",
    "Target",
    "Type",
    "Status",
    "Drop_Reason",
    "Due_Date",
    "Progress_Note",
    "Self_Score",
    "Manager_Score",
    "Created_At",
    "Completed_At",
  ],
  Grievances: [
    "Grievance_ID",
    "Employee_ID",
    "Subject",
    "Description",
    "Category",
    "Status",
    "Filed_At",
    "Reviewed_By",
    "Resolution_Notes",
    "Resolved_At",
  ],
  Config: ["Key", "Value"],
  SEQUENCES: ["SHEET_NAME", "LAST_SEQ"],
};

export function getSheetColumns(sheetName: string): string[] {
  return SHEET_SCHEMA[sheetName] ?? [];
}

export function isKnownSheet(sheetName: string): boolean {
  return sheetName in SHEET_SCHEMA;
}

export function getMissingFields(
  sheetName: string,
  fields: Record<string, string>
): string[] {
  const required = SHEET_SCHEMA[sheetName] ?? [];
  return required.filter((col) => !(col in fields));
}

export function getUnknownFields(
  sheetName: string,
  fields: Record<string, string>
): string[] {
  const known = new Set(SHEET_SCHEMA[sheetName] ?? []);
  return Object.keys(fields).filter((k) => !known.has(k));
}
