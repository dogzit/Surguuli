"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Search, Trash2, MessageSquare, CheckCircle2, Clock,
  TrendingUp, FileSignature, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { deleteSignature } from "@/app/actions/admin";
import { matchesSearch, cn } from "@/lib/utils";

export interface AdminSignature {
  id: string;
  note: string | null;
  createdAt: string;
  teacher: { id: string; name: string; position: string };
  approver: { id: string; name: string; position: string };
}

const APPROVER_COLORS: Record<string, string> = {
  "Захирал": "bg-amber-500",
  "Нярав": "bg-emerald-500",
  "Нятай": "bg-cyan-500",
  "Мэргэжилтэн": "bg-violet-500",
  "Багш нарын зөвлөлийн дарга": "bg-pink-500",
  "Эцэг эхийн төлөөлөл": "bg-indigo-500",
  "Сургуулийн захиргааны ажилтан": "bg-rose-500",
};

function getApproverColor(position: string) {
  return APPROVER_COLORS[position] ?? "bg-muted-foreground";
}

export default function SignaturesPanel({ signatures }: { signatures: AdminSignature[] }) {
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<AdminSignature | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [view, setView] = useState<"table" | "timeline">("table");

  const stats = useMemo(() => {
    const byApprover = new Map<string, number>();
    const byTeacher = new Map<string, Set<string>>();
    for (const s of signatures) {
      byApprover.set(s.approver.position, (byApprover.get(s.approver.position) ?? 0) + 1);
      const set = byTeacher.get(s.teacher.name) ?? new Set();
      set.add(s.approver.position);
      byTeacher.set(s.teacher.name, set);
    }
    return { byApprover, byTeacher };
  }, [signatures]);

  const filtered = useMemo(() => {
    const needle = q.trim();
    if (!needle) return signatures;
    return signatures.filter((s) => {
      const hay = `${s.teacher.name} ${s.approver.name} ${s.teacher.position} ${s.approver.position} ${s.note ?? ""}`;
      return matchesSearch(hay, needle);
    });
  }, [signatures, q]);

  const handleDelete = () => {
    if (!target) return;
    start(async () => {
      const res = await deleteSignature(target.id);
      if (res.ok) { toast.success(res.message ?? "Устгалаа"); setTarget(null); }
      else toast.error(res.error);
    });
  };

  return (
    <div>
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-border/50 bg-emerald-50 p-4 dark:bg-emerald-500/10">
          <div className="flex items-center gap-2"><FileSignature className="h-4 w-4 text-emerald-500" /><span className="text-xs font-medium text-muted-foreground">Нийт</span></div>
          <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{signatures.length}</div>
        </div>
        <div className="rounded-xl border border-border/50 bg-blue-50 p-4 dark:bg-blue-500/10">
          <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500" /><span className="text-xs font-medium text-muted-foreground">Баталгаажуулагчид</span></div>
          <div className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.byApprover.size}</div>
        </div>
        <div className="rounded-xl border border-border/50 bg-violet-50 p-4 dark:bg-violet-500/10">
          <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-violet-500" /><span className="text-xs font-medium text-muted-foreground">Нийт багш</span></div>
          <div className="mt-1 text-2xl font-bold text-violet-600 dark:text-violet-400">{stats.byTeacher.size}</div>
        </div>
        <div className="rounded-xl border border-border/50 bg-amber-50 p-4 dark:bg-amber-500/10">
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" /><span className="text-xs font-medium text-muted-foreground">Сүүлийн 24цаг</span></div>
          <div className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {signatures.filter((s) => Date.now() - new Date(s.createdAt).getTime() < 86400000).length}
          </div>
        </div>
      </div>

      {/* Search + View Toggle */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Хайх..." className="pl-9" />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-muted p-0.5">
          <button type="button" onClick={() => setView("table")} className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", view === "table" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>Хүснэгт</button>
          <button type="button" onClick={() => setView("timeline")} className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", view === "timeline" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>Цагийн шугам</button>
        </div>
      </div>

      <div className="mb-3 text-xs text-muted-foreground tabular-nums">{filtered.length} / {signatures.length} гарын үсэг</div>

      {/* Table View */}
      {view === "table" && (
        <div className="space-y-2">
          {filtered.map((s) => {
            const isExpanded = expandedId === s.id;
            return (
              <div key={s.id} className="group rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                {/* Clickable row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  className="flex cursor-pointer items-center gap-3 p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-xs font-bold text-sky-500">
                    {s.teacher.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{s.teacher.name}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full shrink-0", getApproverColor(s.approver.position))} />
                        <span className="truncate font-medium text-primary">{s.approver.name}</span>
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{s.teacher.position}</span>
                      {s.note && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <MessageSquare className="h-3 w-3" /> Тайлбар байна
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {new Date(s.createdAt).toLocaleString("mn-MN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                    <Button size="xs" variant="outline" onClick={() => setTarget(s)} disabled={pending} className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} />
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border/50 bg-muted/20 px-4 py-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-3">
                        <div className="rounded-lg bg-sky-50 p-3 dark:bg-sky-500/10">
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Багш</div>
                          <div className="font-medium">{s.teacher.name}</div>
                          <div className="text-xs text-muted-foreground">{s.teacher.position}</div>
                        </div>
                        <div className="rounded-lg bg-primary/5 p-3">
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Баталгаажуулагч</div>
                          <div className="flex items-center gap-2">
                            <span className={cn("h-2.5 w-2.5 rounded-full", getApproverColor(s.approver.position))} />
                            <div>
                              <div className="font-medium">{s.approver.name}</div>
                              <div className="text-xs text-muted-foreground">{s.approver.position}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="rounded-lg bg-muted/50 p-3">
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Огноо</div>
                          <div className="font-medium tabular-nums">
                            {new Date(s.createdAt).toLocaleString("mn-MN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        {s.note && (
                          <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-500/10">
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Тайлбар</div>
                            <div className="text-sm text-muted-foreground">💬 {s.note}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline View */}
      {view === "timeline" && (
        <div className="space-y-3">
          {filtered.map((s, idx) => (
            <div key={s.id} className="flex gap-4 cursor-pointer group" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
              <div className="flex flex-col items-center">
                <div className={cn("h-3 w-3 rounded-full border-2 border-background", getApproverColor(s.approver.position))} />
                {idx < filtered.length - 1 && <div className="w-px flex-1 bg-border" />}
              </div>
              <div className="flex-1 rounded-xl border border-border bg-card p-4 shadow-sm transition-all group-hover:border-primary/20 group-hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      <span className="text-foreground">{s.approver.name}</span>
                      <span className="mx-1.5 text-muted-foreground">→</span>
                      <span className="text-primary">{s.teacher.name}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{s.approver.position} · {s.teacher.position}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {new Date(s.createdAt).toLocaleString("mn-MN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <Button size="xs" variant="outline" onClick={(e) => { e.stopPropagation(); setTarget(s); }} disabled={pending} className="border-destructive/30 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {expandedId === s.id && s.note && (
                  <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">💬 {s.note}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!target} onOpenChange={(v) => !v && !pending && setTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-center">Гарын үсэг устгах уу?</DialogTitle>
            <DialogDescription className="text-center">
              <span className="font-medium text-foreground">{target?.approver.name}</span>-ийн{" "}
              <span className="font-medium text-foreground">{target?.teacher.name}</span>-д зурсан үсэг устах болно.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button variant="outline" onClick={() => setTarget(null)} disabled={pending}>Болих</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>Устгах</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
