"use client";

import { useMemo, useState } from "react";
import { SectionShell } from "./SectionShell";
import { GradeSidebar } from "./classes/GradeSidebar";
import { Grade2Panel } from "./classes/Grade2Panel";
import { LockedGradeView } from "./classes/LockedGradeView";
import { hydrateGrade2, type ClassroomInput } from "./classes/data";
import type { Classroom, GradeSummary } from "./classes/types";

interface ClassesSectionProps {
  classroomRows: ClassroomInput[];
  gradeSummaries: GradeSummary[];
}

export function ClassesSection({
  classroomRows,
  gradeSummaries,
}: ClassesSectionProps) {
  const [activeGrade, setActiveGrade] = useState<number>(2);
  const [grade2Classrooms, setGrade2Classrooms] = useState<Classroom[]>(() =>
    hydrateGrade2(classroomRows),
  );

  const lockedSummary = useMemo(
    () => gradeSummaries.find((g) => g.grade === activeGrade),
    [activeGrade, gradeSummaries],
  );

  function handleCreateSection(section: Classroom) {
    setGrade2Classrooms((prev) => [...prev, section]);
  }

  return (
    <SectionShell
      id="classes"
      tone="muted"
      eyebrow="Анги бүлэг"
      title="Ангиудын дэлгэрэнгүй бүртгэл"
      description="1—12-р ангиудын албан ёсны мэдээлэл, идэвхтэй хуваарилалт, сурагчийн ирц, дүнгийн үндсэн үзүүлэлт нэг дор."
    >
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Нүүр</span>
        <span className="text-border">/</span>
        <span>Анги бүлэг</span>
        <span className="text-border">/</span>
        <span className="font-medium text-foreground">{activeGrade}-р анги</span>
      </nav>

      <div className="flex flex-col gap-6 lg:flex-row">
        <GradeSidebar activeGrade={activeGrade} onSelect={setActiveGrade} />
        <div className="min-w-0 flex-1">
          {activeGrade === 2 ? (
            <Grade2Panel
              classrooms={grade2Classrooms}
              onCreateSection={handleCreateSection}
            />
          ) : lockedSummary ? (
            <LockedGradeView summary={lockedSummary} />
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-background p-8 text-center text-sm text-muted-foreground">
              {activeGrade}-р ангийн мэдээлэл өгөгдлийн санд бүртгэгдээгүй байна.
            </div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
