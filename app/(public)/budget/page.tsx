import type { Metadata } from "next";
import { ComingSoonSection } from "@/components/home/ComingSoonSection";
import { loadSchoolName } from "@/lib/school-info";

export async function generateMetadata(): Promise<Metadata> {
  const name = await loadSchoolName();
  return {
    title: name ? `Төсөв · ${name}` : "Төсөв",
    description: "Сургуулийн төсөв, зарцуулалт.",
    robots: { index: false, follow: true },
  };
}

export default function BudgetPage() {
  return (
    <ComingSoonSection
      eyebrow="Төсөв"
      title="Сургуулийн төсөв"
      body="Захиргааны ил тод байдлын хүрээнд жилийн төсөв, зарцуулалт удахгүй энд нээгдэнэ."
      ctaLabel="Мэдээ уншиж эхлэх"
      ctaHref="/news"
    />
  );
}
