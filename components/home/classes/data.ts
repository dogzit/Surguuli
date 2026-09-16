import type { Classroom } from "./types";

export interface ClassroomInput {
  id: string;
  grade: number;
  section: string;
  label: string;
  headTeacher: string;
  room: string | null;
  capacity: number;
  studentCount: number;
  status: string;
  students?: Array<{
    id: string;
    code: string;
    firstName: string;
    lastName: string;
    gender: "M" | "F";
    attendance: number;
    gpa: number;
  }>;
}

export function hydrateGrade2(rows: ClassroomInput[]): Classroom[] {
  return rows
    .filter((r) => r.grade === 2)
    .map((r) => ({
      id: r.id,
      label: r.label,
      headTeacher: r.headTeacher,
      room: r.room ?? "-",
      capacity: r.capacity,
      createdAt: "2025-09-01",
      status: r.status === "draft" ? "draft" : "official",
      // Only real students — no invented rows. Empty roster stays empty so
      // the UI shows an accurate "no students yet" state rather than
      // deceptive placeholder names.
      students: (r.students ?? []).map((s) => ({
        id: s.id,
        code: s.code,
        lastName: s.lastName,
        firstName: s.firstName,
        gender: s.gender,
        attendance: s.attendance,
        gpa: s.gpa,
      })),
    }));
}
