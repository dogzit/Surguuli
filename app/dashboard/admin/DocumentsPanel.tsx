"use client";

import { useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  ChevronDown,
  FileText,
  ExternalLink,
  CalendarClock,
  MapPin,
  Sparkles,
  X,
  UserRound,
  AlertCircle,
  CheckCircle2,
  Clock,
  Truck,
  Circle,
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
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_BY_SLUG,
  DOCUMENT_STATUS_LABEL,
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABEL,
  DOCUMENT_STATUSES,
  CATEGORY_LABEL,
  type DocumentStatus,
  type ApplicationStatus,
} from "@/lib/documents";
import {
  createApplication,
  updateApplicationStatus,
  deleteApplication,
  addDocumentRequest,
  updateDocumentRequest,
  deleteDocumentRequest,
} from "@/app/actions/documents";

export interface StudentOption {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  classroomLabel: string;
  grade: number;
}

export interface DocRow {
  id: string;
  type: string;
  status: string;
  fileUrl: string | null;
  note: string | null;
  updatedAt: string;
}

export interface AppRow {
  id: string;
  university: string;
  country: string | null;
  program: string | null;
  deadline: string | null;
  status: string;
  notes: string | null;
  student: {
    id: string;
    code: string;
    firstName: string;
    lastName: string;
    classroomLabel: string;
    grade: number;
  };
  documents: DocRow[];
  createdAt: string;
}

