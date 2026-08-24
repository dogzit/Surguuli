export type Gender = "M" | "F";

export interface Student {
  id: string;
  code: string;
  lastName: string;
  firstName: string;
  gender: Gender;
  attendance: number;
  gpa: number;
}

export interface Classroom {
  id: string;
  label: string;
  headTeacher: string;
  room: string;
  capacity: number;
  createdAt: string;
  status: "official" | "draft";
  students: Student[];
}

export interface GradeSummary {
  grade: number;
  label: string;
  totalStudents: number;
  sections: number;
  headTeacher: string;
  capacity: number;
  averageAttendance: number;
  status: "sealed" | "active";
}
