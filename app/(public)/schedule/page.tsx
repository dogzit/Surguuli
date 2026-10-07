import type { Metadata } from "next";
import { ComingSoonSection } from "@/components/home/ComingSoonSection";
import { loadSchoolName } from "@/lib/school-info";

export async function generateMetadata(): Promise<Metadata> {
  const name = await loadSchoolName();
  return {
    title: name ? `Хичээлийн хуваарь · ${name}` : "Хичээлийн хуваарь",
    description: "Анги бүрийн хичээлийн хуваарь.",
    robots: { index: false, follow: true },
  };
}

export default function SchedulePage() {
  return (
    <ComingSoonSection
      eyebrow="Хичээлийн хуваарь"
      title="Анги бүрийн долоо хоногийн хуваарь"
      body="Ангиудын долоо хоногийн хичээлийн хуваарь болон онлайн танхимын мэдээллийг энд нэгтгэн байршуулна."
      ctaLabel="Анги бүлэг үзэх"
      ctaHref="/classes"
    />
  );
}
