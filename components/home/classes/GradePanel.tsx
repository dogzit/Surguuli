"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import type { Classroom } from "./types";
import { ClassroomCard } from "./ClassroomCard";

interface GradePanelProps {
  grade: number;
  classrooms: Classroom[];
  managerName: string | null;
  canSeeStudents: boolean;
}

export function GradePanel({ grade, classrooms, managerName, canSeeStudents }: GradePanelProps) {
  const total = classrooms.reduce((sum, c) => sum + c.studentCount, 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-1.5">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">{grade}-р анги</h2>
        <p className="text-sm text-muted-foreground">
          {classrooms.length} бүлэг · {total} сурагч
          {managerName && (
            <>
              {" "}· Хариуцсан менежер <span className="text-foreground">{managerName}</span>
            </>
          )}
        </p>
      </header>

      {!canSeeStudents && (
        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
            Хүүхдийн хувийн мэдээллийг хамгаалах үүднээс сурагчдын нэрсийг зөвхөн
            нэвтэрсэн багш, ажилтанд харуулна.
          </p>
          <Link href="/login" className="text-xs font-semibold text-primary hover:underline">
            Ажилтнаар нэвтрэх
          </Link>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        {classrooms.map((c) => (
          <ClassroomCard key={c.id} classroom={c} />
        ))}
      </div>
    </div>
  );
}
