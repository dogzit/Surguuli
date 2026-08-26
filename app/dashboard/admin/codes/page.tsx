"use client";

import { useMemo, useState } from "react";
import { prisma } from "@/lib/prisma";
import { Search, Printer, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  "bg-cyan-100 text cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
];

function avatarColor(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

interface Teacher {
  id: string;
  name: string;
  position: string;
  pin: string;
}

export default function TeacherCodesPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");

  // Load teachers on mount
  useMemo(() => {
    fetch("/api/teachers/codes")
      .then((r) => r.json())
      .then((data: Teacher[]) => {
        setTeachers(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return teachers;
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(needle) ||
        t.position.toLowerCase().includes(needle) ||
        t.pin.includes(needle),
    );
  }, [q, teachers]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Багшийн кодууд
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Бүх багш нарын 4 оронтой нэвтрэх кодууд
          </p>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 print:hidden"
        >
          <Printer className="h-4 w-4" />
          Хэвлэх
        </button>
      </div>

      {/* Search */}
      <div className="relative print:hidden">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Багш хайх..."
          className="pl-9"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground print:hidden">
        <span>
          Нийт: <span className="font-semibold text-foreground">{teachers.length}</span>
        </span>
        <span>
          Харагдаж буй: <span className="font-semibold text-foreground">{filtered.length}</span>
        </span>
      </div>

      {/* Code cards */}
      {!loaded ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-muted-foreground">Ачааллаж байна...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-muted-foreground">Багш олдсонгүй</div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:grid-cols-3 print:gap-2">
          {filtered.map((teacher) => {
            const color = avatarColor(teacher.id);
            return (
              <Card
                key={teacher.id}
                className="flex items-center gap-4 p-4 transition-colors hover:border-primary/30 print:border print:p-3 print:hover:border-border"
              >
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold",
                    color,
                  )}
                >
                  {teacher.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {teacher.name}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {teacher.position}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-primary" />
                  <span className="font-mono text-lg font-bold tracking-widest text-primary">
                    {teacher.pin}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
