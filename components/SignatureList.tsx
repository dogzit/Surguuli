"use client";

import { motion, type Variants } from "framer-motion";
import { Check, Clock, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignedEntry {
  position: string;
  note: string | null;
  approverName?: string | null;
}

interface Props {
  positions: readonly string[];
  signed: SignedEntry[];
}

const listVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

export default function SignatureList({ positions, signed }: Props) {
  const map = new Map<string, SignedEntry>();
  signed.forEach((s) => map.set(s.position, s));

  return (
    <motion.ul
      variants={listVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
    >
      {positions.map((position) => {
        const entry = map.get(position);
        const isSigned = !!entry;
        return (
          <motion.li
            key={position}
            variants={itemVariants}
            layout
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3.5 transition-colors",
              isSigned
                ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                : "border-border bg-card",
            )}
          >
            <motion.span
              initial={false}
              animate={{ scale: isSigned ? [1, 1.15, 1] : 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={cn(
                "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                isSigned
                  ? "bg-emerald-500 text-white dark:bg-emerald-600"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {isSigned ? (
                <Check className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
            </motion.span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium leading-tight">
                {position}
              </div>
              <div
                className={cn(
                  "mt-0.5 text-xs",
                  isSigned
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-muted-foreground",
                )}
              >
                {isSigned ? "Гарын үсэг зурсан" : "Хүлээгдэж байна"}
              </div>
              {entry?.note && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.25 }}
                  className="mt-2 flex items-start gap-1.5 rounded-md border border-emerald-200/70 bg-card px-2 py-1.5 text-xs text-foreground overflow-hidden dark:border-emerald-500/30"
                >
                  <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-300" />
                  <span className="leading-relaxed">{entry.note}</span>
                </motion.div>
              )}
            </div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
