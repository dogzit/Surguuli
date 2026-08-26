"use client";

import { Lock } from "lucide-react";
import type { GradeSummary } from "./types";

interface LockedGradeViewProps {
  summary: GradeSummary;
}

export function LockedGradeView({ summary }: LockedGradeViewProps) {
  return (
    <section className="relative space-y-8">
      {/* Header */}
      <header className="group relative flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            {summary.label}
          </h2>
          <p className="text-sm text-muted-foreground">
            Ахлах багш{" "}
            <span className="text-foreground">{summary.headTeacher}</span>
          </p>
        </div>

        {/* Lock overlay */}
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-8 py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/80">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-foreground">
              Нууцалсан мэдээлэл
            </div>
            <p className="mt-1.5 max-w-[280px] text-xs leading-relaxed text-muted-foreground">
              Хувийн мэдээллийн хамгаалалтын дагуу зөвхөн 2-р ангийн
              сурагчдын дэлгэрэнгүй нээлттэй байна.
            </p>
          </div>
        </div>
      </header>
    </section>
  );
}
