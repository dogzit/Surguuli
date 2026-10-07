"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Download, Loader2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteLate } from "@/app/actions/lateness";
import { minutesTone } from "@/app/dashboard/duty/minutes-tone";
import { cn } from "@/lib/utils";

export interface LogRow {
  id: string;
  date: string;
  studentName: string;
  classLabel: string;
  minutesLate: number;
  comesFrom: string;
  recordedByName: string;
}

export interface ReportSummary {
  from: string;
  to: string;
  classRows: Array<{ classLabel: string; count: number; students: number; minutes: number }>;
  placeRows: Array<{ place: string; count: number; students: number; minutes: number }>;
  studentRows: Array<{
    name: string;
    classLabel: string;
    count: number;
    minutes: number;
    lastDate: string;
    comesFrom: string;
  }>;
}

const PAGE = 100;

export function LatenessLog({
  rows,
  summary,
  truncated,
}: {
  rows: LogRow[];
  summary: ReportSummary;
  truncated: boolean;
}) {
  const [shown, setShown] = useState(PAGE);
  const [exporting, setExporting] = useState(false);

  const exportXlsx = async () => {
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      const sheet = (data: Array<Record<string, string | number>>, name: string) =>
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), name);

      sheet(
        rows.map((r) => ({
          "Огноо": r.date,
          "Овог, нэр": r.studentName,
          "Анги": r.classLabel,
          "Хоцорсон мин": r.minutesLate,
          "Хаанаас ирдэг": r.comesFrom,
          "Бүртгэсэн": r.recordedByName,
        })),
        "Бүртгэл",
      );
      sheet(
        summary.studentRows.map((s) => ({
          "Овог, нэр": s.name,
          "Анги": s.classLabel,
          "Удаа": s.count,
          "Нийт мин": s.minutes,
          "Хаанаас ирдэг": s.comesFrom,
          "Сүүлд": s.lastDate,
        })),
        "Сурагчаар",
      );
      sheet(
        summary.classRows.map((c) => ({
          "Анги": c.classLabel,
          "Удаа": c.count,
          "Сурагч": c.students,
          "Дундаж мин": Math.round(c.minutes / c.count),
          "Нийт мин": c.minutes,
        })),
        "Ангиар",
      );
      sheet(
        summary.placeRows.map((p) => ({
          "Хаанаас ирдэг": p.place,
          "Удаа": p.count,
          "Сурагч": p.students,
          "Дундаж мин": Math.round(p.minutes / p.count),
          "Нийт мин": p.minutes,
        })),
        "Хаанаас",
      );
      XLSX.writeFile(wb, `hotsrolt_${summary.from}_${summary.to}.xlsx`);
    } catch {
      toast.error("Excel файл үүсгэж чадсангүй.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Бүх бүртгэл</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {rows.length} бүртгэл
            {truncated && " · хамгийн сүүлийн бүртгэлүүд, хугацааг богиносгоно уу"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportXlsx} disabled={exporting}>
          {exporting ? <Loader2 className="animate-spin" /> : <Download />}
          Excel татах
        </Button>
      </div>
      <Card className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Огноо</th>
              <th className="px-4 py-2.5 font-medium">Овог, нэр</th>
              <th className="px-4 py-2.5 font-medium">Анги</th>
              <th className="px-4 py-2.5 text-right font-medium">Хоцорсон</th>
              <th className="px-4 py-2.5 font-medium">Хаанаас ирдэг</th>
              <th className="px-4 py-2.5 font-medium">Бүртгэсэн</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.slice(0, shown).map((r) => (
              <LogLine key={r.id} row={r} />
            ))}
          </tbody>
        </table>
        {rows.length > shown && (
          <div className="border-t border-border p-3 text-center">
            <Button variant="ghost" size="sm" onClick={() => setShown((n) => n + PAGE)}>
              Цааш харах ({rows.length - shown})
            </Button>
          </div>
        )}
      </Card>
    </section>
  );
}

function LogLine({ row: r }: { row: LogRow }) {
  const [pending, start] = useTransition();

  const remove = () => {
    if (!confirm(`${r.studentName} (${r.date})-ийн бүртгэлийг устгах уу?`)) return;
    start(async () => {
      const res = await deleteLate(r.id);
      if (res.ok) toast.success(res.message ?? "Устгагдлаа.");
      else toast.error(res.error);
    });
  };

  return (
    <tr className={cn("hover:bg-accent/30", pending && "opacity-50")}>
      <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted-foreground">
        {r.date.replaceAll("-", ".")}
      </td>
      <td className="px-4 py-2.5 font-medium">{r.studentName}</td>
      <td className="px-4 py-2.5">{r.classLabel}</td>
      <td className="px-4 py-2.5 text-right">
        <span className={cn("rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums", minutesTone(r.minutesLate))}>
          {r.minutesLate} мин
        </span>
      </td>
      <td className="px-4 py-2.5">{r.comesFrom}</td>
      <td className="px-4 py-2.5 text-muted-foreground">{r.recordedByName}</td>
      <td className="px-2 py-1.5">
        <Button variant="ghost" size="icon" onClick={remove} disabled={pending} aria-label="Устгах">
          <Trash2 className="text-muted-foreground" />
        </Button>
      </td>
    </tr>
  );
}
