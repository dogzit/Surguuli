import { prisma } from "@/lib/prisma";

// Shapes for the public /classes page. Deliberately minimal: student codes,
// attendance and GPA never leave the server from here, and student rows are
// only loaded when the caller has already verified a staff session.
export interface PublicStudent {
  id: string;
  firstName: string;
  lastName: string;
  gender: "M" | "F";
}

export interface PublicClassroom {
  id: string;
  grade: number;
  label: string;
  headTeacher: string;
  room: string | null;
  studentCount: number;
  students?: PublicStudent[];
}

export async function loadClassrooms(options?: {
  includeStudents?: boolean;
}): Promise<PublicClassroom[]> {
  const rows = await prisma.classroom.findMany({
    orderBy: [{ grade: "asc" }, { section: "asc" }],
    select: {
      id: true,
      grade: true,
      label: true,
      headTeacher: true,
      room: true,
      _count: { select: { students: true } },
    },
  });

  const byClassroom = new Map<string, PublicStudent[]>();
  if (options?.includeStudents && rows.length > 0) {
    const students = await prisma.student.findMany({
      where: { classroomId: { in: rows.map((r) => r.id) } },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, gender: true, classroomId: true },
    });
    for (const s of students) {
      const list = byClassroom.get(s.classroomId) ?? [];
      list.push({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        gender: s.gender === "F" ? "F" : "M",
      });
      byClassroom.set(s.classroomId, list);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    grade: r.grade,
    label: r.label,
    headTeacher: r.headTeacher,
    room: r.room,
    // Live relation count, not the denormalized studentCount column.
    studentCount: r._count.students,
    students: options?.includeStudents ? (byClassroom.get(r.id) ?? []) : undefined,
  }));
}
