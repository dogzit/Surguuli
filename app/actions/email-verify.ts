"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { hitRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentActor, hashPin, verifyPin, type ActorKind } from "@/lib/session";
import { renderEmailShell, sendMail } from "@/lib/mail";

export type Result<T = void> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };

const CODE_TTL_MS = 10 * 60_000; // 10 minutes
const MAX_ATTEMPTS = 5;
// Rate-limit "issue a code" heavier than the login limit so a bad
// actor can't spam somebody's inbox from many angles.
const ISSUE_MAX_PER_WINDOW = 3;
const ISSUE_WINDOW_MS = 10 * 60_000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function randomCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

function actorRef(
  actor: NonNullable<Awaited<ReturnType<typeof getCurrentActor>>>,
): { kind: ActorKind; id: string; currentEmail: string | null; name: string } {
  switch (actor.kind) {
    case "user":
      return { kind: "user", id: actor.user.id, currentEmail: actor.user.email, name: actor.user.name };
    case "student":
      return {
        kind: "student",
        id: actor.student.id,
        currentEmail: actor.student.email,
        name: `${actor.student.lastName}. ${actor.student.firstName}`,
      };
    case "parent":
      return { kind: "parent", id: actor.parent.id, currentEmail: actor.parent.email, name: actor.parent.name };
  }
}

/**
 * Step 1 of the email-change flow: issue a 6-digit code, email it,
 * store its bcrypt hash. Any prior pending code for this actor is
 * invalidated so a leaked one can't be reused after a new request.
 */
export async function requestEmailChange(rawEmail: string): Promise<Result<{ expiresAt: string }>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "Нэвтрэх шаардлагатай." };
  const me = actorRef(actor);

  const email = rawEmail.trim().toLowerCase();
  if (!email) return { ok: false, error: "И-мэйл шаардлагатай." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "И-мэйлийн формат буруу байна." };
  if (email === me.currentEmail?.toLowerCase()) {
    return { ok: false, error: "Одоогийн имэйл тэй ижил байна." };
  }

  const ip = await getClientIp();
  if (!hitRateLimit(`email-issue:${me.kind}:${me.id}`, ISSUE_MAX_PER_WINDOW, ISSUE_WINDOW_MS)) {
    return { ok: false, error: "Хэт олон код хүсэлт. 10 минутын дараа дахин оролдоно уу." };
  }
  if (!hitRateLimit(`email-issue-ip:${ip}`, ISSUE_MAX_PER_WINDOW * 3, ISSUE_WINDOW_MS)) {
    return { ok: false, error: "Хэт олон код хүсэлт. Дараа дахин оролдоно уу." };
  }

  // Reject if the target email is already in use by another account
  // of the same kind — matches the login flow's uniqueness guarantee.
  const dup = await isEmailInUse(me.kind, me.id, email);
  if (dup) return { ok: false, error: "Энэ имэйл өөр хэрэглэгчид харъяалагдаж байна." };

  const code = randomCode();
  const codeHash = await hashPin(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  // Wipe any old pending codes for this actor so only the newest one
  // is valid. Cheap since there's usually 0 or 1.
  await prisma.$transaction([
    prisma.emailVerification.deleteMany({
      where: { actorKind: me.kind, actorId: me.id, verifiedAt: null },
    }),
    prisma.emailVerification.create({
      data: {
        actorKind: me.kind,
        actorId: me.id,
        email,
        codeHash,
        expiresAt,
      },
    }),
  ]);

  const { html, text } = renderEmailShell({
    title: "И-мэйл баталгаажуулах код",
    intro: `Сайн байна уу, ${me.name}. Та профайл дээрх и-мэйл хаягаа шинэчлэх хүсэлт илгээсэн байна. Доорх 6 оронтой кодыг 10 минутын дотор оруулна уу: ${code}`,
    footer: "Хэрвээ та энэ хүсэлтийг гаргаагүй бол энэ имэйлийг үл тоомсорлоно уу.",
  });
  await sendMail({ to: email, subject: `Баталгаажуулах код: ${code}`, html, text });

  await logAudit({
    action: "email.request_change",
    targetType: me.kind,
    targetId: me.id,
    metadata: { targetEmail: email },
  });

  return {
    ok: true,
    data: { expiresAt: expiresAt.toISOString() },
    message: "Баталгаажуулах кодыг таны шинэ имэйл рүү илгээв.",
  };
}

