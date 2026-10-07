import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Home,
  Settings as SettingsIcon,
  Sparkles,
  Users,
} from "lucide-react";
import { requireParent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventsSection } from "../student/EventsSection";
import { BookmarksSection } from "../student/BookmarksSection";

export const dynamic = "force-dynamic";

export default async function ParentDashboard() {
  const me = await requireParent();

  const [links, events, rsvps, bookmarkNews] = await Promise.all([
    prisma.parentStudent.findMany({
      where: { parentId: me.id },
      orderBy: { createdAt: "asc" },
      include: {
        student: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            classroom: { select: { label: true, headTeacher: true, grade: true } },
          },
        },
      },
    }),
    prisma.event.findMany({
      where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      orderBy: { date: "asc" },
      take: 20,
      include: { _count: { select: { rsvps: true } } },
    }),
    prisma.eventRsvp.findMany({
      where: { actorKind: "parent", actorId: me.id },
      select: { eventId: true, status: true },
    }),
    // Same shape the student BookmarksSection expects — resolve the
    // bookmark rows into the news items they reference.
    (async () => {
      const rows = await prisma.bookmark.findMany({
        where: { actorKind: "parent", actorId: me.id, targetKind: "news" },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      const ids = rows.map((b) => b.targetId);
      if (ids.length === 0) return [];
      const news = await prisma.newsItem.findMany({
        where: { id: { in: ids }, status: "published" },
        select: {
          id: true,
          slug: true,
          tag: true,
          title: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          date: true,
        },
      });
      const byId = new Map(news.map((n) => [n.id, n]));
      return rows
        .map((b) => byId.get(b.targetId))
        .filter((n): n is NonNullable<typeof n> => !!n);
    })(),
  ]);

  const rsvpMap = new Map(rsvps.map((r) => [r.eventId, r.status]));

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground hover:border-primary/30"
        >
          <ArrowLeft className="h-4 w-4" />
          <Home className="h-4 w-4" />
          Сургуулийн хуудас
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/parent/settings"
            className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground hover:border-primary/30"
          >
            <SettingsIcon className="h-4 w-4" />
            Тохиргоо
          </Link>
          <LogoutButton />
        </div>
      </div>

      <Card className="mb-6 overflow-hidden">
        <div className="relative bg-gradient-to-br from-indigo-500/[0.12] via-indigo-500/[0.04] to-transparent p-6">
          <div className="flex items-center gap-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/25 to-indigo-500/5 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Эцэг эхийн булан
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                Сайн байна уу, {me.name}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {me.email}
                {me.phone && <> · {me.phone}</>}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Linked children */}
      <SectionHeader
        icon={<Users className="h-4 w-4 text-indigo-500" />}
        title="Миний хүүхэд"
        subtitle={
          links.length === 0
            ? "Хүүхэдтэй холбогдоогүй байна."
            : `${links.length} холбоос`
        }
      />
      {links.length === 0 ? (
        <Card className="mb-6 border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Ангийн багшаас урилгын код авч дахин бүртгүүлнэ үү.
          </p>
        </Card>
      ) : (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {links.map((l) => (
            <Card key={l.id} className="p-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {l.relation ?? "Хүүхэд"}
              </div>
              <div className="mt-1 text-lg font-bold">
                {l.student.lastName}. {l.student.firstName}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {l.student.code} · {l.student.classroom.label}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  Ангийн багш:{" "}
                  <span className="text-foreground">{l.student.classroom.headTeacher}</span>
                </span>
                <Link
                  href="/classes"
                  className="text-primary hover:underline"
                >
                  Ангийн мэдээлэл →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Events with RSVP */}
      <SectionHeader
        icon={<Calendar className="h-4 w-4 text-orange-500" />}
        title="Ирж буй үйл явдал"
        subtitle={
          events.length === 0 ? "Ирж буй үйл явдал байхгүй." : `${events.length} үйл явдал`
        }
      />
      <EventsSection
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          date: e.date.toISOString(),
          time: e.time,
          location: e.location,
          description: e.description,
          type: e.type,
          rsvpStatus: rsvpMap.get(e.id) ?? null,
          rsvpCount: e._count.rsvps,
        }))}
      />

      {/* Bookmarks */}
      <SectionHeader
        icon={<Bookmark className="h-4 w-4 text-violet-500" />}
        title="Хадгалсан мэдээ"
        subtitle={
          bookmarkNews.length === 0
            ? "Одоогоор хадгалсан мэдээ байхгүй."
            : `${bookmarkNews.length} мэдээ`
        }
      />
      <BookmarksSection
        items={bookmarkNews.map((n) => ({
          id: n.id,
          slug: n.slug,
          tag: n.tag,
          title: n.title,
          excerpt: n.excerpt,
          coverImage: n.coverImage,
          date: (n.publishedAt ?? n.date).toISOString(),
        }))}
      />

      {/* Contact + upcoming features */}
      <Card className="mt-6 p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold">Багштай харилцах</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Шууд мессежийн боломж удахгүй нэмэгдэнэ. Тэр хугацаанд албан бичгийг сургуулийн
              и-мэйл рүү илгээнэ үү.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/contact">Албан бичиг илгээх</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/news">Мэдээ уншиж эхлэх</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-3 mt-8 flex items-baseline justify-between">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </h2>
      <span className="text-xs text-muted-foreground">{subtitle}</span>
    </div>
  );
}
