import { Users } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import StudentsPanel from "../StudentsPanel";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  if (!(await isAdmin())) return <AdminGate />;

  const classrooms = await prisma.classroom.findMany({
    orderBy: [{ grade: "asc" }, { section: "asc" }],
    include: {
      students: {
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      },
    },
  });

  const rows = classrooms.map((c) => ({
    id: c.id,
    grade: c.grade,
    section: c.section,
    label: c.label,
    headTeacher: c.headTeacher,
    room: c.room,
    capacity: c.capacity,
    status: c.status,
    students: c.students.map((s) => ({
      id: s.id,
      code: s.code,
      firstName: s.firstName,
      lastName: s.lastName,
      gender: s.gender,
      attendance: s.attendance,
      gpa: s.gpa,
      chosen: s.chosen,
      previousClassroomId: s.previousClassroomId,
    })),
  }));

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Сурагчид</h1>
          <p className="text-xs text-muted-foreground">
            Ангиудын сурагчийн бүртгэл, Excel импорт, шинэ бүлэг үүсгэх
          </p>
        </div>
      </div>
      <StudentsPanel classrooms={rows} />
    </>
  );
}
