import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function RootPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (!session.firstLoginDone) redirect("/welcome");
  redirect("/dashboard");
}
