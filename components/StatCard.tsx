"use client";

import { motion, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";

const toneClasses = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
} as const;

type Tone = keyof typeof toneClasses;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4"
    >
      {children}
    </motion.div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: Tone;
}) {
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card className="flex items-center gap-3 p-4">
        <div
          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${toneClasses[tone]}`}
        >
          {icon}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <CountUp value={value} />
        </div>
      </Card>
    </motion.div>
  );
}

function CountUp({ value }: { value: number }) {
  return (
    <motion.div
      key={value}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="text-2xl font-bold tabular-nums"
    >
      {value}
    </motion.div>
  );
}
