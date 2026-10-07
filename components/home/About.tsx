"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  MapPin,
  GraduationCap,
  Landmark,
  Clock,
  Users,
  Award,
  Building2,
  ArrowRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionShell } from "./SectionShell";
import type { HistoryEntry, MissionEntry, LocationEntry } from "@/lib/school-info";

const fade = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// Icon-name → component lookup. Any icon referenced by the DB seed must
// be included here so the client can render it.
const ICONS: Record<string, LucideIcon> = {
  BookOpen,
  MapPin,
  GraduationCap,
  Landmark,
  Clock,
  Users,
  Award,
  Building2,
};

// Cycled palette for history cards — keeps the visual rhythm without
// requiring the admin to pick colors per entry.
const CARD_TONES = [
  { color: "from-amber-500/20 to-orange-500/20", iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  { color: "from-blue-500/20 to-cyan-500/20", iconBg: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
  { color: "from-emerald-500/20 to-teal-500/20", iconBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  { color: "from-violet-500/20 to-purple-500/20", iconBg: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300" },
];

function yearsSince(startYear: number) {
  return new Date().getFullYear() - startYear;
}

interface AboutProps {
  students: string | null;
  staff: string | null;
  olympiadMedals: string | null;
  foundedYear: number | null;
  history: HistoryEntry[];
  mission: MissionEntry[];
  locations: LocationEntry[];
  missionDescription: string | null;
}

export function About({
  students,
  staff,
  olympiadMedals,
  foundedYear,
  history,
  mission,
  locations,
  missionDescription,
}: AboutProps) {
  const STATS = [
    foundedYear ? { icon: Clock, value: `${yearsSince(foundedYear)}+`, label: "Жилийн түүх" } : null,
    students ? { icon: Users, value: students, label: "Сурагч" } : null,
    staff ? { icon: GraduationCap, value: staff, label: "Багш, ажилтан" } : null,
    olympiadMedals ? { icon: Award, value: olympiadMedals, label: "Олимпиадын медаль" } : null,
  ].filter((s): s is { icon: LucideIcon; value: string; label: string } => s !== null);

  return (
    <>
      {/* Hero Banner */}
      <section className="relative overflow-hidden border-b border-border/50 bg-gradient-to-br from-primary/[0.08] via-background to-background">
        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          aria-hidden
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <motion.div custom={0} initial="hidden" animate="visible" variants={fade}>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
              <Sparkles className="h-3 w-3" />
              Танилцуулга
            </div>
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fade}
            className="mt-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl"
          >
            Бидний <span className="text-primary">түүх</span>
          </motion.h1>

          {foundedYear && (
            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fade}
              className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
            >
              {foundedYear} онд байгуулагдсанаас хойш {yearsSince(foundedYear)}+
              жилийн турш чанартай сургалтыг тасралтгүй явуулж ирсэн уламжлалтай сургууль.
            </motion.p>
          )}

          {STATS.length > 0 && (
            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fade}
              className={`mt-10 grid gap-4 sm:grid-cols-${Math.min(STATS.length, 4)} grid-cols-2`}
            >
              {STATS.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="rounded-xl border border-border/60 bg-background/60 p-4 backdrop-blur">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="mt-3 text-2xl font-bold tabular-nums text-foreground md:text-3xl">
                      {s.value}
                    </div>
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* Timeline */}
      {history.length > 0 && (
        <SectionShell
          id="about"
          tone="light"
          eyebrow="Түүхэн хугацаа"
          title={foundedYear ? `${yearsSince(foundedYear)}+ жилийн замнал` : "Түүхэн замнал"}
          description="Сургуулийн үндэслэлээс өнөөдрийг хүртэлх гол үе шатууд."
        >
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 hidden w-px bg-border md:block" />

            <div className="space-y-6">
              {history.map((t, i) => {
                const Icon = ICONS[t.icon ?? ""] ?? Landmark;
                const tone = CARD_TONES[i % CARD_TONES.length]!;
                return (
                  <motion.div
                    key={`${t.year}-${i}`}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={fade}
                    className="relative flex gap-6"
                  >
                    <div className="relative z-10 hidden shrink-0 md:block">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${tone.iconBg} ring-4 ring-background`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <Card className="flex-1 overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
                      <div className={`h-1 w-full bg-gradient-to-r ${tone.color}`} />
                      <div className="p-5">
                        <div className="flex items-center gap-3">
                          <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl md:hidden ${tone.iconBg}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                              {t.year}
                            </div>
                            <h3 className="text-base font-semibold text-foreground">
                              {t.title}
                            </h3>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {t.body}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </SectionShell>
      )}

      {/* Campus Journey */}
      {locations.length > 0 && (
        <section className="border-b border-border/50 bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-16 lg:px-8">
            <div className="max-w-2xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                {locations.length} байршил
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Сургуулийн аялал
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                Сургууль нь түүхэндээ хэд хэдэн удаа байршлаа сольж, эцэст нь одоогийн газардаа хүрсэн.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {locations.map((loc, i) => (
                <motion.div
                  key={`${loc.num}-${i}`}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fade}
                  className="group relative"
                >
                  <Card className="relative overflow-hidden p-5 transition hover:-translate-y-1 hover:shadow-lg">
                    <div className="absolute -right-4 -top-4 text-[100px] font-bold leading-none text-muted/30 transition group-hover:text-primary/10">
                      {loc.num}
                    </div>
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-primary">
                        {loc.era}
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-foreground">
                        {loc.label}
                      </h3>
                      {i < locations.length - 1 && (
                        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                          <ArrowRight className="h-3 w-3" />
                          <span>Дараагийнх руу</span>
                        </div>
                      )}
                      {i === locations.length - 1 && (
                        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Одоо энд
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mission & Values */}
      {mission.length > 0 && (
        <SectionShell
          id="mission"
          tone="light"
          eyebrow="Эрхэм зорилго"
          title="Бидний зорилго"
          description={missionDescription ?? undefined}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {mission.map((m, i) => {
              const Icon = ICONS[m.icon] ?? BookOpen;
              return (
                <motion.div
                  key={`${m.title}-${i}`}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fade}
                >
                  <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-foreground">
                      {m.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {m.body}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </SectionShell>
      )}
    </>
  );
}
