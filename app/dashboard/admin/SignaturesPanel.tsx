"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteSignature } from "@/app/actions/admin";

export interface AdminSignature {
  id: string;
  note: string | null;
  createdAt: string;
  teacher: { id: string; name: string; position: string };
  approver: { id: string; name: string; position: string };
}

export default function SignaturesPanel({ signatures }: { signatures: AdminSignature[] }) {
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<AdminSignature | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return signatures;
    return signatures.filter(
      (s) =>
        s.teacher.name.toLowerCase().includes(needle) ||
        s.approver.name.toLowerCase().includes(needle) ||
        s.teacher.position.toLowerCase().includes(needle) ||
        s.approver.position.toLowerCase().includes(needle) ||
        (s.note?.toLowerCase().includes(needle) ?? false),
    );
  }, [signatures, q]);

  const handleDelete = () => {
    if (!target) return;
    start(async () => {
      const res = await deleteSignature(target.id);
      if (res.ok) {
        toast.success(res.message ?? "Устгалаа");
        setTarget(null);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Багш, баталгаажуулагч, тайлбараар хайх..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="mb-2 text-xs text-muted-foreground tabular-nums">
        {filtered.length} / {signatures.length} гарын үсэг
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full">
          <thead className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Багш</th>
              <th className="px-4 py-3 text-left">Баталгаажуулагч</th>
              <th className="hidden px-4 py-3 text-left lg:table-cell">Тайлбар</th>
              <th className="hidden px-4 py-3 text-left md:table-cell">Огноо</th>
              <th className="w-20 px-4 py-3 text-right">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {filtered.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-medium">{s.teacher.name}</div>
                  <div className="text-xs text-muted-foreground">{s.teacher.position}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{s.approver.name}</div>
                  <div className="text-xs text-muted-foreground">{s.approver.position}</div>
                </td>
                <td className="hidden max-w-xs px-4 py-3 lg:table-cell">
                  {s.note ? (
                    <div className="flex items-start gap-1.5 text-xs">
                      <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="truncate">{s.note}</span>
                    </div>
                  ) : (
                    <span className="text-xs italic text-muted-foreground/60">—</span>
                  )}
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-muted-foreground md:table-cell">
                  {new Date(s.createdAt).toLocaleString("mn-MN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setTarget(s)}
                    disabled={pending}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Гарын үсэг олдсонгүй
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!target} onOpenChange={(v) => !v && !pending && setTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-center">Гарын үсэг устгах уу?</DialogTitle>
            <DialogDescription className="text-center">
              <span className="font-medium text-foreground">{target?.approver.name}</span>-ийн{" "}
              <span className="font-medium text-foreground">{target?.teacher.name}</span>-д
              зурсан үсэг устах болно.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button variant="outline" onClick={() => setTarget(null)} disabled={pending}>
              Болих
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>
              Устгах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
