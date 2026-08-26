"use server";

import { prisma } from "@/lib/prisma";
import { hashPin } from "@/lib/session";
import { requireAdmin } from "@/lib/admin";
import { revalidatePath } from "next/cache";

export type Result<T = void> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = new Set(["TEACHER", "APPROVER", "ADMIN"]);

function revalidateAll() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/students");
  revalidatePath("/dashboard/admin/classrooms");
  revalidatePath("/dashboard/approver");
  revalidatePath("/dashboard/teacher");
  revalidatePath("/classes");
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/tour");
  revalidatePath("/quality");
  revalidatePath("/protection");
  revalidatePath("/news");
  revalidatePath("/contact");
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
  await requireAdmin();
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

// ── Classroom CRUD ──────────────────────────────────────────────

export async function createClassroom(input: {
  grade: number;
  section: string;
  label: string;
  headTeacher: string;
  room?: string;
  capacity?: number;
  studentCount?: number;
}): Promise<Result<{ id: string }>> {
  await requireAdmin();
  const grade = input.grade;
  const section = input.section.trim();
  const label = input.label.trim();
  const headTeacher = input.headTeacher.trim();
  const room = input.room?.trim() || null;
  const capacity = input.capacity ?? 32;
  const studentCount = input.studentCount ?? 0;

  if (!section) return { ok: false, error: "Ангийн тэмдэгт шаардлагатай." };
  if (!label) return { ok: false, error: "Ангийн нэр шаардлагатай." };
  if (!headTeacher) return { ok: false, error: "Ангийн багш багшийн нэр шаардлагатай." };
  if (grade < 1 || grade > 12) return { ok: false, error: "Анги 1-12 байх ёстой." };

  const exists = await prisma.classroom.findUnique({ where: { grade_section: { grade, section } } });
  if (exists) return { ok: false, error: `${grade}${section} анги аль хэдийн бүртгэгдсэн.` };

  const created = await prisma.classroom.create({
    data: { grade, section, label, headTeacher, room, capacity, studentCount },
    select: { id: true },
  });
  revalidateAll();
  return { ok: true, data: { id: created.id }, message: "Анги үүсгэлээ." };
}

export async function updateClassroom(
  id: string,
  input: {
    label?: string;
    headTeacher?: string;
    room?: string | null;
    capacity?: number;
    studentCount?: number;
    status?: string;
  },
): Promise<Result> {
  await requireAdmin();
  if (!id) return { ok: false, error: "ID шаардлагатай." };

  const data: Record<string, unknown> = {};
  if (input.label !== undefined) data.label = input.label.trim();
  if (input.headTeacher !== undefined) data.headTeacher = input.headTeacher.trim();
  if (input.room !== undefined) data.room = input.room?.trim() || null;
  if (input.capacity !== undefined) data.capacity = input.capacity;
  if (input.studentCount !== undefined) data.studentCount = input.studentCount;
  if (input.status !== undefined) data.status = input.status;

  await prisma.classroom.update({ where: { id }, data });
  revalidateAll();
  return { ok: true, message: "Хадгалагдлаа." };
}

export async function deleteClassroom(id: string): Promise<Result> {
  await requireAdmin();
  await prisma.classroom.delete({ where: { id } });
  revalidateAll();
  return { ok: true, message: "Анги устгагдлаа." };
}

// ── Student CRUD + Redistribute ──────────────────────────────

function normalizeSection(raw: string): string {
  return raw.trim().toUpperCase();
}

function sanitizeGender(raw: string): "M" | "F" | null {
  const g = raw.trim().toUpperCase();
  return g === "M" || g === "F" ? g : null;
}

