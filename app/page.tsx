import { redirect } from "next/navigation";
import { getCurrentUser, roleHomePath } from "@/lib/session";

export default async function Home() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  redirect(roleHomePath(me.role));
}
