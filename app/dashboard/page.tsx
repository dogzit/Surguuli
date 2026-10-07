import { redirect } from "next/navigation";
import { actorHomePath, getCurrentActor } from "@/lib/session";

export default async function DashboardIndex() {
  // Route ALL signed-in actors (staff / student / parent) to whichever
  // dashboard is theirs. This is the /dashboard entry point that
  // roleHomePath used to guard for staff only.
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  redirect(actorHomePath(actor));
}