const STATUS_TONE: Record<DocumentStatus, { icon: typeof Circle; badge: string; dot: string }> = {
  pending: {
    icon: Circle,
    badge: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/40",
  },
  in_progress: {
    icon: Clock,
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  ready: {
    icon: CheckCircle2,
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  delivered: {
    icon: Truck,
    badge: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
    dot: "bg-sky-500",
  },
};

const APP_STATUS_TONE: Record<ApplicationStatus, string> = {
  open: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  submitted: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  complete: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  cancelled: "bg-muted text-muted-foreground",
};

const ALL_STATUS = "__all__";

export default function DocumentsPanel({
  applications,
  students,
}: {
  applications: AppRow[];
  students: StudentOption[];
}) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppRow | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      if (statusFilter !== ALL_STATUS && a.status !== statusFilter) return false;
      if (!q.trim()) return true;
      const hay = `${a.university} ${a.country ?? ""} ${a.program ?? ""} ${a.student.lastName} ${a.student.firstName} ${a.student.code}`;
      return matchesSearch(hay, q);
    });
  }, [applications, q, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Сурагч, их сургуулиар хайх…"
            className="h-11 pl-11 rounded-xl border-border/50 bg-muted/30"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-52 h-11 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS}>Бүх төлөв</SelectItem>
            {APPLICATION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {APPLICATION_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => setCreateOpen(true)}
          className="h-11 gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-500 hover:to-emerald-500"
        >
          <Sparkles className="h-4 w-4" />
          Шинэ өргөдөл
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border/50 bg-muted/20 px-4 py-16 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <GraduationHat />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {q.trim() || statusFilter !== ALL_STATUS
              ? "Тохирох өргөдөл олдсонгүй."
              : "Одоогоор өргөдөл бүртгэгдээгүй."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Шинэ өргөдөл товчоор эхэлнэ үү.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((app, idx) => (
              <motion.div
                key={app.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: idx * 0.02 }}
              >
                <ApplicationCard
                  app={app}
                  expanded={expandedId === app.id}
                  onToggle={() => setExpandedId(expandedId === app.id ? null : app.id)}
                  onDelete={() => setDeleteTarget(app)}
                  pending={pending}
                  start={start}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create dialog */}
      <CreateApplicationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        students={students}
        pending={pending}
        start={start}
      />

      {/* Delete confirm */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && !pending && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-center">Өргөдөл устгах уу?</DialogTitle>
            <DialogDescription className="text-center">
              <span className="font-medium text-foreground">
                {deleteTarget?.university}
              </span>{" "}
              өргөдөл болон {deleteTarget?.documents.length} бичиг устана.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={pending}
            >
              Болих
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => {
                if (!deleteTarget) return;
                start(async () => {
                  const res = await deleteApplication(deleteTarget.id);
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
    </div>
  );
}

function GraduationHat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-6 w-6">
      <path d="M22 10L12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
    </svg>
  );
}

// ── Application card ──────────────────────────────────────────

function ApplicationCard({
  app,
  expanded,
  onToggle,
  onDelete,
  pending,
  start,
}: {
  app: AppRow;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  pending: boolean;
  start: (cb: () => void) => void;
}) {
  const readyCount = app.documents.filter(
    (d) => d.status === "ready" || d.status === "delivered",
  ).length;
  const total = app.documents.length;
  const pct = total > 0 ? Math.round((readyCount / total) * 100) : 0;

  const deadlineStatus = deadlineFlag(app.deadline);

  return (
    <div
      className={cn(
        "group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300",
        expanded
          ? "border-emerald-500/30 shadow-lg"
          : "border-border/40 hover:border-emerald-500/20 hover:shadow-md",
      )}
    >
      {/* Row header */}
      <div
        onClick={onToggle}
        className="flex cursor-pointer flex-wrap items-center gap-4 p-4 sm:p-5"
      >
        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400">
          <GraduationHat />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {app.university}
            </span>
            {app.country && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {app.country}
              </span>
            )}
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                APP_STATUS_TONE[app.status as ApplicationStatus] ??
                  APP_STATUS_TONE.open,
              )}
            >
              {APPLICATION_STATUS_LABEL[app.status as ApplicationStatus] ??
                app.status}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <UserRound className="h-3 w-3" />
              {app.student.lastName}. {app.student.firstName}
              <span className="text-muted-foreground/60">
                · {app.student.classroomLabel}
              </span>
            </span>
            {app.program && <span>· {app.program}</span>}
            {deadlineStatus && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-medium",
                  deadlineStatus.tone,
                )}
              >
                <CalendarClock className="h-3 w-3" />
                {deadlineStatus.label}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-24 text-right">
            <div className="text-xs font-medium text-muted-foreground">
              {readyCount}/{total} бэлэн
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            disabled={pending}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10"
            title="Устгах"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-5 w-5 text-muted-foreground/40" />
          </motion.div>
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="border-t border-border/50 bg-muted/20 p-4 sm:p-5">
              {/* App status editor */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Өргөдлийн төлөв
                </Label>
                <Select
                  value={app.status}
                  disabled={pending}
                  onValueChange={(v) => {
                    start(async () => {
                      const res = await updateApplicationStatus(app.id, v);
                      if (res.ok) toast.success(res.message ?? "Хадгалагдлаа");
                      else toast.error(res.error);
                    });
                  }}
                >
                  <SelectTrigger className="h-8 w-40 rounded-lg text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPLICATION_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {APPLICATION_STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {app.notes && (
                  <div className="text-xs text-muted-foreground italic">
                    &ldquo;{app.notes}&rdquo;
                  </div>
                )}
              </div>

              {/* Document requests */}
              <div className="space-y-2">
                {app.documents.map((doc) => (
                  <DocumentRow key={doc.id} doc={doc} pending={pending} start={start} />
                ))}
                <AddDocumentButton
                  applicationId={app.id}
                  existingTypes={new Set(app.documents.map((d) => d.type))}
                  pending={pending}
                  start={start}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Document row ──────────────────────────────────────────────

