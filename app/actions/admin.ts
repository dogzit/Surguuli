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
  if (!headTeacher) return { ok: false, error: "Ахлах багшийн нэр шаардлагатай." };
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
export async function deleteGalleryImage(id: string): Promise<Result> {
  await requireAdmin(); await prisma.galleryImage.delete({ where: { id } }); revalidateAll();
  return { ok: true, message: "Зураг устгагдлаа." };
}

// ── Achievement CRUD ─────────────────────────────────────────
export async function createAchievement(input: { name: string; grade?: string; award: string; year: number; category?: string }): Promise<Result<{ id: string }>> {
  await requireAdmin(); const name = input.name.trim(); const award = input.award.trim();
  if (!name || !award) return { ok: false, error: "Нэр, шагнал шаардлагатай." };
  const created = await prisma.achievement.create({ data: { name, grade: input.grade?.trim() || null, award, year: input.year, category: input.category ?? "olimpiad", order: 0 }, select: { id: true } });
  revalidateAll();
  return { ok: true, data: { id: created.id }, message: "Амжилт нэмэгдлээ." };
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
export async function deleteClub(id: string): Promise<Result> {
  await requireAdmin(); await prisma.club.delete({ where: { id } }); revalidateAll();
  return { ok: true, message: "Дугуйлан устгагдлаа." };
}