export async function createStudent(input: {
  classroomId: string;
  firstName: string;
  lastName: string;
  gender: string;
  code?: string;
  attendance?: number;
  gpa?: number;
}): Promise<Result<{ id: string }>> {
  await requireAdmin();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const gender = sanitizeGender(input.gender);
  if (!firstName || !lastName) return { ok: false, error: "Нэр, овог шаардлагатай." };
  if (!gender) return { ok: false, error: "Хүйс M эсвэл F байна." };
  if (!input.classroomId) return { ok: false, error: "Анги шаардлагатай." };

  const classroom = await prisma.classroom.findUnique({ where: { id: input.classroomId } });
  if (!classroom) return { ok: false, error: "Анги олдсонгүй." };

  let code = input.code?.trim();
  if (!code) {
    const count = await prisma.student.count({ where: { classroomId: classroom.id } });
    code = `${classroom.grade}${classroom.section}-${String(count + 1).padStart(3, "0")}`;
  }

  const attendance = Math.max(0, Math.min(100, Math.round(input.attendance ?? 95)));
  const gpa = Math.max(0, Math.min(4, Number((input.gpa ?? 3.5).toFixed(2))));

  try {
    const created = await prisma.student.create({
      data: {
        code,
        firstName,
        lastName,
        gender,
        attendance,
        gpa,
        classroomId: classroom.id,
      },
      select: { id: true },
    });
    await prisma.classroom.update({
      where: { id: classroom.id },
      data: { studentCount: { increment: 1 } },
    });
    revalidateAll();
    return { ok: true, data: { id: created.id }, message: "Сурагч нэмэгдлээ." };
  } catch (err) {
    console.error("[createStudent]", err);
    return { ok: false, error: "Сурагч нэмэхэд алдаа гарлаа. Код давхардсан байж болзошгүй." };
  }
}

export async function updateStudent(
  id: string,
  input: {
    firstName?: string;
    lastName?: string;
    gender?: string;
    attendance?: number;
    gpa?: number;
    classroomId?: string;
    chosen?: boolean;
  },
): Promise<Result> {
  await requireAdmin();
  if (!id) return { ok: false, error: "ID шаардлагатай." };
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Сурагч олдсонгүй." };

  const data: Record<string, unknown> = {};
  if (input.firstName !== undefined) {
    const v = input.firstName.trim();
    if (!v) return { ok: false, error: "Нэр хоосон байж болохгүй." };
    data.firstName = v;
  }
  if (input.lastName !== undefined) {
    const v = input.lastName.trim();
    if (!v) return { ok: false, error: "Овог хоосон байж болохгүй." };
    data.lastName = v;
  }
  if (input.gender !== undefined) {
    const g = sanitizeGender(input.gender);
    if (!g) return { ok: false, error: "Хүйс M эсвэл F байна." };
    data.gender = g;
  }
  if (input.attendance !== undefined) {
    data.attendance = Math.max(0, Math.min(100, Math.round(input.attendance)));
  }
  if (input.gpa !== undefined) {
    data.gpa = Math.max(0, Math.min(4, Number(input.gpa.toFixed(2))));
  }
  if (input.chosen !== undefined) {
    data.chosen = !!input.chosen;
  }

  let moved = false;
  if (input.classroomId && input.classroomId !== existing.classroomId) {
    const target = await prisma.classroom.findUnique({ where: { id: input.classroomId } });
    if (!target) return { ok: false, error: "Шинэ анги олдсонгүй." };
    data.classroomId = target.id;
    moved = true;
  }

  await prisma.$transaction(async (tx) => {
    await tx.student.update({ where: { id }, data });
    if (moved) {
      await tx.classroom.update({
        where: { id: existing.classroomId },
        data: { studentCount: { decrement: 1 } },
      });
      await tx.classroom.update({
        where: { id: input.classroomId! },
        data: { studentCount: { increment: 1 } },
      });
    }
  });

  revalidateAll();
  return { ok: true, message: "Хадгалагдлаа." };
}

export async function deleteStudent(id: string): Promise<Result> {
  await requireAdmin();
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Сурагч олдсонгүй." };
  await prisma.$transaction(async (tx) => {
    await tx.student.delete({ where: { id } });
    await tx.classroom.update({
      where: { id: existing.classroomId },
      data: { studentCount: { decrement: 1 } },
    });
  });
  revalidateAll();
  return { ok: true, message: "Сурагч устгагдлаа." };
}

export async function setStudentChosen(
  id: string,
  chosen: boolean,
): Promise<Result> {
  await requireAdmin();
  await prisma.student.update({ where: { id }, data: { chosen: !!chosen } });
  revalidateAll();
  return { ok: true, message: chosen ? "Сонгосон болов." : "Сонголт цуцаллаа." };
}