function DocumentRow({
  doc,
  pending,
  start,
}: {
  doc: DocRow;
  pending: boolean;
  start: (cb: () => void) => void;
}) {
  const [urlDraft, setUrlDraft] = useState(doc.fileUrl ?? "");
  const [noteDraft, setNoteDraft] = useState(doc.note ?? "");
  const [editing, setEditing] = useState(false);
  const def = DOCUMENT_TYPE_BY_SLUG[doc.type];
  const tone = STATUS_TONE[doc.status as DocumentStatus] ?? STATUS_TONE.pending;
  const Icon = tone.icon;

  const saveField = (input: Parameters<typeof updateDocumentRequest>[1]) => {
    start(async () => {
      const res = await updateDocumentRequest(doc.id, input);
      if (res.ok) toast.success(res.message ?? "Хадгалагдлаа");
      else toast.error(res.error);
    });
  };

  return (
    <div className="rounded-xl border border-border/40 bg-background p-3">
      <div className="flex flex-wrap items-start gap-3">
        <div className={cn("mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", tone.badge)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold text-foreground">
              {def?.label ?? doc.type}
            </span>
            <span className="text-[10px] text-muted-foreground/70">
              {def?.english}
            </span>
          </div>
          {def?.description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{def.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={doc.status}
            disabled={pending}
            onValueChange={(v) => saveField({ status: v })}
          >
            <SelectTrigger className="h-7 w-32 rounded-md text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {DOCUMENT_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-md border border-border/50 bg-background p-1.5 text-muted-foreground transition hover:text-foreground"
            title={editing ? "Хаах" : "Файл / тэмдэглэл"}
          >
            {editing ? <X className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirm("Энэ бичгийг устгах уу?")) return;
              start(async () => {
                const res = await deleteDocumentRequest(doc.id);
                if (res.ok) toast.success(res.message ?? "Устгалаа");
                else toast.error(res.error);
              });
            }}
            className="rounded-md border border-border/50 bg-background p-1.5 text-muted-foreground transition hover:text-destructive hover:bg-destructive/10"
            title="Устгах"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Existing URL surface */}
      {!editing && doc.fileUrl && (
        <a
          href={doc.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
        >
          <ExternalLink className="h-3 w-3" />
          Файл нээх
        </a>
      )}

      {editing && (
        <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
          <div>
            <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              PDF / файлын URL
            </Label>
            <div className="mt-1 flex gap-2">
              <Input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="https://..."
                className="h-9"
              />
              <Button
                size="sm"
                disabled={pending || urlDraft === (doc.fileUrl ?? "")}
                onClick={() => saveField({ fileUrl: urlDraft })}
              >
                Хадгалах
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Тэмдэглэл
            </Label>
            <div className="mt-1 flex gap-2">
              <Input
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Дотоод тэмдэглэл…"
                className="h-9"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={pending || noteDraft === (doc.note ?? "")}
                onClick={() => saveField({ note: noteDraft })}
              >
                Хадгалах
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add document button ───────────────────────────────────────

function AddDocumentButton({
  applicationId,
  existingTypes,
  pending,
  start,
}: {
  applicationId: string;
  existingTypes: Set<string>;
  pending: boolean;
  start: (cb: () => void) => void;
}) {
  const available = DOCUMENT_TYPES.filter((d) => !existingTypes.has(d.slug));
  if (available.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 p-3 text-center text-xs text-muted-foreground">
        Бүх төрлийн бичиг нэмэгдсэн.
      </div>
    );
  }
  return (
    <details className="rounded-xl border border-dashed border-border/40 bg-muted/10 p-3 text-xs">
      <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
        + Бичиг нэмэх
      </summary>
      <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {available.map((d) => (
          <button
            key={d.slug}
            type="button"
            disabled={pending}
            onClick={() => {
              start(async () => {
                const res = await addDocumentRequest(applicationId, d.slug);
                if (res.ok) toast.success(res.message ?? "Нэмэгдлээ");
                else toast.error(res.error);
              });
            }}
            className="flex items-start gap-2 rounded-lg border border-border/40 bg-background p-2 text-left transition hover:border-emerald-500/30 hover:bg-emerald-500/5"
          >
            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <div className="min-w-0">
              <div className="font-semibold text-foreground">{d.label}</div>
              <div className="text-[10px] text-muted-foreground truncate">{d.english}</div>
            </div>
          </button>
        ))}
      </div>
    </details>
  );
}

// ── Create dialog ─────────────────────────────────────────────

function CreateApplicationDialog({
  open,
  onOpenChange,
  students,
  pending,
  start,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  students: StudentOption[];
  pending: boolean;
  start: (cb: () => void) => void;
}) {
  const [studentQ, setStudentQ] = useState("");
  const [studentId, setStudentId] = useState<string | null>(null);
  const [university, setUniversity] = useState("");
  const [country, setCountry] = useState("");
  const [program, setProgram] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [docs, setDocs] = useState<Set<string>>(
    new Set(["transcript", "school_profile", "counselor_rec"]),
  );

  const filteredStudents = useMemo(() => {
    if (!studentQ.trim()) return students.slice(0, 8);
    return students
      .filter((s) =>
        matchesSearch(`${s.lastName} ${s.firstName} ${s.code} ${s.classroomLabel}`, studentQ),
      )
      .slice(0, 12);
  }, [students, studentQ]);

  const chosen = studentId ? students.find((s) => s.id === studentId) : null;

  const reset = () => {
    setStudentQ("");
    setStudentId(null);
    setUniversity("");
    setCountry("");
    setProgram("");
    setDeadline("");
    setNotes("");
    setDocs(new Set(["transcript", "school_profile", "counselor_rec"]));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !pending) {
          onOpenChange(false);
          reset();
        } else onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Шинэ өргөдөл нээх</DialogTitle>
          <DialogDescription>
            Сурагч, зорилтот их сургууль болон шаардлагатай бичгүүдийг сонгоно.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student picker */}
          <div className="space-y-2">
            <Label>Сурагч</Label>
            {chosen ? (
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                <div>
                  <div className="text-sm font-semibold">
                    {chosen.lastName}. {chosen.firstName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {chosen.code} · {chosen.classroomLabel}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStudentId(null)}
                  disabled={pending}
                >
                  Солих
                </Button>
              </div>
            ) : (
              <>
                <Input
                  value={studentQ}
                  onChange={(e) => setStudentQ(e.target.value)}
                  placeholder="Нэр, код, ангиар хайх…"
                />
                <div className="grid gap-1 sm:grid-cols-2">
                  {filteredStudents.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStudentId(s.id)}
                      className="flex items-center gap-2 rounded-lg border border-border/40 bg-background p-2 text-left text-xs transition hover:border-emerald-500/30 hover:bg-emerald-500/5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-semibold">
                        {s.grade}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {s.lastName}. {s.firstName}
                        </div>
                        <div className="truncate text-muted-foreground">
                          {s.code} · {s.classroomLabel}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {filteredStudents.length === 0 && (
                  <p className="text-xs text-muted-foreground">Сурагч олдсонгүй.</p>
                )}
              </>
            )}
          </div>

          {/* University details */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Их сургууль *</Label>
              <Input
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Common App / MIT / Tokyo Univ"
              />
            </div>
            <div>
              <Label>Улс</Label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="USA"
              />
            </div>
            <div>
              <Label>Хөтөлбөр</Label>
              <Input
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                placeholder="Computer Science"
              />
            </div>
            <div>
              <Label>Эцсийн хугацаа</Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Тэмдэглэл</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дотоод тэмдэглэл, тусгай шаардлага…"
            />
          </div>

          {/* Document type picker */}
          <div>
            <Label className="mb-2 block">Шаардлагатай бичгүүд</Label>
            <div className="space-y-3">
              {(["academic", "letter", "administrative"] as const).map((cat) => (
                <div key={cat}>
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {CATEGORY_LABEL[cat]}
                  </div>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {DOCUMENT_TYPES.filter((d) => d.category === cat).map((d) => {
                      const checked = docs.has(d.slug);
                      return (
                        <label
                          key={d.slug}
                          className={cn(
                            "flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-xs transition",
                            checked
                              ? "border-emerald-500/40 bg-emerald-500/5"
                              : "border-border/40 bg-background hover:border-emerald-500/20",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setDocs((prev) => {
                                const next = new Set(prev);
                                if (e.target.checked) next.add(d.slug);
                                else next.delete(d.slug);
                                return next;
                              });
                            }}
                            className="mt-0.5 h-4 w-4 accent-emerald-500"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground">{d.label}</div>
                            <div className="text-[10px] text-muted-foreground">{d.english}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              reset();
            }}
            disabled={pending}
          >
            Болих
          </Button>
          <Button
            disabled={pending || !studentId || !university.trim() || docs.size === 0}
            onClick={() => {
              if (!studentId) return;
              start(async () => {
                const res = await createApplication({
                  studentId,
                  university,
                  country,
                  program,
                  deadline: deadline || null,
                  notes,
                  documentTypes: Array.from(docs),
                });
                if (res.ok) {
                  toast.success(res.message ?? "Нээгдлээ");
                  onOpenChange(false);
                  reset();
                } else toast.error(res.error);
              });
            }}
          >
            <Sparkles className="h-4 w-4" />
            Өргөдөл нээх
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function deadlineFlag(iso: string | null): { label: string; tone: string } | null {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  const dateStr = d.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  if (days < 0) return { label: `${dateStr} · хугацаа хэтэрсэн`, tone: "text-rose-600 dark:text-rose-400" };
  if (days === 0) return { label: `${dateStr} · өнөөдөр`, tone: "text-rose-600 dark:text-rose-400" };
  if (days < 7) return { label: `${dateStr} · ${days} хоног үлдсэн`, tone: "text-amber-600 dark:text-amber-400" };
  if (days < 30) return { label: `${dateStr} · ${days} хоног`, tone: "text-amber-600 dark:text-amber-400" };
  return { label: `${dateStr} · ${days} хоног`, tone: "text-muted-foreground" };
}
