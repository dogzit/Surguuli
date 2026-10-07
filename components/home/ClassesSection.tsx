"use client";

import { useMemo, useState } from "react";
import { SectionShell } from "./SectionShell";
import { GradeSidebar } from "./classes/GradeSidebar";
import { GradePanel } from "./classes/GradePanel";
import type { Classroom } from "./classes/types";

interface ClassesSectionProps {
  classrooms: Classroom[];
  // Per-grade manager names from SchoolInfo, keyed by grade ("2" → name).
  gradeManagers: Record<string, string>;
  // True only for signed-in staff; classrooms then carry student names.
  canSeeStudents: boolean;
}

export function ClassesSection({ classrooms, gradeManagers, canSeeStudents }: ClassesSectionProps) {
  const byGrade = useMemo(() => {
    const map = new Map<number, Classroom[]>();
    for (const c of classrooms) {
      const list = map.get(c.grade) ?? [];
      list.push(c);
      map.set(c.grade, list);
    }
    return map;
  }, [classrooms]);

  const availableGrades = useMemo(() => new Set(byGrade.keys()), [byGrade]);
  const [activeGrade, setActiveGrade] = useState<number>(() =>
    availableGrades.size > 0 ? Math.min(...Array.from(availableGrades)) : 1,
  );
  const active = byGrade.get(activeGrade);

  return (
    <SectionShell
      id="classes"
      tone="light"
      eyebrow="Анги бүлэг"
      title="Ангиудын мэдээлэл"
      description="Анги бүлэг, ангийн багш, сурагчдын тоо нэг дор."
    >
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
        <GradeSidebar
          activeGrade={activeGrade}
          availableGrades={availableGrades}
          onSelect={setActiveGrade}
        />
        <div className="min-w-0 flex-1">
          {active ? (
            <GradePanel
              grade={activeGrade}
              classrooms={active}
              managerName={gradeManagers[String(activeGrade)] ?? null}
              canSeeStudents={canSeeStudents}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
              Ангийн мэдээлэл бүртгэгдээгүй байна.
            </div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
