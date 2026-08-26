"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  DoorOpen,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, matchesSearch } from "@/lib/utils";
import {
  createClassroom,
  updateClassroom,
  deleteClassroom,
} from "@/app/actions/admin";

export interface AdminClassroom {
  id: string;
  grade: number;
  section: string;
  label: string;
  headTeacher: string;
  room: string | null;
  capacity: number;
  studentCount: number;
  status: string;
}

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);
const SECTIONS = ["А", "Б", "В", "Г", "Д", "Е", "Ё", "Ж"];

interface FormState {
  grade: number;
  section: string;
  label: string;
  headTeacher: string;
  room: string;
  // Numeric fields kept as strings so mid-edit values ("") don't collapse to 0.
  capacity: string;
  studentCount: string;
}

const EMPTY_FORM: FormState = { grade: 1, section: "А", label: "", headTeacher: "", room: "", capacity: "32", studentCount: "0" };

export default function ClassroomPanel({ classrooms }: { classrooms: AdminClassroom[] }) {
  const [q, setQ] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [pending, start] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminClassroom | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminClassroom | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const stats = useMemo(() => ({
    total: classrooms.length,
    totalStudents: classrooms.reduce((s, c) => s + c.studentCount, 0),
    totalCapacity: classrooms.reduce((s, c) => s + c.capacity, 0),
    avgOccupancy: classrooms.length > 0
      ? Math.round(classrooms.reduce((s, c) => s + (c.capacity > 0 ? c.studentCount / c.capacity : 0), 0) / classrooms.length * 100)
      : 0,
  }), [classrooms]);

  const filtered = useMemo(() => {
    const needle = q.trim();
    return classrooms.filter((c) => {
      if (gradeFilter !== "all" && c.grade !== Number(gradeFilter)) return false;
      if (!needle) return true;
      const hay = `${c.label} ${c.headTeacher} ${c.room ?? ""} ${c.grade}${c.section}`;
      return matchesSearch(hay, needle);
    });
  }, [classrooms, q, gradeFilter]);

  const gradeStats = useMemo(() => {
    const map = new Map<number, { count: number; students: number; capacity: number }>();
    for (const c of classrooms) {
      const existing = map.get(c.grade) ?? { count: 0, students: 0, capacity: 0 };
      existing.count++;
      existing.students += c.studentCount;
      existing.capacity += c.capacity;
      map.set(c.grade, existing);
    }
    return map;
  }, [classrooms]);

  const openCreate = () => { setForm(EMPTY_FORM); setCreateOpen(true); };
  const openEdit = (c: AdminClassroom) => {
    setEditing(c);
    setForm({ grade: c.grade, section: c.section, label: c.label, headTeacher: c.headTeacher, room: c.room ?? "", capacity: String(c.capacity), studentCount: String(c.studentCount) });
  };

  const handleCreate = () => {
    start(async () => {
      const res = await createClassroom({
        grade: form.grade,
        section: form.section,
        label: form.label,
        headTeacher: form.headTeacher,
        room: form.room,
        capacity: Number(form.capacity) || 32,
        studentCount: Number(form.studentCount) || 0,
      });
      if (res.ok) { toast.success(res.message ?? "Үүсгэлээ"); setCreateOpen(false); }
      else toast.error(res.error);
    });
  };

  const handleUpdate = () => {
    if (!editing) return;
    start(async () => {
      const res = await updateClassroom(editing.id, { label: form.label, headTeacher: form.headTeacher, room: form.room || null, capacity: Number(form.capacity) || 0, studentCount: Number(form.studentCount) || 0 });
      if (res.ok) { toast.success(res.message ?? "Хадгаллаа"); setEditing(null); }
      else toast.error(res.error);
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    start(async () => {
      const res = await deleteClassroom(deleteTarget.id);
      if (res.ok) { toast.success(res.message ?? "Устгалаа"); setDeleteTarget(null); }
      else toast.error(res.error);
    });
  };

  const updateForm = (k: keyof FormState, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Ангиуд" value={stats.total} color="text-cyan-500 bg-cyan-500/10" />
        <StatCard icon={<Users className="h-5 w-5" />} label="Сурагчид" value={stats.totalStudents} color="text-blue-500 bg-blue-500/10" />
        <StatCard icon={<DoorOpen className="h-5 w-5" />} label="Багтаамж" value={stats.totalCapacity} color="text-emerald-500 bg-emerald-500/10" />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Дундаж ачаалал" value={`${stats.avgOccupancy}%`} color="text-violet-500 bg-violet-500/10" />
      </div>

      {/* Occupancy overview bar */}
      <div className="mb-6 rounded-2xl border border-border/50 bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold">Анги бүрийн ачаалал</h3>
        <div className="flex gap-1">
          {classrooms.map((c) => {
            const pct = c.capacity > 0 ? Math.round((c.studentCount / c.capacity) * 100) : 0;
            return (
              <div
                key={c.id}
                title={`${c.label}: ${c.studentCount}/${c.capacity} (${pct}%)`}
                className="group relative flex-1"
              >
                <div className="h-8 rounded bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      pct >= 90 ? "bg-amber-500" : pct >= 70 ? "bg-emerald-500" : "bg-blue-400",
                    )}
                    style={{ height: `${Math.max(pct, 5)}%`, marginTop: "auto" }}
                  />
                </div>
                <div className="mt-1 text-center text-[9px] font-medium text-muted-foreground">
                  {c.grade}{c.section}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground/60">
          <span>🔵 &lt;70%</span>
          <span>🟢 70-89%</span>
          <span>🟡 90%+</span>
        </div>
      </div>

      {/* Grade filter chips */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setGradeFilter("all")}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
            gradeFilter === "all" ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/20",
          )}
        >
          Бүгд ({classrooms.length})
        </button>
        {GRADES.map((g) => {
          const s = gradeStats.get(g);
          return (
            <button
              key={g}
              type="button"
              onClick={() => setGradeFilter(gradeFilter === String(g) ? "all" : String(g))}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                gradeFilter === String(g) ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/20",
              )}
            >
              {g}-р ({s?.count ?? 0})
            </button>
          );
        })}
      </div>

      {/* Search + Create */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Анги, багш, өрөөгөөр хайх..." className="pl-9" />
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Анги нэмэх
        </Button>
      </div>

      <div className="mb-3 text-xs text-muted-foreground tabular-nums">
        {filtered.length} / {classrooms.length} анги
      </div>

      {/* Classroom Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const fillPct = c.capacity > 0 ? Math.round((c.studentCount / c.capacity) * 100) : 0;
          return (
            <div key={c.id} className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white",
                    fillPct >= 90 ? "bg-amber-500" : fillPct >= 70 ? "bg-emerald-500" : "bg-blue-500",
                  )}>
                    <span className="text-lg">{c.grade}</span>
                    <span className="text-xs">{c.section}</span>
                  </div>
                  <div>
                    <div className="font-semibold">{c.label}</div>
                    <div className="text-xs text-muted-foreground">{c.headTeacher}</div>
                  </div>
                </div>
                <div className="text-right text-lg font-bold tabular-nums">{fillPct}%</div>
              </div>

              {/* Occupancy bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    fillPct >= 90 ? "bg-amber-500" : fillPct >= 70 ? "bg-emerald-500" : "bg-blue-400",
                  )}
                  style={{ width: `${Math.min(fillPct, 100)}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>🏠 {c.room ?? "Тодорхойгүй"}</span>
                <span>{c.studentCount}/{c.capacity} сурагч</span>
              </div>

              <div className="mt-3 flex gap-1 border-t border-border/50 pt-3 opacity-50 transition-opacity group-hover:opacity-100">
                <Button size="xs" variant="outline" onClick={() => openEdit(c)} disabled={pending} className="flex-1">
                  <Pencil className="mr-1 h-3 w-3" /> Засах
                </Button>
                <Button size="xs" variant="outline" onClick={() => setDeleteTarget(c)} disabled={pending}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
            Анги олдсонгүй
          </div>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={createOpen} onOpenChange={(v) => !v && !pending && setCreateOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Шинэ анги нэмэх</DialogTitle>
            <DialogDescription>Ангийн мэдээллийг бөглөнө үү.</DialogDescription>
          </DialogHeader>
          <ClassroomForm form={form} updateForm={updateForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={pending}>Болих</Button>
            <Button onClick={handleCreate} disabled={pending || !form.label || !form.headTeacher}>Үүсгэх</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(v) => !v && !pending && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Анги засах</DialogTitle>
            <DialogDescription>{editing?.label} ангийн мэдээллийг шинэчилнэ үү.</DialogDescription>
          </DialogHeader>
          <ClassroomForm form={form} updateForm={updateForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={pending}>Болих</Button>
            <Button onClick={handleUpdate} disabled={pending || !form.label || !form.headTeacher}>Хадгалах</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && !pending && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-center">Анги устгах уу?</DialogTitle>
            <DialogDescription className="text-center">
              <span className="font-medium text-foreground">{deleteTarget?.label}</span> устгагдах болно.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={pending}>Болих</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>Устгах</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-center gap-2">
        <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>{icon}</div>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{typeof value === "number" ? value.toLocaleString() : value}</div>
    </div>
  );
}

function ClassroomForm({ form, updateForm }: { form: FormState; updateForm: (k: keyof FormState, v: string | number) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Анги</Label>
          <Select value={String(form.grade)} onValueChange={(v) => updateForm("grade", Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{GRADES.map((g) => <SelectItem key={g} value={String(g)}>{g}-р анги</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Бүлэг</Label>
          <Select value={form.section} onValueChange={(v) => updateForm("section", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SECTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5"><Label>Ангийн нэр</Label><Input value={form.label} onChange={(e) => updateForm("label", e.target.value)} placeholder="1А анги" /></div>
      <div className="space-y-1.5"><Label>Ангийн багш</Label><Input value={form.headTeacher} onChange={(e) => updateForm("headTeacher", e.target.value)} placeholder="Б. Мөнхцэцэг" /></div>
      <div className="space-y-1.5"><Label>Өрөө</Label><Input value={form.room} onChange={(e) => updateForm("room", e.target.value)} placeholder="204 тоот" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Багтаамж</Label>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.capacity}
            onChange={(e) => updateForm("capacity", e.target.value.replace(/[^\d]/g, "").slice(0, 3))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Сурагчийн тоо</Label>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.studentCount}
            onChange={(e) => updateForm("studentCount", e.target.value.replace(/[^\d]/g, "").slice(0, 3))}
          />
        </div>
      </div>
    </div>
  );
}
