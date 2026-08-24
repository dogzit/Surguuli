"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number | string;
  subtitle?: string;
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "cyan" | "pink";
}

const COLOR_MAP = {
  blue: "text-blue-400",
  green: "text-emerald-400",
  yellow: "text-amber-400",
  red: "text-red-400",
  purple: "text-violet-400",
  cyan: "text-cyan-400",
  pink: "text-pink-400",
};

export function DarkStatCard({ label, value, subtitle, color = "blue" }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur"
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-1 text-3xl font-bold tabular-nums", COLOR_MAP[color])}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {subtitle && (
        <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>
      )}
    </motion.div>
  );
}
