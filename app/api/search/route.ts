import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hitRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Simple ILIKE fan-out across four tables. Good enough at 5000 kids
// scale; swap to Postgres FTS or Meilisearch when the content bulk
// grows past a few thousand rows.
const PER_CATEGORY = 8;

// Cap per IP so a rogue script can't hammer the DB via /search.
const RATE_MAX = 30;
const RATE_WINDOW_MS = 60_000;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ q, results: emptyResults() });
  }

  const ip = await getClientIp();
  if (!hitRateLimit(`search:${ip}`, RATE_MAX, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: "Хэт олон хайлт. Дараа дахин оролдоно уу." }, { status: 429 });
  }

  const like = { contains: q, mode: "insensitive" as const };

  const [news, achievements, events, faqs] = await Promise.all([
    prisma.newsItem.findMany({
      where: {
        status: "published",
        OR: [{ title: like }, { excerpt: like }, { tag: like }],
      },
      orderBy: { publishedAt: "desc" },
      take: PER_CATEGORY,
      select: { id: true, slug: true, title: true, excerpt: true, tag: true, publishedAt: true },
    }),
    prisma.achievement.findMany({
      where: {
        OR: [{ name: like }, { award: like }, { grade: like }],
      },
      orderBy: { year: "desc" },
      take: PER_CATEGORY,
      select: { id: true, name: true, award: true, year: true, grade: true },
    }),
    prisma.event.findMany({
      where: {
        OR: [{ title: like }, { description: like }, { location: like }],
      },
      orderBy: { date: "asc" },
      take: PER_CATEGORY,
      select: { id: true, title: true, description: true, date: true, location: true },
    }),
    prisma.faq.findMany({
      where: {
        OR: [{ question: like }, { answer: like }],
      },
      orderBy: { order: "asc" },
      take: PER_CATEGORY,
      select: { id: true, question: true, answer: true },
    }),
  ]);

  return NextResponse.json({
    q,
    results: {
      news: news.map((n) => ({
        id: n.id,
        slug: n.slug,
        title: n.title,
        snippet: n.excerpt,
        meta: n.tag,
        date: n.publishedAt ? n.publishedAt.toISOString() : null,
      })),
      achievements: achievements.map((a) => ({
        id: a.id,
        title: a.name,
        snippet: a.award,
        meta: a.grade,
        date: String(a.year),
      })),
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        snippet: e.description,
        meta: e.location,
        date: e.date.toISOString(),
      })),
      faqs: faqs.map((f) => ({
        id: f.id,
        title: f.question,
        snippet: f.answer.slice(0, 200),
      })),
    },
  });
}

function emptyResults() {
  return { news: [], achievements: [], events: [], faqs: [] };
}
