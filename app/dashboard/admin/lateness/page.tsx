import Link from "next/link";
import { AlarmClock, PenLine } from "lucide-react";
import { canAccessAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { canViewLateReport } from "@/lib/lateness-access";
import {
  REPEAT_THRESHOLD,
  addDays,
  compareClassLabels,
  formatDateKey,
  isDateKey,
  schoolDate,
  studentKey,
} from "@/lib/lateness";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import AdminGate from "../AdminGate";
import { PageHero } from "../PageHero";
import { LatenessLog, type LogRow, type ReportSummary } from "./LatenessLog";

export const dynamic = "force-dynamic";

const MAX_ROWS = 5000;

interface SearchParams {
  from?: string;
  to?: string;
  class?: string;
}

/** School year starts on 1 September. */
function schoolYearStart(today: string): string {
  const [y, m] = today.split("-").map(Number) as [number, number];
  return `${m >= 9 ? y : y - 1}-09-01`;
}

export default async function LatenessReportPage({ searchParams }: { searchParams: SearchParams }) {
  if (!(await canViewLateReport())) {
    const access = await canAccessAdmin();
    return <AdminGate role={access.role as "ADMIN" | "APPROVER" | null} />;
  }

  const today = schoolDate();
  const presets = [
    { label: "Өнөөдөр", from: today, to: today },
    { label: "7 хоног", from: addDays(today, -6), to: today },
    { label: "30 хоног", from: addDays(today, -29), to: today },
    { label: "Энэ сар", from: `${today.slice(0, 7)}-01`, to: today },
    { label: "Хичээлийн жил", from: schoolYearStart(today), to: today },
  ];

  let to = searchParams.to && isDateKey(searchParams.to) ? searchParams.to : today;
  let from = searchParams.from && isDateKey(searchParams.from) ? searchParams.from : addDays(to, -29);
  if (from > to) [from, to] = [to, from];
  const classFilter = searchParams.class?.trim() || "";

  const [rows, classesInRange] = await Promise.all([
    prisma.lateArrival.findMany({
      where: { date: { gte: from, lte: to }, ...(classFilter ? { classLabel: classFilter } : {}) },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: MAX_ROWS,
      select: {
        id: true,
        date: true,
        studentName: true,
        classLabel: true,
        minutesLate: true,
        comesFrom: true,
        studentId: true,
        recordedByName: true,
      },
    }),
    prisma.lateArrival.groupBy({ by: ["classLabel"], where: { date: { gte: from, lte: to } } }),
  ]);

  // ── Aggregates ──
  const totalMinutes = rows.reduce((s, r) => s + r.minutesLate, 0);

  type ClassAgg = { classLabel: string; count: number; minutes: number; students: Set<string> };
  type PlaceAgg = { place: string; count: number; minutes: number; students: Set<string>; spellings: Map<string, number> };
  type StudentAgg = {
    name: string;
    classLabel: string;
    count: number;
    minutes: number;
    lastDate: string;
    places: Map<string, number>;
  };
  const byClass = new Map<string, ClassAgg>();
  const byPlace = new Map<string, PlaceAgg>();
  const byStudent = new Map<string, StudentAgg>();
  const byDay = new Map<string, number>();

  for (const r of rows) {
    const sk = studentKey(r);

    const c = byClass.get(r.classLabel) ?? { classLabel: r.classLabel, count: 0, minutes: 0, students: new Set() };
    c.count++;
    c.minutes += r.minutesLate;
    c.students.add(sk);
    byClass.set(r.classLabel, c);

    const pk = r.comesFrom.toLowerCase();
    const p = byPlace.get(pk) ?? { place: r.comesFrom, count: 0, minutes: 0, students: new Set(), spellings: new Map() };
    p.count++;
    p.minutes += r.minutesLate;
    p.students.add(sk);
    p.spellings.set(r.comesFrom, (p.spellings.get(r.comesFrom) ?? 0) + 1);
    byPlace.set(pk, p);

    // Rows arrive newest first, so the first one seen carries the latest name/class.
    const s = byStudent.get(sk) ?? {
      name: r.studentName,
      classLabel: r.classLabel,
      count: 0,
      minutes: 0,
      lastDate: r.date,
      places: new Map(),
    };
    s.count++;
    s.minutes += r.minutesLate;
    s.places.set(r.comesFrom, (s.places.get(r.comesFrom) ?? 0) + 1);
    byStudent.set(sk, s);

    byDay.set(r.date, (byDay.get(r.date) ?? 0) + 1);
  }

  const mostCommon = (m: Map<string, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";

  const classRows = [...byClass.values()]
    .map((c) => ({ classLabel: c.classLabel, count: c.count, students: c.students.size, minutes: c.minutes }))
    .sort((a, b) => b.count - a.count || compareClassLabels(a.classLabel, b.classLabel));
  const placeRows = [...byPlace.values()]
    .map((p) => ({ place: mostCommon(p.spellings), count: p.count, students: p.students.size, minutes: p.minutes }))
    .sort((a, b) => b.count - a.count);
  const studentRows = [...byStudent.values()]
    .map((s) => ({
      name: s.name,
      classLabel: s.classLabel,
      count: s.count,
      minutes: s.minutes,
      lastDate: s.lastDate,
      comesFrom: mostCommon(s.places),
    }))
    .sort((a, b) => b.count - a.count || b.minutes - a.minutes);
  const repeatRows = studentRows.filter((s) => s.count >= 2);
  const dayRows = [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  const avg = rows.length > 0 ? Math.round(totalMinutes / rows.length) : 0;
  const flagged = studentRows.filter((s) => s.count >= REPEAT_THRESHOLD).length;

  const logRows: LogRow[] = rows.map((r) => ({
    id: r.id,
    date: r.date,
    studentName: r.studentName,
    classLabel: r.classLabel,
    minutesLate: r.minutesLate,
    comesFrom: r.comesFrom,
    recordedByName: r.recordedByName,
  }));
  const summary: ReportSummary = { from, to, classRows, placeRows, studentRows };

  const classOptions = classesInRange.map((c) => c.classLabel).sort(compareClassLabels);
  const presetHref = (p: { from: string; to: string }) => {
    const q = new URLSearchParams({ from: p.from, to: p.to });
    if (classFilter) q.set("class", classFilter);
    return `/dashboard/admin/lateness?${q}`;
  };

  return (
    <>
      <PageHero
        icon={AlarmClock}
        title="Хоцролтын нэгдсэн тайлан"
        subtitle={`${formatDateKey(from)} — ${formatDateKey(to)}${classFilter ? ` · ${classFilter} анги` : ""}`}
        accent="amber"
        stats={[
          { label: "Хоцролт", value: rows.length, tone: "accent" },
          { label: "Сурагч", value: studentRows.length },
          { label: "Дундаж", value: `${avg} мин` },
          { label: "Нийт", value: `${totalMinutes} мин`, tone: "muted" },
          { label: `${REPEAT_THRESHOLD}+ удаа`, value: flagged, tone: flagged > 0 ? "accent" : "muted" },
        ]}
      />

      {/* Filters — a plain GET form so the URL is shareable and works without JS. */}
      <Card className="mb-6 p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {presets.map((p) => {
            const on = p.from === from && p.to === to;
            return (
              <Link
                key={p.label}
                href={presetHref(p)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent",
                )}
              >
                {p.label}
              </Link>
            );
          })}
        </div>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            <span>Эхлэх</span>
            <input type="date" name="from" defaultValue={from} max={today} className={FIELD} />
          </label>
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            <span>Дуусах</span>
            <input type="date" name="to" defaultValue={to} max={today} className={FIELD} />
          </label>
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            <span>Анги</span>
            <select name="class" defaultValue={classFilter} className={FIELD}>
              <option value="">Бүх анги</option>
              {classFilter && !classOptions.includes(classFilter) && (
                <option value={classFilter}>{classFilter}</option>
              )}
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Шүүх
          </button>
          <Link
            href="/dashboard/duty"
            className="ml-auto inline-flex h-9 items-center gap-2 rounded-md border border-input px-3 text-sm font-medium hover:bg-accent"
          >
            <PenLine className="h-4 w-4" />
            Хоцролт бүртгэх
          </Link>
        </form>
      </Card>

      {rows.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Энэ хугацаанд хоцролт бүртгэгдээгүй байна.
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <SummaryTable
              title="Ангиар"
              head={["Анги", "Удаа", "Сурагч", "Дундаж", "Нийт мин"]}
              rows={classRows.map((c) => [
                <Link
                  key="c"
                  href={`/dashboard/admin/lateness?${new URLSearchParams({ from, to, class: c.classLabel })}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {c.classLabel}
                </Link>,
                c.count,
                c.students,
                `${Math.round(c.minutes / c.count)} мин`,
                c.minutes,
              ])}
            />
            <SummaryTable
              title="Хаанаас ирдэг"
              head={["Хаанаас", "Удаа", "Сурагч", "Дундаж", "Нийт мин"]}
              rows={placeRows.map((p) => [
                <span key="p" className="font-medium">{p.place}</span>,
                p.count,
                p.students,
                `${Math.round(p.minutes / p.count)} мин`,
                p.minutes,
              ])}
            />
          </div>

          <SummaryTable
            title="Давтан хоцордог сурагчид"
            note={`2 ба түүнээс дээш удаа хоцорсон. ${REPEAT_THRESHOLD}+ удаа бол улаанаар тэмдэглэнэ.`}
            empty="Энэ хугацаанд давтан хоцорсон сурагч алга."
            head={["Сурагч", "Анги", "Удаа", "Нийт мин", "Хаанаас", "Сүүлд"]}
            textCols={[0, 1, 4]}
            rows={repeatRows.map((s) => [
              <span key="n" className={cn("font-medium", s.count >= REPEAT_THRESHOLD && "text-rose-600 dark:text-rose-400")}>
                {s.name}
              </span>,
              s.classLabel,
              <span
                key="k"
                className={cn(
                  "rounded px-1.5 py-0.5 font-semibold",
                  s.count >= REPEAT_THRESHOLD ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : "bg-muted",
                )}
              >
                {s.count}
              </span>,
              s.minutes,
              s.comesFrom,
              s.lastDate.replaceAll("-", "."),
            ])}
          />

          {dayRows.length > 1 && (
            <SummaryTable
              title="Өдрөөр"
              head={["Өдөр", "Хоцорсон"]}
              rows={dayRows.map(([d, n]) => [formatDateKey(d), n])}
            />
          )}

          <LatenessLog rows={logRows} summary={summary} truncated={rows.length >= MAX_ROWS} />
        </div>
      )}
    </>
  );
}

const FIELD =
  "block h-9 rounded-md border border-input bg-transparent px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function SummaryTable({
  title,
  note,
  empty,
  head,
  rows,
  textCols = [0],
}: {
  title: string;
  note?: string;
  empty?: string;
  head: string[];
  rows: Array<Array<React.ReactNode>>;
  // Left-aligned columns; the rest are numbers and align right.
  textCols?: number[];
}) {
  return (
    <section>
      <h2 className="text-base font-semibold">{title}</h2>
      {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
      <Card className="mt-3 overflow-x-auto">
        {rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">{empty}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {head.map((h, i) => (
                  <th key={h} className={cn("px-4 py-2.5 font-medium", !textCols.includes(i) && "text-right")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((cells, r) => (
                <tr key={r} className="hover:bg-accent/30">
                  {cells.map((cell, i) => (
                    <td key={i} className={cn("px-4 py-2.5", !textCols.includes(i) && "text-right tabular-nums")}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </section>
  );
}
