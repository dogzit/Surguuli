import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { Briefcase, CheckCircle2, Clock, Users, FileCheck } from "lucide-react"; // FileCheck нэмэв
import { prisma } from "@/lib/prisma";
import { APPROVER_POSITIONS } from "@/lib/positions";
import { StatCard, StatGrid } from "@/components/StatCard";
import TeacherTable, { type TeacherRow } from "./TeacherTable";

export default async function ApproverDashboard() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "APPROVER") redirect("/dashboard/teacher");

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    include: {
      managedSignatures: {
        select: {
          approverId: true,
          note: true,
          approver: { select: { position: true } },
        },
      },
    },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });

  const total = APPROVER_POSITIONS.length;
  const validPositions = new Set<string>(APPROVER_POSITIONS);

  const rows: TeacherRow[] = teachers.map((t) => {
    const validSigs = t.managedSignatures.filter((s) =>
      validPositions.has(s.approver.position),
    );
    const signedSet = new Set(validSigs.map((s) => s.approver.position));
    const signed = signedSet.size;
    const mine = validSigs.find((s) => s.approverId === me.id);
    return {
      id: t.id,
      name: t.name,
      position: t.position,
      signed,
      alreadySigned: !!mine,
      myNote: mine?.note ?? null,
      complete: signed >= total,
    };
  });

  // Эрэмбэлэлт: Зурсан багш нарыг хамгийн дээд талд гаргах
  const sortedRows = [...rows].sort((a, b) => {
    if (a.alreadySigned === b.alreadySigned) return 0;
    return a.alreadySigned ? -1 : 1;
  });

  const signedByMe = rows.filter((r) => r.alreadySigned).length;
  const fullyCompleted = rows.filter((r) => r.complete).length; // Бүрэн баталгаажсан багш нар
  const remaining = rows.length - signedByMe;

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Briefcase className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {me.name}
          </h1>
          <p className="text-sm text-muted-foreground">{me.position}</p>
        </div>
      </header>

      <StatGrid>
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Нийт багш"
          value={rows.length}
          tone="default"
        />
        <StatCard
          icon={<FileCheck className="h-4 w-4" />}
          label="Бүрэн баталгаажсан"
          value={fullyCompleted}
          tone="success"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Таны зурсан"
          value={signedByMe}
          tone="success"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Зураагүй багш"
          value={remaining}
          tone="warning"
        />
      </StatGrid>

      <TeacherTable teachers={sortedRows} total={total} />
    </main>
  );
}