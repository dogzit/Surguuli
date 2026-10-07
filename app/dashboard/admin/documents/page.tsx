import { GraduationCap } from "lucide-react";
import { canAccessAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import { PageHero } from "../PageHero";
import DocumentsPanel, {
  type AppRow,
  type StudentOption,
} from "../DocumentsPanel";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const access = await canAccessAdmin();
  if (access.role !== "ADMIN") return <AdminGate role={access.role as "APPROVER" | null} />;

  // Students list for the picker in the create dialog. Cap at 5000 so the
  // whole roster fits without paging — matches the current student scale.
  const [applications, students] = await Promise.all([
    prisma.universityApplication.findMany({
      orderBy: [{ status: "asc" }, { deadline: "asc" }, { createdAt: "desc" }],
      include: {
        student: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            classroom: { select: { grade: true, section: true, label: true } },
          },
        },
        documents: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            type: true,
            status: true,
            fileUrl: true,
            note: true,
            updatedAt: true,
          },
        },
      },
    }),
    prisma.student.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 5000,
      select: {
        id: true,
        code: true,
        firstName: true,
        lastName: true,
        classroom: { select: { label: true, grade: true } },
      },
    }),
  ]);

  const activeCount = applications.filter((a) => a.status === "open").length;
  const submittedCount = applications.filter((a) => a.status === "submitted").length;
  const readyDocs = applications.reduce(
    (sum, a) => sum + a.documents.filter((d) => d.status === "ready" || d.status === "delivered").length,
    0,
  );
  const pendingDocs = applications.reduce(
    (sum, a) => sum + a.documents.filter((d) => d.status === "pending").length,
    0,
  );

  const appRows: AppRow[] = applications.map((a) => ({
    id: a.id,
    university: a.university,
    country: a.country,
    program: a.program,
    deadline: a.deadline ? a.deadline.toISOString() : null,
    status: a.status,
    notes: a.notes,
    student: {
      id: a.student.id,
      code: a.student.code,
      firstName: a.student.firstName,
      lastName: a.student.lastName,
      classroomLabel: a.student.classroom.label,
      grade: a.student.classroom.grade,
    },
    documents: a.documents.map((d) => ({
      id: d.id,
      type: d.type,
      status: d.status,
      fileUrl: d.fileUrl,
      note: d.note,
      updatedAt: d.updatedAt.toISOString(),
    })),
    createdAt: a.createdAt.toISOString(),
  }));

  const studentOptions: StudentOption[] = students.map((s) => ({
    id: s.id,
    code: s.code,
    firstName: s.firstName,
    lastName: s.lastName,
    classroomLabel: s.classroom.label,
    grade: s.classroom.grade,
  }));

  return (
    <>
      <PageHero
        icon={GraduationCap}
        title="Гадаад сургуулийн өргөдөл"
        subtitle="Common App болон гадны их сургуульд гаргах бичиг баримтын удирдлага"
        accent="emerald"
        stats={[
          { label: "Идэвхтэй өргөдөл", value: activeCount, tone: "accent" },
          { label: "Илгээгдсэн", value: submittedCount },
          { label: "Бэлэн бичиг", value: readyDocs },
          { label: "Хүлээгдэж буй", value: pendingDocs, tone: "muted" },
        ]}
      />
      <DocumentsPanel applications={appRows} students={studentOptions} />
    </>
  );
}
