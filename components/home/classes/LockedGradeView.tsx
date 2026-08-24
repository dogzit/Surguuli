"use client";

import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { GradeSummary } from "./types";

interface LockedGradeViewProps {
  summary: GradeSummary;
}

function Metric({
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

export function LockedGradeView({ summary }: LockedGradeViewProps) {
  return (
    <section className="space-y-5">
      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-muted/30 px-6 py-5">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Директорын дэргэдэх зөвлөл · Тогтоол №{summary.grade}12
            </div>
            <h2 className="mt-1 text-xl font-bold text-foreground">
              {summary.label} · {summary.sections} бүлэг
            </h2>
            <div className="mt-1 text-sm text-muted-foreground">
              Бүлгийн ахлах багш:{" "}
              <span className="font-medium text-foreground">
                {summary.headTeacher}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              <Lock className="h-3 w-3" />
              Битүүмжилсэн
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Read-only directory
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-6 md:grid-cols-4">
          <Metric label="Нийт сурагч" value={summary.totalStudents} suffix="хүн" />
          <Metric label="Багтаамж" value={summary.capacity} suffix="ор" />
          <Metric label="Бүлгийн тоо" value={summary.sections} />
          <Metric
            label="Ирц (жилийн)"
            value={summary.averageAttendance.toFixed(1)}
            suffix="%"
          />
        </div>

        <div className="border-t border-border bg-muted/30 px-6 py-3 text-xs text-muted-foreground">
          Энэ ангийн мэдээллийг зөвхөн албан ёсны удирдлагын шийдвэрээр өөрчилнө.
        </div>
      </Card>

      <div className="rounded-lg border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
        Сурагчийн дэлгэрэнгүй нэрсийн жагсаалт нь хувийн мэдээллийн хамгаалалтын
        хуулийн дагуу энэ хэсэгт ил тод хэвлэгдэхгүй.
      </div>
    </section>
  );
}
