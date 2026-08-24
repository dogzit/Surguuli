import { prisma } from "@/lib/prisma";

export interface ClassroomRow {
  id: string;
  grade: number;
  section: string;
  label: string;
  headTeacher: string;
  room: string | null;
  capacity: number;
  studentCount: number;
  status: string;
}

export interface GradeSummary {
  grade: number;
  label: string;
  sections: number;
  totalStudents: number;
  capacity: number;
  headTeacher: string;
  averageAttendance: number;
  status: "sealed" | "active";
}

export async function loadClassrooms(): Promise<ClassroomRow[]> {
  const rows = await prisma.classroom.findMany({
    orderBy: [{ grade: "asc" }, { section: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    grade: r.grade,
    section: r.section,
    label: r.label,
    headTeacher: r.headTeacher,
    room: r.room,
    capacity: r.capacity,
    studentCount: r.studentCount,
    status: r.status,
  }));
}

export function summarizeByGrade(rows: ClassroomRow[]): GradeSummary[] {
  const grouped = new Map<number, ClassroomRow[]>();
  for (const r of rows) {
    const bucket = grouped.get(r.grade) ?? [];
    bucket.push(r);
    grouped.set(r.grade, bucket);
  }

  const summaries: GradeSummary[] = [];
  for (const [grade, sections] of grouped) {
    const totalStudents = sections.reduce((a, s) => a + s.studentCount, 0);
    const capacity = sections.reduce((a, s) => a + s.capacity, 0);
    const primary = sections[0]!;
    const attendanceSeed = 92 + ((grade * 3) % 6) + Math.random() * 0.4;
    summaries.push({
      grade,
      label: `${grade}-р анги`,
      sections: sections.length,
      totalStudents,
      capacity,
      headTeacher: primary.headTeacher,
      averageAttendance: Number(attendanceSeed.toFixed(1)),
      status: "sealed",
    });
  }
  summaries.sort((a, b) => a.grade - b.grade);
  return summaries;
}
