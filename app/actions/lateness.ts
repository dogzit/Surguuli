"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { notifyMany } from "@/lib/notifications";
import { getLateRecorder, type LateRecorder } from "@/lib/lateness-access";
import { SOCIAL_WORKER_POSITION } from "@/lib/positions";
import {
  MAX_COMES_FROM,
  MAX_MINUTES_LATE,
  MAX_NAME,
  REPEAT_THRESHOLD,
  REPEAT_WINDOW_DAYS,
  addDays,
  classLabelFor,
  cleanText,
  isDateKey,
  nameKey,
  normalizeClassLabel,
  schoolDate,
  studentDisplayName,
} from "@/lib/lateness";
import type { Result } from "./admin";

export interface LateInput {
  date: string;
  studentName: string;
  classLabel: string;
  minutesLate: number | string;
  comesFrom: string;
  studentId?: string | null; // set when picked from the student list
}

export interface StudentMatch {
  id: string;
  name: string;
  classLabel: string;
  lastComesFrom: string | null;
}

function canModify(me: LateRecorder, recordedById: string | null): boolean {
  return me.canModerate || (me.id !== null && me.id === recordedById);
}

function revalidateLateness() {
  revalidatePath("/dashboard/duty");
  revalidatePath("/dashboard/admin/lateness");
}

/** Name + class for a known student, so typed and picked entries agree. */
async function linkedStudent(id: string) {
  const s = await prisma.student.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      classroom: { select: { grade: true, section: true } },
    },
  });
  if (!s) return null;
  return {
    id: s.id,
    name: studentDisplayName(s.lastName, s.firstName),
    classLabel: classLabelFor(s.classroom.grade, s.classroom.section),
  };
}

/**
 * The teacher typed the name by hand: link it anyway when it matches
 * exactly one student of that class, so the report counts them as one child.
 */
async function findTypedStudent(name: string, classLabel: string): Promise<string | null> {
  const m = /^(\d{1,2})([^\d-])$/.exec(classLabel);
  if (!m) return null;
  const students = await prisma.student.findMany({
    where: { classroom: { grade: Number(m[1]), section: m[2] } },
    select: { id: true, firstName: true, lastName: true },
  });
  const key = nameKey(name);
  const hits = students.filter((s) => nameKey(studentDisplayName(s.lastName, s.firstName)) === key);
  return hits.length === 1 ? hits[0]!.id : null;
}

/** Record that a student arrived late. One record per student per day. */
export async function recordLate(input: LateInput): Promise<Result<{ id: string }>> {
  const me = await getLateRecorder();
  if (!me) return { ok: false, error: "Зөвхөн нэвтэрсэн багш, ажилтан бүртгэнэ." };

  const today = schoolDate();
  const date = String(input.date ?? "").trim() || today;
  if (!isDateKey(date) || date > today || date < addDays(today, -365)) {
    return { ok: false, error: "Огноо буруу байна." };
  }

  const minutesLate = Math.round(Number(input.minutesLate));
  if (!Number.isFinite(minutesLate) || minutesLate < 1 || minutesLate > MAX_MINUTES_LATE) {
    return { ok: false, error: `Хоцорсон минутыг 1–${MAX_MINUTES_LATE} хооронд оруулна уу.` };
  }

  const comesFrom = cleanText(input.comesFrom, MAX_COMES_FROM);
  if (!comesFrom) return { ok: false, error: "Хаанаас ирдгийг бичнэ үү." };

  let studentId: string | null = null;
  let studentName: string;
  let classLabel: string;
  if (input.studentId) {
    const s = await linkedStudent(String(input.studentId));
    if (!s) return { ok: false, error: "Сурагч олдсонгүй." };
    ({ id: studentId, name: studentName, classLabel } = s);
  } else {
    studentName = cleanText(input.studentName, MAX_NAME);
    if (studentName.length < 2) return { ok: false, error: "Сурагчийн нэрийг бичнэ үү." };
    const label = normalizeClassLabel(String(input.classLabel ?? ""));
    if (!label) return { ok: false, error: "Ангийг 5Б эсвэл 10-2 хэлбэрээр бичнэ үү." };
    classLabel = label;
    studentId = await findTypedStudent(studentName, classLabel);
  }

  const sameDay = await prisma.lateArrival.findMany({
    where: { date, classLabel },
    select: { studentId: true, studentName: true },
  });
  const key = nameKey(studentName);
  const dup = sameDay.find((r) => (studentId && r.studentId === studentId) || nameKey(r.studentName) === key);
  if (dup) {
    return { ok: false, error: `${dup.studentName} (${classLabel}) энэ өдөр аль хэдийн бүртгэгдсэн байна.` };
  }

  let id: string;
  try {
    const created = await prisma.lateArrival.create({
      data: {
        date,
        studentName,
        classLabel,
        minutesLate,
        comesFrom,
        studentId,
        recordedById: me.id,
        recordedByName: me.name,
      },
      select: { id: true },
    });
    id = created.id;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: `${studentName} энэ өдөр аль хэдийн бүртгэгдсэн байна.` };
    }
    throw err;
  }

  await flagRepeatLateness({ studentId, studentName, classLabel }, date);
  revalidateLateness();
  return { ok: true, data: { id }, message: `${studentName} (${classLabel}) бүртгэгдлээ.` };
}

