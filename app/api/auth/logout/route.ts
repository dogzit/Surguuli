import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_TYPE_COOKIE } from "@/lib/session";
import { ADMIN_COOKIE } from "@/lib/admin";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  for (const name of [SESSION_COOKIE, SESSION_TYPE_COOKIE, ADMIN_COOKIE]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
  return response;
}
