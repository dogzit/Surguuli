import { prisma } from "@/lib/prisma";

export interface StudentRow {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  gender: "M" | "F";
  attendance: number;
  gpa: number;
  classroomId: string;
}

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
  students?: StudentRow[];
  // Real average attendance for this classroom (0-100). null when there are
  // no students to average — callers should render "-" instead of a made-up
  // number.
  averageAttendance?: number | null;
}

export interface GradeSummary {
  grade: number;
  label: string;
  sections: number;
  totalStudents: number;
  capacity: number;
  headTeacher: string;
  // Real average across all students in this grade, weighted by student count.
  // null when the grade has no student rows yet.
  averageAttendance: number | null;
  status: "sealed" | "active";
}

export async function loadClassrooms(options?: {
  includeStudentsForGrades?: number[];
}): Promise<ClassroomRow[]> {
  const grades = options?.includeStudentsForGrades;

  // Fetch all classrooms with student counts + average attendance via
  // Prisma aggregation — avoids loading all student rows into memory.
  const rows = await prisma.classroom.findMany({
    orderBy: [{ grade: "asc" }, { section: "asc" }],
    include: {
      _count: { select: { students: true } },
      students: {
        select: { attendance: true },
      },
    },
  });

  // For grades where the caller needs full student data, fetch separately
  const studentData: Record<string, StudentRow[]> = {};
  if (grades && grades.length > 0) {
    const classroomIds = rows
      .filter((r) => grades.includes(r.grade))
      .map((r) => r.id);

    if (classroomIds.length > 0) {
      const students = await prisma.student.findMany({
        where: { classroomId: { in: classroomIds } },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: {
          id: true,
          code: true,
          firstName: true,
          lastName: true,
          gender: true,
          attendance: true,
          gpa: true,
          classroomId: true,
        },
      });

      for (const s of students) {
        if (!studentData[s.classroomId]) studentData[s.classroomId] = [];
        studentData[s.classroomId].push(s as StudentRow);
      }
    }
  }

  return rows.map((r) => {
    const attendances = r.students.map((s) => s.attendance);
    const averageAttendance =
      attendances.length > 0
        ? Number(
            (attendances.reduce((a, b) => a + b, 0) / attendances.length).toFixed(
              1,
            ),
          )
        : null;

    const wantsStudents = grades && grades.includes(r.grade);

    return {
      id: r.id,
      grade: r.grade,
      section: r.section,
      label: r.label,
      headTeacher: r.headTeacher,
      room: r.room,
      capacity: r.capacity,
      studentCount: r._count.students,
      status: r.status,
      averageAttendance,
      students: wantsStudents ? (studentData[r.id] ?? []) : undefined,
    };
  });
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

    // Weighted average using each classroom's own average and its student
    // count. Sections with no students contribute nothing.
    let attendanceSum = 0;
    let attendanceStudents = 0;
    for (const s of sections) {
      if (s.averageAttendance != null && s.studentCount > 0) {
        attendanceSum += s.averageAttendance * s.studentCount;
        attendanceStudents += s.studentCount;
      }
    }
    const averageAttendance =
      attendanceStudents > 0
        ? Number((attendanceSum / attendanceStudents).toFixed(1))
        : null;

    summaries.push({
      grade,
      label: `${grade}-р анги`,
      sections: sections.length,
      totalStudents,
      capacity,
      headTeacher: primary.headTeacher,
      averageAttendance,
      status: "sealed",
    });
  }
  summaries.sort((a, b) => a.grade - b.grade);
  return summaries;
}