export async function setStudentsChosenBulk(
  ids: string[],
  chosen: boolean,
): Promise<Result<{ count: number }>> {
  await requireAdmin();
  if (ids.length === 0) return { ok: true, data: { count: 0 } };
  const result = await prisma.student.updateMany({
    where: { id: { in: ids } },
    data: { chosen: !!chosen },
  });
  revalidateAll();
  return { ok: true, data: { count: result.count }, message: `${result.count} сурагч шинэчлэгдлээ.` };
}

export interface ImportStudentRow {
  firstName: string;
  lastName: string;
  gender?: string;
  attendance?: number;
  gpa?: number;
  code?: string;
  chosen?: boolean;
}

/**
 * Bulk import students into a single classroom (typically after admin uploads xlsx).
 * If a row's code matches an existing student in this classroom, it's updated; otherwise
 * a new record is created. Rows with the `chosen` flag will be marked accordingly.
 */
export async function importStudents(
  classroomId: string,
  rows: ImportStudentRow[],
  options?: { replace?: boolean },
): Promise<Result<{ inserted: number; updated: number }>> {
  await requireAdmin();
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom) return { ok: false, error: "Анги олдсонгүй." };

  const cleaned = rows
    .map((r, i) => {
      const firstName = String(r.firstName ?? "").trim();
      const lastName = String(r.lastName ?? "").trim();
      if (!firstName || !lastName) return null;
      const gender = sanitizeGender(String(r.gender ?? "")) ?? (i % 2 === 0 ? "F" : "M");
      const code = String(r.code ?? "").trim() ||
        `${classroom.grade}${classroom.section}-${String(i + 1).padStart(3, "0")}`;
      return {
        code,
        firstName,
        lastName,
        gender,
        attendance: Math.max(0, Math.min(100, Math.round(Number(r.attendance ?? 95)))),
        gpa: Math.max(0, Math.min(4, Number(Number(r.gpa ?? 3.5).toFixed(2)))),
        chosen: !!r.chosen,
        classroomId: classroom.id,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (cleaned.length === 0) {
    return { ok: false, error: "Импорт хийх сурагч олдсонгүй." };
  }

  let inserted = 0;
  let updated = 0;

  await prisma.$transaction(
    async (tx) => {
      if (options?.replace) {
        await tx.student.deleteMany({ where: { classroomId: classroom.id } });
      }
      for (const row of cleaned) {
        const existing = await tx.student.findUnique({ where: { code: row.code } });
        if (existing) {
          await tx.student.update({
            where: { code: row.code },
            data: {
              firstName: row.firstName,
              lastName: row.lastName,
              gender: row.gender,
              attendance: row.attendance,
              gpa: row.gpa,
              chosen: row.chosen,
              classroomId: row.classroomId,
            },
          });
          updated++;
        } else {
          await tx.student.create({ data: row });
          inserted++;
        }
      }
      const count = await tx.student.count({ where: { classroomId: classroom.id } });
      await tx.classroom.update({
        where: { id: classroom.id },
        data: { studentCount: count },
      });
    },
    { timeout: 30000, maxWait: 10000 },
  );

  revalidateAll();
  return {
    ok: true,
    data: { inserted, updated },
    message: `+${inserted} нэмэгдэж, ${updated} шинэчлэгдлээ.`,
  };
}

/**
 * Creates a brand-new section (grade, section, label) and moves N randomly-picked students
 * out of the OTHER sections of the same grade into it. Used to redistribute students when
 * opening an extra classroom mid-year.
 *
 * If `preferChosen` is true, all students marked chosen=true (from the source grade) are
 * pulled in first; the remaining slots are filled by random pick from the non-chosen pool.
 */
export async function createSectionFromPool(input: {
  grade: number;
  section: string;
  label: string;
  headTeacher: string;
  room?: string;
  capacity?: number;
  pickCount: number;
  preferChosen?: boolean;
}): Promise<Result<{ classroomId: string; movedCount: number; chosenIncluded: number }>> {
  await requireAdmin();
  const grade = input.grade;
  const section = normalizeSection(input.section);
  const label = input.label.trim();
  const headTeacher = input.headTeacher.trim();
  const room = input.room?.trim() || null;
  const capacity = input.capacity ?? 32;
  const pickCount = Math.max(1, Math.min(60, Math.floor(input.pickCount)));

  if (grade < 1 || grade > 12) return { ok: false, error: "Анги 1-12 байх ёстой." };
  if (!section) return { ok: false, error: "Бүлгийн тэмдэгт шаардлагатай." };
  if (!label) return { ok: false, error: "Ангийн нэр шаардлагатай." };
  if (!headTeacher) return { ok: false, error: "Ангийн багш шаардлагатай." };

  const dup = await prisma.classroom.findUnique({
    where: { grade_section: { grade, section } },
  });
  if (dup) return { ok: false, error: `${grade}${section} анги аль хэдийн бүртгэгдсэн.` };

  const pool = await prisma.student.findMany({
    where: { classroom: { grade } },
  });
  if (pool.length === 0) {
    return { ok: false, error: `${grade}-р ангийн бусад бүлэгт сурагч байхгүй байна.` };
  }
  if (pickCount > pool.length) {
    return {
      ok: false,
      error: `Хамгийн ихдээ ${pool.length} сурагч татаж болно.`,
    };
  }

  function shuffleInPlace<T>(arr: T[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
  }

  let picked: typeof pool;
  let chosenIncluded = 0;

  if (input.preferChosen) {
    // "Trick for parents": chosen kids are pulled in first (shuffled among themselves so
    // sibling order isn't obvious), then random pick fills the rest.
    const chosenPool = pool.filter((s) => s.chosen);
    const otherPool = pool.filter((s) => !s.chosen);
    shuffleInPlace(chosenPool);
    shuffleInPlace(otherPool);
    const chosenTake = Math.min(chosenPool.length, pickCount);
    picked = [
      ...chosenPool.slice(0, chosenTake),
      ...otherPool.slice(0, pickCount - chosenTake),
    ];
    chosenIncluded = chosenTake;
    // Re-shuffle final list so the roster doesn't reveal chosen came first
    shuffleInPlace(picked);
  } else {
    const shuffled = [...pool];
    shuffleInPlace(shuffled);
    picked = shuffled.slice(0, pickCount);
    chosenIncluded = picked.filter((s) => s.chosen).length;
  }

  // Track how many leave each source classroom so we can update counts
  // Group picked students by their source classroom so we can do one UPDATE per
  // source instead of N individual updates. This keeps the transaction short
  // enough to fit inside Prisma's default 5s interactive-transaction budget.
  const bySource = new Map<string, string[]>();
  for (const s of picked) {
    const arr = bySource.get(s.classroomId) ?? [];
    arr.push(s.id);
    bySource.set(s.classroomId, arr);
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const created = await tx.classroom.create({
        data: {
          grade,
          section,
          label,
          headTeacher,
          room,
          capacity,
          studentCount: picked.length,
          status: "draft",
        },
        select: { id: true },
      });

      // One updateMany per source classroom (typically 3-5 iterations regardless
      // of how many students are being moved). Sets previousClassroomId so
      // revertSection() can send them back.
      for (const [srcId, ids] of bySource) {
        await tx.student.updateMany({
          where: { id: { in: ids } },
          data: {
            classroomId: created.id,
            previousClassroomId: srcId,
          },
        });
        await tx.classroom.update({
          where: { id: srcId },
          data: { studentCount: { decrement: ids.length } },
        });
      }

      return { classroomId: created.id };
    },
    { timeout: 20000, maxWait: 10000 },
  );

  revalidateAll();
  return {
    ok: true,
    data: {
      classroomId: result.classroomId,
      movedCount: picked.length,
      chosenIncluded,
    },
    message: `${picked.length} сурагчийг ${label} руу шилжүүлэв.`,
  };
}

/**
 * Undo a previously-created section: every student that was moved into this classroom
 * (i.e. has previousClassroomId set) is sent back to their prior classroom, then the
 * now-empty classroom is deleted.
 *
 * Any students that were manually added to this classroom afterwards (previousClassroomId
 * is null) block the revert — the admin must delete or move them first.
 */
export async function revertSection(
  classroomId: string,
): Promise<Result<{ returnedCount: number }>> {
  await requireAdmin();
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    include: { students: true },
  });
  if (!classroom) return { ok: false, error: "Анги олдсонгүй." };

  const orphans = classroom.students.filter((s) => !s.previousClassroomId);
  if (orphans.length > 0) {
    return {
      ok: false,
      error: `${orphans.length} сурагч энэ бүлэгт шинээр нэмэгдсэн байна. Тэднийг эхлээд устгаж/шилжүүлж, дараа нь буцаана уу.`,
    };
  }

  const returning = classroom.students.filter((s) => s.previousClassroomId);
  if (returning.length === 0) {
    // Empty classroom — just delete it
    await prisma.classroom.delete({ where: { id: classroom.id } });
    revalidateAll();
    return { ok: true, data: { returnedCount: 0 }, message: "Хоосон бүлэг устгагдлаа." };
  }

  // Group returning students by destination (previousClassroomId) so we can
  // do one updateMany per source rather than N per-student updates.
  const bySource = new Map<string, string[]>();
  for (const s of returning) {
    const arr = bySource.get(s.previousClassroomId!) ?? [];
    arr.push(s.id);
    bySource.set(s.previousClassroomId!, arr);
  }

  await prisma.$transaction(
    async (tx) => {
      for (const [srcId, ids] of bySource) {
        await tx.student.updateMany({
          where: { id: { in: ids } },
          data: {
            classroomId: srcId,
            previousClassroomId: null,
          },
        });
        await tx.classroom.update({
          where: { id: srcId },
          data: { studentCount: { increment: ids.length } },
        });
      }
      // Delete the now-empty classroom
      await tx.classroom.delete({ where: { id: classroom.id } });
    },
    { timeout: 20000, maxWait: 10000 },
  );

  revalidateAll();
  return {
    ok: true,
    data: { returnedCount: returning.length },
    message: `${classroom.label} буцаагдаж, ${returning.length} сурагч анхны бүлэгтээ буцлаа.`,
  };
}

