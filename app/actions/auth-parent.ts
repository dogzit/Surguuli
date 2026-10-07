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
  signSession,
  verifyPin,
} from "@/lib/session";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;
const INVITE_CODE_LEN = 8;

const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_ERROR = "И-мэйл эсвэл PIN буруу байна.";

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Sign an existing parent in with email + PIN.
 */
export async function loginAsParent(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const pin = String(formData.get("pin") ?? "").trim();

  if (!email || !pin) return { error: "И-мэйл болон PIN шаардлагатай." };
  if (!EMAIL_RE.test(email)) return { error: "И-мэйлийн формат буруу байна." };

  const ip = await getClientIp();
  if (
    !hitRateLimit(`parent-login:ip:${ip}`, MAX_ATTEMPTS * 2, WINDOW_MS) ||
    !hitRateLimit(`parent-login:email:${email}`, MAX_ATTEMPTS, WINDOW_MS)
  ) {
    return {
      error: "Хэт олон удаа буруу оруулсан байна. 1 минутын дараа дахин оролдоно уу.",
    };
  }

  const parent = await prisma.parent.findUnique({ where: { email } });
  if (!parent) {
    await logAudit({
      action: "parent.login_failed",
      metadata: { email, reason: "no_account" },
    });
    return { error: GENERIC_ERROR };
  }

  const ok = await verifyPin(pin, parent.pin);
  if (!ok) {
    await logAudit({
      action: "parent.login_failed",
      targetType: "parent",
      targetId: parent.id,
      metadata: { email },
    });
    return { error: GENERIC_ERROR };
  }

  resetRateLimit(`parent-login:ip:${ip}`);
  resetRateLimit(`parent-login:email:${email}`);

  await prisma.parent.update({
    where: { id: parent.id },
    data: { loginAt: new Date() },
  });
  await logAudit({
    action: "parent.login_success",
    targetType: "parent",
    targetId: parent.id,
  });

  await clearAnySession();
  const store = await cookies();
  store.set(SESSION_COOKIE, signSession(parent.id, "parent"), SESSION_COOKIE_OPTS);
  store.set(SESSION_TYPE_COOKIE, "parent", SESSION_COOKIE_OPTS);

  redirect("/dashboard/parent");
}

/**
 * Redeem a one-time invite code and create a new Parent account. Called
 * from the /login page's "Эцэг эх бүртгэл" tab.
 *
 * The invite code binds the new parent to a specific student. If the
 * parent already has an email registered we skip creating a duplicate
 * account and just link the child, so a parent with three kids only
 * needs one account.
 */
export async function redeemParentInvite(formData: FormData) {
  const rawCode = String(formData.get("code") ?? "");
  const code = normalizeCode(rawCode);
  const name = String(formData.get("name") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const pin = String(formData.get("pin") ?? "").trim();
  const pinConfirm = String(formData.get("pinConfirm") ?? "").trim();

  if (!code || code.length !== INVITE_CODE_LEN) {
    return { error: "Урилгын код 8 тэмдэгт байх ёстой." };
  }
  if (!name) return { error: "Овог, нэрээ бичнэ үү." };
  if (!EMAIL_RE.test(email)) return { error: "И-мэйлийн формат буруу байна." };
  if (pin.length < 4 || pin.length > 8) {
    return { error: "PIN 4-8 тэмдэгт байх ёстой." };
  }
  if (pin !== pinConfirm) return { error: "PIN давхардаж таарахгүй байна." };

  const ip = await getClientIp();
  // Redemption is heavier than login (creates rows), so a slightly
  // stricter bucket. Codes themselves are 8 upper-alnum ⇒ 36^8 space,
  // brute force is impractical, but rate limit still prevents burst
  // scans across many codes from one IP.
  if (!hitRateLimit(`parent-invite:ip:${ip}`, 5, WINDOW_MS)) {
    return { error: "Хэт олон оролдлого. Түр хүлээгээд дахин оролдоно уу." };
  }

  const invite = await prisma.inviteCode.findUnique({
    where: { code },
    include: { student: { select: { id: true, firstName: true, lastName: true } } },
  });
  if (!invite) {
    await logAudit({ action: "parent.invite_invalid", metadata: { code } });
    return { error: "Урилгын код олдсонгүй." };
  }
  if (invite.usedAt) {
    return { error: "Энэ код аль хэдийн ашиглагдсан." };
  }
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return { error: "Урилгын код хугацаа хэтэрсэн." };
  }

  // Reuse an existing parent account if the email matches — sibling case.
  const existing = await prisma.parent.findUnique({ where: { email } });
  const hashed = existing ? existing.pin : await hashPin(pin);

  const parent = await prisma.$transaction(async (tx) => {
    const p =
      existing ??
      (await tx.parent.create({
        data: { name, email, pin: hashed, phone },
      }));

    // Idempotent link — if the link already exists (rare, but possible
    // if the same code is retried after a network blip) skip creating.
    await tx.parentStudent.upsert({
      where: { parentId_studentId: { parentId: p.id, studentId: invite.studentId } },
      create: {
        parentId: p.id,
        studentId: invite.studentId,
        relation: invite.relation ?? null,
      },
      update: {},
    });

    await tx.inviteCode.update({
      where: { id: invite.id },
      data: { usedAt: new Date(), usedById: p.id },
    });

    return p;
  });

  await logAudit({
    action: existing ? "parent.linked_via_invite" : "parent.registered",
    targetType: "parent",
    targetId: parent.id,
    metadata: {
      code,
      studentId: invite.studentId,
      studentName: `${invite.student.lastName}. ${invite.student.firstName}`,
    },
  });

  await clearAnySession();
  const store = await cookies();
  store.set(SESSION_COOKIE, signSession(parent.id, "parent"), SESSION_COOKIE_OPTS);
  store.set(SESSION_TYPE_COOKIE, "parent", SESSION_COOKIE_OPTS);

  redirect("/dashboard/parent");
}

export async function logoutParent() {
  await clearAnySession();
  redirect("/login");
}
