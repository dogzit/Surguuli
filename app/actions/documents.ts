"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/admin";
import { logAudit } from "@/lib/audit";
import {
  VALID_DOCUMENT_SLUGS,
  APPLICATION_STATUSES,
  DOCUMENT_STATUSES,
  type ApplicationStatus,
  type DocumentStatus,
} from "@/lib/documents";

export type Result<T = void> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };

function isNotFound(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025"
  );
}

async function guardNotFound(
  notFoundMsg: string,
  fn: () => Promise<unknown>,
): Promise<Result> {
  try {
    await fn();
    return { ok: true };
  } catch (err) {
    if (isNotFound(err)) return { ok: false, error: notFoundMsg };
    throw err;
  }
}

function revalidateDocuments() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/documents");
}

// ── Application CRUD ──────────────────────────────────────────

export async function createApplication(input: {
  studentId: string;
  university: string;
  country?: string | null;
  program?: string | null;
  deadline?: string | null;
  notes?: string | null;
  documentTypes: string[];
}): Promise<Result<{ id: string }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const university = input.university.trim();
  if (!university) return { ok: false, error: "Их сургуулийн нэр шаардлагатай." };

  const student = await prisma.student.findUnique({
    where: { id: input.studentId },
    select: { id: true },
  });
  if (!student) return { ok: false, error: "Сурагч олдсонгүй." };

  const requestedTypes = Array.from(new Set(input.documentTypes)).filter((t) =>
    VALID_DOCUMENT_SLUGS.has(t),
  );
  if (requestedTypes.length === 0) {
    return { ok: false, error: "Дор хаяж нэг бичиг сонгоно уу." };
  }

  const deadline = input.deadline ? new Date(input.deadline) : null;
  if (input.deadline && Number.isNaN(deadline?.getTime())) {
    return { ok: false, error: "Огноо буруу байна." };
  }

  const created = await prisma.$transaction(async (tx) => {
    const app = await tx.universityApplication.create({
      data: {
        studentId: student.id,
        university,
        country: input.country?.trim() || null,
        program: input.program?.trim() || null,
        deadline,
        notes: input.notes?.trim() || null,
      },
      select: { id: true },
    });
    await tx.documentRequest.createMany({
      data: requestedTypes.map((type) => ({
        applicationId: app.id,
        type,
      })),
    });
    return app;
  });

  await logAudit({
    action: "application.create",
    targetType: "application",
    targetId: created.id,
    metadata: { studentId: student.id, university, docs: requestedTypes.length },
  });
  revalidateDocuments();
  return { ok: true, data: { id: created.id }, message: "Өргөдөл нээгдлээ." };
}

export async function updateApplicationStatus(
  id: string,
  status: string,
): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  if (!APPLICATION_STATUSES.includes(status as ApplicationStatus)) {
    return { ok: false, error: "Төлөв буруу байна." };
  }
  const res = await guardNotFound("Өргөдөл олдсонгүй.", () =>
    prisma.universityApplication.update({ where: { id }, data: { status } }),
  );
  if (!res.ok) return res;
  await logAudit({
    action: "application.update_status",
    targetType: "application",
    targetId: id,
    metadata: { status },
  });
  revalidateDocuments();
  return { ok: true, message: "Хадгалагдлаа." };
}

export async function deleteApplication(id: string): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const res = await guardNotFound("Өргөдөл олдсонгүй.", () =>
    prisma.universityApplication.delete({ where: { id } }),
  );
  if (!res.ok) return res;
  await logAudit({
    action: "application.delete",
    targetType: "application",
    targetId: id,
  });
  revalidateDocuments();
  return { ok: true, message: "Өргөдөл устгагдлаа." };
}

// ── DocumentRequest CRUD ──────────────────────────────────────

export async function addDocumentRequest(
  applicationId: string,
  type: string,
): Promise<Result<{ id: string }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  if (!VALID_DOCUMENT_SLUGS.has(type)) {
    return { ok: false, error: "Бичгийн төрөл буруу байна." };
  }
  try {
    const created = await prisma.documentRequest.create({
      data: { applicationId, type },
      select: { id: true },
    });
    await logAudit({
      action: "document.create",
      targetType: "document",
      targetId: created.id,
      metadata: { applicationId, type },
    });
    revalidateDocuments();
    return { ok: true, data: { id: created.id }, message: "Бичиг нэмэгдлээ." };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { ok: false, error: "Энэ өргөдөлд ийм төрлийн бичиг аль хэдийн бий." };
    }
    throw err;
  }
}

export async function updateDocumentRequest(
  id: string,
  input: {
    status?: string;
    fileUrl?: string | null;
    note?: string | null;
    assignedToId?: string | null;
  },
): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const data: Record<string, unknown> = {};
  if (input.status !== undefined) {
    if (!DOCUMENT_STATUSES.includes(input.status as DocumentStatus)) {
      return { ok: false, error: "Төлөв буруу байна." };
    }
    data.status = input.status;
  }
  if (input.fileUrl !== undefined) {
    const url = input.fileUrl?.trim() || null;
    if (url && !/^https?:\/\//i.test(url)) {
      return { ok: false, error: "URL нь http:// эсвэл https:// эхэлнэ." };
    }
    data.fileUrl = url;
  }
  if (input.note !== undefined) {
    const note = input.note?.trim();
    data.note = note && note.length > 0 ? note.slice(0, 2000) : null;
  }
  if (input.assignedToId !== undefined) {
    data.assignedToId = input.assignedToId?.trim() || null;
  }

  const res = await guardNotFound("Бичиг олдсонгүй.", () =>
    prisma.documentRequest.update({ where: { id }, data }),
  );
  if (!res.ok) return res;
  await logAudit({
    action: "document.update",
    targetType: "document",
    targetId: id,
    metadata: data,
  });
  revalidateDocuments();
  return { ok: true, message: "Хадгалагдлаа." };
}

export async function deleteDocumentRequest(id: string): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const res = await guardNotFound("Бичиг олдсонгүй.", () =>
    prisma.documentRequest.delete({ where: { id } }),
  );
  if (!res.ok) return res;
  await logAudit({
    action: "document.delete",
    targetType: "document",
    targetId: id,
  });
  revalidateDocuments();
  return { ok: true, message: "Бичиг устгагдлаа." };
}
