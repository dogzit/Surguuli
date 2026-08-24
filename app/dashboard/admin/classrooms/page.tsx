import { GraduationCap } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import ClassroomPanel from "../ClassroomPanel";

export default async function ClassroomsPage() {
  if (!(await isAdmin())) return <AdminGate />;

  const classrooms = await prisma.classroom.findMany({
    orderBy: [{ grade: "asc" }, { section: "asc" }],
  });

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Ангиуд</h1>
          <p className="text-xs text-muted-foreground">
            1—12-р ангийн удирдлага
          </p>
        </div>
      </div>
      <ClassroomPanel
        classrooms={classrooms.map((c) => ({
          id: c.id,
          grade: c.grade,
          section: c.section,
          label: c.label,
          headTeacher: c.headTeacher,
          room: c.room,
          capacity: c.capacity,
          studentCount: c.studentCount,
          status: c.status,
        }))}
      />
    </>
  );
}