// ── Announcement CRUD ─────────────────────────────────────────

export async function createAnnouncement(input: { text: string; order?: number }): Promise<Result<{ id: string }>> {
  await requireAdmin();
  const text = input.text.trim();
  if (!text) return { ok: false, error: "Мэдээлэл шаардлагатай." };
  const created = await prisma.announcement.create({
    data: { text, order: input.order ?? 0 },
    select: { id: true },
  });
  revalidateAll();
  return { ok: true, data: { id: created.id }, message: "Зарлал үүсгэлээ." };
}

export async function updateAnnouncement(id: string, input: { text?: string; order?: number; active?: boolean }): Promise<Result> {
  await requireAdmin();
  if (!id) return { ok: false, error: "ID шаардлагатай." };
  const data: Record<string, unknown> = {};
  if (input.text !== undefined) data.text = input.text.trim();
  if (input.order !== undefined) data.order = input.order;
  if (input.active !== undefined) data.active = input.active;
  await prisma.announcement.update({ where: { id }, data });
  revalidateAll();
  return { ok: true, message: "Хадгалагдлаа." };
}

export async function deleteAnnouncement(id: string): Promise<Result> {
  await requireAdmin();
  await prisma.announcement.delete({ where: { id } });
  revalidateAll();
  return { ok: true, message: "Зарлал устгагдлаа." };
}

