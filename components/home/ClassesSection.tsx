"use client";

import { useMemo, useState } from "react";
import { SectionShell } from "./SectionShell";
import { GradeSidebar } from "./classes/GradeSidebar";
import { Grade2Panel } from "./classes/Grade2Panel";
import { LockedGradeView } from "./classes/LockedGradeView";
import { hydrateGrade2, type ClassroomInput } from "./classes/data";
import type { GradeSummary } from "./classes/types";

interface ClassesSectionProps {
  classroomRows: ClassroomInput[];
  gradeSummaries: GradeSummary[];
}

export function ClassesSection({
  classroomRows,
  gradeSummaries,
}: ClassesSectionProps) {
  const [activeGrade, setActiveGrade] = useState<number>(2);

  const grade2Classrooms = useMemo(
    () => hydrateGrade2(classroomRows),
    [classroomRows],
  );

  const lockedSummary = useMemo(
    () => gradeSummaries.find((g) => g.grade === activeGrade),
    [activeGrade, gradeSummaries],
  );

  return (
    <SectionShell
      id="classes"
      tone="light"
      eyebrow="Анги бүлэг"
      title="Сурагчдын дэлгэрэнгүй бүртгэл"
      description="Ангиудын албан ёсны мэдээлэл — одоогийн бүлэг, ахлах багш нэг дор."
    >
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
        <GradeSidebar activeGrade={activeGrade} onSelect={setActiveGrade} />
        <div className="min-w-0 flex-1">
          {activeGrade === 2 ? (
            <Grade2Panel classrooms={grade2Classrooms} />
          ) : lockedSummary ? (
            <LockedGradeView summary={lockedSummary} />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
              {activeGrade}-р ангийн мэдээлэл бүртгэгдээгүй байна.
            </div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
