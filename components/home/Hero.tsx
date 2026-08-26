"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Logo from "@/components/Logo";

const fade = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

interface HeroProps {
  students: string;
  staff: string;
  foundedYear?: string;
  principalName?: string;
  principalQuote?: string;
}

export function Hero({
  students,
  staff,
  foundedYear = "1921",
  principalName = "Хоролгарав",
  principalQuote = "Хүүхэд бүр эрдэм номын гэрлээр гэрэлтэж, өөрийгөө болон нийгмээ хүндэтгэж сурах — энэ бол бидний сургалтын тэргүүлэх зорилго.",
}: HeroProps) {
  const STATS = [
    { k: foundedYear, v: "Байгуулагдсан он" },
    { k: students, v: "Сурагч" },
    { k: staff, v: "Багш, ажилтан" },
  ];
  const principalInitial = principalName.trim().charAt(0) || "Х";

  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/[0.07] via-background to-background"
    >
      <div
        className="absolute inset-0 -z-10 opacity-[0.05]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.15fr_1fr] md:items-center md:py-20 lg:px-8">
        <div>
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fade}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary"
          >
            <ShieldCheck className="h-3 w-3" />
            Албан ёсны цахим хуудас
          </motion.div>
          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fade}
            className="mt-5 text-3xl font-bold tracking-tight text-foreground md:text-5xl"
          >
            Нийслэлийн ерөнхий боловсролын 3-р сургууль
          </motion.h1>
          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fade}
            className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base"
          >
            <span className="font-semibold text-foreground">Нийслэлийн ерөнхий боловсролын 3-р сургууль</span>{" "}
            нь 1921 оны Ардын хувьсгалын дараа байгуулагдсан Монголын анхны
            олон нийтийн сургуулиудын нэг бөгөөд Сүхбаатар дүүрэг, 10-р хорооны
            нутаг дэвсгэрт өнөөдрийг хүртэл үйл ажиллагаагаа явуулж байна.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fade}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <Button size="lg" asChild>
              <Link href="/classes">
                Анги, бүлгийн мэдээлэл
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/tour">
                <PlayCircle className="mr-1.5 h-4 w-4" />
                Виртуал аялалд оролцох
              </Link>
            </Button>

          </motion.div>

          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fade}
            className="mt-10 grid max-w-lg grid-cols-3 gap-6 text-left"
          >
            {STATS.map((s) => (
              <div key={s.k}>
                <dt className="text-2xl font-bold text-foreground tabular-nums md:text-3xl">
                  {s.k}
                </dt>
                <dd className="mt-0.5 text-[11px] uppercase tracking-widest text-muted-foreground">
                  {s.v}
                </dd>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fade}
        >
          <Card className="relative hidden overflow-hidden p-6 md:block">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Logo size={18} />
                Захирлын мэндчилгээ
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                <ShieldCheck className="h-3 w-3" />
                Батлагдсан
              </span>
            </div>
            <blockquote className="mt-4 text-base italic leading-relaxed text-foreground md:text-lg">
              «{principalQuote}»
            </blockquote>
            <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {principalInitial}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {principalName}
                </div>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Сургуулийн захирал
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
