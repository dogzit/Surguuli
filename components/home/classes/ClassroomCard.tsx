"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Classroom } from "./types";

interface ClassroomCardProps {
  classroom: Classroom;
}

export function ClassroomCard({ classroom }: ClassroomCardProps) {
  const subtitle = [classroom.headTeacher, classroom.room].filter(Boolean).join(" · ");

  return (
    <Card className="overflow-hidden p-0 shadow-none transition-colors hover:border-primary/30">
      <header className="flex items-start justify-between gap-3 px-6 py-5">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">{classroom.label}</h3>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
          {classroom.studentCount} сурагч
        </span>
      </header>

      {/* Only present for signed-in staff — the server never sends names otherwise. */}
      {classroom.students && (
        <div className="max-h-72 overflow-auto border-t border-border/60">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card text-[11px] font-medium text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="w-10 px-4 py-2.5 text-right font-medium">№</th>
                <th className="px-4 py-2.5 text-left font-medium">Овог, нэр</th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              {classroom.students.map((student, i) => (
                <tr
                  key={student.id}
                  className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/40"
                >
                  <td className="px-4 py-2 text-right text-xs tabular-nums text-muted-foreground">
                    {i + 1}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          student.gender === "F" ? "bg-rose-400" : "bg-blue-400",
                        )}
                      />
                      <span className="font-medium text-foreground">
                        {student.lastName.charAt(0)}. {student.firstName}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {classroom.students.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-10 text-center text-xs text-muted-foreground">
                    Сурагчийн бүртгэл алга байна.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
