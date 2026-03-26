import { appendRowByFields, getNextSeq, generateId } from "@/lib/sheets";
import type { NotificationType } from "@/lib/types";

export async function createNotification(
  employeeId: string,
  type: NotificationType,
  message: string
): Promise<void> {
  const seq = await getNextSeq("Notifications");
  const id = generateId("NOTIF", seq);
  await appendRowByFields("Notifications", {
    Notification_ID: id,
    Employee_ID: employeeId,
    Type: type,
    Message: message,
    Status: "pending",
    Created_At: new Date().toISOString(),
    Sent_At: "",
  });
}
