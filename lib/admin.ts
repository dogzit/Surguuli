import { cookies } from "next/headers";
import crypto from "crypto";

export const ADMIN_COOKIE = "admin_uid";
const ADMIN_MARKER = "admin";

function adminSecret(): string {
  const s = process.env.ADMIN_SECRET || process.env.SESSION_SECRET;
  if (!s || s.length < 16)
    throw new Error("ADMIN_SECRET or SESSION_SECRET must be set");
  return s;
}

export function verifyAdminPin(pin: string): boolean {
  return pin === process.env.ADMIN_PIN;
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  const token = crypto
    .createHmac("sha256", adminSecret())
    .update(ADMIN_MARKER)
    .digest("hex");

  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  const expected = crypto
    .createHmac("sha256", adminSecret())
    .update(ADMIN_MARKER)
    .digest("hex");
  return token === expected;
}
