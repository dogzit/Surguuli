import type { Metadata } from "next";
import { SectionShell } from "@/components/home/SectionShell";

export const metadata: Metadata = {
  title: "Хичээлийн хуваарь · Нийслэлийн ерөнхий боловсролын 3-р сургууль",
  description: "Анги бүрийн хичээлийн хуваарь.",
};

export default function SchedulePage() {
  return (
    <SectionShell
      id="schedule"
      tone="light"
      eyebrow="Хичээлийн хуваарь"
      title="Хичээлийн хуваарь"
      description="Анги бүрийн хичээлийн хуваарь энд нэмэгдэх болно."
    >
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Хуваарь одоогоор бэлдэгдэж байна.
        </p>
      </div>
    </SectionShell>
  );
}
