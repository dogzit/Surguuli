"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionShell } from "./SectionShell";
import type { EventRow } from "@/lib/site-data";

const TYPE_COLORS: Record<string, string> = {
  school: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  academic: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  sports: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  cultural: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  other: "bg-muted text-muted-foreground",
};

const TYPE_LABELS: Record<string, string> = {
  school: "Сургууль",
  academic: "Сургалт",
  sports: "Спорт",
  cultural: "Соёл",
  other: "Бусад",
};

const fade = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" });
}

export function EventsSection({ events }: { events: EventRow[] }) {
  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.date) >= now);
  const past = events.filter((e) => new Date(e.date) < now).reverse();

  return (
    <SectionShell
      id="events"
      tone="light"
      eyebrow="Үйл явдал"
      title="Товлогдсон үйл явдлууд"
      description="Хичээлийн жилийн гол үйл явдлууд, арга хэмжээнүүд."
    >
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">Үйл явдал байхгүй байна</p>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Удахгүй болох</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {upcoming.map((ev, i) => {
                  const color = TYPE_COLORS[ev.type] ?? TYPE_COLORS.other;
                  return (
                    <motion.div key={ev.id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade}>
                      <Card className="flex gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <span className="text-lg font-bold leading-none tabular-nums">{new Date(ev.date).getDate()}</span>
                          <span className="text-[10px] uppercase">{new Date(ev.date).toLocaleDateString("mn-MN", { month: "short" })}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}>
                              {TYPE_LABELS[ev.type] ?? ev.type}
                            </span>
                          </div>
                          <h4 className="mt-1 text-sm font-semibold text-foreground">{ev.title}</h4>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{ev.description}</p>
                          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                            {ev.time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{ev.time}</span>}
                            {ev.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</span>}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Өнгөрсөн</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {past.slice(0, 4).map((ev, i) => (
                  <motion.div key={ev.id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade}>
                    <Card className="flex gap-4 p-4 opacity-60">
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <span className="text-lg font-bold leading-none tabular-nums">{new Date(ev.date).getDate()}</span>
                        <span className="text-[10px] uppercase">{new Date(ev.date).toLocaleDateString("mn-MN", { month: "short" })}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-foreground">{ev.title}</h4>
                        <p className="mt-1 text-xs text-muted-foreground">{fmtDate(ev.date)}</p>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </SectionShell>
  );
}
