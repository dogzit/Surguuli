"use client";

import { useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Copy,
  KeyRound,
  Printer,
  RefreshCcw,
  Sparkles,
  Trash2,
  UserPlus,
  UserCheck,
  X,
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
import { cn, matchesSearch } from "@/lib/utils";
import {
  createInviteCode,
  regenerateClassroomPins,
  regenerateOneStudentPin,
  revokeInviteCode,
} from "@/app/actions/access";

export interface ClassroomRow {
  id: string;
  grade: number;
  section: string;
  label: string;
  headTeacher: string;
  students: StudentRow[];
}

export interface StudentRow {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  hasPin: boolean;
  loginAt: string | null;
  parentCount: number;
  openInviteCount: number;
}

export interface InviteRow {
  id: string;
  code: string;
  relation: string | null;
  expiresAt: string | null;
  createdAt: string;
  student: { code: string; name: string };
}

// Plaintext PINs live only in this popup, in browser memory, from the
// moment the server hashed them until the admin closes the dialog.
type PinReveal = {
  classroomLabel: string;
  items: Array<{ id: string; code: string; firstName: string; lastName: string; pin: string }>;
} | null;

// Same for invite codes — one at a time.
type InviteReveal = {
  code: string;
  studentName: string;
  expiresAt: string | null;
} | null;

export default function AccessPanel({
  classrooms,
  invites,
}: {
  classrooms: ClassroomRow[];
  invites: InviteRow[];
}) {
  const [q, setQ] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [pinReveal, setPinReveal] = useState<PinReveal>(null);
  const [inviteReveal, setInviteReveal] = useState<InviteReveal>(null);
  const [inviteTarget, setInviteTarget] = useState<{ studentId: string; studentName: string } | null>(
    null,
  );

  const filtered = useMemo(() => {
    if (!q.trim()) return classrooms;
    const needle = q;
    return classrooms
      .map((c) => ({
        ...c,
        students: c.students.filter((s) =>
          matchesSearch(`${s.lastName} ${s.firstName} ${s.code}`, needle),
        ),
      }))
      .filter((c) => c.students.length > 0 || matchesSearch(c.label, needle));
  }, [classrooms, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Анги, сурагч, кодоор хайх…"
          className="h-11 rounded-xl sm:max-w-md"
        />
      </div>

      {/* Classrooms */}
      <div className="space-y-3">
        {filtered.map((c) => {
          const withPin = c.students.filter((s) => s.hasPin).length;
          const linked = c.students.filter((s) => s.parentCount > 0).length;
          const isOpen = expandedId === c.id;
          return (
            <div
              key={c.id}
              className={cn(
                "overflow-hidden rounded-2xl border bg-card transition-all",
                isOpen ? "border-amber-500/30 shadow-lg" : "border-border/40 hover:border-amber-500/20",
              )}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : c.id)}
                className="flex w-full items-center gap-4 p-4 text-left"
              >
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-600 dark:text-amber-400">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-foreground">{c.label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Ангийн багш: <span className="text-foreground">{c.headTeacher}</span>
                  </div>
                </div>
                <div className="hidden gap-4 text-right text-xs sm:flex">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Сурагч
                    </div>
                    <div className="font-bold tabular-nums">{c.students.length}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      PIN
                    </div>
                    <div className="font-bold tabular-nums">
                      {withPin}/{c.students.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Эцэг эх
                    </div>
                    <div className="font-bold tabular-nums">
                      {linked}/{c.students.length}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending || c.students.length === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!confirm(`${c.label}-ийн БҮХ сурагчийн PIN шинэчлэх үү? Хуучин PIN идэвхгүй болно.`)) return;
                    start(async () => {
                      const res = await regenerateClassroomPins(c.id);
                      if (res.ok && res.data) {
                        setPinReveal(res.data);
                        toast.success(res.message ?? "Хийгдлээ");
                      } else if (!res.ok) toast.error(res.error);
                    });
                  }}
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Ангийн PIN
                </Button>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-5 w-5 text-muted-foreground/40" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="border-t border-border/50 bg-muted/20">
                      <table className="w-full text-sm">
                        <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          <tr className="border-b border-border/40">
                            <th className="px-3 py-2 text-left font-semibold">№</th>
                            <th className="px-3 py-2 text-left font-semibold">Овог, нэр</th>
                            <th className="px-3 py-2 text-left font-semibold">Код</th>
                            <th className="px-3 py-2 text-center font-semibold">PIN</th>
                            <th className="px-3 py-2 text-center font-semibold">Эцэг эх</th>
                            <th className="px-3 py-2 text-right font-semibold">Үйлдэл</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {c.students.map((s, i) => (
                            <tr key={s.id} className="hover:bg-background/50">
                              <td className="px-3 py-1.5 text-xs tabular-nums text-muted-foreground">
                                {String(i + 1).padStart(2, "0")}
                              </td>
                              <td className="px-3 py-1.5 font-medium">
                                {s.lastName}. {s.firstName}
                              </td>
                              <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">
                                {s.code}
                              </td>
                              <td className="px-3 py-1.5 text-center">
                                {s.hasPin ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                    <UserCheck className="h-3 w-3" /> Идэвхтэй
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                                    Байхгүй
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-1.5 text-center tabular-nums">
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                    s.parentCount > 0
                                      ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                      : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  {s.parentCount}
                                </span>
                                {s.openInviteCount > 0 && (
                                  <span className="ml-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                    +{s.openInviteCount}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-1.5">
                                <div className="flex justify-end gap-1">
                                  <button
                                    type="button"
                                    disabled={pending}
                                    onClick={() => {
                                      if (!confirm(`${s.lastName}. ${s.firstName}-ын PIN шинэчлэх үү?`)) return;
                                      start(async () => {
                                        const res = await regenerateOneStudentPin(s.id);
                                        if (res.ok && res.data) {
                                          setPinReveal({
                                            classroomLabel: `${res.data.name} (${res.data.code})`,
                                            items: [{
                                              id: s.id,
                                              code: res.data.code,
                                              firstName: s.firstName,
                                              lastName: s.lastName,
                                              pin: res.data.pin,
                                            }],
                                          });
                                          toast.success(res.message ?? "Шинэчлэгдлээ");
                                        } else if (!res.ok) toast.error(res.error);
                                      });
                                    }}
                                    className="flex h-7 items-center gap-1 rounded-md border border-border/50 bg-background px-2 text-[11px] font-medium transition hover:bg-accent"
                                    title="Энэ сурагчийн PIN шинэчлэх"
                                  >
                                    <RefreshCcw className="h-3 w-3" />
                                    PIN
                                  </button>
                                  <button
                                    type="button"
                                    disabled={pending}
                                    onClick={() =>
                                      setInviteTarget({
                                        studentId: s.id,
                                        studentName: `${s.lastName}. ${s.firstName} (${s.code})`,
                                      })
                                    }
                                    className="flex h-7 items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 text-[11px] font-medium text-primary transition hover:bg-primary/10"
                                    title="Эцэг эхэд урилга үүсгэх"
                                  >
                                    <UserPlus className="h-3 w-3" />
                                    Урилга
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Active invites */}
      {invites.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold">Идэвхтэй урилга ({invites.length})</h2>
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-border/40 bg-muted/20">
                  <th className="px-3 py-2 text-left font-semibold">Код</th>
                  <th className="px-3 py-2 text-left font-semibold">Сурагч</th>
                  <th className="px-3 py-2 text-left font-semibold">Харилцаа</th>
                  <th className="px-3 py-2 text-left font-semibold">Хугацаа</th>
                  <th className="px-3 py-2 text-right font-semibold">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {invites.map((i) => {
                  const expired = i.expiresAt && new Date(i.expiresAt) < new Date();
                  return (
                    <tr key={i.id} className={cn(expired && "opacity-60")}>
                      <td className="px-3 py-2 font-mono font-bold tabular-nums">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(i.code);
                            toast.success("Хууллаа");
                          }}
                          className="inline-flex items-center gap-1 hover:text-primary"
                        >
                          {i.code}
                          <Copy className="h-3 w-3" />
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs font-medium">{i.student.name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {i.student.code}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {i.relation ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {i.expiresAt
                          ? new Date(i.expiresAt).toLocaleDateString("mn-MN")
                          : "Хугацаагүй"}
                        {expired && (
                          <span className="ml-1 rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 dark:text-rose-400">
                            Хэтэрсэн
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            if (!confirm(`${i.code} кодыг цуцлах уу?`)) return;
                            start(async () => {
                              const res = await revokeInviteCode(i.id);
                              if (res.ok) toast.success(res.message ?? "Цуцлагдлаа");
                              else toast.error(res.error);
                            });
                          }}
                          className="rounded-md border border-border/50 bg-background p-1.5 text-muted-foreground transition hover:text-destructive hover:bg-destructive/10"
                          title="Цуцлах"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Invite creation dialog */}
      <InviteDialog
        target={inviteTarget}
        onClose={() => setInviteTarget(null)}
        pending={pending}
        onCreated={(reveal) => setInviteReveal(reveal)}
        start={start}
      />

      {/* PIN reveal dialog (printable) */}
      <PinRevealDialog reveal={pinReveal} onClose={() => setPinReveal(null)} />

      {/* Invite reveal dialog */}
      <InviteRevealDialog reveal={inviteReveal} onClose={() => setInviteReveal(null)} />
    </div>
  );
}

// ── Dialogs ───────────────────────────────────────────────────

function InviteDialog({
  target,
  onClose,
  pending,
  onCreated,
  start,
}: {
  target: { studentId: string; studentName: string } | null;
  onClose: () => void;
  pending: boolean;
  onCreated: (r: InviteReveal) => void;
  start: (cb: () => void) => void;
}) {
  const [relation, setRelation] = useState("Ээж");
  const [days, setDays] = useState("60");

  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && !pending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Эцэг эхийн урилга үүсгэх</DialogTitle>
          <DialogDescription>{target?.studentName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Харилцаа</Label>
            <div className="flex flex-wrap gap-1.5">
              {["Ээж", "Аав", "Хамгаалагч", "Бусад"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRelation(r)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                    relation === r
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-background hover:border-primary/20",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Хугацаа (өдөр)</Label>
            <Input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
              placeholder="60"
            />
            <p className="text-[10px] text-muted-foreground">
              0 бол хугацаагүй. Ердийн үед 30-90 хоног.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Болих
          </Button>
          <Button
            disabled={pending}
            onClick={() => {
              if (!target) return;
              start(async () => {
                const res = await createInviteCode({
                  studentId: target.studentId,
                  relation,
                  expiresInDays: Number(days) || 0,
                });
                if (res.ok && res.data) {
                  onCreated({
                    code: res.data.code,
                    studentName: res.data.studentName,
                    expiresAt: res.data.expiresAt ? res.data.expiresAt.toISOString() : null,
                  });
                  onClose();
                  toast.success(res.message ?? "Үүсгэлээ");
                } else if (!res.ok) toast.error(res.error);
              });
            }}
          >
            <Sparkles className="h-4 w-4" />
            Үүсгэх
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InviteRevealDialog({
  reveal,
  onClose,
}: {
  reveal: InviteReveal;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!reveal} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Урилгын код бэлэн</DialogTitle>
          <DialogDescription>
            {reveal?.studentName} · эцэг эхэд дараах кодыг илгээнэ үү
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center">
          <div className="font-mono text-3xl font-black tracking-widest text-primary">
            {reveal?.code}
          </div>
          <button
            type="button"
            onClick={() => {
              if (reveal) {
                navigator.clipboard.writeText(reveal.code);
                toast.success("Код хууллаа");
              }
            }}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Copy className="h-3 w-3" />
            Хуулбарлах
          </button>
        </div>
        {reveal?.expiresAt && (
          <p className="text-center text-xs text-muted-foreground">
            {new Date(reveal.expiresAt).toLocaleDateString("mn-MN")} хүртэл идэвхтэй
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Хаах
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PinRevealDialog({
  reveal,
  onClose,
}: {
  reveal: PinReveal;
  onClose: () => void;
}) {
  const single = reveal?.items.length === 1;
  return (
    <Dialog open={!!reveal} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>
                {single ? "Шинэ PIN" : `PIN хуудас — ${reveal?.classroomLabel}`}
              </DialogTitle>
              <DialogDescription>
                Энэ дэлгэц хаагдсаны дараа PIN-үүд буцаагдашгүй. Хэвлээд эсвэл хуулан авна уу.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        {reveal && (
          <>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-300">
              ⚠ Энэ PIN-үүдийг зөвхөн энэ удаа харах боломжтой. Хаагдвал сурагч бүрд шинэ PIN үүсгэх болно.
            </div>

            <div className="overflow-hidden rounded-xl border border-border/50">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">№</th>
                    <th className="px-3 py-2 text-left font-semibold">Овог, нэр</th>
                    <th className="px-3 py-2 text-left font-semibold">Код</th>
                    <th className="px-3 py-2 text-right font-semibold">PIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {reveal.items.map((s, i) => (
                    <tr key={s.id}>
                      <td className="px-3 py-1.5 text-xs tabular-nums text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </td>
                      <td className="px-3 py-1.5 font-medium">
                        {s.lastName}. {s.firstName}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">
                        {s.code}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-base font-black tabular-nums text-primary">
                        {s.pin}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter className="sm:justify-between">
              <div className="text-[10px] text-muted-foreground">
                {reveal.items.length} мөр
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const rows = reveal.items
                      .map(
                        (s, i) =>
                          `${String(i + 1).padStart(2, "0")}\t${s.lastName}. ${s.firstName}\t${s.code}\t${s.pin}`,
                      )
                      .join("\n");
                    navigator.clipboard.writeText(rows);
                    toast.success(`${reveal.items.length} мөр хууллаа`);
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Хуулах
                </Button>
                <Button onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                  Хэвлэх
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