// ── News CRUD ─────────────────────────────────────────────────

export async function createNewsItem(input: { tag: string; title: string; excerpt: string; date?: string }): Promise<Result<{ id: string }>> {
  await requireAdmin();
  const tag = input.tag.trim();
  const title = input.title.trim();
  const excerpt = input.excerpt.trim();
  if (!tag || !title) return { ok: false, error: "Таг, гарчиг шаардлагатай." };
  const created = await prisma.newsItem.create({
    data: { tag, title, excerpt, date: input.date ? new Date(input.date) : new Date(), order: 0 },
    select: { id: true },
  });
  revalidateAll();
  return { ok: true, data: { id: created.id }, message: "Мэдээ үүсгэлээ." };
}

export async function updateNewsItem(id: string, input: { tag?: string; title?: string; excerpt?: string }): Promise<Result> {
  await requireAdmin();
  if (!id) return { ok: false, error: "ID шаардлагатай." };
  const data: Record<string, unknown> = {};
  if (input.tag !== undefined) data.tag = input.tag.trim();
  if (input.title !== undefined) data.title = input.title.trim();
  if (input.excerpt !== undefined) data.excerpt = input.excerpt.trim();
  await prisma.newsItem.update({ where: { id }, data });
  revalidateAll();
  return { ok: true, message: "Хадгалагдлаа." };
}

