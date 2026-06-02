"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPin, verifyPin } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type FormResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateEmail(formData: FormData): Promise<FormResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Та нэвтрээгүй байна." };

  const raw = String(formData.get("email") ?? "").trim();
  const email = raw === "" ? null : raw.toLowerCase();

  if (email && !EMAIL_RE.test(email)) {
    return { ok: false, error: "Имэйл хаягийн формат буруу байна." };
  }

  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== me.id) {
      return {
        ok: false,
        error: "Энэ имэйлийг өөр хэрэглэгч ашиглаж байна.",
      };
    }
  }

  await prisma.user.update({ where: { id: me.id }, data: { email } });
  revalidatePath("/dashboard/settings");
  return { ok: true, message: "Имэйл хадгалагдлаа." };
}

export async function updatePin(formData: FormData): Promise<FormResult> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Та нэвтрээгүй байна." };

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "").trim();

  if (!(await verifyPin(current, me.pin))) {
    return { ok: false, error: "Одоогийн PIN буруу байна." };
  }
  if (next.length < 4 || next.length > 8) {
    return {
      ok: false,
      error: "Шинэ PIN 4-8 тэмдэгт байх ёстой.",
    };
  }
  if (next !== confirm) {
    return { ok: false, error: "Шинэ PIN тохирохгүй байна." };
  }
  if (next === current) {
    return {
      ok: false,
      error: "Шинэ PIN нь одоогийнхтой ижил байна.",
    };
  }

  const hashed = await hashPin(next);
  await prisma.user.update({ where: { id: me.id }, data: { pin: hashed } });
  revalidatePath("/dashboard/settings");
  return { ok: true, message: "PIN код шинэчлэгдлээ." };
}
