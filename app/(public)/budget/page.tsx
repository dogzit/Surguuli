import type { Metadata } from "next";
import { SectionShell } from "@/components/home/SectionShell";

export const metadata: Metadata = {
  title: "Төсөв · Нийслэлийн ерөнхий боловсролын 3-р сургууль",
  description: "Сургуулийн төсөв, зарцуулалт.",
};

export default function BudgetPage() {
  return (
    <SectionShell
      id="budget"
      tone="light"
      eyebrow="Төсөв"
      title="Төсөв"
      description="Сургуулийн төсөв энд нэмэгдэх болно."
    >
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Төсөв одоогоор бэлдэгдэж байна.
        </p>
      </div>
    </SectionShell>
  );
}