export async function deleteNewsItem(id: string): Promise<Result> {
  await requireAdmin();
  await prisma.newsItem.delete({ where: { id } });
  revalidateAll();
  return { ok: true, message: "Мэдээ устгагдлаа." };
}

// ── Tour Room CRUD ────────────────────────────────────────────

export async function createTourRoom(input: { slug: string; label: string; subtitle: string; description: string; icon: string; panoramaUrl?: string | null }): Promise<Result<{ id: string }>> {
  await requireAdmin();
  const slug = input.slug.trim();
  const label = input.label.trim();
  if (!slug || !label) return { ok: false, error: "Slug, нэр шаардлагатай." };
  const exists = await prisma.tourRoom.findUnique({ where: { slug } });
  if (exists) return { ok: false, error: "Энэ slug аль хэдийн бүртгэгдсэн." };
  const maxOrder = await prisma.tourRoom.aggregate({ _max: { order: true } });
  const created = await prisma.tourRoom.create({
    data: { slug, label, subtitle: input.subtitle.trim(), description: input.description.trim(), icon: input.icon.trim(), panoramaUrl: input.panoramaUrl?.trim() || null, order: (maxOrder._max.order ?? -1) + 1 },
    select: { id: true },
  });
  revalidateAll();
  return { ok: true, data: { id: created.id }, message: "Зогсолол үүсгэлээ." };
}

export async function updateTourRoom(id: string, input: { label?: string; subtitle?: string; description?: string; icon?: string; panoramaUrl?: string | null }): Promise<Result> {
  await requireAdmin();
  if (!id) return { ok: false, error: "ID шаардлагатай." };
  const data: Record<string, unknown> = {};
  if (input.label !== undefined) data.label = input.label.trim();
  if (input.subtitle !== undefined) data.subtitle = input.subtitle.trim();
  if (input.description !== undefined) data.description = input.description.trim();
  if (input.icon !== undefined) data.icon = input.icon.trim();
  if (input.panoramaUrl !== undefined) data.panoramaUrl = input.panoramaUrl?.trim() || null;
  await prisma.tourRoom.update({ where: { id }, data });
  revalidateAll();
  return { ok: true, message: "Хадгалагдлаа." };
}

export async function deleteTourRoom(id: string): Promise<Result> {
  await requireAdmin();
  await prisma.tourRoom.delete({ where: { id } });
  revalidateAll();
  return { ok: true, message: "Зогсолол устгагдлаа." };
}

// ── Gallery CRUD ─────────────────────────────────────────────
export async function createGalleryImage(input: { title: string; url: string; category?: string }): Promise<Result<{ id: string }>> {
  await requireAdmin();
  const title = input.title.trim(); const url = input.url.trim();
  if (!title || !url) return { ok: false, error: "Нэр, URL шаардлагатай." };
  const maxOrder = await prisma.galleryImage.aggregate({ _max: { order: true } });
  const created = await prisma.galleryImage.create({ data: { title, url, category: input.category ?? "general", order: (maxOrder._max.order ?? -1) + 1 }, select: { id: true } });
  revalidateAll();
  return { ok: true, data: { id: created.id }, message: "Зураг нэмэгдлээ." };
}
export async function updateGalleryImage(id: string, input: { title?: string; category?: string }): Promise<Result> {
  await requireAdmin(); if (!id) return { ok: false, error: "ID шаардлагатай." };
  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title.trim();
  if (input.category !== undefined) data.category = input.category;
  await prisma.galleryImage.update({ where: { id }, data }); revalidateAll();
  return { ok: true, message: "Хадгалагдлаа." };
}
export async function deleteGalleryImage(id: string): Promise<Result> {
  await requireAdmin(); await prisma.galleryImage.delete({ where: { id } }); revalidateAll();
  return { ok: true, message: "Зураг устгагдлаа." };
}

