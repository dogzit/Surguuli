import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  GraduationCap,
  Home,
  Settings as SettingsIcon,
  Trophy,
  Users as UsersIcon,
} from "lucide-react";
import { requireStudent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";
import { Card } from "@/components/ui/card";
import { PortfolioSection } from "./PortfolioSection";
import { ClubsSection } from "./ClubsSection";
import { EventsSection } from "./EventsSection";
import { BookmarksSection } from "./BookmarksSection";

export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
  const me = await requireStudent();

  // Everything the student dashboard renders is queried up front so the
  // client components only handle interaction — matches the /admin pattern.
  const [classroom, portfolio, clubs, myMemberships, events, myRsvps, bookmarks] = await Promise.all(
    [
      prisma.classroom.findUnique({
        where: { id: me.classroomId },
        select: { label: true, headTeacher: true, room: true },
      }),
      prisma.studentPortfolioItem.findMany({
        where: { studentId: me.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.club.findMany({
        orderBy: { order: "asc" },
        include: { _count: { select: { members: true } } },
      }),
      prisma.clubMember.findMany({
        where: { studentId: me.id },
        select: { clubId: true },
      }),
      prisma.event.findMany({
        where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        orderBy: { date: "asc" },
        take: 20,
        include: { _count: { select: { rsvps: true } } },
      }),
      prisma.eventRsvp.findMany({
        where: { actorKind: "student", actorId: me.id },
        select: { eventId: true, status: true },
      }),
      // Fetch bookmarks + their referenced news in parallel — resolved
      // client-side into "saved news cards".
      (async () => {
        const rows = await prisma.bookmark.findMany({
          where: { actorKind: "student", actorId: me.id, targetKind: "news" },
          orderBy: { createdAt: "desc" },
          take: 30,
        });
        const ids = rows.map((b) => b.targetId);
        if (ids.length === 0) return [];
        const news = await prisma.newsItem.findMany({
          where: { id: { in: ids }, status: "published" },
          select: { id: true, slug: true, tag: true, title: true, excerpt: true, coverImage: true, publishedAt: true, date: true },
        });
        // Preserve bookmark order (most recent first).
        const byId = new Map(news.map((n) => [n.id, n]));
        return rows
          .map((b) => byId.get(b.targetId))
          .filter((n): n is NonNullable<typeof n> => !!n);
      })(),
    ],
  );

  const memberOfSet = new Set(myMemberships.map((m) => m.clubId));
  const rsvpMap = new Map(myRsvps.map((r) => [r.eventId, r.status]));

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
            href="/dashboard/student/settings"
            className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground hover:border-primary/30"
          >
            <SettingsIcon className="h-4 w-4" />
            Тохиргоо
          </Link>
          <LogoutButton />
        </div>
      </div>

      <Card className="mb-6 overflow-hidden">
        <div className="relative bg-gradient-to-br from-emerald-500/[0.12] via-emerald-500/[0.04] to-transparent p-6">
          <div className="flex items-center gap-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/25 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Сурагчийн булан
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                Сайн байна уу, {me.firstName}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {me.lastName}. {me.firstName} · {me.code}
                {classroom && <> · {classroom.label}</>}
              </p>
            </div>
          </div>
        </div>
        {classroom && (
          <div className="grid grid-cols-2 gap-4 border-t border-border/50 p-5 sm:grid-cols-3">
            <Field label="Ангийн багш" value={classroom.headTeacher} />
            <Field label="Өрөө" value={classroom.room ?? "—"} />
            <Field
              label="Идэвх"
              value={`${portfolio.length} ажил · ${memberOfSet.size} дугуйлан`}
            />
          </div>
        )}
      </Card>

      {/* Portfolio */}
      <SectionHeader
        icon={<Trophy className="h-4 w-4 text-amber-500" />}
        title="Миний амжилтууд"
        subtitle={`${portfolio.length} ажил · ${portfolio.filter((p) => p.status === "approved").length} батлагдсан`}
      />
      <PortfolioSection
        items={portfolio.map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          description: p.description,
          imageUrl: p.imageUrl,
          achievedAt: p.achievedAt ? p.achievedAt.toISOString() : null,
          status: p.status,
          reviewNote: p.reviewNote,
        }))}
      />

      {/* Clubs */}
      <SectionHeader
        icon={<UsersIcon className="h-4 w-4 text-indigo-500" />}
        title="Дугуйлан ба клубууд"
        subtitle={
          clubs.length === 0
            ? "Одоогоор дугуйлан бүртгэгдээгүй."
            : `${memberOfSet.size}/${clubs.length} дугуйланд элссэн`
        }
      />
      <ClubsSection
        clubs={clubs.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          teacher: c.teacher,
          schedule: c.schedule,
          memberCount: c._count.members,
          isMember: memberOfSet.has(c.id),
        }))}
      />

      {/* Events */}
      <SectionHeader
        icon={<Calendar className="h-4 w-4 text-orange-500" />}
        title="Ирж буй үйл явдал"
        subtitle={events.length === 0 ? "Ирж буй үйл явдал байхгүй." : `${events.length} үйл явдал`}
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
          bookmarks.length === 0
            ? "Одоогоор хадгалсан мэдээ байхгүй."
            : `${bookmarks.length} мэдээ`
        }
      />
      <BookmarksSection
        items={bookmarks.map((n) => ({
          id: n.id,
          slug: n.slug,
          tag: n.tag,
          title: n.title,
          excerpt: n.excerpt,
          coverImage: n.coverImage,
          date: (n.publishedAt ?? n.date).toISOString(),
        }))}
      />
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
    </div>
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
