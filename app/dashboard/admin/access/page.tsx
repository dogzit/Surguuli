import { KeyRound } from "lucide-react";
import { canAccessAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import { PageHero } from "../PageHero";
import AccessPanel, {
  type ClassroomRow,
  type InviteRow,
} from "../AccessPanel";

export const dynamic = "force-dynamic";

export default async function AccessPage() {
  const access = await canAccessAdmin();
  if (access.role !== "ADMIN") return <AdminGate role={access.role as "APPROVER" | null} />;

  const [classrooms, invites] = await Promise.all([
    prisma.classroom.findMany({
      orderBy: [{ grade: "asc" }, { section: "asc" }],
      include: {
        students: {
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            pin: true, // just to know "has pin" — never sent to client
            loginAt: true,
            _count: { select: { parentLinks: true, inviteCodes: true } },
          },
        },
      },
    }),
    prisma.inviteCode.findMany({
      where: { usedAt: null },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        student: {
          select: { code: true, firstName: true, lastName: true },
        },
      },
    }),
  ]);

  // Compute at-a-glance totals for the hero chips.
  let totalStudents = 0;
  let studentsWithPin = 0;
  let studentsWithParent = 0;
  for (const c of classrooms) {
    for (const s of c.students) {
      totalStudents++;
      if (s.pin) studentsWithPin++;
      if (s._count.parentLinks > 0) studentsWithParent++;
    }
  }

  const classroomRows: ClassroomRow[] = classrooms.map((c) => ({
    id: c.id,
    grade: c.grade,
    section: c.section,
    label: c.label,
    headTeacher: c.headTeacher,
    students: c.students.map((s) => ({
      id: s.id,
      code: s.code,
      firstName: s.firstName,
      lastName: s.lastName,
      hasPin: !!s.pin,
      loginAt: s.loginAt ? s.loginAt.toISOString() : null,
      parentCount: s._count.parentLinks,
      openInviteCount: s._count.inviteCodes,
    })),
  }));

  const inviteRows: InviteRow[] = invites.map((i) => ({
    id: i.id,
    code: i.code,
    relation: i.relation,
    expiresAt: i.expiresAt ? i.expiresAt.toISOString() : null,
    createdAt: i.createdAt.toISOString(),
    student: {
      code: i.student.code,
      name: `${i.student.lastName}. ${i.student.firstName}`,
    },
  }));

  return (
    <>
      <PageHero
        icon={KeyRound}
        title="Нэвтрэх эрх"
        subtitle="Сурагчийн PIN, эцэг эхийн урилгын кодны удирдлага"
        accent="amber"
        stats={[
          { label: "Нийт сурагч", value: totalStudents, tone: "accent" },
          { label: "PIN олгосон", value: studentsWithPin },
          { label: "Эцэг эхтэй холбогдсон", value: studentsWithParent },
          {
            label: "Идэвхтэй урилга",
            value: inviteRows.length,
            tone: "muted",
          },
        ]}
      />
      <AccessPanel classrooms={classroomRows} invites={inviteRows} />
    </>
  );
}
