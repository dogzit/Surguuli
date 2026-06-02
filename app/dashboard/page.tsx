import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function DashboardIndex() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  redirect(me.role === "APPROVER" ? "/dashboard/approver" : "/dashboard/teacher");
}
