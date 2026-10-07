import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";

export const ADMIN_COOKIE = "admin_uid";
const ADMIN_MARKER = "admin";
// Match the session-cookie duration (30 days) so an admin who signed in via
// PIN doesn't silently lose access mid-session and get redirected back to
// `/login` — that used to trigger the AdminGate refresh-loop when combined
// with an approver session.
const ADMIN_MAX_AGE = 60 * 60 * 24 * 30;

function adminSecret(): string {
  const s = process.env.ADMIN_SECRET || process.env.SESSION_SECRET;
  if (!s || s.length < 16)
    throw new Error("ADMIN_SECRET or SESSION_SECRET must be set");
  return s;
}

export function verifyAdminPin(pin: string): boolean {
  // Trim both sides — .env values often have accidental trailing spaces
  // or quotes and users likewise sometimes paste with whitespace.
  const expected = process.env.ADMIN_PIN?.trim();
  const provided = pin.trim();
  // Fail closed if the admin PIN is not configured.
  if (!expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
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
    maxAge: ADMIN_MAX_AGE,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  const expected = crypto
    .createHmac("sha256", adminSecret())
    .update(ADMIN_MARKER)
    .digest("hex");
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

// Check if user can access admin dashboard (admin OR approver with session)
export async function canAccessAdmin(): Promise<{ allowed: boolean; role: string | null; userId: string | null; position: string | null; name: string | null }> {
  // Check admin cookie first
  if (await isAdmin()) {
    return { allowed: true, role: "ADMIN", userId: null, position: null, name: null };
  }
  // Check approver session
  const { getCurrentUser } = await import("./session");
  const user = await getCurrentUser();
  if (user && (user.role === "APPROVER" || user.role === "ADMIN")) {
    return { allowed: true, role: user.role, userId: user.id, position: user.position, name: user.name };
  }
  return { allowed: false, role: null, userId: null, position: null, name: null };
}

/**
 * True for school staff: the admin PIN cookie or any signed-in staff
 * account (teacher, approver, admin). Students and parents are not staff.
 * Used to gate children's personal data on public pages.
 */
export async function isStaffViewer(): Promise<boolean> {
  if (await isAdmin()) return true;
  const { getCurrentUser } = await import("./session");
  return (await getCurrentUser()) !== null;
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/dashboard/admin");
}

/**
 * Server-action variant of requireAdmin: does NOT redirect (redirects from
 * server actions confuse React 19 form state). Returns a Result-shaped
 * error the caller can pass straight through.
 */
export async function ensureAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (!(await isAdmin())) {
    return { ok: false, error: "Админы эрх шаардлагатай." };
  }
  return { ok: true };
}
