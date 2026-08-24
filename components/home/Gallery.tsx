"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
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
  const [lightbox, setLightbox] = useState<GalleryImageRow | null>(null);

  const filtered = cat === "all" ? images : images.filter((i) => i.category === cat);

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
                onClick={() => setLightbox(img)}
                className="group relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-muted"
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setLightbox(null)}
          >
            <motion.div
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
                onClick={() => setLightbox(null)}
                className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground shadow-lg"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="mt-2 text-center text-sm text-white/80">{lightbox.title}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionShell>
  );
}
