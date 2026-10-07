import Link from "next/link";
import { redirect } from "next/navigation";
import { AlarmClock, ArrowLeft, BarChart3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { canViewLateReport, getLateRecorder } from "@/lib/lateness-access";
import {
  classLabelFor,
  compareClassLabels,
  formatDateKey,
  isDateKey,
  schoolDate,
} from "@/lib/lateness";
import { DutyBoard, type DutyRecord } from "./DutyBoard";

export const dynamic = "force-dynamic";

export default async function DutyPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const me = await getLateRecorder();
  // Students and parents get bounced to their own dashboard by /dashboard.
  if (!me) redirect("/dashboard");

  const today = schoolDate();
  const date =
    searchParams.date && isDateKey(searchParams.date) && searchParams.date <= today
      ? searchParams.date
      : today;

  const [rows, classrooms, usedClasses, places, showReport] = await Promise.all([
    prisma.lateArrival.findMany({
      where: { date },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        studentName: true,
        classLabel: true,
        minutesLate: true,
        comesFrom: true,
        recordedById: true,
        recordedByName: true,
        createdAt: true,
      },
    }),
    prisma.classroom.findMany({ select: { grade: true, section: true } }),
    prisma.lateArrival.groupBy({ by: ["classLabel"] }),
    prisma.lateArrival.groupBy({
      by: ["comesFrom"],
      _count: { _all: true },
      orderBy: { _count: { comesFrom: "desc" } },
      take: 15,
    }),
    canViewLateReport(),
  ]);

  const classOptions = Array.from(
    new Set([
      ...classrooms.map((c) => classLabelFor(c.grade, c.section)),
      ...usedClasses.map((c) => c.classLabel),
    ]),
  ).sort(compareClassLabels);

  const records: DutyRecord[] = rows.map((r) => ({
    id: r.id,
    studentName: r.studentName,
    classLabel: r.classLabel,
    minutesLate: r.minutesLate,
    comesFrom: r.comesFrom,
    recordedByName: r.recordedByName,
    createdAt: r.createdAt.toISOString(),
    canDelete: me.canModerate || (me.id !== null && me.id === r.recordedById),
  }));

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <Link
          href={me.homePath}
          className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Буцах
        </Link>
        {showReport && (
          <Link
            href="/dashboard/admin/lateness"
            className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-accent hover:text-foreground"
          >
            <BarChart3 className="h-4 w-4" />
            Нэгдсэн тайлан
          </Link>
        )}
      </div>

      <header className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <AlarmClock className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Хоцролт бүртгэх</h1>
          <p className="text-sm text-muted-foreground">
            {formatDateKey(date)} · Жижүүр: {me.name}
          </p>
        </div>
      </header>

      <DutyBoard
        date={date}
        today={today}
        records={records}
        classOptions={classOptions}
        placeOptions={places.map((p) => p.comesFrom)}
      />
    </main>
  );
}
