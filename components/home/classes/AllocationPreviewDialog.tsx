"use client";

import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Classroom } from "./types";

export interface AllocationPreview {
  classroom: Classroom;
  totalPool: number;
  sampledAt: Date;
}

interface Props {
  preview: AllocationPreview | null;
  onClose: () => void;
  onConfirm: () => void;
}

function formatTime(d: Date): string {
  return d.toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AllocationPreviewDialog({ preview, onClose, onConfirm }: Props) {
  const open = preview !== null;
  const classroom = preview?.classroom;
  const girls = classroom?.students.filter((s) => s.gender === "F").length ?? 0;
  const boys = classroom ? classroom.students.length - girls : 0;

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : null)}>
      <DialogContent className="max-w-2xl p-0">
        <div className="border-b border-border bg-primary/[0.05] px-6 py-5">
          <DialogHeader className="space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
              Хуваарилалтын урьдчилсан үр дүн
            </div>
            <DialogTitle className="text-xl">
              {classroom?.label ?? "Шинэ бүлэг"}
            </DialogTitle>
            <DialogDescription>
              Санамсаргүй сонголтын протокол №{" "}
              <span className="font-mono text-foreground">
                RND-
                {preview ? preview.sampledAt.getTime().toString(36).toUpperCase() : "---"}
              </span>
            </DialogDescription>
          </DialogHeader>
        </div>

        {classroom && preview && (
          <div className="px-6 pb-6 pt-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricPill label="Сонгогдсон" value={classroom.students.length} />
              <MetricPill label="Нийт сан" value={preview.totalPool} />
              <MetricPill label="Охин / Хүү" value={`${girls} / ${boys}`} />
              <MetricPill label="Кабинет" value={classroom.room} mono />
            </div>

            <div className="mt-4 rounded-md border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-foreground">Ахлах багш:</span>{" "}
                  {classroom.headTeacher}
                </div>
                <div>
                  Огноо:{" "}
                  <span className="tabular-nums">{formatTime(preview.sampledAt)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 max-h-64 overflow-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/40 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="w-10 px-3 py-2 text-left">№</th>
                    <th className="px-3 py-2 text-left">Овог, нэр</th>
                    <th className="w-24 px-3 py-2 text-left">Код</th>
                    <th className="w-16 px-3 py-2 text-center">Х/О</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {classroom.students.map((s, i) => (
                    <tr key={s.id}>
                      <td className="px-3 py-1.5 text-xs tabular-nums text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </td>
                      <td className="px-3 py-1.5 text-foreground">
                        {s.lastName.charAt(0)}. {s.firstName}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-[11px] uppercase text-muted-foreground">
                        {s.code}
                      </td>
                      <td className="px-3 py-1.5 text-center text-[10px] font-semibold text-muted-foreground">
                        {s.gender === "F" ? "Ох" : "Хү"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <span className="font-semibold">Санамж.</span> Уг үр дүн нь урьдчилсан
              төлөвт байна. Батлагдсанаар шинэ бүлэг албан ёсны бүртгэлд орно.
            </div>

            <DialogFooter className="mt-5">
              <Button type="button" variant="outline" onClick={onClose}>
                Цуцлах
              </Button>
              <Button type="button" onClick={onConfirm}>
                <CheckCircle2 className="h-4 w-4" />
                Батлаж бүртгэх
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MetricPill({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={
          "mt-0.5 text-lg font-bold text-foreground tabular-nums " +
          (mono ? "font-mono text-base" : "")
        }
      >
        {value}
      </div>
    </div>
  );
}
