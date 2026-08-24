"use client";

import { useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Classroom } from "./types";
import { ClassroomCard } from "./ClassroomCard";
import { RandomizerPanel } from "./RandomizerPanel";

interface Grade2PanelProps {
  classrooms: Classroom[];
  onCreateSection: (c: Classroom) => void;
}

export function Grade2Panel({ classrooms, onCreateSection }: Grade2PanelProps) {
  const summary = useMemo(() => {
    const students = classrooms.flatMap((c) => c.students);
    const total = students.length;
    const girls = students.filter((s) => s.gender === "F").length;
    const avgAttendance = total
      ? students.reduce((a, s) => a + s.attendance, 0) / total
      : 0;
    return {
      total,
      girls,
      boys: total - girls,
      sections: classrooms.length,
      avgAttendance,
    };
  }, [classrooms]);

  const newlyCreatedIds = useMemo(
    () =>
      new Set(classrooms.filter((c) => c.status === "draft").map((c) => c.id)),
    [classrooms],
  );

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-muted/30 px-6 py-5">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Идэвхтэй ангилал · Тогтоол №2-024
            </div>
            <h2 className="mt-1 text-xl font-bold text-foreground">
              2-р анги · Дэлгэрэнгүй бүртгэл
            </h2>
            <div className="mt-1 text-sm text-muted-foreground">
              Хариуцсан менежер:{" "}
              <span className="font-medium text-foreground">Ц. Оюунтуяа</span> · Хяналт:{" "}
              <span className="font-medium text-foreground">Сургалтын менежер</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              Идэвхтэй хуваарилалт
            </span>
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 sm:inline-flex">
              <CheckCircle2 className="h-3 w-3" />
              Батлагдсан
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-6 md:grid-cols-5">
          <SummaryTile label="Бүлэг" value={summary.sections} />
          <SummaryTile label="Нийт сурагч" value={summary.total} suffix="хүн" />
          <SummaryTile label="Охин" value={summary.girls} />
          <SummaryTile label="Хүү" value={summary.boys} />
          <SummaryTile
            label="Дундаж ирц"
            value={summary.avgAttendance.toFixed(1)}
            suffix="%"
          />
        </div>
      </Card>

      <RandomizerPanel classrooms={classrooms} onCreateSection={onCreateSection} />

      <div className="grid gap-4 xl:grid-cols-2">
        {classrooms.map((c) => (
          <ClassroomCard
            key={c.id}
            classroom={c}
            isNew={newlyCreatedIds.has(c.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/40 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1 text-foreground">
        <span className="text-2xl font-bold tabular-nums">{value}</span>
        {suffix && (
          <span className="text-xs font-medium text-muted-foreground">{suffix}</span>
        )}
      </div>
    </div>
  );
}
