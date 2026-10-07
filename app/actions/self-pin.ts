"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { hitRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCurrentActor, hashPin, verifyPin, type ActorKind } from "@/lib/session";

export type Result<T = void> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };

// Same 5/min guard as the login path so a compromised session can't
// bruteforce-guess the current PIN.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

/**
 * Actor-aware self-PIN-change. Requires the current PIN, matches new
 * against confirm, enforces 4-8 length, bcrypt-hashes, and audit-logs.
 * Works for staff, students, and parents from one action.
 */
export async function changeMyPin(input: {
  currentPin: string;
  newPin: string;
  confirmPin: string;
}): Promise<Result> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "Нэвтрэх шаардлагатай." };

  const currentPin = input.currentPin.trim();
  const newPin = input.newPin.trim();
  const confirmPin = input.confirmPin.trim();

  if (!currentPin || !newPin) return { ok: false, error: "Одоогийн болон шинэ PIN шаардлагатай." };
  if (newPin.length < 4 || newPin.length > 8) return { ok: false, error: "PIN 4-8 тэмдэгт байх ёстой." };
  if (newPin !== confirmPin) return { ok: false, error: "Шинэ PIN давхардаж таарахгүй байна." };
  if (newPin === currentPin) return { ok: false, error: "Шинэ PIN одоогийнхтой ижил байна." };

  const ip = await getClientIp();
  const kind: ActorKind =
    actor.kind === "user" ? "user" : actor.kind === "student" ? "student" : "parent";
  const id =
    actor.kind === "user" ? actor.user.id : actor.kind === "student" ? actor.student.id : actor.parent.id;
  if (!hitRateLimit(`self-pin:${kind}:${id}`, MAX_ATTEMPTS, WINDOW_MS)) {
    return { ok: false, error: "Хэт олон оролдлого. Түр хүлээгээд дахин оролдоно уу." };
  }
  if (!hitRateLimit(`self-pin-ip:${ip}`, MAX_ATTEMPTS * 3, WINDOW_MS)) {
    return { ok: false, error: "Хэт олон оролдлого. Дараа дахин оролдоно уу." };
  }

  const storedPin =
    actor.kind === "user"
      ? actor.user.pin
      : actor.kind === "student"
        ? actor.student.pin
        : actor.parent.pin;

  const ok = await verifyPin(currentPin, storedPin);
  if (!ok) {
    await logAudit({
      action: "self.pin_change_failed",
      targetType: kind,
      targetId: id,
      metadata: { reason: "wrong_current_pin" },
    });
    return { ok: false, error: "Одоогийн PIN буруу байна." };
  }

  const hashed = await hashPin(newPin);
  switch (actor.kind) {
    case "user":
      await prisma.user.update({ where: { id }, data: { pin: hashed } });
      break;
    case "student":
      await prisma.student.update({ where: { id }, data: { pin: hashed } });
      break;
    case "parent":
      await prisma.parent.update({ where: { id }, data: { pin: hashed } });
      break;
  }

  await logAudit({ action: "self.pin_change_success", targetType: kind, targetId: id });
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/student/settings");
  revalidatePath("/dashboard/parent/settings");
  return { ok: true, message: "PIN шинэчлэгдлээ." };
}
