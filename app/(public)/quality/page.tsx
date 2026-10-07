import type { Metadata } from "next";
import { Quality } from "@/components/home/Quality";
import { loadSchoolInfoBundle, loadSchoolName } from "@/lib/school-info";

export async function generateMetadata(): Promise<Metadata> {
  const name = await loadSchoolName();
  return {
    title: name ? `Сургалтын чанар · ${name}` : "Сургалтын чанар",
    description:
      "Улсын болон олон улсын үнэлгээний тоо баримт, PISA, улсын шалгалтын үр дүн.",
  };
}

export const revalidate = 3600;

export default async function QualityPage() {
  const info = await loadSchoolInfoBundle();

  return (
    <Quality
      nationalExam={info.qualityNationalExam ?? ""}
      universityRate={info.qualityUniversityRate ?? ""}
      olympiadMedals={info.olympiadMedals ?? ""}
      pisaScore={info.qualityPisaScore ?? ""}
      nationalExamDesc={info.qualityNationalExamDesc ?? ""}
      teacherDesc={info.qualityTeacherDesc ?? ""}
    />
  );
}
