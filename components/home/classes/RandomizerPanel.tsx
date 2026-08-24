"use client";

import { useMemo, useState } from "react";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Classroom, Student } from "./types";
import { NEW_SECTION_ROOMS, NEW_SECTION_TEACHERS } from "./data";
import {
  AllocationPreviewDialog,
  type AllocationPreview,
} from "./AllocationPreviewDialog";

interface RandomizerPanelProps {
  classrooms: Classroom[];
  onCreateSection: (section: Classroom) => void;
}

const SECTION_LETTERS = ["А", "Б", "В", "Г", "Д", "Е", "Ё", "Ж", "З", "И"];

function nextSectionLabel(existing: Classroom[]): { label: string; id: string } {
  const usedLetters = new Set(
    existing.map((c) => c.label.replace(/[^А-ЯӨҮЁ]/g, "").slice(-1)),
  );
  const nextLetter = SECTION_LETTERS.find((l) => !usedLetters.has(l)) ?? "?";
  return {
    label: `2${nextLetter} анги`,
    id: `class-2${nextLetter}-${Date.now().toString(36)}`,
  };
}

function shuffle<T>(source: readonly T[]): T[] {
  const copy = [...source];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function pickCount(pool: number): number {
  if (pool <= 0) return 0;
  const min = Math.max(1, Math.min(4, pool));
  const max = Math.min(8, pool);
  const span = max - min + 1;
  return min + Math.floor(Math.random() * span);
}

export function RandomizerPanel({
  classrooms,
  onCreateSection,
}: RandomizerPanelProps) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<AllocationPreview | null>(null);

  const totals = useMemo(() => {
    const students = classrooms.flatMap((c) => c.students);
    return { pool: students.length, sections: classrooms.length };
  }, [classrooms]);

  async function handleRun() {
    if (busy) return;
    setBusy(true);

    const allStudents: Student[] = classrooms.flatMap((c) => c.students);
    const shuffled = shuffle(allStudents);
    const takeCount = pickCount(shuffled.length);
    const selected = shuffled.slice(0, takeCount);
    const { label, id } = nextSectionLabel(classrooms);

    const room = NEW_SECTION_ROOMS[Math.floor(Math.random() * NEW_SECTION_ROOMS.length)]!;
    const teacher =
      NEW_SECTION_TEACHERS[Math.floor(Math.random() * NEW_SECTION_TEACHERS.length)]!;

    const newClassroom: Classroom = {
      id,
      label,
      headTeacher: teacher,
      room,
      capacity: 32,
      createdAt: new Date().toISOString().slice(0, 10),
      status: "draft",
      students: selected,
    };

    await new Promise((r) => setTimeout(r, 650));

    setPreview({
      classroom: newClassroom,
      totalPool: allStudents.length,
      sampledAt: new Date(),
    });
    setBusy(false);
  }

  function confirmPreview() {
    if (!preview) return;
    onCreateSection(preview.classroom);
    setPreview(null);
  }

  return (
    <>
      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-primary/[0.05] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                Захиргааны хяналтын самбар
              </div>
              <h3 className="mt-1 text-lg font-bold text-foreground">
                Шинэ анги бүрдүүлэлт / Сурагч хуваарилалт
              </h3>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Хичээлийн жилийн явцад ирсэн шинэ хүсэлт, шилжилт хөдөлгөөн,
                дүнгийн тэнцвэржүүлэлтэд үндэслэн 2-р ангийн сурагчдыг санамсаргүй
                байдлаар шинэчилж хуваарилах албан ёсны хэрэглүүр.
              </p>
            </div>
            <span className="hidden shrink-0 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary md:inline">
              Гарын үсэг: Захирал
            </span>
          </div>
        </div>

        <div className="grid gap-4 border-b border-border bg-muted/30 px-6 py-4 sm:grid-cols-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Сурагчийн сан
            </div>
            <div className="mt-0.5 text-2xl font-bold text-foreground tabular-nums">
              {totals.pool}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Одоогийн бүлэг
            </div>
            <div className="mt-0.5 text-2xl font-bold text-foreground tabular-nums">
              {totals.sections}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Статус
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-foreground">
                Хуваарилалт хүлээж байна
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="max-w-md text-xs leading-relaxed text-muted-foreground">
            Дараах товчийг дарснаар одоогийн 2-р ангийн бүх сурагчийг санамсаргүйгээр
            дахин ялган шинэ бүлэг үүсгэнэ. Үр дүнг хянан баталгаажуулж, зөвшөөрсний
            дараа албан ёсоор бүртгэгдэнэ.
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-md border border-border bg-background px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
              v2.4 · Аудитлагдсан
            </span>
            <Button
              type="button"
              onClick={handleRun}
              disabled={busy || totals.pool === 0}
              size="lg"
            >
              {busy ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                  Хуваарилж байна…
                </>
              ) : (
                <>
                  <Shuffle className="h-4 w-4" />
                  Сурагчдыг санамсаргүй байдлаар хуваарилах
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      <AllocationPreviewDialog
        preview={preview}
        onClose={() => setPreview(null)}
        onConfirm={confirmPreview}
      />
    </>
  );
}
