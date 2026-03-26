import { appendRowByFields, getNextSeq, generateId } from "./sheets";

interface OrgChangeParams {
  employeeId: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
}

export async function appendOrgChange(params: OrgChangeParams): Promise<void> {
  const seq = await getNextSeq("Org_Changes");
  const changeId = generateId("CHG", seq);
  await appendRowByFields("Org_Changes", {
    Change_ID: changeId,
    Changed_By: params.changedBy,
    Employee_ID: params.employeeId,
    Field_Changed: params.fieldChanged,
    Old_Value: params.oldValue,
    New_Value: params.newValue,
    Changed_At: new Date().toISOString(),
  });
}
