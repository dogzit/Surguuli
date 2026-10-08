import type { Metadata } from "next";
import { ComingSoonSection } from "@/components/home/ComingSoonSection";
import { loadSchoolName } from "@/lib/school-info";

export async function generateMetadata(): Promise<Metadata> {
  const name = await loadSchoolName();
  return {
    title: name ? `Багшийн үнэлгээ · ${name}` : "Багшийн үнэлгээ",
    description: "Багш нарын үнэлгээ, сэтгэгдэл.",
    robots: { index: false, follow: true },
  };
}

export default function TeacherEvalPage() {
  return (
    <ComingSoonSection
      eyebrow="Багшийн үнэлгээ"
      title="Багш нарын мэргэжлийн үнэлгээ"
      body="Багш нарын мэргэшил, үнэлгээний албан ёсны хэсэг удахгүй нээгдэнэ. Одоохондоо сургалтын чанарын хуудсаас багшийн бүрэлдэхүүн, мэргэшил гэх мэт мэдээллийг үзэж болно."
      ctaLabel="Сургалтын чанар"
      ctaHref="/quality"
    />
  );
}
