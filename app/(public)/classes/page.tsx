import type { Metadata } from "next";
import { Suspense } from "react";
import { ClassesSection } from "@/components/home/ClassesSection";
import { ClassesSkeleton } from "@/components/home/classes/ClassesSkeleton";
import { loadClassrooms } from "@/lib/classrooms";
import { loadSchoolInfoBundle, loadSchoolName } from "@/lib/school-info";

export async function generateMetadata(): Promise<Metadata> {
  const name = await loadSchoolName();
  return {
    title: name ? `Анги бүлэг · ${name}` : "Анги бүлэг",
    description: "Анги бүлэг, ангийн багш, сурагчдын тооны албан ёсны мэдээлэл.",
  };
}

// Class summaries only — student names are for staff, who see the full
// rosters on the staff site. The staff site refreshes this cache on change.
export const revalidate = 60;

async function ClassesData() {
  const [classrooms, info] = await Promise.all([loadClassrooms(), loadSchoolInfoBundle()]);
  return (
    <ClassesSection
      classrooms={classrooms}
      gradeManagers={info.gradeManagers}
      canSeeStudents={false}
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