// ── Achievement CRUD ─────────────────────────────────────────
export async function createAchievement(input: { name: string; grade?: string; award: string; year: number; category?: string; image?: string }): Promise<Result<{ id: string }>> {
  await requireAdmin(); const name = input.name.trim(); const award = input.award.trim();
  if (!name || !award) return { ok: false, error: "Нэр, шагнал шаардлагатай." };
  const created = await prisma.achievement.create({ data: { name, grade: input.grade?.trim() || null, award, year: input.year, category: input.category ?? "olimpiad", image: input.image || null, order: 0 }, select: { id: true } });
  revalidateAll();
  return { ok: true, data: { id: created.id }, message: "Амжилт нэмэгдлээ." };
}
export async function updateAchievement(id: string, input: { name?: string; grade?: string; award?: string; year?: number; category?: string; image?: string }): Promise<Result> {
  await requireAdmin(); if (!id) return { ok: false, error: "ID шаардлагатай." };
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.grade !== undefined) data.grade = input.grade?.trim() || null;
  if (input.award !== undefined) data.award = input.award.trim();
  if (input.year !== undefined) data.year = input.year;
  if (input.category !== undefined) data.category = input.category;
  if (input.image !== undefined) data.image = input.image || null;
  await prisma.achievement.update({ where: { id }, data }); revalidateAll();
  return { ok: true, message: "Хадгалагдлаа." };
}
export async function deleteAchievement(id: string): Promise<Result> {
  await requireAdmin(); await prisma.achievement.delete({ where: { id } }); revalidateAll();
  return { ok: true, message: "Амжилт устгагдлаа." };
}

// ── FAQ CRUD ─────────────────────────────────────────────────
export async function createFaq(input: { question: string; answer: string }): Promise<Result<{ id: string }>> {
  await requireAdmin(); const question = input.question.trim(); const answer = input.answer.trim();
  if (!question || !answer) return { ok: false, error: "Асуулт, хариулт шаардлагатай." };
  const maxOrder = await prisma.faq.aggregate({ _max: { order: true } });
  const created = await prisma.faq.create({ data: { question, answer, order: (maxOrder._max.order ?? -1) + 1 }, select: { id: true } });
  revalidateAll();
  return { ok: true, data: { id: created.id }, message: "Асуулт нэмэгдлээ." };
}
export async function updateFaq(id: string, input: { question?: string; answer?: string }): Promise<Result> {
  await requireAdmin(); if (!id) return { ok: false, error: "ID шаардлагатай." };
  const data: Record<string, unknown> = {};
  if (input.question !== undefined) data.question = input.question.trim();
  if (input.answer !== undefined) data.answer = input.answer.trim();
  await prisma.faq.update({ where: { id }, data }); revalidateAll();
  return { ok: true, message: "Хадгалагдлаа." };
}
export async function deleteFaq(id: string): Promise<Result> {
  await requireAdmin(); await prisma.faq.delete({ where: { id } }); revalidateAll();
  return { ok: true, message: "Асуулт устгагдлаа." };
}

