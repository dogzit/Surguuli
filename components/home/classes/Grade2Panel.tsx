"use client";

import { useMemo } from "react";
import type { Classroom } from "./types";
import { ClassroomCard } from "./ClassroomCard";

interface Grade2PanelProps {
  classrooms: Classroom[];
}

export function Grade2Panel({ classrooms }: Grade2PanelProps) {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-1.5">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          2-р анги
        </h2>
        <p className="text-sm text-muted-foreground">
          Хариуцсан менежер{" "}
          <span className="text-foreground">Ц. Оюунтуяа</span>
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-2">
        {classrooms.map((c) => (
          <ClassroomCard key={c.id} classroom={c} />
        ))}
      </div>
    </div>
  );
}
