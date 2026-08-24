import type { Metadata } from "next";
import { Suspense } from "react";
import { ClassesSection } from "@/components/home/ClassesSection";
import { ClassesSkeleton } from "@/components/home/classes/ClassesSkeleton";
import { loadClassrooms, summarizeByGrade } from "@/lib/classrooms";

export const metadata: Metadata = {
  title: "Анги бүлэг · Монгол 3-р сургууль",
  description:
    "1—12-р ангиудын албан ёсны мэдээлэл, идэвхтэй хуваарилалт, сурагчийн ирц, дүнгийн үндсэн үзүүлэлт.",
};

export const dynamic = "force-dynamic";

async function ClassesData() {
  const classroomRows = await loadClassrooms();
  const gradeSummaries = summarizeByGrade(classroomRows);
  return (
    <ClassesSection
      classroomRows={classroomRows}
      gradeSummaries={gradeSummaries}
    />
  );
}

export default function ClassesPage() {
  return (
    <Suspense fallback={<ClassesSkeleton />}>
      <ClassesData />
    </Suspense>
  );
}
