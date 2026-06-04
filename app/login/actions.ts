"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE } from "@/lib/admin";
import {
  SESSION_COOKIE,
  hashPin,
  isLegacyPin,
  roleHomePath,
  signSession,
  verifyPin,
} from "@/lib/session";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;
const attempts = new Map<string, { count: number; firstAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = attempts.get(userId);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(userId, { count: 1, firstAt: now });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_ATTEMPTS;
}

function resetRateLimit(userId: string) {
  attempts.delete(userId);
}

export async function loginAs(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();

  if (!userId || !pin) {
    return { error: "PIN код шаардлагатай." };
  }

  if (!checkRateLimit(userId)) {
    return { error: "Хэт олон удаа буруу оруулсан байна. 1 минутын дараа дахин оролдоно уу." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { error: "Хэрэглэгч олдсонгүй." };
  }

  const ok = await verifyPin(pin, user.pin);
  if (!ok) {
    return { error: "PIN код буруу байна." };
  }

  resetRateLimit(userId);

  if (isLegacyPin(user.pin)) {
    const fresh = await hashPin(pin);
    await prisma.user.update({ where: { id: user.id }, data: { pin: fresh } });
  }

  cookies().set(SESSION_COOKIE, signSession(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  redirect(roleHomePath(user.role, user.position));
}

export async function logout() {
  const store = cookies();
  store.delete(SESSION_COOKIE);
  store.delete(ADMIN_COOKIE);
  redirect("/login");
}