/**
 * Step 2: verify the code, then apply the new email. Wrong code
 * increments `attempts`; on the 5th failure the whole record is
 * deleted and the user must request a new code.
 */
export async function verifyEmailChange(rawCode: string): Promise<Result<{ email: string }>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "Нэвтрэх шаардлагатай." };
  const me = actorRef(actor);

  const code = rawCode.trim();
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "6 оронтой код оруулна уу." };

  const ip = await getClientIp();
  if (!hitRateLimit(`email-verify-ip:${ip}`, 20, 60_000)) {
    return { ok: false, error: "Хэт олон оролдлого. Түр хүлээгээд дахин оролдоно уу." };
  }

  const pending = await prisma.emailVerification.findFirst({
    where: { actorKind: me.kind, actorId: me.id, verifiedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!pending) return { ok: false, error: "Баталгаажуулах код олдсонгүй. Дахин хүсэлт гаргана уу." };
  if (pending.expiresAt < new Date()) {
    await prisma.emailVerification.delete({ where: { id: pending.id } });
    return { ok: false, error: "Кодны хугацаа хэтэрсэн. Шинэ код хүсэлт гаргана уу." };
  }
  if (pending.attempts >= MAX_ATTEMPTS) {
    await prisma.emailVerification.delete({ where: { id: pending.id } });
    return { ok: false, error: "Хэт олон буруу оролдлого. Шинэ код хүсэлт гаргана уу." };
  }

  const ok = await verifyPin(code, pending.codeHash);
  if (!ok) {
    await prisma.emailVerification.update({
      where: { id: pending.id },
      data: { attempts: { increment: 1 } },
    });
    const left = MAX_ATTEMPTS - (pending.attempts + 1);
    return {
      ok: false,
      error: left > 0 ? `Код буруу байна. ${left} оролдлого үлдсэн.` : "Хэт олон буруу оролдлого.",
    };
  }

  // Idempotent: mark verified, then update the actor's email column.
  await prisma.$transaction([
    prisma.emailVerification.update({
      where: { id: pending.id },
      data: { verifiedAt: new Date() },
    }),
    applyEmailUpdate(me.kind, me.id, pending.email),
  ]);

  await logAudit({
    action: "email.verified",
    targetType: me.kind,
    targetId: me.id,
    metadata: { email: pending.email },
  });
  revalidatePath("/dashboard/settings");

  return {
    ok: true,
    data: { email: pending.email },
    message: "И-мэйл амжилттай баталгаажлаа.",
  };
}

/** True if some OTHER account of the same actor kind already uses this email. */
async function isEmailInUse(kind: ActorKind, myId: string, email: string): Promise<boolean> {
  switch (kind) {
    case "user": {
      const row = await prisma.user.findUnique({ where: { email } });
      return !!row && row.id !== myId;
    }
    case "student": {
      const row = await prisma.student.findUnique({ where: { email } });
      return !!row && row.id !== myId;
    }
    case "parent": {
      const row = await prisma.parent.findUnique({ where: { email } });
      return !!row && row.id !== myId;
    }
  }
}

/** Return the prisma update op for the actor's table. Kept as a factory so
 * the caller can wrap it in a $transaction alongside the verification update. */
function applyEmailUpdate(kind: ActorKind, id: string, email: string) {
  switch (kind) {
    case "user":
      return prisma.user.update({ where: { id }, data: { email } });
    case "student":
      return prisma.student.update({ where: { id }, data: { email } });
    case "parent":
      return prisma.parent.update({ where: { id }, data: { email } });
  }
}

/** Discard any pending code so the user can start over. */
export async function cancelPendingEmailChange(): Promise<Result> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "Нэвтрэх шаардлагатай." };
  const me = actorRef(actor);
  await prisma.emailVerification.deleteMany({
    where: { actorKind: me.kind, actorId: me.id, verifiedAt: null },
  });
  revalidatePath("/dashboard/settings");
  return { ok: true };
}