/**
 * Tell the social worker (and admins) the moment a student crosses the
 * repeat threshold — exactly once per crossing, not on every later record.
 */
async function flagRepeatLateness(
  who: { studentId: string | null; studentName: string; classLabel: string },
  date: string,
) {
  const window = { gte: addDays(date, -(REPEAT_WINDOW_DAYS - 1)), lte: date };
  const rows = await prisma.lateArrival.findMany({
    where: who.studentId
      ? { date: window, studentId: who.studentId }
      : { date: window, classLabel: who.classLabel, studentId: null },
    select: { studentName: true },
  });
  const key = nameKey(who.studentName);
  const count = who.studentId ? rows.length : rows.filter((r) => nameKey(r.studentName) === key).length;
  if (count !== REPEAT_THRESHOLD) return;

  const recipients = await prisma.user.findMany({
    where: { OR: [{ position: SOCIAL_WORKER_POSITION }, { role: "ADMIN" }] },
    select: { id: true },
  });
  await notifyMany(
    recipients.map((r) => ({ actorKind: "user" as const, actorId: r.id })),
    {
      category: "system",
      title: `Давтан хоцролт: ${who.studentName} (${who.classLabel})`,
      body: `Сүүлийн ${REPEAT_WINDOW_DAYS} хоногт ${count} удаа хоцорлоо.`,
      href: "/dashboard/admin/lateness",
    },
  );
}

export async function deleteLate(id: string): Promise<Result> {
  const me = await getLateRecorder();
  if (!me) return { ok: false, error: "Зөвхөн нэвтэрсэн багш, ажилтан устгана." };

  const record = await prisma.lateArrival.findUnique({
    where: { id },
    select: { recordedById: true, studentName: true, classLabel: true, date: true },
  });
  if (!record) return { ok: false, error: "Бүртгэл олдсонгүй." };
  if (!canModify(me, record.recordedById)) {
    return { ok: false, error: "Зөвхөн бүртгэсэн багш эсвэл нийгмийн ажилтан устгана." };
  }

  await prisma.lateArrival.delete({ where: { id } });
  await logAudit({
    action: "lateness.delete",
    targetType: "LateArrival",
    targetId: id,
    metadata: { studentName: record.studentName, classLabel: record.classLabel, date: record.date },
  });
  revalidateLateness();
  return { ok: true, message: "Устгагдлаа." };
}

/** Autocomplete for the duty form: "Тэмүүлэн", "Б. Тэм", "2А-014". */
export async function searchStudents(query: string): Promise<StudentMatch[]> {
  if (!(await getLateRecorder())) return [];
  const q = cleanText(query, 40);
  if (q.length < 2) return [];

  const tokens = q.split(/[\s.]+/).filter(Boolean);
  const first = tokens.reduce((a, b) => (b.length > a.length ? b : a), "");
  const initial = tokens.find((t) => t !== first);

  const rows = await prisma.student.findMany({
    where: {
      OR: [
        { code: { startsWith: q, mode: "insensitive" } },
        {
          firstName: { contains: first, mode: "insensitive" },
          ...(initial ? { lastName: { startsWith: initial, mode: "insensitive" } } : {}),
        },
      ],
    },
    take: 8,
    orderBy: [{ firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      classroom: { select: { grade: true, section: true } },
      lateArrivals: { take: 1, orderBy: { date: "desc" }, select: { comesFrom: true } },
    },
  });

  return rows.map((s) => ({
    id: s.id,
    name: studentDisplayName(s.lastName, s.firstName),
    classLabel: classLabelFor(s.classroom.grade, s.classroom.section),
    lastComesFrom: s.lateArrivals[0]?.comesFrom ?? null,
  }));
}
