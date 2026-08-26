"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Filter, Search, X } from "lucide-react";
import CircularProgress from "@/components/CircularProgress";
import ProgressBar from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ApproveButton from "./ApproveButton";
import { cn, toLatin } from "@/lib/utils";

export interface TeacherRow {
  id: string;
  name: string;
  position: string;
  signed: number;
  alreadySigned: boolean;
  myNote: string | null;
  complete: boolean;
}

interface Props {
  teachers: TeacherRow[];
  total: number;
  approverPosition: string;
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-red-100 text-red-600",
    "bg-orange-100 text-orange-600",
    "bg-amber-100 text-amber-600",
    "bg-emerald-100 text-emerald-600",
    "bg-blue-100 text-blue-600",
    "bg-indigo-100 text-indigo-600",
    "bg-violet-100 text-violet-600",
    "bg-pink-100 text-pink-600",
  ];
  const index = name.length % colors.length;
  return colors[index];
}

const ALL = "__all__";

export default function ApproverTeacherTable({ teachers, total, approverPosition }: Props) {
  const [q, setQ] = useState("");
  const [position, setPosition] = useState<string>(ALL);

  const positions = useMemo(() => {
    const set = new Set(teachers.map((t) => t.position));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "mn"));
  }, [teachers]);

  const indexed = useMemo(
    () =>
      teachers.map((t) => ({
        ...t,
        searchText:
          (t.name + "|" + t.position).toLowerCase() +
          "|" +
          toLatin(t.name + " " + t.position),
      })),
    [teachers],
  );

  const filtered = useMemo(() => {
    const raw = q.trim().toLowerCase();
    if (!raw && position === ALL) return indexed;
    const needleLat = toLatin(raw);
    return indexed.filter((t) => {
      if (position !== ALL && t.position !== position) return false;
      if (!raw) return true;
      return t.searchText.includes(raw) || t.searchText.includes(needleLat);
    });
  }, [indexed, q, position]);

  const hasFilters = !!q || position !== ALL;

  const signedByMe = teachers.filter((t) => t.alreadySigned).length;
  const remaining = teachers.length - signedByMe;

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5">
      {/* Stats bar */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Таны зурсан:</span>
          <span className="font-semibold text-foreground">{signedByMe}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">Үлдсэн:</span>
          <span className="font-semibold text-foreground">{remaining}</span>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Нэр эсвэл хичээлээр хайх..."
            className="pl-9"
          />
        </div>
        <Select value={position} onValueChange={setPosition}>
          <SelectTrigger className="sm:w-72">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Бүх албан тушаал" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>
              Бүх албан тушаал ({teachers.length})
            </SelectItem>
            {positions.map((p) => {
              const count = teachers.filter((t) => t.position === p).length;
              return (
                <SelectItem key={p} value={p}>
                  {p} ({count})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              setQ("");
              setPosition(ALL);
            }}
          >
            <X className="h-4 w-4" />
            Цэвэрлэх
          </Button>
        )}
      </div>

      <div className="mb-3 text-xs text-muted-foreground tabular-nums">
        {filtered.length} / {teachers.length} багш
      </div>

      {/* Teacher list */}
      <div className="space-y-2">
        {filtered.map((t, i) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-4 rounded-xl border p-4 transition-all",
              t.complete
                ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/5"
                : t.alreadySigned
                ? "border-primary/20 bg-primary/5"
                : "border-border bg-card hover:border-primary/20 hover:shadow-sm",
            )}
          >
            {/* Avatar */}
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold text-sm", getAvatarColor(t.name))}>
              {t.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{t.name}</span>
                {t.complete && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Бэлэн
                  </span>
                )}
                {t.alreadySigned && !t.complete && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    Зурсан
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{t.position}</div>
              {/* Progress */}
              <div className="mt-2 hidden sm:block">
                <ProgressBar signed={t.signed} total={total} />
              </div>
            </div>

            {/* Mobile progress */}
            <div className="sm:hidden">
              <CircularProgress signed={t.signed} total={total} size={48} strokeWidth={4} showSubtext={false} />
            </div>

            {/* Action */}
            <div className="shrink-0">
              <ApproveButton
                teacherId={t.id}
                teacherName={t.name}
                currentNote={t.myNote}
                alreadySigned={t.alreadySigned}
                complete={t.complete}
              />
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
            Олдсонгүй
          </div>
        )}
      </div>
    </div>
  );
}
