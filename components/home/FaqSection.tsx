"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionShell } from "./SectionShell";
import { cn } from "@/lib/utils";
import type { FaqRow } from "@/lib/site-data";

const fade = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function FaqSection({ items }: { items: FaqRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <SectionShell
      id="faq"
      tone="muted"
      eyebrow="Асуулт хариулт"
      title="Түгээмэл асуултууд"
      description="Эцэг эх, сурагчид хамгийн их асуудаг асуултуудын хариултууд."
    >
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Асуулт байхгүй байна</p>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {items.map((item, i) => {
            const isOpen = openId === item.id;
            return (
              <motion.div
                key={item.id}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
              >
                <Card className={cn("overflow-hidden transition", isOpen && "border-primary/30")}>
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    <span className="flex-1 text-sm font-semibold text-foreground">{item.question}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className="border-t border-border px-4 py-4 pl-16 text-sm leading-relaxed text-muted-foreground">
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </SectionShell>
  );
}
