"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  signed: number;
  total: number;
  showLabels?: boolean;
  className?: string;
}

export default function ProgressBar({
  signed,
  total,
  showLabels = true,
  className,
}: Props) {
  const pct = total > 0 ? Math.round((signed / total) * 100) : 0;
  const isDone = signed >= total && total > 0;
  return (
    <div className={cn("w-full", className)}>
      {showLabels && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground tabular-nums">
            {signed}/{total}
          </span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              isDone
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-foreground",
            )}
          >
            {pct}%
          </span>
        </div>
      )}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className={cn(
            "h-full rounded-full",
            isDone ? "bg-emerald-500 dark:bg-emerald-400" : "bg-primary",
          )}
        />
        {!isDone && pct > 0 && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "linear", delay: 1 }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
        )}
      </div>
    </div>
  );
}
