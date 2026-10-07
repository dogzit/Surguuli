"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_TYPE_COOKIE } from "@/lib/session";

// Staff sign in on the separate staff site; students and parents sign in
// with app/actions/auth-student.ts and auth-parent.ts.

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(SESSION_TYPE_COOKIE);
  redirect("/login");
}
