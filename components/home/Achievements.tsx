"use client";

import { motion } from "framer-motion";
import { Award, Medal, Trophy, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionShell } from "./SectionShell";
import type { AchievementRow } from "@/lib/site-data";

const CATEGORY_ICONS: Record<string, typeof Award> = {
  olimpiad: Trophy,
  competition: Medal,
  academic: Star,
  other: Award,
};

const CATEGORY_COLORS: Record<string, string> = {
  olimpiad: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  competition: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  academic: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  other: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
};

const fade = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Achievements({ items }: { items: AchievementRow[] }) {
  const grouped = items.reduce<Record<number, AchievementRow[]>>((acc, item) => {
    (acc[item.year] ??= []).push(item);
    return acc;
  }, {});

  return (
    <SectionShell
      id="achievements"
      tone="light"
      eyebrow="Амжилт"
      title="Сурагчдын амжилт"
      description="Манай сургуулийн сурагчдын олимпиад, тэмцээний амжилтууд."
    >
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Амжилт байхгүй байна</p>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([year, yearItems]) => (
              <div key={year}>
                <div className="mb-3 flex items-center gap-3">
                  <h3 className="text-lg font-bold tabular-nums text-foreground">{year}</h3>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">{yearItems.length} амжилт</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {yearItems.map((item, i) => {
                    const Icon = CATEGORY_ICONS[item.category] ?? Award;
                    const color = CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.other;
                    return (
                      <motion.div
                        key={item.id}
                        custom={i}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fade}
                      >
                        <Card className="flex items-start gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                          <div className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground">{item.name}</div>
                            {item.grade && <div className="text-xs text-muted-foreground">{item.grade}-р анги</div>}
                            <div className="mt-1 text-sm font-medium text-primary">{item.award}</div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </SectionShell>
  );
}
