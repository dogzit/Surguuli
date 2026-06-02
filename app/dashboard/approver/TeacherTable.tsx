"use client";

import { useMemo, useState } from "react";
import { Filter, Search, X } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
}

// Багш бүрт өөр өөр өнгө оноох функц
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
  // Нэрний уртаас хамааруулан өнгө сонгох
  const index = name.length % colors.length;
  return colors[index];
}

const CYR_TO_LAT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "ye", ё: "yo",
  ж: "j", з: "z", и: "i", й: "i", к: "k", л: "l", м: "m",
  н: "n", о: "o", ө: "u", п: "p", р: "r", с: "s", т: "t",
  у: "u", ү: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "sh", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function toLatin(s: string): string {
  return s
    .toLowerCase()
    .split("")
    .map((c) => CYR_TO_LAT[c] ?? c)
    .join("");
}

const ALL = "__all__";

export default function TeacherTable({ teachers, total }: Props) {
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

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Нэр эсвэл хичээлээр хайх (Кирилл/Латин)..."
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

      <div className="mb-2 text-xs text-muted-foreground tabular-nums">
        {filtered.length} / {teachers.length} багш
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full">
          <thead className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-12 px-4 py-3 text-left">№</th>
              <th className="px-4 py-3 text-left">Багш</th>
              <th className="w-24 px-4 py-3 text-center lg:w-auto lg:text-left">
                Явц
              </th>
              <th className="w-44 px-4 py-3 text-right">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {filtered.map((t, i) => (
              <tr key={t.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3 text-sm font-medium text-muted-foreground tabular-nums">
                  {i + 1}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* Аватар хэсэг */}
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-semibold text-sm", getAvatarColor(t.name))}>
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    {/* Нэр, Албан тушаал */}
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.position}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center lg:hidden">
                    <CircularProgress
                      signed={t.signed}
                      total={total}
                      size={52}
                      strokeWidth={5}
                      showSubtext={false}
                    />
                  </div>
                  <div className="hidden lg:block">
                    <ProgressBar signed={t.signed} total={total} />
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <ApproveButton
                    teacherId={t.id}
                    teacherName={t.name}
                    currentNote={t.myNote}
                    alreadySigned={t.alreadySigned}
                    complete={t.complete}
                  />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  Олдсонгүй
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}