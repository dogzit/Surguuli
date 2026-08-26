"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import * as XLSX from "xlsx";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Upload,
  Shuffle,
  CheckCircle2,
  Undo2,
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
  createSectionFromPool,
  createStudent,
  deleteStudent,
  importStudents,
  revertSection,
  updateStudent,
} from "@/app/actions/admin";

export interface AdminStudent {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  gender: string;
  attendance: number;
  gpa: number;
  chosen: boolean;
  previousClassroomId: string | null;
}

export interface AdminStudentClassroom {
  id: string;
  grade: number;
  section: string;
  label: string;
  headTeacher: string;
  room: string | null;
  capacity: number;
  status: string;
  students: AdminStudent[];
}

const SECTION_LETTERS = ["А", "Б", "В", "Г", "Д", "Е", "Ё", "Ж", "З", "И"];

export default function StudentsPanel({
  classrooms,
}: {
  classrooms: AdminStudentClassroom[];
}) {
  const grades = useMemo(() => {
    return Array.from(new Set(classrooms.map((c) => c.grade))).sort((a, b) => a - b);
  }, [classrooms]);

  const [activeGrade, setActiveGrade] = useState<number>(grades.includes(2) ? 2 : grades[0] ?? 1);
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();

  const [addOpen, setAddOpen] = useState<AdminStudentClassroom | null>(null);
  const [editOpen, setEditOpen] = useState<{ classroom: AdminStudentClassroom; student: AdminStudent } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminStudent | null>(null);
  const [importTarget, setImportTarget] = useState<AdminStudentClassroom | null>(null);
  const [shuffleOpen, setShuffleOpen] = useState(false);
  const [lastShuffleReport, setLastShuffleReport] = useState<{
    classroomId: string;
    label: string;
    count: number;
  } | null>(null);
  const [revertTarget, setRevertTarget] = useState<AdminStudentClassroom | null>(null);

  const runRevert = (classroom: AdminStudentClassroom) => {
    start(async () => {
      const res = await revertSection(classroom.id);
      if (res.ok) {
        toast.success(res.message ?? "Буцаагдлаа");
        setLastShuffleReport(null);
        setRevertTarget(null);
      } else toast.error(res.error);
    });
  };

  const inGrade = useMemo(
    () => classrooms.filter((c) => c.grade === activeGrade),
    [classrooms, activeGrade],
  );

  const filteredClassrooms = useMemo(() => {
    const needle = q.trim();
    if (!needle) return inGrade;
    return inGrade
      .map((c) => ({
        ...c,
        students: c.students.filter((s) =>
          matchesSearch(`${s.lastName} ${s.firstName} ${s.code}`, needle),
        ),
      }))
      .filter((c) => c.students.length > 0);
  }, [inGrade, q]);

  const totalInGrade = useMemo(
    () => inGrade.reduce((sum, c) => sum + c.students.length, 0),
    [inGrade],
  );

  const usedSectionLetters = new Set(inGrade.map((c) => c.section));
  const nextSectionLetter = SECTION_LETTERS.find((l) => !usedSectionLetters.has(l)) ?? "?";

  return (
    <div className="space-y-6">
      {/* Grade selector */}
      <div className="flex flex-wrap gap-1.5">
        {grades.map((g) => {
          const active = g === activeGrade;
          return (
            <button
              key={g}
              type="button"
              onClick={() => setActiveGrade(g)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                active
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-card hover:border-primary/20",
              )}
            >
              {g}-р анги
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 sm:flex-row sm:items-center">
        <div className="grid flex-1 grid-cols-2 gap-4 text-xs sm:max-w-xs">
          <Stat label="Бүлэг" value={inGrade.length} />
          <Stat label="Сурагч" value={totalInGrade} />
        </div>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Нэр эсвэл кодоор хайх…"
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShuffleOpen(true)} disabled={totalInGrade === 0}>
          <Shuffle className="h-4 w-4" />
          Шинэ бүлэг үүсгэх
        </Button>
      </div>

      {lastShuffleReport && (
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-300/50 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200 sm:flex-row sm:items-center">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            {lastShuffleReport.label} үүсгэгдэж, {lastShuffleReport.count} сурагч санамсаргүй байдлаар шилжүүлэгдлээ.
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => {
                const target = inGrade.find((c) => c.id === lastShuffleReport.classroomId);
                if (target) setRevertTarget(target);
              }}
            >
              <Undo2 className="h-3.5 w-3.5" />
              Буцаах
            </Button>
            <button
              type="button"
              onClick={() => setLastShuffleReport(null)}
              className="text-xs opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Classroom sections */}
      {filteredClassrooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
          {q ? "Хайлтад тохирох сурагч байхгүй." : `${activeGrade}-р ангид сурагч бүртгэгдээгүй байна.`}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClassrooms.map((c) => {
            const returnable = c.students.filter((s) => s.previousClassroomId).length;
            const canRevert = returnable > 0 && returnable === c.students.length;
            return (
              <div key={c.id} className="rounded-2xl border border-border/60 bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold">{c.label}</h3>
                      {c.status === "draft" && (
                        <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300">
                          Хуваарилалт
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Ахлах багш: <span className="text-foreground">{c.headTeacher}</span> · Өрөө:{" "}
                      <span className="text-foreground">{c.room ?? "—"}</span> · Багтаамж {c.capacity}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right text-xs text-muted-foreground">
                      <div className="tabular-nums text-foreground">
                        {c.students.length} сурагч
                      </div>
                    </div>
                    {canRevert && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRevertTarget(c)}
                        disabled={pending}
                        className="border-amber-400/50 text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10"
                      >
                        <Undo2 className="h-3.5 w-3.5" /> Буцаах
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setImportTarget(c)} disabled={pending}>
                      <Upload className="h-3.5 w-3.5" /> Excel
                    </Button>
                    <Button size="sm" onClick={() => setAddOpen(c)} disabled={pending}>
                      <Plus className="h-3.5 w-3.5" /> Нэмэх
                    </Button>
                  </div>
                </div>
                <div className="max-h-[420px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background/95 text-[10px] uppercase tracking-widest text-muted-foreground backdrop-blur">
                      <tr className="border-b border-border">
                        <th className="w-10 px-3 py-2 text-left font-semibold">№</th>
                        <th className="px-3 py-2 text-left font-semibold">Овог, нэр</th>
                        <th className="w-24 px-3 py-2 text-left font-semibold">Код</th>
                        <th className="w-14 px-3 py-2 text-center font-semibold">Х/О</th>
                        <th className="w-20 px-3 py-2 text-right font-semibold">Ирц</th>
                        <th className="w-16 px-3 py-2 text-right font-semibold">Дүн</th>
                        <th className="w-24 px-3 py-2 text-right font-semibold">Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {c.students.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-accent/40">
                          <td className="px-3 py-1.5 text-xs tabular-nums text-muted-foreground">
                            {String(idx + 1).padStart(2, "0")}
                          </td>
                          <td className="px-3 py-1.5">
                            <div className="font-medium">
                              {s.lastName}. {s.firstName}
                            </div>
                          </td>
                          <td className="px-3 py-1.5 text-xs font-mono text-muted-foreground">
                            {s.code}
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            <span
                              className={cn(
                                "inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold",
                                s.gender === "F"
                                  ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
                                  : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
                              )}
                            >
                              {s.gender === "F" ? "Ох" : "Хү"}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 text-right text-xs tabular-nums text-muted-foreground">
                            {s.attendance}%
                          </td>
                          <td className="px-3 py-1.5 text-right text-xs tabular-nums font-medium">
                            {s.gpa.toFixed(2)}
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => setEditOpen({ classroom: c, student: s })}
                                disabled={pending}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => setDeleteTarget(s)}
                                disabled={pending}
                                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add student */}
      <StudentDialog
        open={!!addOpen}
        onClose={() => setAddOpen(null)}
        mode="create"
        pending={pending}
        classroomLabel={addOpen?.label ?? ""}
        onSubmit={(data) => {
          if (!addOpen) return;
          start(async () => {
            const res = await createStudent({ classroomId: addOpen.id, ...data });
            if (res.ok) {
              toast.success(res.message ?? "Хадгалагдлаа");
              setAddOpen(null);
            } else toast.error(res.error);
          });
        }}
      />

      {/* Edit student */}
      <StudentDialog
        open={!!editOpen}
        onClose={() => setEditOpen(null)}
        mode="edit"
        pending={pending}
        classroomLabel={editOpen?.classroom.label ?? ""}
        initial={editOpen?.student}
        onSubmit={(data) => {
          if (!editOpen) return;
          start(async () => {
            const res = await updateStudent(editOpen.student.id, data);
            if (res.ok) {
              toast.success(res.message ?? "Хадгалагдлаа");
              setEditOpen(null);
            } else toast.error(res.error);
          });
        }}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && !pending && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Сурагч устгах уу?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">
                {deleteTarget?.lastName} {deleteTarget?.firstName}
              </span>{" "}
              устгагдаж, буцаах боломжгүй.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={pending}>
              Болих
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => {
                if (!deleteTarget) return;
                start(async () => {
                  const res = await deleteStudent(deleteTarget.id);
                  if (res.ok) {
                    toast.success(res.message ?? "Устгалаа");
                    setDeleteTarget(null);
                  } else toast.error(res.error);
                });
              }}
            >
              Устгах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excel import */}
      <ImportDialog
        target={importTarget}
        onClose={() => setImportTarget(null)}
        pending={pending}
        onImport={(rows, replace) => {
          if (!importTarget) return;
          start(async () => {
            const res = await importStudents(importTarget.id, rows, { replace });
            if (res.ok) {
              toast.success(res.message ?? "Импортлолоо");
              setImportTarget(null);
            } else toast.error(res.error);
          });
        }}
      />

      {/* Revert confirm */}
      <Dialog open={!!revertTarget} onOpenChange={(v) => !v && !pending && setRevertTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
              <Undo2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-center">Хуваарилалтыг буцаах уу?</DialogTitle>
            <DialogDescription className="text-center">
              <span className="font-medium text-foreground">{revertTarget?.label}</span> устгагдаж,{" "}
              {revertTarget?.students.length} сурагч анхны бүлэгтээ буцна.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button variant="outline" onClick={() => setRevertTarget(null)} disabled={pending}>
              Болих
            </Button>
            <Button
              disabled={pending}
              onClick={() => revertTarget && runRevert(revertTarget)}
            >
              <Undo2 className="h-4 w-4" /> Буцаах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shuffle → new section */}
      <ShuffleDialog
        open={shuffleOpen}
        onClose={() => setShuffleOpen(false)}
        pending={pending}
        grade={activeGrade}
        defaultSection={nextSectionLetter}
        maxPick={totalInGrade}
        onSubmit={(input) => {
          start(async () => {
            const res = await createSectionFromPool({ ...input, preferChosen: true });
            if (res.ok && res.data) {
              toast.success(`${res.data.movedCount} сурагчийг ${input.label} руу санамсаргүй хуваарилав.`);
              setShuffleOpen(false);
              setLastShuffleReport({
                classroomId: res.data.classroomId,
                label: input.label,
                count: res.data.movedCount,
              });
            } else if (!res.ok) toast.error(res.error);
          });
        }}
      />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "amber" }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "text-lg font-bold tabular-nums",
          tone === "amber" ? "text-amber-600 dark:text-amber-300" : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function StudentDialog({
  open,
  onClose,
  mode,
  pending,
  classroomLabel,
  initial,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  pending: boolean;
  classroomLabel: string;
  initial?: AdminStudent;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    gender: string;
    attendance: number;
    gpa: number;
    chosen?: boolean;
  }) => void;
}) {
  // Numeric fields are stored as strings so mid-edit values ("", "3.") don't reset to 0.
  const [form, setForm] = useState({
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    gender: initial?.gender ?? "F",
    attendance: String(initial?.attendance ?? 95),
    gpa: String(initial?.gpa ?? 3.5),
    chosen: initial?.chosen ?? false,
  });

  // Reset when target changes
  const key = initial?.id ?? "new";
  const lastKey = useRef(key);
  if (lastKey.current !== key) {
    lastKey.current = key;
    setForm({
      firstName: initial?.firstName ?? "",
      lastName: initial?.lastName ?? "",
      gender: initial?.gender ?? "F",
      attendance: String(initial?.attendance ?? 95),
      gpa: String(initial?.gpa ?? 3.5),
      chosen: initial?.chosen ?? false,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !pending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Сурагч нэмэх" : "Сурагч засах"}</DialogTitle>
          <DialogDescription>{classroomLabel}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Овог</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="Батбаяр"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Нэр</Label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="Тэмүүлэн"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Хүйс</Label>
              <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="F">Эмэгтэй</SelectItem>
                  <SelectItem value="M">Эрэгтэй</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ирц %</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.attendance}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    attendance: e.target.value.replace(/[^\d]/g, "").slice(0, 3),
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>GPA</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={form.gpa}
                onChange={(e) => {
                  const v = e.target.value.replace(",", ".").replace(/[^0-9.]/g, "");
                  // keep at most one dot
                  const parts = v.split(".");
                  const cleaned = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : v;
                  setForm((f) => ({ ...f, gpa: cleaned.slice(0, 5) }));
                }}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <input
              type="checkbox"
              checked={form.chosen}
              onChange={(e) => setForm((f) => ({ ...f, chosen: e.target.checked }))}
              className="h-4 w-4"
            />
            <span className="text-muted-foreground">Дараагийн хуваарилалтын нөөцөд оруулах</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Болих
          </Button>
          <Button
            disabled={pending || !form.firstName || !form.lastName}
            onClick={() =>
              onSubmit({
                firstName: form.firstName,
                lastName: form.lastName,
                gender: form.gender,
                attendance: Number(form.attendance) || 0,
                gpa: Number(form.gpa) || 0,
                chosen: form.chosen,
              })
            }
          >
            {mode === "create" ? "Нэмэх" : "Хадгалах"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShuffleDialog({
  open,
  onClose,
  pending,
  grade,
  defaultSection,
  maxPick,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  pending: boolean;
  grade: number;
  defaultSection: string;
  maxPick: number;
  onSubmit: (input: {
    grade: number;
    section: string;
    label: string;
    headTeacher: string;
    room?: string;
    capacity?: number;
    pickCount: number;
  }) => void;
}) {
  const [form, setForm] = useState({
    section: defaultSection,
    label: `${grade}${defaultSection} анги`,
    headTeacher: "",
    room: "",
    capacity: "32",
    pickCount: String(Math.min(28, maxPick)),
  });

  // Reset when opened / grade changes
  const key = `${grade}-${defaultSection}-${open ? "1" : "0"}`;
  const lastKey = useRef(key);
  if (lastKey.current !== key) {
    lastKey.current = key;
    setForm({
      section: defaultSection,
      label: `${grade}${defaultSection} анги`,
      headTeacher: "",
      room: "",
      capacity: "32",
      pickCount: String(Math.min(28, maxPick)),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !pending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{grade}-р ангид шинэ бүлэг үүсгэх</DialogTitle>
          <DialogDescription>
            Одоо байгаа {maxPick} сурагчаас санамсаргүй сонгож шинэ бүлэгт шилжүүлнэ.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Бүлэг</Label>
              <Input
                value={form.section}
                maxLength={2}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    section: e.target.value.toUpperCase(),
                    label: `${grade}${e.target.value.toUpperCase()} анги`,
                  }))
                }
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Ангийн нэр</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Ахлах багш</Label>
            <Input
              value={form.headTeacher}
              onChange={(e) => setForm((f) => ({ ...f, headTeacher: e.target.value }))}
              placeholder="А. Дэлгэрмөрөн"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Өрөө</Label>
              <Input
                value={form.room}
                onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                placeholder="212 тоот"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Багтаамж</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.capacity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, capacity: e.target.value.replace(/[^\d]/g, "").slice(0, 3) }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Хэдэн сурагч?</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.pickCount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pickCount: e.target.value.replace(/[^\d]/g, "").slice(0, 3) }))
                }
              />
              <p className="text-[10px] text-muted-foreground">Хамгийн ихдээ {maxPick}</p>
            </div>
          </div>
          <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
            Хуваарилалт нь одоо байгаа бүх бүлгээс санамсаргүй байдлаар сонгож,
            баталгаажуулсны дараа шинэ бүлэгт шилжүүлнэ.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Болих
          </Button>
          <Button
            disabled={
              pending ||
              !form.section ||
              !form.headTeacher ||
              (Number(form.pickCount) || 0) < 1
            }
            onClick={() =>
              onSubmit({
                grade,
                section: form.section,
                label: form.label,
                headTeacher: form.headTeacher,
                room: form.room || undefined,
                capacity: Number(form.capacity) || 32,
                pickCount: Number(form.pickCount) || 1,
              })
            }
          >
            <Shuffle className="h-4 w-4" /> Санамсаргүй хуваарилах
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ParsedImportRow {
  firstName: string;
  lastName: string;
  gender?: string;
  chosen?: boolean;
  code?: string;
}

function ImportDialog({
  target,
  onClose,
  pending,
  onImport,
}: {
  target: AdminStudentClassroom | null;
  onClose: () => void;
  pending: boolean;
  onImport: (rows: ParsedImportRow[], replace: boolean) => void;
}) {
  const [rows, setRows] = useState<ParsedImportRow[]>([]);
  const [replace, setReplace] = useState(true);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setParsing(true);
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellStyles: true });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) throw new Error("Sheet олдсонгүй");
      const ws = wb.Sheets[sheetName]!;
      const ref = ws["!ref"];
      if (!ref) throw new Error("Хоосон sheet");
      const range = XLSX.utils.decode_range(ref);

      // Find header row (looks for "Овог")
      let headerRow = range.s.r + 2;
      for (let R = range.s.r; R <= Math.min(range.e.r, 5); R++) {
        for (let C = range.s.c; C <= Math.min(range.e.c, 3); C++) {
          const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })] as XLSX.CellObject | undefined;
          if (cell && String(cell.v ?? "").trim() === "Овог") {
            headerRow = R;
            break;
          }
        }
      }

      const parsed: ParsedImportRow[] = [];
      for (let R = headerRow + 1; R <= range.e.r; R++) {
        const lastCell = ws[XLSX.utils.encode_cell({ r: R, c: 1 })] as XLSX.CellObject | undefined;
        const firstCell = ws[XLSX.utils.encode_cell({ r: R, c: 2 })] as XLSX.CellObject | undefined;
        const genderCell = ws[XLSX.utils.encode_cell({ r: R, c: 3 })] as XLSX.CellObject | undefined;
        const addrCell = ws[XLSX.utils.encode_cell({ r: R, c: 4 })] as XLSX.CellObject | undefined;
        const firstName = String(firstCell?.v ?? "").trim();
        if (!firstName) continue;
        const lastName = String(lastCell?.v ?? "").trim() || "-";
        const genderRaw = String(genderCell?.v ?? "").toLowerCase();
        const gender = genderRaw.startsWith("эм") || genderRaw === "f" ? "F" : "M";

        const chosen = [lastCell, firstCell, addrCell].some((c) => {
          const s = c?.s as { fgColor?: { rgb?: string }; bgColor?: { rgb?: string } } | undefined;
          const rgb = s?.fgColor?.rgb ?? s?.bgColor?.rgb;
          return rgb ? ["FFFF00", "FFFFFF00"].includes(rgb.toUpperCase()) : false;
        });

        parsed.push({ firstName, lastName, gender, chosen });
      }
      setRows(parsed);
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setParsing(false);
    }
  }

  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && !pending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Excel-ээс сурагч импортлох</DialogTitle>
          <DialogDescription>{target?.label}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
          <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={pending || parsing}>
            <Upload className="h-4 w-4" />
            {parsing ? "Уншиж байна…" : "Excel файл сонгох"}
          </Button>
          {fileName && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
              <div className="font-medium text-foreground">{fileName}</div>
              <div className="mt-1 text-muted-foreground">{rows.length} сурагч уншигдав</div>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={replace}
              onChange={(e) => setReplace(e.target.checked)}
              className="h-4 w-4"
            />
            <span>Одоогийн сурагчдыг үлдээхгүй, дараад солих</span>
          </label>
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">Excel-ийн бүтэц</summary>
            <p className="mt-2">
              Хүлээн авах баганууд: <code>№</code>, <code>Овог</code>, <code>Нэр</code>, <code>Хүйс</code>,{" "}
              <code>Гэрийн хаяг</code>.
            </p>
          </details>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Болих
          </Button>
          <Button disabled={pending || rows.length === 0} onClick={() => onImport(rows, replace)}>
            {rows.length > 0 ? `${rows.length} сурагч импортлох` : "Файл сонгоно уу"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
