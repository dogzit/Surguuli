"use server";

import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, setAdminSession } from "@/lib/admin";
import { logAudit } from "@/lib/audit";
import {
  hitRateLimit,
  resetRateLimit,
  getClientIp,
} from "@/lib/rate-limit";
import {
  SESSION_COOKIE,
  SESSION_TYPE_COOKIE,
  hashPin,
  isLegacyPin,
  roleHomePath,
  signSession,
  verifyPin,
} from "@/lib/session";

// Shared cookie config so staff/student/parent flows all set matching
// SameSite/Secure/lifetime. httpOnly is on for both — nothing client-side
// needs to read these.
const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
};

/**
 * Compare two strings in constant time. Returns false whenever the buffers
 * differ in length so an attacker cannot use timing to guess PIN length.
 */
function timingSafeStringEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

export async function loginAs(formData: FormData) {
  const identifier = String(formData.get("userId") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();

  if (!identifier || !pin) {
    return { error: "Хэрэглэгчийн ID эсвэл PIN код шаардлагатай." };
  }

  const ip = await getClientIp();
  // Rate-limit by IP AND by identifier so one source cannot brute-force
  // many accounts, and one account cannot be attacked from many sources.
  if (
    !hitRateLimit(`login:ip:${ip}`, MAX_ATTEMPTS * 2, WINDOW_MS) ||
    !hitRateLimit(`login:id:${identifier}`, MAX_ATTEMPTS, WINDOW_MS)
  ) {
    return { error: "Хэт олон удаа буруу оруулсан байна. 1 минутын дараа дахин оролдоно уу." };
  }

  const GENERIC_LOGIN_ERROR = "Хэрэглэгчийн ID эсвэл PIN код буруу байна.";

  // Resolve identifier: user ID (from picker/search) or email address.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const user =
    (await prisma.user.findUnique({ where: { id: identifier } })) ??
    (EMAIL_RE.test(identifier)
      ? await prisma.user.findUnique({
          where: { email: identifier.toLowerCase() },
        })
      : null);
  // Same message for "no such user" and "wrong PIN" so attackers cannot
  // enumerate valid user IDs from the error text.
  if (!user) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  // ── Super-admin path ──────────────────────────────────────────────
  // The single account matching SUPER_ADMIN_EMAIL bypasses the DB pin
  // check and instead validates against ADMIN_PIN from the env. On
  // success we grant BOTH a session cookie (so the app knows who the
  // actor is for audit logs) and the admin cookie (so admin-only
  // sub-pages work).
  const superEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  const adminPinEnv = process.env.ADMIN_PIN;
  if (
    superEmail &&
    adminPinEnv &&
    user.email?.toLowerCase() === superEmail &&
    user.role === "ADMIN"
  ) {
    if (!timingSafeStringEq(pin, adminPinEnv)) {
      await logAudit({
        action: "auth.super_admin_failed",
        targetType: "user",
        targetId: user.id,
      });
      return { error: GENERIC_LOGIN_ERROR };
    }
    resetRateLimit(`login:ip:${ip}`);
    resetRateLimit(`login:id:${identifier}`);
    await setAdminSession();
    const store = await cookies();
    store.set(SESSION_COOKIE, signSession(user.id, "user"), SESSION_COOKIE_OPTS);
    store.set(SESSION_TYPE_COOKIE, "user", SESSION_COOKIE_OPTS);
    await logAudit({
      action: "auth.super_admin_success",
      targetType: "user",
      targetId: user.id,
    });
    redirect("/dashboard/admin");
  }

  const ok = await verifyPin(pin, user.pin);
  if (!ok) {
    // Log the failed attempt so admins can spot brute-force patterns even
    // when the rate limiter allowed them through.
    await logAudit({
      action: "auth.login_failed",
      targetType: "user",
      targetId: user.id,
      metadata: { identifier },
    });
    return { error: GENERIC_LOGIN_ERROR };
  }

  resetRateLimit(`login:ip:${ip}`);
  resetRateLimit(`login:id:${identifier}`);
  await logAudit({
    action: "auth.login_success",
    targetType: "user",
    targetId: user.id,
    metadata: { role: user.role },
  });

  if (isLegacyPin(user.pin)) {
    const fresh = await hashPin(pin);
    await prisma.user.update({ where: { id: user.id }, data: { pin: fresh } });
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, signSession(user.id, "user"), SESSION_COOKIE_OPTS);
  store.set(SESSION_TYPE_COOKIE, "user", SESSION_COOKIE_OPTS);

  redirect(roleHomePath(user.role, user.position));
}

/** Public shape returned to the login UI — no PII beyond name/position needed for login. */
export interface UserSearchResult {
  id: string;
  name: string;
  position: string;
  role: string;
}

// Bulk roster: fetched once by the login page and filtered locally, so
// typing feels instant and the server sees at most a handful of requests
// per visitor instead of one per keystroke.
const ROSTER_MAX_PER_WINDOW = 5;
const ROSTER_WINDOW_MS = 5 * 60_000;
const ROSTER_HARD_LIMIT = 500;

/**
 * Returns the full staff roster (teachers + approvers) once. The login page
 * fetches this a single time (on first focus of the search input) and does
 * all subsequent filtering client-side — no more per-keystroke DB round-
 * trips.
 *
 * The rate limit is intentionally lenient per visitor but tight per IP: 5
 * bulk-roster reads every 5 minutes is plenty for real users while still
 * making bulk scraping annoying.
 */
export async function getStaffRoster(): Promise<
  | { ok: true; users: UserSearchResult[] }
  | { ok: false; error: string }
> {
  const ip = await getClientIp();
  if (!hitRateLimit(`roster:${ip}`, ROSTER_MAX_PER_WINDOW, ROSTER_WINDOW_MS)) {
    return { ok: false, error: "Хэт олон хүсэлт. Түр хүлээгээд дахин оролдоно уу." };
  }

  const users = await prisma.user.findMany({
    where: { role: { in: ["TEACHER", "APPROVER"] } },
    orderBy: [{ role: "asc" }, { position: "asc" }, { name: "asc" }],
    select: { id: true, name: true, position: true, role: true },
    take: ROSTER_HARD_LIMIT,
  });

  return { ok: true, users };
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(SESSION_TYPE_COOKIE);
  store.delete(ADMIN_COOKIE);
  redirect("/login");
}
