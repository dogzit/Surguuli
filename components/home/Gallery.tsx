"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ZoomIn, ImageIcon } from "lucide-react";
import { SectionShell } from "./SectionShell";
import type { GalleryImageRow } from "@/lib/site-data";

const CATEGORIES = [
  { value: "all", label: "Бүгд" },
  { value: "school", label: "Сургууль" },
  { value: "events", label: "Арга хэмжээ" },
  { value: "sports", label: "Спорт" },
  { value: "academic", label: "Сургалт" },
];

const fade = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Gallery({ images }: { images: GalleryImageRow[] }) {
  const [cat, setCat] = useState("all");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const filtered = useMemo(
    () => (cat === "all" ? images : images.filter((i) => i.category === cat)),
    [cat, images],
  );

  const lightbox = lightboxIdx !== null ? filtered[lightboxIdx] ?? null : null;

  const closeLightbox = () => setLightboxIdx(null);
  const stepLightbox = (delta: number) =>
    setLightboxIdx((i) =>
      i === null || filtered.length === 0
        ? i
        : (i + delta + filtered.length) % filtered.length,
    );

  // Keyboard: Escape closes, arrows navigate, lock body scroll
  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowRight") stepLightbox(1);
      else if (e.key === "ArrowLeft") stepLightbox(-1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxIdx]);

  // If category changes while lightbox is open, close it (index no longer meaningful)
  useEffect(() => {
    setLightboxIdx(null);
  }, [cat]);

  return (
    <SectionShell
      id="gallery"
      tone="muted"
      eyebrow="Галерей"
      title="Сургуулийн зургууд"
      description="Манай сургуулийн өдөр тутмын амьдрал, арга хэмжээ, спортын тэмцээний зургууд."
    >
      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCat(c.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              cat === c.value
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-muted-foreground hover:bg-accent"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background/50 px-4 py-16 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">Зураг байхгүй байна</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((img, i) => (
            <motion.div
              key={img.id}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fade}
            >
              <button
                type="button"
                onClick={() => setLightboxIdx(i)}
                aria-label={`${img.title} — томруулж үзэх`}
                className="group relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <img
                  src={img.url}
                  alt={img.alt ?? img.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
                  <ZoomIn className="h-8 w-8 text-white opacity-0 transition group-hover:opacity-100" />
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                  <p className="truncate text-xs font-medium text-white">{img.title}</p>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={lightbox.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            {filtered.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  stepLightbox(-1);
                }}
                aria-label="Өмнөх зураг"
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-4"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            <motion.div
              key={lightbox.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-h-[85vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightbox.url}
                alt={lightbox.alt ?? lightbox.title}
                className="max-h-[85vh] rounded-xl object-contain"
              />
              <button
                type="button"
                onClick={closeLightbox}
                aria-label="Хаах"
                className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="mt-2 text-center text-sm text-white/80">
                {lightbox.title}
                {filtered.length > 1 && (
                  <span className="ml-2 tabular-nums text-white/60">
                    {(lightboxIdx ?? 0) + 1} / {filtered.length}
                  </span>
                )}
              </div>
            </motion.div>
            {filtered.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  stepLightbox(1);
                }}
                aria-label="Дараах зураг"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-4"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </SectionShell>
  );
}
