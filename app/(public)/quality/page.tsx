import type { Metadata } from "next";
import { Quality } from "@/components/home/Quality";
import { loadSchoolInfo } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Сургалтын чанар · Монгол 3-р сургууль",
  description:
    "Улсын болон олон улсын үнэлгээний тоо баримт, PISA, улсын шалгалтын үр дүн.",
};

export default async function QualityPage() {
  const info = await loadSchoolInfo();

  return (
    <Quality
      nationalExam={info.quality_national_exam ?? "3.72"}
      universityRate={info.quality_university_rate ?? "94"}
      olympiadMedals={info.quality_olympiad_medals ?? "27"}
      pisaScore={info.quality_pisa_score ?? "512"}
      nationalExamDesc={info.quality_national_exam_desc ?? ""}
      teacherDesc={info.quality_teacher_desc ?? ""}
    />
  );
}
