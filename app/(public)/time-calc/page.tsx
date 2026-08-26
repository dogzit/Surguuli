import type { Metadata } from "next";
import { SectionShell } from "@/components/home/SectionShell";

export const metadata: Metadata = {
  title: "Цагийн тооцоо · Нийслэлийн ерөнхий боловсролын 3-р сургууль",
  description: "Сурагчдын цагийн тооцоо, ирцийн мэдээлэл.",
};

export default function TimeCalcPage() {
  return (
    <SectionShell
      id="time-calc"
      tone="light"
      eyebrow="Цагийн тооцоо"
      title="Цагийн тооцоо"
      description="Сурагчдын цагийн тооцоо энд нэмэгдэх болно."
    >
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Цагийн тооцоо одоогоор бэлдэгдэж байна.
        </p>
      </div>
    </SectionShell>
  );
}
