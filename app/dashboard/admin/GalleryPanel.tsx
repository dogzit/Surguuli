"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Search, Trash2, Pencil, X, Image as ImageIcon,
  Grid3X3, List, Check, Loader2, Sparkles, CloudUpload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, matchesSearch } from "@/lib/utils";
import {
  createGalleryImage, updateGalleryImage, deleteGalleryImage,
} from "@/app/actions/admin";

interface GalleryImage {
  id: string;
  title: string;
  url: string;
  category: string;
  order: number;
}

const CATEGORIES = [
  { value: "school", label: "Сургууль", emoji: "🏫" },
  { value: "events", label: "Арга хэмжээ", emoji: "🎉" },
  { value: "sports", label: "Спорт", emoji: "⚽" },
  { value: "academic", label: "Сургалт", emoji: "📚" },
];

const CATEGORY_COLORS: Record<string, string> = {
  school: "from-blue-500 to-cyan-500",
  events: "from-violet-500 to-purple-500",
  sports: "from-emerald-500 to-teal-500",
  academic: "from-amber-500 to-orange-500",
};

const CATEGORY_BG: Record<string, string> = {
  school: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  events: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  sports: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  academic: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export default function GalleryPanel({ images }: { images: GalleryImage[] }) {
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [category, setCategory] = useState<string>("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GalleryImage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    let result = images;
    if (category !== "all") {
      result = result.filter((img) => img.category === category);
    }
    if (q.trim()) {
      result = result.filter((img) => matchesSearch(img.title, q));
    }
    return result;
  }, [images, q, category]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    start(async () => {
      const res = await deleteGalleryImage(deleteTarget.id);
      if (res?.ok) {
        toast.success(res.message);
        setDeleteTarget(null);
      } else {
        toast.error(res?.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                view === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                view === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
                category === "all"
                  ? "bg-foreground text-background shadow-md"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              Бүх ({images.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = images.filter((i) => i.category === cat.value).length;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
                    category === cat.value
                      ? "bg-foreground text-background shadow-md"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {cat.emoji} {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <Button
          onClick={() => setUploadOpen(true)}
          className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-rose-500 to-violet-500 text-white shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Зураг нэмэх
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700" />
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Зураг хайх..."
          className="h-11 pl-11 rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span>
          Нийт <span className="font-semibold text-foreground">{images.length}</span> зураг
          {category !== "all" && (
            <> · <span className="font-semibold text-foreground">{filtered.length}</span> харагдаж буй</>
          )}
        </span>
      </div>

      {/* Grid View */}
      {view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((img, idx) => (
              <motion.div
                key={img.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -12 }}
                transition={{ duration: 0.3, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {img.url ? (
                    <img
                      src={img.url}
                      alt={img.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/20" />
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-400 group-hover:opacity-100" />

                  {/* Category badge */}
                  <div className="absolute left-3 top-3 z-10">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-md",
                      `bg-gradient-to-r ${CATEGORY_COLORS[img.category] ?? "from-gray-500 to-gray-600"}`,
                    )}>
                      {CATEGORIES.find((c) => c.value === img.category)?.emoji}
                      {CATEGORIES.find((c) => c.value === img.category)?.label ?? img.category}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 opacity-0 transition-all duration-300 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setEditTarget(img); }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-foreground shadow-md backdrop-blur-sm transition-all hover:bg-white"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(img); }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-destructive shadow-md backdrop-blur-sm transition-all hover:bg-destructive hover:text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title bar */}
                <div className="p-3.5">
                  <div className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {img.title}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-full rounded-3xl border-2 border-dashed border-border/50 bg-muted/20 px-4 py-20 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/10 to-violet-500/10">
                <ImageIcon className="h-8 w-8 text-pink-500/40" />
              </div>
              <p className="text-base font-semibold text-foreground">Зураг байхгүй</p>
              <p className="mt-1.5 text-sm text-muted-foreground">Дээрх товчийг дарж шинэ зураг нэмнэ үү</p>
            </motion.div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {filtered.map((img, idx) => (
              <motion.div
                key={img.id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.25, delay: idx * 0.02 }}
                className="group flex items-center gap-4 rounded-2xl border border-border/40 bg-card p-3 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:-translate-y-0.5"
              >
                {/* Thumbnail */}
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {img.url ? (
                    <img src={img.url} alt={img.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className={cn(
                    "absolute bottom-1 right-1 h-2 w-2 rounded-full ring-2 ring-card",
                    `bg-gradient-to-r ${CATEGORY_COLORS[img.category] ?? "from-gray-500 to-gray-600"}`,
                  )} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {img.title}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                      CATEGORY_BG[img.category] ?? "bg-muted text-muted-foreground",
                    )}>
                      {CATEGORIES.find((c) => c.value === img.category)?.emoji}{" "}
                      {CATEGORIES.find((c) => c.value === img.category)?.label ?? img.category}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 gap-1.5 opacity-0 transition-all duration-200 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setEditTarget(img)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-all hover:text-foreground hover:bg-accent"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(img)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-all hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="rounded-3xl border-2 border-dashed border-border/50 bg-muted/20 px-4 py-20 text-center">
              <ImageIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/20" />
              <p className="text-sm font-medium text-muted-foreground">Зураг байхгүй</p>
            </div>
          )}
        </div>
      )}

      {/* Upload Dialog */}
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />

      {/* Edit Dialog */}
      <EditDialog image={editTarget} open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)} />

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && !pending && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Зураг устгах уу?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">&ldquo;{deleteTarget?.title}&rdquo; -г устгах уу?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={pending}>Болих</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>Устгах</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Upload Dialog ──────────────────────────────────────────────
function UploadDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [files, setFiles] = useState<Array<{ file: File; preview: string; title: string; category: string }>>([]);
  const [category, setCategory] = useState("school");
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).filter((f) => f.type.startsWith("image/"));
    arr.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFiles((prev) => [
          ...prev,
          { file: f, preview: e.target?.result as string, title: f.name.replace(/\.[^.]+$/, ""), category },
        ]);
      };
      reader.readAsDataURL(f);
    });
  }, [category]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateFileTitle = (idx: number, title: string) => {
    setFiles((prev) => prev.map((f, i) => i === idx ? { ...f, title } : f));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error("Зураг сонгоно уу");
      return;
    }

    start(async () => {
      let successCount = 0;
      for (const f of files) {
        const res = await createGalleryImage({ title: f.title || "Зураг", url: f.preview, category: f.category });
        if (res?.ok) successCount++;
      }

      if (successCount > 0) {
        toast.success(`${successCount} зураг нэмэгдлээ`);
        setFiles([]);
        onOpenChange(false);
      } else {
        toast.error("Зураг нэмэхэд алдаа гарлаа");
      }
    });
  };

  const close = () => {
    setFiles([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !pending && close()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-violet-500 text-white shadow-lg shadow-pink-500/25">
              <CloudUpload className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold">Зураг нэмэх</div>
              <div className="text-xs font-normal text-muted-foreground">Файлаас эсвэл URL-аас</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className="relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-pink-500/5 via-rose-500/5 to-violet-500/5 p-10 text-center transition-all duration-300 hover:border-primary/40 hover:from-pink-500/10 hover:via-rose-500/10 hover:to-violet-500/10"
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/20 to-violet-500/20">
                  <CloudUpload className="h-8 w-8 text-pink-500" />
                </div>
              </motion.div>
              <p className="text-base font-semibold text-foreground">Зураг үрэлдэж тавих</p>
              <p className="mt-1.5 text-sm text-muted-foreground"> эсвэл дарж олон зураг сонгох</p>
              <p className="mt-3 text-xs text-muted-foreground/60">PNG, JPG, WebP · Хамгийн ихдээ 5MB</p>
            </div>

            {/* Selected files */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{files.length} зураг сонгогдлоо</span>
                    <button type="button" onClick={() => setFiles([])} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                      Бүгдийг арилгах
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {files.map((f, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="group relative flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 shadow-sm"
                      >
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <img src={f.preview} alt="" className="h-full w-full object-cover" />
                        </div>
                        <input
                          value={f.title}
                          onChange={(e) => updateFileTitle(idx, e.target.value)}
                          className="min-w-0 flex-1 truncate rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs font-medium"
                          placeholder="Нэр"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Global category */}
            <div className="space-y-1.5">
              <Label>Бүх зургийн ангилал</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={close} disabled={pending} className="rounded-xl">Болих</Button>
          <Button
            onClick={handleSubmit}
            disabled={pending || files.length === 0}
            className="rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-violet-500 text-white shadow-lg shadow-pink-500/25"
          >
            {pending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {files.length > 1 ? `${files.length} зураг нэмэх` : "Нэмэх"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Dialog ──────────────────────────────────────────────
function EditDialog({
  image,
  open,
  onOpenChange,
}: {
  image: GalleryImage | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("school");
  const [newPreview, setNewPreview] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync when image changes
  if (image && !pending && title !== image.title) {
    setTitle(image.title);
    setCategory(image.category);
    setNewPreview(null);
  }

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setNewPreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    }
  }, []);

  const handleSubmit = () => {
    if (!image) return;
    start(async () => {
      const updateData: { title?: string; category?: string; url?: string } = { title, category };
      if (newPreview) {
        updateData.url = newPreview;
      }
      const res = await updateGalleryImage(image.id, updateData);
      if (res?.ok) {
        toast.success("Зураг шинэчлэгдлээ");
        setNewPreview(null);
        onOpenChange(false);
      } else {
        toast.error(res?.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !pending && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-violet-500 text-white">
              <Pencil className="h-4 w-4" />
            </div>
            Зураг засах
          </DialogTitle>
        </DialogHeader>

        {/* Current or new image preview */}
        <div className="relative overflow-hidden rounded-xl border border-border/50 bg-muted/20 p-2">
          <img 
            src={newPreview || image?.url} 
            alt={image?.title} 
            className="mx-auto max-h-40 rounded-lg object-contain" 
          />
          {newPreview && (
            <button
              type="button"
              onClick={() => setNewPreview(null)}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Replace image button */}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 py-3 text-sm font-medium text-primary transition-all hover:border-primary/40 hover:bg-primary/10"
          >
            <CloudUpload className="mr-2 inline h-4 w-4" />
            Зураг солих
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Нэр</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Ангилал</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending} className="rounded-xl">Болих</Button>
          <Button onClick={handleSubmit} disabled={pending} className="rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Хадгалах
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
