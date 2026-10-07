"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { hitRateLimit, resetRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  SESSION_COOKIE,
  SESSION_TYPE_COOKIE,
  clearAnySession,
  hashPin,
  isLegacyPin,
  signSession,
  verifyPin,
} from "@/lib/session";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

// Shared cookie options — matches app/login/actions.ts so all three
// actor kinds behave identically (SameSite, Secure in prod, 30 days).
const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
};

const GENERIC_ERROR = "Код эсвэл PIN буруу байна.";

/**
 * Sign a student in. They enter their student code (e.g. "2А-001") and
 * PIN. Students without a PIN yet (the admin hasn't run the generator)
 * cannot log in — matches the "opt-in per student" note in the schema.
 */
export async function loginAsStudent(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();

  if (!code || !pin) return { error: "Код болон PIN шаардлагатай." };

  const ip = await getClientIp();
  if (
    !hitRateLimit(`student-login:ip:${ip}`, MAX_ATTEMPTS * 2, WINDOW_MS) ||
    !hitRateLimit(`student-login:code:${code}`, MAX_ATTEMPTS, WINDOW_MS)
  ) {
    return {
      error: "Хэт олон удаа буруу оруулсан байна. 1 минутын дараа дахин оролдоно уу.",
    };
  }

  const student = await prisma.student.findUnique({ where: { code } });
  if (!student || !student.pin) {
    await logAudit({
      action: "student.login_failed",
      targetType: "student",
      targetId: student?.id,
      metadata: { code, reason: !student ? "no_such_code" : "no_pin_yet" },
    });
    return { error: GENERIC_ERROR };
  }

  const ok = await verifyPin(pin, student.pin);
  if (!ok) {
    await logAudit({
      action: "student.login_failed",
      targetType: "student",
      targetId: student.id,
      metadata: { code },
    });
    return { error: GENERIC_ERROR };
  }

  resetRateLimit(`student-login:ip:${ip}`);
  resetRateLimit(`student-login:code:${code}`);

  // Auto-upgrade legacy plaintext PINs on successful login, same policy
  // as User accounts. Also stamp loginAt so admins can see stale accounts.
  const data: Record<string, unknown> = { loginAt: new Date() };
  if (isLegacyPin(student.pin)) data.pin = await hashPin(pin);
  await prisma.student.update({ where: { id: student.id }, data });

  await logAudit({
    action: "student.login_success",
    targetType: "student",
    targetId: student.id,
  });

  // Wipe any prior session so a shared computer doesn't end up with two
  // overlapping cookies. Then set student session cookies.
  await clearAnySession();
  const store = await cookies();
  store.set(SESSION_COOKIE, signSession(student.id, "student"), SESSION_COOKIE_OPTS);
  store.set(SESSION_TYPE_COOKIE, "student", SESSION_COOKIE_OPTS);

  redirect("/dashboard/student");
}

/**
 * Sign the student out. Same POST shape as the staff logout so the
 * client-side LogoutButton can keep using it.
 */
export async function logoutStudent() {
  await clearAnySession();
  redirect("/login");
}
