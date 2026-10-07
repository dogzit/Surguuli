"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, Plus, Sparkles, Trash2, XCircle } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUploader } from "@/components/ui/file-uploader";
import { cn } from "@/lib/utils";
import {
  deletePortfolioItem,
  submitPortfolioItem,
} from "@/app/actions/community";

interface Item {
  id: string;
  title: string;
  category: string;
  description: string | null;
  imageUrl: string | null;
  achievedAt: string | null;
  status: string;
  reviewNote: string | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  achievement: "Амжилт",
  project: "Төсөл",
  certificate: "Гэрчилгээ",
  other: "Бусад",
};

const STATUS_META: Record<string, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  pending: {
    label: "Хүлээгдэж буй",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    Icon: Clock,
  },
  approved: {
    label: "Батлагдсан",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    Icon: CheckCircle2,
  },
  rejected: {
    label: "Татгалзсан",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    Icon: XCircle,
  },
};

export function PortfolioSection({ items }: { items: Item[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [pending, start] = useTransition();

  return (
    <>
      <div className="mb-6 grid gap-3 md:grid-cols-2">
        {items.map((it) => {
          const meta = STATUS_META[it.status] ?? STATUS_META.pending!;
          const Icon = meta.Icon;
          return (
            <motion.div
              key={it.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden p-0">
                {it.imageUrl && (
                  <div className="aspect-video bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.imageUrl}
                      alt={it.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {CATEGORY_LABEL[it.category] ?? it.category}
                      </div>
                      <h3 className="mt-0.5 text-sm font-semibold text-foreground">
                        {it.title}
                      </h3>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                        meta.className,
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </span>
                  </div>
                  {it.achievedAt && (
                    <div className="mt-1 text-[10px] tabular-nums text-muted-foreground">
                      {new Date(it.achievedAt).toLocaleDateString("mn-MN")}
                    </div>
                  )}
                  {it.description && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {it.description}
                    </p>
                  )}
                  {it.reviewNote && it.status !== "approved" && (
                    <div className="mt-3 rounded-lg border border-amber-300/40 bg-amber-500/5 p-2 text-[11px] text-amber-800 dark:text-amber-300">
                      Захиргаа: {it.reviewNote}
                    </div>
                  )}
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(it)}
                      disabled={pending}
                      className="rounded-md border border-border/50 bg-background p-1.5 text-muted-foreground transition hover:text-destructive hover:bg-destructive/10"
                      title="Устгах"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex min-h-[160px] items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/10 text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
        >
          <div className="flex flex-col items-center gap-2">
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Шинэ ажил илгээх</span>
          </div>
        </button>
      </div>

      <AddDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        pending={pending}
        start={start}
      />

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && !pending && setDeleteTarget(null)}
      >
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
    </>
  );
}

function AddDialog({
  open,
  onOpenChange,
  pending,
  start,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pending: boolean;
  start: (cb: () => void) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    category: "achievement",
    description: "",
    achievedAt: "",
    imageUrl: "",
  });

  const reset = () =>
    setForm({ title: "", category: "achievement", description: "", achievedAt: "", imageUrl: "" });

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Шинэ ажил илгээх</DialogTitle>
          <DialogDescription>
            Илгээсний дараа админ үзэж баталгаажуулна.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Гарчиг</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Математикийн улсын олимпиадын алтан медаль"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Ангилал</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="achievement">Амжилт</SelectItem>
                  <SelectItem value="project">Төсөл</SelectItem>
                  <SelectItem value="certificate">Гэрчилгээ</SelectItem>
                  <SelectItem value="other">Бусад</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Огноо</Label>
              <Input
                type="date"
                value={form.achievedAt}
                onChange={(e) => setForm((f) => ({ ...f, achievedAt: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Тайлбар</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Товч тайлбар"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Зураг / гэрчилгээ</Label>
            <FileUploader
              value={form.imageUrl || null}
              onChange={(url) => setForm((f) => ({ ...f, imageUrl: url ?? "" }))}
              category="image"
              aspect="video"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); reset(); }} disabled={pending}>
            Болих
          </Button>
          <Button
            disabled={pending || !form.title.trim()}
            onClick={() => {
              start(async () => {
                const res = await submitPortfolioItem({
                  title: form.title,
                  category: form.category,
                  description: form.description,
                  achievedAt: form.achievedAt || null,
                  imageUrl: form.imageUrl || null,
                });
                if (res.ok) {
                  toast.success(res.message ?? "Илгээгдлээ");
                  onOpenChange(false);
                  reset();
                } else toast.error(res.error);
              });
            }}
          >
            <Sparkles className="h-4 w-4" />
            Илгээх
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