// ── Event CRUD ───────────────────────────────────────────────
export async function createEvent(input: { title: string; date: string; time?: string; location?: string; description: string; type?: string }): Promise<Result<{ id: string }>> {
  await requireAdmin(); const title = input.title.trim();
  if (!title) return { ok: false, error: "Нэр шаардлагатай." };
  const created = await prisma.event.create({ data: { title, date: new Date(input.date), time: input.time?.trim() || null, location: input.location?.trim() || null, description: input.description.trim(), type: input.type ?? "school", order: 0 }, select: { id: true } });
  revalidateAll();
  return { ok: true, data: { id: created.id }, message: "Үйл явдал нэмэгдлээ." };
}
export async function updateEvent(id: string, input: { title?: string; date?: string; time?: string; location?: string; description?: string; type?: string }): Promise<Result> {
  await requireAdmin(); if (!id) return { ok: false, error: "ID шаардлагатай." };
  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title.trim();
  if (input.date !== undefined) data.date = new Date(input.date);
  if (input.time !== undefined) data.time = input.time?.trim() || null;
  if (input.location !== undefined) data.location = input.location?.trim() || null;
  if (input.description !== undefined) data.description = input.description.trim();
  if (input.type !== undefined) data.type = input.type;
  await prisma.event.update({ where: { id }, data }); revalidateAll();
  return { ok: true, message: "Хадгалагдлаа." };
}
export async function deleteEvent(id: string): Promise<Result> {
  await requireAdmin(); await prisma.event.delete({ where: { id } }); revalidateAll();
  return { ok: true, message: "Үйл явдал устгагдлаа." };
}

// ── Testimonial CRUD ─────────────────────────────────────────
export async function createTestimonial(input: { name: string; role: string; text: string; rating?: number }): Promise<Result<{ id: string }>> {
  await requireAdmin(); const name = input.name.trim(); const text = input.text.trim();
  if (!name || !text) return { ok: false, error: "Нэр, сэтгэгдэл шаардлагатай." };
  const maxOrder = await prisma.testimonial.aggregate({ _max: { order: true } });
  const created = await prisma.testimonial.create({ data: { name, role: input.role.trim(), text, rating: input.rating ?? 5, order: (maxOrder._max.order ?? -1) + 1 }, select: { id: true } });
  revalidateAll();
  return { ok: true, data: { id: created.id }, message: "Сэтгэгдэл нэмэгдлээ." };
}
export async function updateTestimonial(id: string, input: { name?: string; role?: string; text?: string; rating?: number }): Promise<Result> {
  await requireAdmin(); if (!id) return { ok: false, error: "ID шаардлагатай." };
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.role !== undefined) data.role = input.role.trim();
  if (input.text !== undefined) data.text = input.text.trim();
  if (input.rating !== undefined) data.rating = input.rating;
  await prisma.testimonial.update({ where: { id }, data }); revalidateAll();
  return { ok: true, message: "Хадгалагдлаа." };
}
export async function deleteTestimonial(id: string): Promise<Result> {
  await requireAdmin(); await prisma.testimonial.delete({ where: { id } }); revalidateAll();
  return { ok: true, message: "Сэтгэгдэл устгагдлаа." };
}

// ── Club CRUD ────────────────────────────────────────────────
export async function createClub(input: { name: string; description: string; teacher?: string; schedule?: string; icon?: string }): Promise<Result<{ id: string }>> {
  await requireAdmin(); const name = input.name.trim();
  if (!name) return { ok: false, error: "Нэр шаардлагатай." };
  const maxOrder = await prisma.club.aggregate({ _max: { order: true } });
  const created = await prisma.club.create({ data: { name, description: input.description.trim(), teacher: input.teacher?.trim() || null, schedule: input.schedule?.trim() || null, icon: input.icon?.trim() || null, order: (maxOrder._max.order ?? -1) + 1 }, select: { id: true } });
  revalidateAll();
  return { ok: true, data: { id: created.id }, message: "Дугуйлан нэмэгдлээ." };
}
export async function updateClub(id: string, input: { name?: string; description?: string; teacher?: string; schedule?: string; icon?: string }): Promise<Result> {
  await requireAdmin(); if (!id) return { ok: false, error: "ID шаардлагатай." };
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.description !== undefined) data.description = input.description.trim();
  if (input.teacher !== undefined) data.teacher = input.teacher?.trim() || null;
  if (input.schedule !== undefined) data.schedule = input.schedule?.trim() || null;
  if (input.icon !== undefined) data.icon = input.icon?.trim() || null;
  await prisma.club.update({ where: { id }, data }); revalidateAll();
  return { ok: true, message: "Хадгалагдлаа." };
}
export async function deleteClub(id: string): Promise<Result> {
  await requireAdmin(); await prisma.club.delete({ where: { id } }); revalidateAll();
  return { ok: true, message: "Дугуйлан устгагдлаа." };
}
