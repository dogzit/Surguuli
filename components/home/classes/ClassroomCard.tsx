"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Classroom } from "./types";

interface ClassroomCardProps {
  classroom: Classroom;
}

export function ClassroomCard({ classroom }: ClassroomCardProps) {
  return (
    <Card className="overflow-hidden p-0 shadow-none transition-colors hover:border-primary/30">
      <header className="px-6 py-5">
        <h3 className="text-base font-semibold text-foreground">
          {classroom.label}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {classroom.headTeacher} · {classroom.room}
        </p>
      </header>

      <div className="max-h-72 overflow-auto border-t border-border/60">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card text-[11px] font-medium text-muted-foreground">
            <tr className="border-b border-border/60">
              <th className="px-4 py-2.5 text-left font-medium">Овог, нэр</th>
              <th className="w-16 px-4 py-2.5 text-center font-medium">Ирц</th>
              <th className="w-16 px-4 py-2.5 text-center font-medium">Дүн</th>
            </tr>
          </thead>
          <tbody className="text-foreground">
            {classroom.students.map((student) => (
              <tr
                key={student.id}
                className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/40"
              >
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        student.gender === "F"
                          ? "bg-rose-400"
                          : "bg-blue-400",
                      )}
                    />
                    <span className="font-medium text-foreground">
                      {student.lastName.charAt(0)}. {student.firstName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 text-center text-xs text-muted-foreground">
                  —
                </td>
                <td className="px-4 py-2 text-center text-xs text-muted-foreground">
                  —
                </td>
              </tr>
            ))}
            {classroom.students.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-10 text-center text-xs text-muted-foreground"
                >
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
