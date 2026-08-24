"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Classroom } from "./types";

interface ClassroomCardProps {
  classroom: Classroom;
  isNew?: boolean;
}

export function ClassroomCard({ classroom, isNew = false }: ClassroomCardProps) {
  const stats = useMemo(() => {
    const total = classroom.students.length;
    if (total === 0) return { total, girls: 0, boys: 0, avgAttendance: 0, avgGpa: 0 };
    const girls = classroom.students.filter((s) => s.gender === "F").length;
    const boys = total - girls;
    const avgAttendance =
      classroom.students.reduce((sum, s) => sum + s.attendance, 0) / total;
    const avgGpa = classroom.students.reduce((sum, s) => sum + s.gpa, 0) / total;
    return { total, girls, boys, avgAttendance, avgGpa };
  }, [classroom.students]);

  const isDraft = classroom.status === "draft";

  return (
    <Card
      className={cn(
        "overflow-hidden p-0 transition-shadow hover:shadow-md",
        isNew && "border-amber-300 ring-2 ring-amber-100 dark:border-amber-500/40 dark:ring-amber-500/20",
      )}
    >
      <header
        className={cn(
          "flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4",
          isDraft ? "bg-amber-50/60 dark:bg-amber-500/[0.06]" : "bg-muted/40",
        )}
      >
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">
              {classroom.label}
            </h3>
            {isDraft ? (
              <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300">
                Шинэ · Төсөл
              </span>
            ) : (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                Батлагдсан
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Ахлах багш:{" "}
            <span className="font-medium text-foreground">{classroom.headTeacher}</span>{" "}
            · Кабинет:{" "}
            <span className="font-medium text-foreground">{classroom.room}</span>
          </div>
        </div>
        <div className="text-right text-[10px] uppercase tracking-widest text-muted-foreground">
          <div>Бүртгэсэн: {classroom.createdAt}</div>
          <div className="mt-0.5 truncate font-mono text-muted-foreground/70">
            {classroom.id.slice(0, 12)}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-px bg-border text-center text-xs">
        <div className="bg-background px-2 py-2.5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Сурагч
          </div>
          <div className="mt-0.5 text-base font-bold text-foreground tabular-nums">
            {stats.total} / {classroom.capacity}
          </div>
        </div>
        <div className="bg-background px-2 py-2.5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Охин / Хүү
          </div>
          <div className="mt-0.5 text-base font-bold text-foreground tabular-nums">
            {stats.girls} / {stats.boys}
          </div>
        </div>
        <div className="bg-background px-2 py-2.5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Ирц
          </div>
          <div className="mt-0.5 text-base font-bold text-foreground tabular-nums">
            {stats.avgAttendance.toFixed(1)}%
          </div>
        </div>
        <div className="bg-background px-2 py-2.5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Дундаж
          </div>
          <div className="mt-0.5 text-base font-bold text-foreground tabular-nums">
            {stats.avgGpa.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="max-h-72 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              <th className="w-10 px-3 py-2 text-left font-semibold">№</th>
              <th className="px-3 py-2 text-left font-semibold">Овог, нэр</th>
              <th className="w-16 px-3 py-2 text-center font-semibold">Х/О</th>
              <th className="w-20 px-3 py-2 text-right font-semibold">Ирц</th>
              <th className="w-16 px-3 py-2 text-right font-semibold">Дүн</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {classroom.students.map((student, idx) => (
              <tr key={student.id} className="hover:bg-accent/50">
                <td className="px-3 py-1.5 text-xs tabular-nums text-muted-foreground">
                  {String(idx + 1).padStart(2, "0")}
                </td>
                <td className="px-3 py-1.5">
                  <div className="font-medium text-foreground">
                    {student.lastName.charAt(0)}. {student.firstName}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {student.code}
                  </div>
                </td>
                <td className="px-3 py-1.5 text-center">
                  <span
                    className={cn(
                      "inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold",
                      student.gender === "F"
                        ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
                    )}
                  >
                    {student.gender === "F" ? "Ох" : "Хү"}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-right text-xs tabular-nums text-muted-foreground">
                  {student.attendance}%
                </td>
                <td className="px-3 py-1.5 text-right text-xs tabular-nums font-medium text-foreground">
                  {student.gpa.toFixed(2)}
                </td>
              </tr>
            ))}
            {classroom.students.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-xs text-muted-foreground">
                  Сурагчийн бүртгэл алга байна.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
