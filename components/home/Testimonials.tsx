"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionShell } from "./SectionShell";
import type { TestimonialRow } from "@/lib/site-data";

const fade = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const AVATAR_COLORS = [
  "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
];

export function Testimonials({ items }: { items: TestimonialRow[] }) {
  return (
    <SectionShell
      id="testimonials"
      tone="muted"
      eyebrow="Сэтгэгдэл"
      title="Эцэг эхийн үнэлгээ"
      description="Манай сургуулийн эцэг эхүүдийн үнэлгээ, сэтгэгдлүүд."
    >
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Сэтгэгдэл байхгүй байна</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const color = AVATAR_COLORS[i % AVATAR_COLORS.length]!;
            return (
              <motion.div
                key={item.id}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
              >
                <Card className="flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                  <Quote className="h-6 w-6 text-primary/20" />
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    «{item.text}»
                  </p>
                  <div className="mt-4 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${s < item.rating ? "fill-amber-400 text-amber-400" : "text-muted/40"}`}
                      />
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${color}`}>
                      {item.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{item.name}</div>
                      <div className="text-[11px] text-muted-foreground">{item.role}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </SectionShell>
  );
}
