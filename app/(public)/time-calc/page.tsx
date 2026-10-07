import type { Metadata } from "next";
import { ComingSoonSection } from "@/components/home/ComingSoonSection";
import { loadSchoolName } from "@/lib/school-info";

export async function generateMetadata(): Promise<Metadata> {
  const name = await loadSchoolName();
  return {
    title: name ? `Цагийн тооцоо · ${name}` : "Цагийн тооцоо",
    description: "Сурагчдын цагийн тооцоо, ирцийн мэдээлэл.",
    robots: { index: false, follow: true },
  };
}

export default function TimeCalcPage() {
  return (
    <ComingSoonSection
      eyebrow="Цагийн тооцоо"
      title="Ирц, цагийн тооцоо"
      body="Ирц, цагийн тооцооны албан ёсны бүртгэлийг Боловсролын ерөнхий системд явуулж байна. Тус портал дээр сурагч, эцэг эхийн харах булан удахгүй нэмэгдэнэ."
      ctaLabel="Сурагчийн булан"
      ctaHref="/dashboard/student"
    />
  );
}
