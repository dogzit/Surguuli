"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, UploadCloud, X, Image as ImageIcon, FileText, Film } from "lucide-react";
import { cn } from "@/lib/utils";

type Category = "image" | "document" | "video" | "any";

interface Props {
  value?: string | null;
  onChange: (url: string | null) => void;
  category?: Category;
  accept?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  // Rendered preview aspect (only for image category). Anything else
  // shows a filename chip.
  aspect?: "video" | "square" | "wide";
}

/**
 * Drag-and-drop uploader that POSTs to /api/upload and returns the
 * public URL through `onChange`. Used everywhere admin content needs
 * a real image/PDF/video instead of a manually pasted URL.
 */
export function FileUploader({
  value,
  onChange,
  category = "image",
  accept,
  label = "Файл сонгох эсвэл чирж оруулна уу",
  className,
  disabled,
  aspect = "video",
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadOne = useCallback(
    async (file: File) => {
      if (!file) return;
      setError(null);
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("category", category);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error ?? "Хадгалж чадсангүй.");
          return;
        }
        onChange(json.url as string);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Сүлжээний алдаа.");
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [category, onChange],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (disabled || uploading) return;
      const file = e.dataTransfer.files?.[0];
      if (file) void uploadOne(file);
    },
    [disabled, uploading, uploadOne],
  );

  // Have a URL — show the preview surface with a "remove" affordance.
  if (value) {
    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-xl border border-border/50 bg-muted/30",
          aspect === "square" && "aspect-square",
          aspect === "video" && "aspect-video",
          aspect === "wide" && "aspect-[21/9]",
          className,
        )}
      >
        {category === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <FilePreviewChip url={value} category={category} />
        )}
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled || uploading}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition-all group-hover:opacity-100 hover:bg-black/80"
          title="Устгах"
        >
          <X className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-lg bg-black/60 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur transition-all group-hover:opacity-100 hover:bg-black/80"
        >
          <UploadCloud className="h-3.5 w-3.5" />
          Солих
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept ?? defaultAccept(category)}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadOne(f);
          }}
          className="hidden"
          disabled={disabled || uploading}
        />
      </div>
    );
  }

  // Empty — drop zone.
  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={onDrop}
      onClick={() => !disabled && !uploading && inputRef.current?.click()}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-all",
        aspect === "square" && "aspect-square",
        aspect === "video" && "aspect-video",
        aspect === "wide" && "aspect-[21/9]",
        dragActive
          ? "border-primary bg-primary/5"
          : "border-border/60 hover:border-primary/40 hover:bg-muted/20",
        (disabled || uploading) && "pointer-events-none opacity-60",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept ?? defaultAccept(category)}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadOne(f);
        }}
        className="hidden"
        disabled={disabled || uploading}
      />
      <AnimatePresence mode="wait">
        {uploading ? (
          <motion.div
            key="up"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Хадгалж байна…</p>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium">{label}</p>
            <p className="text-[10px] text-muted-foreground">{categoryHint(category)}</p>
          </motion.div>
        )}
      </AnimatePresence>
      {error && (
        <div className="absolute inset-x-3 bottom-3 rounded-lg bg-destructive/10 px-3 py-1.5 text-[11px] text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}

function defaultAccept(category: Category): string {
  switch (category) {
    case "image":
      return "image/jpeg,image/png,image/webp,image/gif,image/avif";
    case "document":
      return "application/pdf";
    case "video":
      return "video/mp4,video/webm";
    case "any":
      return "image/*,application/pdf,video/*";
  }
}

function categoryHint(category: Category): string {
  switch (category) {
    case "image":
      return "JPG · PNG · WebP · дээд тал 10MB";
    case "document":
      return "PDF · дээд тал 10MB";
    case "video":
      return "MP4 · WebM · дээд тал 10MB";
    case "any":
      return "Зураг · PDF · Видео · дээд тал 10MB";
  }
}

function FilePreviewChip({ url, category }: { url: string; category: Category }) {
  const Icon = category === "document" ? FileText : category === "video" ? Film : ImageIcon;
  const filename = url.split("/").pop() ?? "файл";
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/30">
      <div className="flex flex-col items-center gap-2 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="max-w-full truncate text-xs font-medium text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {filename}
        </a>
      </div>
    </div>
  );
}
