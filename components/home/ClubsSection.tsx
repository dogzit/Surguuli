"use client";

import { motion } from "framer-motion";
import { Dumbbell, Music, Palette, Code, Globe, BookOpen, Users, Camera } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionShell } from "./SectionShell";
import type { ClubRow } from "@/lib/site-data";

const ICON_MAP: Record<string, typeof Dumbbell> = {
  Dumbbell, Music, Palette, Code, Globe, BookOpen, Users, Camera,
};

const CLUB_COLORS = [
  "from-rose-500/10 to-pink-500/10",
  "from-blue-500/10 to-cyan-500/10",
  "from-emerald-500/10 to-teal-500/10",
  "from-amber-500/10 to-orange-500/10",
  "from-violet-500/10 to-purple-500/10",
  "from-indigo-500/10 to-blue-500/10",
];

const fade = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function ClubsSection({ clubs }: { clubs: ClubRow[] }) {
  return (
    <SectionShell
      id="clubs"
      tone="light"
      eyebrow="Дугуйлан"
      title="Нэмэлт үйл ажиллагаа"
      description="Сурагчдын хобби, сонирхлын дагуу дугуйлан, клубууд."
    >
      {clubs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Дугуйлан байхгүй байна</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club, i) => {
            const Icon = ICON_MAP[club.icon ?? ""] ?? Users;
            const gradient = CLUB_COLORS[i % CLUB_COLORS.length]!;
            return (
              <motion.div
                key={club.id}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
              >
                <Card className="group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />
                  <div className="p-5">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-foreground">{club.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{club.description}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                      {club.teacher && <span>Багш: {club.teacher}</span>}
                      {club.schedule && <span>Хуваарь: {club.schedule}</span>}
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
