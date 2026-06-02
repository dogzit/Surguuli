"use server";

import { prisma } from "@/lib/prisma";
import { hashPin, requireAdmin } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type Result<T = void> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = new Set(["TEACHER", "APPROVER", "ADMIN"]);

function revalidateAll() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/approver");
  revalidatePath("/dashboard/teacher");
  revalidatePath("/login");
}

export async function createUser(input: {
  name: string;
  position: string;
  role: string;
  email?: string | null;
  pin?: string;
}): Promise<Result<{ id: string }>> {
  await requireAdmin();
  const name = input.name.trim();
  const position = input.position.trim();
  const role = input.role.trim();
  const email = (input.email ?? "").trim().toLowerCase() || null;
  const pin = (input.pin ?? "0000").trim();

  if (!name) return { ok: false, error: "Нэр заавал шаардлагатай." };
  if (!position) return { ok: false, error: "Албан тушаал шаардлагатай." };
  if (!VALID_ROLES.has(role)) return { ok: false, error: "Үүрэг буруу байна." };
  if (email && !EMAIL_RE.test(email)) {
    return { ok: false, error: "Имэйлийн формат буруу." };
  }
  if (pin.length < 4 || pin.length > 8) {
    return { ok: false, error: "PIN 4-8 тэмдэгт байх ёстой." };
  }

  if (email) {
    const dup = await prisma.user.findUnique({ where: { email } });
    if (dup) return { ok: false, error: "Энэ имэйл бусдад харъяалагдаж байна." };
  }

  const hashed = await hashPin(pin);
  const created = await prisma.user.create({
    data: { name, position, role, email, pin: hashed },
    select: { id: true },
  });

  revalidateAll();
  return { ok: true, data: { id: created.id }, message: "Хэрэглэгч үүсгэлээ." };
}

export async function updateUser(
  id: string,
  input: { name?: string; position?: string; role?: string; email?: string | null },
): Promise<Result> {
  await requireAdmin();
  if (!id) return { ok: false, error: "ID шаардлагатай." };

  const data: Record<string, unknown> = {};

  if (input.name !== undefined) {
    const n = input.name.trim();
    if (!n) return { ok: false, error: "Нэр хоосон байж болохгүй." };
    data.name = n;
  }
  if (input.position !== undefined) {
    const p = input.position.trim();
    if (!p) return { ok: false, error: "Албан тушаал хоосон байж болохгүй." };
    data.position = p;
  }
  if (input.role !== undefined) {
    if (!VALID_ROLES.has(input.role)) return { ok: false, error: "Үүрэг буруу байна." };
    data.role = input.role;
  }
  if (input.email !== undefined) {
    const raw = (input.email ?? "").trim().toLowerCase();
    const email = raw === "" ? null : raw;
    if (email && !EMAIL_RE.test(email)) {
      return { ok: false, error: "Имэйлийн формат буруу." };
    }
    if (email) {
      const dup = await prisma.user.findUnique({ where: { email } });
      if (dup && dup.id !== id) {
        return { ok: false, error: "Энэ имэйл бусдад харъяалагдаж байна." };
      }
    }
    data.email = email;
  }

  await prisma.user.update({ where: { id }, data });
  revalidateAll();
  return { ok: true, message: "Хадгалагдлаа." };
}

export async function deleteUser(id: string): Promise<Result> {
  const me = await requireAdmin();
  if (id === me.id) return { ok: false, error: "Өөрийгөө устгах боломжгүй." };

  await prisma.user.delete({ where: { id } });
  revalidateAll();
  return { ok: true, message: "Хэрэглэгч устгагдлаа." };
}

export async function resetUserPin(
  id: string,
  newPin: string = "0000",
): Promise<Result> {
  await requireAdmin();
  const pin = newPin.trim();
  if (pin.length < 4 || pin.length > 8) {
    return { ok: false, error: "PIN 4-8 тэмдэгт байх ёстой." };
  }
  const hashed = await hashPin(pin);
  await prisma.user.update({ where: { id }, data: { pin: hashed } });
  revalidateAll();
  return { ok: true, message: `PIN ${pin} болж шинэчлэгдлээ.` };
}

export async function resetAllPins(newPin: string = "0000"): Promise<Result<{ count: number }>> {
  await requireAdmin();
  const pin = newPin.trim();
  if (pin.length < 4 || pin.length > 8) {
    return { ok: false, error: "PIN 4-8 тэмдэгт байх ёстой." };
  }
  const hashed = await hashPin(pin);
  const result = await prisma.user.updateMany({
    where: { role: { not: "ADMIN" } },
    data: { pin: hashed },
  });
  revalidateAll();
  return { ok: true, data: { count: result.count }, message: `${result.count} хэрэглэгчийн PIN шинэчлэгдлээ.` };
}

export async function deleteSignature(id: string): Promise<Result> {
  await requireAdmin();
  await prisma.signature.delete({ where: { id } });
  revalidateAll();
  return { ok: true, message: "Гарын үсэг устгагдлаа." };
}

export async function clearAllSignatures(): Promise<Result<{ count: number }>> {
  await requireAdmin();
  const result = await prisma.signature.deleteMany({});
  revalidateAll();
  return { ok: true, data: { count: result.count }, message: `${result.count} гарын үсэг устгагдлаа.` };
}

export async function clearTeacherSignatures(teacherId: string): Promise<Result<{ count: number }>> {
  await requireAdmin();
  const result = await prisma.signature.deleteMany({ where: { teacherId } });
  revalidateAll();
  return { ok: true, data: { count: result.count }, message: `${result.count} гарын үсэг устгагдлаа.` };
}
