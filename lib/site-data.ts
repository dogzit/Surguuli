import { prisma } from "@/lib/prisma";

// ── Announcements ─────────────────────────────────────────────
export interface AnnouncementRow {
  id: string;
  text: string;
  order: number;
}

export async function loadAnnouncements(): Promise<AnnouncementRow[]> {
  const rows = await prisma.announcement.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  return rows.map((r) => ({ id: r.id, text: r.text, order: r.order }));
}

// ── News Items ────────────────────────────────────────────────
export interface NewsItemRow {
  id: string;
  tag: string;
  title: string;
  excerpt: string;
  date: string;
  order: number;
}

export async function loadNewsItems(): Promise<NewsItemRow[]> {
  const rows = await prisma.newsItem.findMany({
    orderBy: { order: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    tag: r.tag,
    title: r.title,
    excerpt: r.excerpt,
    date: r.date.toISOString(),
    order: r.order,
  }));
}

// ── Tour Rooms ────────────────────────────────────────────────
export interface TourRoomFact {
  key: string;
  value: string;
}

export interface TourRoomRow {
  id: string;
  slug: string;
  label: string;
  subtitle: string;
  description: string;
  icon: string;
  panoramaUrl: string | null;
  order: number;
  facts: TourRoomFact[];
}

export async function loadTourRooms(): Promise<TourRoomRow[]> {
  const rows = await prisma.tourRoom.findMany({
    orderBy: { order: "asc" },
    include: { facts: { orderBy: { order: "asc" } } },
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    label: r.label,
    subtitle: r.subtitle,
    description: r.description,
    icon: r.icon,
    panoramaUrl: r.panoramaUrl ?? null,
    order: r.order,
    facts: r.facts.map((f) => ({ key: f.key, value: f.value })),
  }));
}

// ── School Info (key-value) ───────────────────────────────────
export async function loadSchoolInfo(): Promise<Record<string, string>> {
  const rows = await prisma.schoolInfo.findMany();
  const map: Record<string, string> = {};
  for (const r of rows) {
    map[r.key] = r.value;
  }
  return map;
}

export async function getSchoolInfo(key: string): Promise<string | null> {
  const row = await prisma.schoolInfo.findUnique({ where: { key } });
  return row?.value ?? null;
}

// ── Gallery ──────────────────────────────────────────────────
export interface GalleryImageRow {
  id: string;
  title: string;
  url: string;
  alt: string | null;
  category: string;
  order: number;
}

export async function loadGallery(category?: string): Promise<GalleryImageRow[]> {
  const where = category && category !== "all" ? { category } : {};
  const rows = await prisma.galleryImage.findMany({ where, orderBy: { order: "asc" } });
  return rows.map((r) => ({ id: r.id, title: r.title, url: r.url, alt: r.alt, category: r.category, order: r.order }));
}

// ── Achievements ─────────────────────────────────────────────
export interface AchievementRow {
  id: string;
  name: string;
  grade: string | null;
  award: string;
  year: number;
  category: string;
  order: number;
}

export async function loadAchievements(): Promise<AchievementRow[]> {
  const rows = await prisma.achievement.findMany({ orderBy: [{ year: "desc" }, { order: "asc" }] });
  return rows.map((r) => ({ id: r.id, name: r.name, grade: r.grade, award: r.award, year: r.year, category: r.category, order: r.order }));
}

// ── FAQ ──────────────────────────────────────────────────────
export interface FaqRow {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export async function loadFaqs(): Promise<FaqRow[]> {
  const rows = await prisma.faq.findMany({ orderBy: { order: "asc" } });
  return rows.map((r) => ({ id: r.id, question: r.question, answer: r.answer, order: r.order }));
}

// ── Events ───────────────────────────────────────────────────
export interface EventRow {
  id: string;
  title: string;
  date: string;
  time: string | null;
  location: string | null;
  description: string;
  type: string;
  order: number;
}

export async function loadEvents(): Promise<EventRow[]> {
  const rows = await prisma.event.findMany({ orderBy: { date: "asc" } });
  return rows.map((r) => ({ id: r.id, title: r.title, date: r.date.toISOString(), time: r.time, location: r.location, description: r.description, type: r.type, order: r.order }));
}

// ── Testimonials ─────────────────────────────────────────────
export interface TestimonialRow {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  order: number;
}

export async function loadTestimonials(): Promise<TestimonialRow[]> {
  const rows = await prisma.testimonial.findMany({ orderBy: { order: "asc" } });
  return rows.map((r) => ({ id: r.id, name: r.name, role: r.role, text: r.text, rating: r.rating, order: r.order }));
}

// ── Clubs ────────────────────────────────────────────────────
export interface ClubRow {
  id: string;
  name: string;
  description: string;
  teacher: string | null;
  schedule: string | null;
  icon: string | null;
  order: number;
}

export async function loadClubs(): Promise<ClubRow[]> {
  const rows = await prisma.club.findMany({ orderBy: { order: "asc" } });
  return rows.map((r) => ({ id: r.id, name: r.name, description: r.description, teacher: r.teacher, schedule: r.schedule, icon: r.icon, order: r.order }));
}
