"use server";

import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPin } from "@/lib/session";
import { ensureAdmin } from "@/lib/admin";
import { logAudit } from "@/lib/audit";
import { sanitizeRichHtml } from "@/lib/sanitize";
import { notifyEveryone } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

/**
 * Turn a title into a URL-friendly slug. Cyrillic-aware transliteration
 * so a title like "Хичээлийн шинэ жил" becomes "hicheeliin-shine-jil"
 * rather than an empty string.
 */
function slugify(input: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "ye", ё: "yo",
    ж: "j", з: "z", и: "i", й: "i", к: "k", л: "l", м: "m",
    н: "n", о: "o", ө: "o", п: "p", р: "r", с: "s", т: "t",
    у: "u", ү: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
    щ: "sh", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  const lower = input.toLowerCase();
  let out = "";
  for (const ch of lower) {
    if (map[ch] !== undefined) out += map[ch];
    else if (/[a-z0-9]/.test(ch)) out += ch;
    else out += "-";
  }
  return out
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "news";
}

/**
 * Return a slug that is guaranteed unique in the NewsItem table.
 * If the desired slug already exists, appends `-2`, `-3`, … .
 */
async function ensureUniqueNewsSlug(desired: string, excludeId?: string): Promise<string> {
  const base = slugify(desired);
  let candidate = base;
  let counter = 2;
  // Cap the retry loop — collisions are cheap but pathological titles
  // shouldn't be able to spin forever.
  while (counter < 20) {
    const existing = await prisma.newsItem.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${counter}`;
    counter++;
  }
  // Very unlikely fallback — random suffix.
  return `${base}-${crypto.randomBytes(3).toString("hex")}`;
}

function randomPin4(): string {
  return String(crypto.randomInt(0, 10000)).padStart(4, "0");
}

export type Result<T = void> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = new Set(["TEACHER", "APPROVER", "ADMIN"]);

/** True when a Prisma operation failed because the target record no longer exists. */
function isNotFound(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025"
  );
}

/** Wrap a mutation so missing-record errors become clean Result errors instead of 500s. */
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

// Targeted revalidation helpers — the old `revalidateAll()` flushed 12
// unrelated paths on every mutation. Each helper below only invalidates
// pages that actually depend on the changed model.

function revalidateUsers() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin/codes");
  revalidatePath("/dashboard/teacher");
  revalidatePath("/login");
}

function revalidateSignatures() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/signatures");
  revalidatePath("/dashboard/teacher");
  revalidatePath("/dashboard/accountant");
}

function revalidateClassrooms() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/classrooms");
  revalidatePath("/dashboard/admin/students");
  revalidatePath("/classes");
  revalidatePath("/");
}

function revalidateContent(kind:
  | "announcements"
  | "news"
  | "tour"
  | "gallery"
  | "achievements"
  | "faq"
  | "events"
  | "testimonials"
  | "clubs"
) {
  revalidatePath("/dashboard/admin");
  switch (kind) {
    case "announcements":
      revalidatePath("/");
      break;
    case "news":
      revalidatePath("/");
      revalidatePath("/news");
      break;
    case "tour":
      revalidatePath("/tour");
      break;
    case "gallery":
      revalidatePath("/");
      revalidatePath("/dashboard/admin/gallery");
      break;
    case "achievements":
      revalidatePath("/");
      revalidatePath("/dashboard/admin/achievements");
      break;
    case "faq":
      revalidatePath("/");
      revalidatePath("/dashboard/admin/faq");
      break;
    case "events":
      revalidatePath("/");
      revalidatePath("/dashboard/admin/events");
      break;
    case "testimonials":
      revalidatePath("/");
      revalidatePath("/dashboard/admin/testimonials");
      break;
    case "clubs":
      revalidatePath("/");
      break;
  }
}

export async function createUser(input: {
  name: string;
  position: string;
  role: string;
  email?: string | null;
  pin?: string;
}): Promise<Result<{ id: string }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
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

  await logAudit({ action: "user.create", targetType: "user", targetId: created.id, metadata: { name, role, position } });
  revalidateUsers();
  return { ok: true, data: { id: created.id }, message: "Хэрэглэгч үүсгэлээ." };
}

export async function updateUser(
  id: string,
  input: { name?: string; position?: string; role?: string; email?: string | null },
): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
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

  const res = await guardNotFound("Хэрэглэгч олдсонгүй.", () =>
    prisma.user.update({ where: { id }, data }),
  );
  if (!res.ok) return res;
  await logAudit({ action: "user.update", targetType: "user", targetId: id, metadata: data });
  revalidateUsers();
  return { ok: true, message: "Хадгалагдлаа." };
}

export async function deleteUser(
  id: string,
  options?: { confirmCascade?: boolean },
): Promise<Result<{ cascadedSignatures?: number }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      name: true,
      role: true,
      _count: { select: { managedSignatures: true, signatures: true } },
    },
  });
  if (!target) return { ok: false, error: "Хэрэглэгч олдсонгүй." };
  if (target.role === "ADMIN") {
    return { ok: false, error: "Админ хэрэглэгчийг устгах боломжгүй." };
  }

  // Deleting an APPROVER cascades their signatures — teachers who relied on
  // those signatures for completion status silently drop back to incomplete.
  // Require an explicit second confirmation with the affected count.
  const cascaded = target._count.managedSignatures;
  if (target.role === "APPROVER" && cascaded > 0 && !options?.confirmCascade) {
    return {
      ok: false,
      error: `Энэ баталгаажуулагч ${cascaded} багшид гарын үсэг зурсан байна. Устгавал тэдгээр гарын үсэг мөн устана. Баталгаажуулж дахин дарна уу.`,
    };
  }

  const res = await guardNotFound("Хэрэглэгч олдсонгүй.", () =>
    prisma.user.delete({ where: { id } }),
  );
  if (!res.ok) return res;
  await logAudit({
    action: "user.delete",
    targetType: "user",
    targetId: id,
    metadata: { name: target.name, role: target.role, cascadedSignatures: cascaded },
  });
  revalidateUsers();
  if (target.role === "APPROVER") revalidateSignatures();
  return {
    ok: true,
    data: { cascadedSignatures: cascaded },
    message:
      cascaded > 0
        ? `Хэрэглэгч устгагдаж, ${cascaded} гарын үсэг цуцлагдлаа.`
        : "Хэрэглэгч устгагдлаа.",
  };
}

export async function resetUserPin(
  id: string,
  newPin: string = "0000",
): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const pin = newPin.trim();
  if (pin.length < 4 || pin.length > 8) {
    return { ok: false, error: "PIN 4-8 тэмдэгт байх ёстой." };
  }
  // Block resetting an admin's PIN from this page, same as regenerateTeacherPin.
  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });
  if (!target) return { ok: false, error: "Хэрэглэгч олдсонгүй." };
  if (target.role === "ADMIN") {
    return { ok: false, error: "Админы PIN-ийг энэ хуудаснаас reset хийх боломжгүй." };
  }

  const hashed = await hashPin(pin);
  await prisma.user.update({ where: { id }, data: { pin: hashed } });
  await logAudit({ action: "user.reset_pin", targetType: "user", targetId: id });
  revalidateUsers();
  return { ok: true, message: `PIN ${pin} болж шинэчлэгдлээ.` };
}

export async function resetAllPins(newPin: string = "0000"): Promise<Result<{ count: number }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const pin = newPin.trim();
  if (pin.length < 4 || pin.length > 8) {
    return { ok: false, error: "PIN 4-8 тэмдэгт байх ёстой." };
  }
  const hashed = await hashPin(pin);
  const result = await prisma.user.updateMany({
    where: { role: { not: "ADMIN" } },
    data: { pin: hashed },
  });
  await logAudit({ action: "user.reset_all_pins", metadata: { count: result.count } });
  revalidateUsers();
  return { ok: true, data: { count: result.count }, message: `${result.count} хэрэглэгчийн PIN шинэчлэгдлээ.` };
}

/**
 * Generate a random 4-digit PIN for one teacher, hash it, and return the
 * plaintext ONCE so the admin can hand it over. After this call, the plaintext
 * is unrecoverable — only the bcrypt hash is stored.
 */
export async function regenerateTeacherPin(
  id: string,
): Promise<Result<{ plainPin: string; name: string }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  if (!id) return { ok: false, error: "ID шаардлагатай." };
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, role: true },
  });
  if (!user) return { ok: false, error: "Хэрэглэгч олдсонгүй." };
  if (user.role === "ADMIN") {
    return { ok: false, error: "Админы PIN-ийг энэ хуудаснаас reset хийх боломжгүй." };
  }

  const plainPin = randomPin4();
  const hashed = await hashPin(plainPin);
  await prisma.user.update({ where: { id }, data: { pin: hashed } });
  await logAudit({ action: "user.regen_pin", targetType: "user", targetId: id });
  revalidateUsers();
  return {
    ok: true,
    data: { plainPin, name: user.name },
    message: `${user.name}-ийн PIN шинэчлэгдлээ.`,
  };
}

/**
 * Regenerate PINs for ALL non-admin users at once. Returns each user's new
 * plaintext PIN so the admin can print a distribution sheet. Plaintext is
 * NOT stored — only the bcrypt hashes.
 *
 * All updates run inside a single transaction so a mid-loop failure doesn't
 * leave half the staff with new PINs the admin never saw.
 */
export async function regenerateAllTeacherPins(): Promise<
  Result<{ items: Array<{ id: string; name: string; position: string; plainPin: string }> }>
> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const users = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: { id: true, name: true, position: true },
  });

  // Hash outside the transaction (bcrypt is slow; keeping it out of the txn
  // avoids the pool sitting idle while we compute hashes).
  const prepared = await Promise.all(
    users.map(async (u) => {
      const plainPin = randomPin4();
      const hashed = await hashPin(plainPin);
      return { id: u.id, name: u.name, position: u.position, plainPin, hashed };
    }),
  );

  await prisma.$transaction(
    async (tx) => {
      for (const p of prepared) {
        await tx.user.update({ where: { id: p.id }, data: { pin: p.hashed } });
      }
    },
    { timeout: 60_000, maxWait: 10_000 },
  );

  const items = prepared.map(({ hashed: _hashed, ...rest }) => rest);
  await logAudit({ action: "user.regen_all_pins", metadata: { count: items.length } });
  revalidateUsers();
  return {
    ok: true,
    data: { items },
    message: `${items.length} хэрэглэгчийн PIN шинэчлэгдлээ.`,
  };
}

export async function deleteSignature(id: string): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const res = await guardNotFound("Гарын үсэг олдсонгүй.", () =>
    prisma.signature.delete({ where: { id } }),
  );
  if (!res.ok) return res;
  await logAudit({ action: "signature.delete", targetType: "signature", targetId: id });
  revalidateSignatures();
  return { ok: true, message: "Гарын үсэг устгагдлаа." };
}

export async function clearAllSignatures(): Promise<Result<{ count: number }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const result = await prisma.signature.deleteMany({});
  await logAudit({ action: "signature.clear_all", metadata: { count: result.count } });
  revalidateSignatures();
  return { ok: true, data: { count: result.count }, message: `${result.count} гарын үсэг устгагдлаа.` };
}

export async function clearTeacherSignatures(teacherId: string): Promise<Result<{ count: number }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const result = await prisma.signature.deleteMany({ where: { teacherId } });
  await logAudit({ action: "signature.clear_for_teacher", targetType: "user", targetId: teacherId, metadata: { count: result.count } });
  revalidateSignatures();
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
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const grade = input.grade;
  const section = input.section.trim();
  const label = input.label.trim();
  const headTeacher = input.headTeacher.trim();
  const room = input.room?.trim() || null;
  const capacity = input.capacity ?? 32;
  const studentCount = input.studentCount ?? 0;

  if (!section) return { ok: false, error: "Ангийн тэмдэгт шаардлагатай." };
  if (!label) return { ok: false, error: "Ангийн нэр шаардлагатай." };
  if (!headTeacher) return { ok: false, error: "Ангийн багшийн нэр шаардлагатай." };
  if (!Number.isInteger(grade) || grade < 1 || grade > 12) {
    return { ok: false, error: "Анги 1-12 байх ёстой." };
  }

  const exists = await prisma.classroom.findUnique({ where: { grade_section: { grade, section } } });
  if (exists) return { ok: false, error: `${grade}${section} анги аль хэдийн бүртгэгдсэн.` };

  const created = await prisma.classroom.create({
    data: { grade, section, label, headTeacher, room, capacity, studentCount },
    select: { id: true },
  });
  await logAudit({ action: "classroom.create", targetType: "classroom", targetId: created.id, metadata: { grade, section, label } });
  revalidateClassrooms();
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
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  if (!id) return { ok: false, error: "ID шаардлагатай." };

  const data: Record<string, unknown> = {};
  if (input.label !== undefined) data.label = input.label.trim();
  if (input.headTeacher !== undefined) data.headTeacher = input.headTeacher.trim();
  if (input.room !== undefined) data.room = input.room?.trim() || null;
  if (input.capacity !== undefined) data.capacity = input.capacity;
  if (input.studentCount !== undefined) data.studentCount = input.studentCount;
  if (input.status !== undefined) data.status = input.status;

  const res = await guardNotFound("Анги олдсонгүй.", () =>
    prisma.classroom.update({ where: { id }, data }),
  );
  if (!res.ok) return res;
  await logAudit({ action: "classroom.update", targetType: "classroom", targetId: id, metadata: data });
  revalidateClassrooms();
  return { ok: true, message: "Хадгалагдлаа." };
}

export async function deleteClassroom(id: string): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const res = await guardNotFound("Анги олдсонгүй.", () =>
    prisma.classroom.delete({ where: { id } }),
  );
  if (!res.ok) return res;
  await logAudit({ action: "classroom.delete", targetType: "classroom", targetId: id });
  revalidateClassrooms();
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
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
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
    // Wrap create + count increment together so a mid-write failure cannot
    // leave `Classroom.studentCount` drifting out of sync with actual rows.
    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.student.create({
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
      await tx.classroom.update({
        where: { id: classroom.id },
        data: { studentCount: { increment: 1 } },
      });
      return row;
    });
    await logAudit({ action: "student.create", targetType: "student", targetId: created.id, metadata: { classroomId: classroom.id, code } });
    revalidateClassrooms();
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
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
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

  await logAudit({ action: "student.update", targetType: "student", targetId: id, metadata: { moved } });
  revalidateClassrooms();
  return { ok: true, message: "Хадгалагдлаа." };
}

export async function deleteStudent(id: string): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Сурагч олдсонгүй." };
  await prisma.$transaction(async (tx) => {
    await tx.student.delete({ where: { id } });
    await tx.classroom.update({
      where: { id: existing.classroomId },
      data: { studentCount: { decrement: 1 } },
    });
  });
  await logAudit({ action: "student.delete", targetType: "student", targetId: id, metadata: { code: existing.code } });
  revalidateClassrooms();
  return { ok: true, message: "Сурагч устгагдлаа." };
}

export async function setStudentChosen(
  id: string,
  chosen: boolean,
): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const res = await guardNotFound("Сурагч олдсонгүй.", () =>
    prisma.student.update({ where: { id }, data: { chosen: !!chosen } }),
  );
  if (!res.ok) return res;
  revalidateClassrooms();
  return { ok: true, message: chosen ? "Сонгосон болов." : "Сонголт цуцаллаа." };
}

export async function setStudentsChosenBulk(
  ids: string[],
  chosen: boolean,
): Promise<Result<{ count: number }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  if (ids.length === 0) return { ok: true, data: { count: 0 } };
  const result = await prisma.student.updateMany({
    where: { id: { in: ids } },
    data: { chosen: !!chosen },
  });
  revalidateClassrooms();
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
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
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

  // Resolve which incoming rows already exist BEFORE the transaction so
  // we don't do N round-trips inside the txn budget. At ~30ms per query
  // over Neon, importing an entire grade (~500 rows) used to blow past
  // the 30s timeout and roll everything back.
  const codes = cleaned.map((r) => r.code);
  const existingRows = await prisma.student.findMany({
    where: { code: { in: codes } },
    select: { code: true },
  });
  const existingCodes = new Set(existingRows.map((r) => r.code));

  const toCreate = cleaned.filter((r) => !existingCodes.has(r.code));
  const toUpdate = cleaned.filter((r) => existingCodes.has(r.code));

  await prisma.$transaction(
    async (tx) => {
      if (options?.replace) {
        await tx.student.deleteMany({ where: { classroomId: classroom.id } });
      }
      if (toCreate.length > 0) {
        // createMany silently skips duplicates that may have been inserted
        // between our pre-check and the txn (e.g. concurrent admin action).
        await tx.student.createMany({ data: toCreate, skipDuplicates: true });
      }
      // Updates still have to be per-row since fields differ.
      for (const row of toUpdate) {
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
      }
      const count = await tx.student.count({ where: { classroomId: classroom.id } });
      await tx.classroom.update({
        where: { id: classroom.id },
        data: { studentCount: count },
      });
    },
    { timeout: 30000, maxWait: 10000 },
  );

  const inserted = toCreate.length;
  const updated = toUpdate.length;

  await logAudit({ action: "student.import", targetType: "classroom", targetId: classroom.id, metadata: { inserted, updated, replace: !!options?.replace } });
  revalidateClassrooms();
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
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const grade = input.grade;
  const section = normalizeSection(input.section);
  const label = input.label.trim();
  const headTeacher = input.headTeacher.trim();
  const room = input.room?.trim() || null;
  const capacity = input.capacity ?? 32;
  const pickCount = Math.max(1, Math.min(60, Math.floor(input.pickCount)));

  if (!Number.isInteger(grade) || grade < 1 || grade > 12) {
    return { ok: false, error: "Анги 1-12 байх ёстой." };
  }
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

  // Cryptographically secure Fisher-Yates so redistribution is not biased or
  // predictable (Math.random has known PRNG issues).
  function shuffleInPlace<T>(arr: T[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
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

  await logAudit({ action: "classroom.create_from_pool", targetType: "classroom", targetId: result.classroomId, metadata: { grade, section, moved: picked.length, chosenIncluded } });
  revalidateClassrooms();
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
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
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
    await logAudit({ action: "classroom.revert_empty", targetType: "classroom", targetId: classroom.id });
    revalidateClassrooms();
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

  await logAudit({ action: "classroom.revert", targetType: "classroom", targetId: classroom.id, metadata: { returned: returning.length } });
  revalidateClassrooms();
  return {
    ok: true,
    data: { returnedCount: returning.length },
    message: `${classroom.label} буцаагдаж, ${returning.length} сурагч анхны бүлэгтээ буцлаа.`,
  };
}

// ── Announcement CRUD ─────────────────────────────────────────

export async function createAnnouncement(input: { text: string; order?: number }): Promise<Result<{ id: string }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const text = input.text.trim();
  if (!text) return { ok: false, error: "Мэдээлэл шаардлагатай." };
  const created = await prisma.announcement.create({
    data: { text, order: input.order ?? 0 },
    select: { id: true },
  });
  revalidateContent("announcements");
  return { ok: true, data: { id: created.id }, message: "Зарлал үүсгэлээ." };
}

export async function updateAnnouncement(id: string, input: { text?: string; order?: number; active?: boolean }): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  if (!id) return { ok: false, error: "ID шаардлагатай." };
  const data: Record<string, unknown> = {};
  if (input.text !== undefined) data.text = input.text.trim();
  if (input.order !== undefined) data.order = input.order;
  if (input.active !== undefined) data.active = input.active;
  const res = await guardNotFound("Зарлал олдсонгүй.", () =>
    prisma.announcement.update({ where: { id }, data }),
  );
  if (!res.ok) return res;
  revalidateContent("announcements");
  return { ok: true, message: "Хадгалагдлаа." };
}

export async function deleteAnnouncement(id: string): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const res = await guardNotFound("Зарлал олдсонгүй.", () =>
    prisma.announcement.delete({ where: { id } }),
  );
  if (!res.ok) return res;
  revalidateContent("announcements");
  return { ok: true, message: "Зарлал устгагдлаа." };
}

// ── News CRUD ─────────────────────────────────────────────────

export async function createNewsItem(input: {
  tag: string;
  title: string;
  excerpt: string;
  body?: string;
  coverImage?: string | null;
  status?: "draft" | "published";
  date?: string;
}): Promise<Result<{ id: string; slug: string }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const tag = input.tag.trim();
  const title = input.title.trim();
  const excerpt = input.excerpt.trim();
  if (!tag || !title) return { ok: false, error: "Таг, гарчиг шаардлагатай." };

  const slug = await ensureUniqueNewsSlug(title);
  const status = input.status === "draft" ? "draft" : "published";
  const body = input.body ? sanitizeRichHtml(input.body) : null;

  const created = await prisma.newsItem.create({
    data: {
      tag,
      title,
      excerpt,
      body,
      coverImage: input.coverImage?.trim() || null,
      slug,
      status,
      publishedAt: status === "published" ? new Date() : null,
      date: input.date ? new Date(input.date) : new Date(),
      order: 0,
    },
    select: { id: true, slug: true },
  });
  await logAudit({ action: "news.create", targetType: "news", targetId: created.id, metadata: { slug, status } });
  // Only fan out notifications when the article goes public. Drafts stay
  // silent so admins can iterate without paging every parent.
  if (status === "published") {
    void notifyEveryone({
      category: "news",
      title: `Шинэ мэдээ: ${title}`,
      body: excerpt ? excerpt.slice(0, 200) : null,
      href: created.slug ? `/news/${created.slug}` : "/news",
    });
  }
  revalidateContent("news");
  if (created.slug) revalidatePath(`/news/${created.slug}`);
  return { ok: true, data: { id: created.id, slug: created.slug ?? "" }, message: "Мэдээ үүсгэлээ." };
}

export async function updateNewsItem(id: string, input: {
  tag?: string;
  title?: string;
  excerpt?: string;
  body?: string | null;
  coverImage?: string | null;
  status?: "draft" | "published";
}): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  if (!id) return { ok: false, error: "ID шаардлагатай." };

  const existing = await prisma.newsItem.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Мэдээ олдсонгүй." };

  const data: Record<string, unknown> = {};
  if (input.tag !== undefined) data.tag = input.tag.trim();
  if (input.title !== undefined) {
    const newTitle = input.title.trim();
    data.title = newTitle;
    // Regenerate slug if the title actually changed AND either the
    // existing slug is empty (backfill) or was derived from the old
    // title. Manual slugs stay untouched.
    if (!existing.slug || existing.slug === slugify(existing.title)) {
      data.slug = await ensureUniqueNewsSlug(newTitle, id);
    }
  }
  if (input.excerpt !== undefined) data.excerpt = input.excerpt.trim();
  if (input.body !== undefined) {
    data.body = input.body ? sanitizeRichHtml(input.body) : null;
  }
  if (input.coverImage !== undefined) {
    data.coverImage = input.coverImage?.trim() || null;
  }
  if (input.status !== undefined) {
    const newStatus = input.status === "draft" ? "draft" : "published";
    data.status = newStatus;
    // First publish stamps publishedAt; unpublishing preserves it.
    if (newStatus === "published" && !existing.publishedAt) {
      data.publishedAt = new Date();
    }
  }

  const res = await guardNotFound("Мэдээ олдсонгүй.", () =>
    prisma.newsItem.update({ where: { id }, data }),
  );
  if (!res.ok) return res;
  await logAudit({ action: "news.update", targetType: "news", targetId: id, metadata: Object.keys(data) });
  // Draft → published transition = the article is going live for the
  // first time. Broadcast a notification exactly once (guarded by the
  // absent-publishedAt check on the pre-update row).
  const wentLive =
    input.status === "published" && existing.status !== "published";
  if (wentLive) {
    const newSlug = (data.slug as string | undefined) ?? existing.slug ?? null;
    const title = (data.title as string | undefined) ?? existing.title;
    const excerpt = (data.excerpt as string | undefined) ?? existing.excerpt;
    void notifyEveryone({
      category: "news",
      title: `Шинэ мэдээ: ${title}`,
      body: excerpt ? excerpt.slice(0, 200) : null,
      href: newSlug ? `/news/${newSlug}` : "/news",
    });
  }
  revalidateContent("news");
  if (existing.slug) revalidatePath(`/news/${existing.slug}`);
  if (data.slug) revalidatePath(`/news/${data.slug as string}`);
  return { ok: true, message: "Хадгалагдлаа." };
}

export async function deleteNewsItem(id: string): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const res = await guardNotFound("Мэдээ олдсонгүй.", () =>
    prisma.newsItem.delete({ where: { id } }),
  );
  if (!res.ok) return res;
  revalidateContent("news");
  return { ok: true, message: "Мэдээ устгагдлаа." };
}

// ── Tour Room CRUD ────────────────────────────────────────────

export async function createTourRoom(input: { slug: string; label: string; subtitle: string; description: string; icon: string; panoramaUrl?: string | null; videoUrl?: string | null; photoUrl?: string | null }): Promise<Result<{ id: string }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const slug = input.slug.trim();
  const label = input.label.trim();
  if (!slug || !label) return { ok: false, error: "Slug, нэр шаардлагатай." };
  const exists = await prisma.tourRoom.findUnique({ where: { slug } });
  if (exists) return { ok: false, error: "Энэ slug аль хэдийн бүртгэгдсэн." };
  const maxOrder = await prisma.tourRoom.aggregate({ _max: { order: true } });
  const created = await prisma.tourRoom.create({
    data: {
      slug,
      label,
      subtitle: input.subtitle.trim(),
      description: input.description.trim(),
      icon: input.icon.trim(),
      panoramaUrl: input.panoramaUrl?.trim() || null,
      videoUrl: input.videoUrl?.trim() || null,
      photoUrl: input.photoUrl?.trim() || null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
    select: { id: true },
  });
  revalidateContent("tour");
  return { ok: true, data: { id: created.id }, message: "Зогсолол үүсгэлээ." };
}

export async function updateTourRoom(id: string, input: { label?: string; subtitle?: string; description?: string; icon?: string; panoramaUrl?: string | null; videoUrl?: string | null; photoUrl?: string | null }): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  if (!id) return { ok: false, error: "ID шаардлагатай." };
  const data: Record<string, unknown> = {};
  if (input.label !== undefined) data.label = input.label.trim();
  if (input.subtitle !== undefined) data.subtitle = input.subtitle.trim();
  if (input.description !== undefined) data.description = input.description.trim();
  if (input.icon !== undefined) data.icon = input.icon.trim();
  if (input.panoramaUrl !== undefined) data.panoramaUrl = input.panoramaUrl?.trim() || null;
  if (input.videoUrl !== undefined) data.videoUrl = input.videoUrl?.trim() || null;
  if (input.photoUrl !== undefined) data.photoUrl = input.photoUrl?.trim() || null;
  const res = await guardNotFound("Зогсолол олдсонгүй.", () =>
    prisma.tourRoom.update({ where: { id }, data }),
  );
  if (!res.ok) return res;
  revalidateContent("tour");
  return { ok: true, message: "Хадгалагдлаа." };
}

export async function deleteTourRoom(id: string): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const res = await guardNotFound("Зогсолол олдсонгүй.", () =>
    prisma.tourRoom.delete({ where: { id } }),
  );
  if (!res.ok) return res;
  revalidateContent("tour");
  return { ok: true, message: "Зогсолол устгагдлаа." };
}

// ── Gallery CRUD ─────────────────────────────────────────────
export async function createGalleryImage(input: { title: string; url: string; category?: string }): Promise<Result<{ id: string }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const title = input.title.trim(); const url = input.url.trim();
  if (!title || !url) return { ok: false, error: "Нэр, URL шаардлагатай." };
  const maxOrder = await prisma.galleryImage.aggregate({ _max: { order: true } });
  const created = await prisma.galleryImage.create({ data: { title, url, category: input.category ?? "general", order: (maxOrder._max.order ?? -1) + 1 }, select: { id: true } });
  revalidateContent("gallery");
  return { ok: true, data: { id: created.id }, message: "Зураг нэмэгдлээ." };
}
export async function updateGalleryImage(id: string, input: { title?: string; category?: string }): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  if (!id) return { ok: false, error: "ID шаардлагатай." };
  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title.trim();
  if (input.category !== undefined) data.category = input.category;
  const res = await guardNotFound("Зураг олдсонгүй.", () =>
    prisma.galleryImage.update({ where: { id }, data }),
  );
  if (!res.ok) return res;
  revalidateContent("gallery");
  return { ok: true, message: "Хадгалагдлаа." };
}
export async function deleteGalleryImage(id: string): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const res = await guardNotFound("Зураг олдсонгүй.", () =>
    prisma.galleryImage.delete({ where: { id } }),
  );
  if (!res.ok) return res;
  revalidateContent("gallery");
  return { ok: true, message: "Зураг устгагдлаа." };
}

// ── Achievement CRUD ─────────────────────────────────────────
export async function createAchievement(input: { name: string; grade?: string; award: string; year: number; category?: string; image?: string }): Promise<Result<{ id: string }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const name = input.name.trim(); const award = input.award.trim();
  if (!name || !award) return { ok: false, error: "Нэр, шагнал шаардлагатай." };
  const created = await prisma.achievement.create({ data: { name, grade: input.grade?.trim() || null, award, year: input.year, category: input.category ?? "olimpiad", image: input.image || null, order: 0 }, select: { id: true } });
  revalidateContent("achievements");
  return { ok: true, data: { id: created.id }, message: "Амжилт нэмэгдлээ." };
}
export async function updateAchievement(id: string, input: { name?: string; grade?: string; award?: string; year?: number; category?: string; image?: string }): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  if (!id) return { ok: false, error: "ID шаардлагатай." };
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.grade !== undefined) data.grade = input.grade?.trim() || null;
  if (input.award !== undefined) data.award = input.award.trim();
  if (input.year !== undefined) data.year = input.year;
  if (input.category !== undefined) data.category = input.category;
  if (input.image !== undefined) data.image = input.image || null;
  const res = await guardNotFound("Амжилт олдсонгүй.", () =>
    prisma.achievement.update({ where: { id }, data }),
  );
  if (!res.ok) return res;
  revalidateContent("achievements");
  return { ok: true, message: "Хадгалагдлаа." };
}
export async function deleteAchievement(id: string): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const res = await guardNotFound("Амжилт олдсонгүй.", () =>
    prisma.achievement.delete({ where: { id } }),
  );
  if (!res.ok) return res;
  revalidateContent("achievements");
  return { ok: true, message: "Амжилт устгагдлаа." };
}

// ── FAQ CRUD ─────────────────────────────────────────────────
export async function createFaq(input: { question: string; answer: string }): Promise<Result<{ id: string }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const question = input.question.trim(); const answer = input.answer.trim();
  if (!question || !answer) return { ok: false, error: "Асуулт, хариулт шаардлагатай." };
  const maxOrder = await prisma.faq.aggregate({ _max: { order: true } });
  const created = await prisma.faq.create({ data: { question, answer, order: (maxOrder._max.order ?? -1) + 1 }, select: { id: true } });
  revalidateContent("faq");
  return { ok: true, data: { id: created.id }, message: "Асуулт нэмэгдлээ." };
}
export async function updateFaq(id: string, input: { question?: string; answer?: string }): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  if (!id) return { ok: false, error: "ID шаардлагатай." };
  const data: Record<string, unknown> = {};
  if (input.question !== undefined) data.question = input.question.trim();
  if (input.answer !== undefined) data.answer = input.answer.trim();
  const res = await guardNotFound("Асуулт олдсонгүй.", () =>
    prisma.faq.update({ where: { id }, data }),
  );
  if (!res.ok) return res;
  revalidateContent("faq");
  return { ok: true, message: "Хадгалагдлаа." };
}
export async function deleteFaq(id: string): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const res = await guardNotFound("Асуулт олдсонгүй.", () =>
    prisma.faq.delete({ where: { id } }),
  );
  if (!res.ok) return res;
  revalidateContent("faq");
  return { ok: true, message: "Асуулт устгагдлаа." };
}

// ── Event CRUD ───────────────────────────────────────────────
export async function createEvent(input: { title: string; date: string; time?: string; location?: string; description: string; type?: string }): Promise<Result<{ id: string }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Нэр шаардлагатай." };
  const created = await prisma.event.create({ data: { title, date: new Date(input.date), time: input.time?.trim() || null, location: input.location?.trim() || null, description: input.description.trim(), type: input.type ?? "school", order: 0 }, select: { id: true } });
  revalidateContent("events");
  return { ok: true, data: { id: created.id }, message: "Үйл явдал нэмэгдлээ." };
}
export async function updateEvent(id: string, input: { title?: string; date?: string; time?: string; location?: string; description?: string; type?: string }): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  if (!id) return { ok: false, error: "ID шаардлагатай." };
  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title.trim();
  if (input.date !== undefined) data.date = new Date(input.date);
  if (input.time !== undefined) data.time = input.time?.trim() || null;
  if (input.location !== undefined) data.location = input.location?.trim() || null;
  if (input.description !== undefined) data.description = input.description.trim();
  if (input.type !== undefined) data.type = input.type;
  const res = await guardNotFound("Үйл явдал олдсонгүй.", () =>
    prisma.event.update({ where: { id }, data }),
  );
  if (!res.ok) return res;
  revalidateContent("events");
  return { ok: true, message: "Хадгалагдлаа." };
}
export async function deleteEvent(id: string): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const res = await guardNotFound("Үйл явдал олдсонгүй.", () =>
    prisma.event.delete({ where: { id } }),
  );
  if (!res.ok) return res;
  revalidateContent("events");
  return { ok: true, message: "Үйл явдал устгагдлаа." };
}

// ── Testimonial CRUD ─────────────────────────────────────────
export async function createTestimonial(input: { name: string; role: string; text: string; rating?: number }): Promise<Result<{ id: string }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const name = input.name.trim(); const text = input.text.trim();
  if (!name || !text) return { ok: false, error: "Нэр, сэтгэгдэл шаардлагатай." };
  const maxOrder = await prisma.testimonial.aggregate({ _max: { order: true } });
  const created = await prisma.testimonial.create({ data: { name, role: input.role.trim(), text, rating: input.rating ?? 5, order: (maxOrder._max.order ?? -1) + 1 }, select: { id: true } });
  revalidateContent("testimonials");
  return { ok: true, data: { id: created.id }, message: "Сэтгэгдэл нэмэгдлээ." };
}
export async function updateTestimonial(id: string, input: { name?: string; role?: string; text?: string; rating?: number }): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  if (!id) return { ok: false, error: "ID шаардлагатай." };
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.role !== undefined) data.role = input.role.trim();
  if (input.text !== undefined) data.text = input.text.trim();
  if (input.rating !== undefined) data.rating = input.rating;
  const res = await guardNotFound("Сэтгэгдэл олдсонгүй.", () =>
    prisma.testimonial.update({ where: { id }, data }),
  );
  if (!res.ok) return res;
  revalidateContent("testimonials");
  return { ok: true, message: "Хадгалагдлаа." };
}
export async function deleteTestimonial(id: string): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const res = await guardNotFound("Сэтгэгдэл олдсонгүй.", () =>
    prisma.testimonial.delete({ where: { id } }),
  );
  if (!res.ok) return res;
  revalidateContent("testimonials");
  return { ok: true, message: "Сэтгэгдэл устгагдлаа." };
}

// ── Club CRUD ────────────────────────────────────────────────
export async function createClub(input: { name: string; description: string; teacher?: string; schedule?: string; icon?: string }): Promise<Result<{ id: string }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Нэр шаардлагатай." };
  const maxOrder = await prisma.club.aggregate({ _max: { order: true } });
  const created = await prisma.club.create({ data: { name, description: input.description.trim(), teacher: input.teacher?.trim() || null, schedule: input.schedule?.trim() || null, icon: input.icon?.trim() || null, order: (maxOrder._max.order ?? -1) + 1 }, select: { id: true } });
  revalidateContent("clubs");
  return { ok: true, data: { id: created.id }, message: "Дугуйлан нэмэгдлээ." };
}
export async function updateClub(id: string, input: { name?: string; description?: string; teacher?: string; schedule?: string; icon?: string }): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  if (!id) return { ok: false, error: "ID шаардлагатай." };
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.description !== undefined) data.description = input.description.trim();
  if (input.teacher !== undefined) data.teacher = input.teacher?.trim() || null;
  if (input.schedule !== undefined) data.schedule = input.schedule?.trim() || null;
  if (input.icon !== undefined) data.icon = input.icon?.trim() || null;
  const res = await guardNotFound("Дугуйлан олдсонгүй.", () =>
    prisma.club.update({ where: { id }, data }),
  );
  if (!res.ok) return res;
  revalidateContent("clubs");
  return { ok: true, message: "Хадгалагдлаа." };
}
export async function deleteClub(id: string): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;
  const res = await guardNotFound("Дугуйлан олдсонгүй.", () =>
    prisma.club.delete({ where: { id } }),
  );
  if (!res.ok) return res;
  revalidateContent("clubs");
  return { ok: true, message: "Дугуйлан устгагдлаа." };
}

// ── Student fetching (per-grade for scalability) ───────────

export type StudentRow = {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  gender: string;
  attendance: number;
  gpa: number;
  chosen: boolean;
  previousClassroomId: string | null;
};

export type StudentClassroomRow = {
  id: string;
  grade: number;
  section: string;
  label: string;
  headTeacher: string;
  room: string | null;
  capacity: number;
  status: string;
  students: StudentRow[];
};

/**
 * Fetch students for a single grade. Called by StudentsPanel when the user
 * switches grade tabs — avoids loading all 3000+ students upfront.
 */
export async function getStudentsByGrade(
  grade: number,
): Promise<Result<StudentClassroomRow[]>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const classrooms = await prisma.classroom.findMany({
    where: { grade },
    orderBy: { section: "asc" },
    include: {
      students: {
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: {
          id: true,
          code: true,
          firstName: true,
          lastName: true,
          gender: true,
          attendance: true,
          gpa: true,
          chosen: true,
          previousClassroomId: true,
        },
      },
    },
  });

  return {
    ok: true,
    data: classrooms.map((c) => ({
      id: c.id,
      grade: c.grade,
      section: c.section,
      label: c.label,
      headTeacher: c.headTeacher,
      room: c.room,
      capacity: c.capacity,
      status: c.status,
      students: c.students.map((s) => ({
        id: s.id,
        code: s.code,
        firstName: s.firstName,
        lastName: s.lastName,
        gender: s.gender,
        attendance: s.attendance,
        gpa: s.gpa,
        chosen: s.chosen,
        previousClassroomId: s.previousClassroomId,
      })),
    })),
  };
}

/**
 * Fetch just the classroom metadata (no students) for the students page.
 * The StudentsPanel will call getStudentsByGrade() for the active grade.
 */
export async function getClassroomMeta(): Promise<
  Result<Array<{ id: string; grade: number; section: string; label: string; headTeacher: string; room: string | null; capacity: number; status: string }>>
> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const classrooms = await prisma.classroom.findMany({
    orderBy: [{ grade: "asc" }, { section: "asc" }],
    select: {
      id: true,
      grade: true,
      section: true,
      label: true,
      headTeacher: true,
      room: true,
      capacity: true,
      status: true,
    },
  });

  return { ok: true, data: classrooms };
}
