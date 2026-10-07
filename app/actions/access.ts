"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/admin";
import { logAudit } from "@/lib/audit";
import { hashPin } from "@/lib/session";

export type Result<T = void> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };

// PINs are 6 digits: enough entropy against casual guessing (~1M
// combinations) while staying short enough to memorize on the sheet
// students take home. Legacy staff pins remain 4-8.
const STUDENT_PIN_LEN = 6;
const INVITE_CODE_LEN = 8;

function randomDigits(n: number): string {
  const max = 10 ** n;
  return String(crypto.randomInt(0, max)).padStart(n, "0");
}

function randomInviteCode(): string {
  // Uppercase alphanumerics minus visually confusing chars (0/O, 1/I).
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < INVITE_CODE_LEN; i++) {
    out += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return out;
}

function revalidateAccess() {
  revalidatePath("/dashboard/admin/access");
  revalidatePath("/dashboard/admin");
}

// ── Student PINs ──────────────────────────────────────────────

/**
 * (Re)generate PINs for every student in one classroom in a single
 * transaction. Returns the plaintext PINs so the admin can print a
 * per-classroom handout — after this call the plaintext is gone.
 */
export async function regenerateClassroomPins(
  classroomId: string,
): Promise<
  Result<{
    classroomLabel: string;
    items: Array<{ id: string; code: string; firstName: string; lastName: string; pin: string }>;
  }>
> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    include: {
      students: {
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: { id: true, code: true, firstName: true, lastName: true },
      },
    },
  });
  if (!classroom) return { ok: false, error: "Анги олдсонгүй." };
  if (classroom.students.length === 0) {
    return { ok: false, error: "Энэ ангид сурагч бүртгэгдээгүй байна." };
  }

  // Hash outside the transaction (bcrypt is slow) so we don't hold the
  // txn open while computing 30+ hashes.
  const prepared = await Promise.all(
    classroom.students.map(async (s) => {
      const pin = randomDigits(STUDENT_PIN_LEN);
      const hashed = await hashPin(pin);
      return { id: s.id, code: s.code, firstName: s.firstName, lastName: s.lastName, pin, hashed };
    }),
  );

  await prisma.$transaction(
    async (tx) => {
      for (const p of prepared) {
        await tx.student.update({
          where: { id: p.id },
          data: { pin: p.hashed },
        });
      }
    },
    { timeout: 60_000, maxWait: 10_000 },
  );

  await logAudit({
    action: "student.regen_classroom_pins",
    targetType: "classroom",
    targetId: classroom.id,
    metadata: { count: prepared.length, label: classroom.label },
  });
  revalidateAccess();

  return {
    ok: true,
    data: {
      classroomLabel: classroom.label,
      items: prepared.map(({ hashed: _h, ...rest }) => rest),
    },
    message: `${prepared.length} сурагчийн PIN шинэчлэгдлээ.`,
  };
}

export async function regenerateOneStudentPin(
  studentId: string,
): Promise<Result<{ pin: string; name: string; code: string }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, code: true, firstName: true, lastName: true },
  });
  if (!student) return { ok: false, error: "Сурагч олдсонгүй." };

  const pin = randomDigits(STUDENT_PIN_LEN);
  const hashed = await hashPin(pin);
  await prisma.student.update({ where: { id: student.id }, data: { pin: hashed } });

  await logAudit({
    action: "student.regen_pin",
    targetType: "student",
    targetId: student.id,
  });
  revalidateAccess();

  return {
    ok: true,
    data: { pin, code: student.code, name: `${student.lastName}. ${student.firstName}` },
    message: `${student.code} сурагчийн PIN шинэчлэгдлээ.`,
  };
}

// ── Parent invite codes ───────────────────────────────────────

/**
 * Create a fresh invite code for a specific student. Multiple codes
 * per student are OK (one for mother, one for father). Codes expire
 * in 60 days by default.
 */
export async function createInviteCode(
  input: { studentId: string; relation?: string; expiresInDays?: number },
): Promise<Result<{ code: string; expiresAt: Date | null; studentName: string }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const student = await prisma.student.findUnique({
    where: { id: input.studentId },
    select: { id: true, firstName: true, lastName: true, code: true },
  });
  if (!student) return { ok: false, error: "Сурагч олдсонгүй." };

  const days = input.expiresInDays ?? 60;
  const expiresAt = days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

  // Retry once on collision — the alphabet is 32 chars × 8 slots =
  // 1.1 × 10^12 space, so a real collision is astronomically unlikely,
  // but the retry costs nothing.
  let code = randomInviteCode();
  for (let attempt = 0; attempt < 2; attempt++) {
    const dup = await prisma.inviteCode.findUnique({ where: { code } });
    if (!dup) break;
    code = randomInviteCode();
  }

  await prisma.inviteCode.create({
    data: {
      code,
      studentId: student.id,
      relation: input.relation?.trim() || null,
      expiresAt,
    },
  });

  await logAudit({
    action: "parent.invite_created",
    targetType: "student",
    targetId: student.id,
    metadata: { code, relation: input.relation, expiresAt },
  });
  revalidateAccess();

  return {
    ok: true,
    data: {
      code,
      expiresAt,
      studentName: `${student.lastName}. ${student.firstName} (${student.code})`,
    },
    message: `Код үүслээ: ${code}`,
  };
}

export async function revokeInviteCode(id: string): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  try {
    await prisma.inviteCode.delete({ where: { id } });
  } catch {
    return { ok: false, error: "Код олдсонгүй." };
  }
  await logAudit({
    action: "parent.invite_revoked",
    targetType: "invite",
    targetId: id,
  });
  revalidateAccess();
  return { ok: true, message: "Код цуцлагдлаа." };
}
