"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, ChevronLeft, ChevronRight, X } from "lucide-react";

interface Props {
  items: string[];
}

const DISMISS_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function AnnouncementBar({ items }: Props) {
  const [current, setCurrent] = useState(0);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined" || items.length === 0) return false;
    const stored = localStorage.getItem("announcement_dismissed_at");
    if (!stored) return false;
    const elapsed = Date.now() - Number(stored);
    if (elapsed >= DISMISS_DURATION_MS) {
      // 5 minutes passed — clear and show again
      localStorage.removeItem("announcement_dismissed_at");
      return false;
    }
    return true;
  });
  const [isPaused, setIsPaused] = useState(false);

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem("announcement_dismissed_at", String(Date.now()));
  };

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + items.length) % items.length);
  }, [items.length]);

  // Auto-rotate
  useEffect(() => {
    if (dismissed || items.length === 0 || isPaused) return;
    const t = setInterval(next, 4000);
    return () => clearInterval(t);
  }, [next, dismissed, items.length, isPaused]);

  // Auto-reappear after 5 minutes
  useEffect(() => {
    if (!dismissed) return;
    const stored = localStorage.getItem("announcement_dismissed_at");
    if (!stored) return;
    const remaining = DISMISS_DURATION_MS - (Date.now() - Number(stored));
    if (remaining <= 0) {
      setDismissed(false);
      localStorage.removeItem("announcement_dismissed_at");
      return;
    }
    const t = setTimeout(() => {
      setDismissed(false);
      localStorage.removeItem("announcement_dismissed_at");
    }, remaining);
    return () => clearTimeout(t);
  }, [dismissed]);

  if (items.length === 0) return null;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden border-b border-primary/10 bg-gradient-to-r from-primary/[0.05] via-primary/[0.02] to-primary/[0.05]"
        >
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
            {/* Badge */}
            <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Шинэ
              </span>
            </div>

            {/* Announcement text */}
            <div className="relative min-h-[20px] flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={current}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] as const }}
                  className="truncate text-[13px] font-medium text-foreground/80"
                >
                  {items[current]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex shrink-0 items-center gap-1.5">
              {/* Progress dots */}
              <div className="hidden items-center gap-1 sm:flex">
                {items.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrent(i)}
                    aria-label={`${i + 1}-р зарлал`}
                    className="group p-0.5"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all duration-300 ${
                        i === current
                          ? "w-5 bg-primary"
                          : "w-1.5 bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="hidden h-4 w-px bg-border sm:block" />

              <button
                type="button"
                onClick={prev}
                aria-label="Өмнөх"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Дараах"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Хаах"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
