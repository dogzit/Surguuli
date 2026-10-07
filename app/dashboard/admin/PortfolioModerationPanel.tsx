"use client";

import { useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  deletePortfolioItem,
  reviewPortfolioItem,
} from "@/app/actions/community";

export interface PortfolioRow {
  id: string;
  title: string;
  category: string;
  description: string | null;
  imageUrl: string | null;
  achievedAt: string | null;
  status: string;
  reviewNote: string | null;
  publishedToGallery: boolean;
  createdAt: string;
  student: {
    id: string;
    code: string;
    name: string;
    classroom: string;
  };
}

const CATEGORY_LABEL: Record<string, string> = {
  achievement: "Амжилт",
  project: "Төсөл",
  certificate: "Гэрчилгээ",
  other: "Бусад",
};

type Tab = "pending" | "approved" | "rejected" | "all";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "pending", label: "Хүлээгдэж буй" },
  { id: "approved", label: "Батлагдсан" },
  { id: "rejected", label: "Татгалзсан" },
  { id: "all", label: "Бүгд" },
];

export default function PortfolioModerationPanel({ items }: { items: PortfolioRow[] }) {
  const [tab, setTab] = useState<Tab>("pending");
  const [q, setQ] = useState("");
  const [reviewTarget, setReviewTarget] = useState<PortfolioRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioRow | null>(null);
  const [pending, start] = useTransition();

  const counts = useMemo(() => {
    return {
      pending: items.filter((i) => i.status === "pending").length,
      approved: items.filter((i) => i.status === "approved").length,
      rejected: items.filter((i) => i.status === "rejected").length,
      all: items.length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    return items
      .filter((i) => (tab === "all" ? true : i.status === tab))
      .filter((i) => {
        if (!q.trim()) return true;
        return matchesSearch(`${i.title} ${i.student.name} ${i.student.code}`, q);
      });
  }, [items, q, tab]);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 gap-1 rounded-xl border border-border/50 bg-card p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition",
                tab === t.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label} <span className="ml-1 text-[10px] opacity-70">{counts[t.id]}</span>
            </button>
          ))}
        </div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Гарчиг, сурагчаар хайх…"
          className="sm:max-w-xs"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card className="border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">Тохирох ажил байхгүй.</p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((it) => (
              <motion.div
                key={it.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <PortfolioCard
                  item={it}
                  onReview={() => setReviewTarget(it)}
                  onDelete={() => setDeleteTarget(it)}
                  pending={pending}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ReviewDialog
        target={reviewTarget}
        onClose={() => setReviewTarget(null)}
        pending={pending}
        start={start}
      />
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && !pending && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Ажлыг устгах уу?</DialogTitle>
            <DialogDescription className="text-center">
              <span className="font-medium text-foreground">{deleteTarget?.title}</span> устана.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={pending}>
              Болих
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => {
                if (!deleteTarget) return;
                start(async () => {
                  const res = await deletePortfolioItem(deleteTarget.id);
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

function PortfolioCard({
  item,
  onReview,
  onDelete,
  pending,
}: {
  item: PortfolioRow;
  onReview: () => void;
  onDelete: () => void;
  pending: boolean;
}) {
  const isPending = item.status === "pending";
  const isApproved = item.status === "approved";
  const isRejected = item.status === "rejected";
  return (
    <Card className="overflow-hidden p-0">
      {item.imageUrl && (
        <div className="aspect-video bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {CATEGORY_LABEL[item.category] ?? item.category}
            </div>
            <h3 className="mt-0.5 text-sm font-semibold text-foreground">{item.title}</h3>
            <div className="mt-1 text-xs text-muted-foreground">
              {item.student.name} · <span className="font-mono">{item.student.code}</span> · {item.student.classroom}
            </div>
          </div>
          <StatusChip status={item.status} />
        </div>
        {item.achievedAt && (
          <div className="mt-2 text-[10px] tabular-nums text-muted-foreground">
            {new Date(item.achievedAt).toLocaleDateString("mn-MN")} · илгээсэн:{" "}
            {new Date(item.createdAt).toLocaleDateString("mn-MN")}
          </div>
        )}
        {item.description && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        )}
        {item.reviewNote && (isRejected || item.publishedToGallery) && (
          <div className="mt-3 rounded-lg border border-border/40 bg-muted/30 p-2 text-[11px] text-muted-foreground">
            Тэмдэглэл: {item.reviewNote}
          </div>
        )}
        {item.publishedToGallery && (
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-3 w-3" />
            Гал зурагт нийтэлсэн
          </div>
        )}
        <div className="mt-3 flex justify-end gap-1.5">
          {(isPending || isRejected || isApproved) && (
            <Button size="sm" variant="outline" onClick={onReview} disabled={pending}>
              {isPending ? "Шүүх" : "Өөрчлөх"}
            </Button>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="rounded-md border border-border/50 bg-background p-1.5 text-muted-foreground transition hover:text-destructive hover:bg-destructive/10"
            title="Устгах"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}

function StatusChip({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        Батлагдсан
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
        <XCircle className="h-3 w-3" />
        Татгалзсан
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
      <Clock className="h-3 w-3" />
      Хүлээгдэж буй
    </span>
  );
}

function ReviewDialog({
  target,
  onClose,
  pending,
  start,
}: {
  target: PortfolioRow | null;
  onClose: () => void;
  pending: boolean;
  start: (cb: () => void) => void;
}) {
  const [note, setNote] = useState("");
  const [publish, setPublish] = useState(true);

  // Reset form when target changes.
  const key = target?.id ?? "";
  const lastKey = useMemoRef(key);
  if (lastKey.current !== key) {
    lastKey.current = key;
    setNote(target?.reviewNote ?? "");
    setPublish(target?.publishedToGallery ?? true);
  }

  const submit = (status: "approved" | "rejected") => {
    if (!target) return;
    start(async () => {
      const res = await reviewPortfolioItem(target.id, {
        status,
        note,
        publishToGallery: status === "approved" ? publish : false,
      });
      if (res.ok) {
        toast.success(res.message ?? "Хадгалагдлаа");
        onClose();
      } else toast.error(res.error);
    });
  };

  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && !pending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ажлыг шүүх</DialogTitle>
          <DialogDescription>
            {target?.title} · {target?.student.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Тэмдэглэл (заавал биш)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Сурагчид харагдах товч тэмдэглэл"
            />
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 p-3 text-sm">
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
              className="h-4 w-4"
            />
            <span>Батлагдсаны дараа гал зурагт нийтлэх</span>
          </label>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="destructive" disabled={pending} onClick={() => submit("rejected")}>
            <XCircle className="h-4 w-4" />
            Татгалзах
          </Button>
          <Button disabled={pending} onClick={() => submit("approved")}>
            <CheckCircle2 className="h-4 w-4" />
            Батлах
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Tiny local hook: like useRef but survives re-renders without imports.
function useMemoRef<T>(initial: T): { current: T } {
  const box = useState(() => ({ current: initial }))[0];
  return box;
}
