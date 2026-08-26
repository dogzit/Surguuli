import type { Metadata } from "next";
import { SectionShell } from "@/components/home/SectionShell";

export const metadata: Metadata = {
  title: "Багшийн үнэлгээ · Нийслэлийн ерөнхий боловсролын 3-р сургууль",
  description: "Багш нарын үнэлгээ, сэтгэгдэл.",
};

export default function TeacherEvalPage() {
  return (
    <SectionShell
      id="teacher-eval"
      tone="light"
      eyebrow="Багшийн үнэлгээ"
      title="Багшийн үнэлгээ"
      description="Багш нарын үнэлгээ энд нэмэгдэх болно."
    >
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Багшийн үнэлгээ одоогоор бэлдэгдэж байна.
        </p>
      </div>
    </SectionShell>
  );
}
