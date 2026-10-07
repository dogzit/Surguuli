import type { Metadata } from "next";
import { Suspense } from "react";
import { ClassesSection } from "@/components/home/ClassesSection";
import { ClassesSkeleton } from "@/components/home/classes/ClassesSkeleton";
import { loadClassrooms } from "@/lib/classrooms";
import { isStaffViewer } from "@/lib/admin";
import { loadSchoolInfoBundle, loadSchoolName } from "@/lib/school-info";

export async function generateMetadata(): Promise<Metadata> {
  const name = await loadSchoolName();
  return {
    title: name ? `Анги бүлэг · ${name}` : "Анги бүлэг",
    description: "Анги бүлэг, ангийн багш, сурагчдын тооны албан ёсны мэдээлэл.",
  };
}

// Rendered per request: student names are included only for signed-in
// staff, so this page must never be cached and shared between visitors.
export const dynamic = "force-dynamic";

async function ClassesData() {
  const canSeeStudents = await isStaffViewer();
  const [classrooms, info] = await Promise.all([
    loadClassrooms({ includeStudents: canSeeStudents }),
    loadSchoolInfoBundle(),
  ]);
  return (
    <ClassesSection
      classrooms={classrooms}
      gradeManagers={info.gradeManagers}
      canSeeStudents={canSeeStudents}
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
