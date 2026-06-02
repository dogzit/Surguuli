"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { APPROVER_POSITIONS } from "@/lib/positions";

function cleanNote(note: string | undefined | null): string | null {
  if (!note) return null;
  const trimmed = note.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 500) : null;
}

async function requireApprover() {
  const me = await getCurrentUser();
  if (!me || me.role !== "APPROVER") {
    throw new Error("Зөвхөн гарын үсэг зурах эрхтэй хэрэглэгч үйлдэх боломжтой.");
  }
  return me;
}

function revalidateAll() {
  revalidatePath("/dashboard/approver");
  revalidatePath("/dashboard/teacher");
}

export async function addSignature(teacherId: string, note?: string) {
  const me = await requireApprover();

  const existing = await prisma.signature.findUnique({
    where: { teacherId_approverId: { teacherId, approverId: me.id } },
  });
  if (existing) {
    throw new Error("Та энэ багшид аль хэдийн гарын үсэг зурсан байна.");
  }

  await prisma.signature.create({
    data: { teacherId, approverId: me.id, note: cleanNote(note) },
  });

  const total = await prisma.signature.count({ where: { teacherId } });
  if (total >= APPROVER_POSITIONS.length) {
    console.log(`Ready for payment: teacher ${teacherId}`);
  }

  revalidateAll();
  return { total };
}

export async function updateSignatureNote(teacherId: string, note: string) {
  const me = await requireApprover();
  await prisma.signature.update({
    where: { teacherId_approverId: { teacherId, approverId: me.id } },
    data: { note: cleanNote(note) },
  });
  revalidateAll();
}

export async function removeSignature(teacherId: string) {
  const me = await requireApprover();

  const result = await prisma.signature.deleteMany({
    where: { teacherId, approverId: me.id },
  });
  if (result.count === 0) {
    throw new Error("Та энэ багшид гарын үсэг зураагүй байна.");
  }

  revalidateAll();
  return { removed: result.count };
}
