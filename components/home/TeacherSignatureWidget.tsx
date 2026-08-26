"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FileSignature, ChevronRight, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignatureData {
  signed: number;
  total: number;
  complete: boolean;
}

export function TeacherSignatureWidget() {
  const [data, setData] = useState<SignatureData | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/teacher/signatures/progress")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.total > 0) {
          setData(d);
          setVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  if (!visible || !data || dismissed) return null;

  const pct = Math.round((data.signed / data.total) * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-6 right-6 z-50 max-w-sm"
      >
        <div className="rounded-2xl border border-border/60 bg-background/95 p-4 shadow-2xl backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="absolute right-2 top-2 rounded-lg p-1 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                data.complete
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                  : "bg-primary/10 text-primary",
              )}
            >
              {data.complete ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <FileSignature className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">
                {data.complete ? "Амралт баталгаажсан!" : "Гарын үсэгийн явц"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {data.signed}/{data.total} гарын үсэг
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    data.complete
                      ? "bg-emerald-500"
                      : "bg-gradient-to-r from-primary/80 to-primary",
                  )}
                />
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/teacher"
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl bg-primary/10 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            Дэлгэрэнгүй
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
