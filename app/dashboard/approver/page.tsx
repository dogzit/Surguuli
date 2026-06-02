import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { Briefcase, CheckCircle2, Clock, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { APPROVER_POSITIONS } from "@/lib/positions";
import { Card } from "@/components/ui/card";
import TeacherTable, { type TeacherRow } from "./TeacherTable";

export default async function ApproverDashboard() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "APPROVER") redirect("/dashboard/teacher");

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    include: {
      managedSignatures: { select: { approverId: true, note: true } },
    },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });

  const total = APPROVER_POSITIONS.length;
  const rows: TeacherRow[] = teachers.map((t) => {
    const signed = t.managedSignatures.length;
    const mine = t.managedSignatures.find((s) => s.approverId === me.id);
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

  const signedByMe = rows.filter((r) => r.alreadySigned).length;
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

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          icon={<Users className="h-4 w-4" />}
          label="Нийт багш"
          value={rows.length}
          tone="default"
        />
        <Stat
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Таны зурсан"
          value={signedByMe}
          tone="success"
        />
        <Stat
          icon={<Clock className="h-4 w-4" />}
          label="Үлдсэн"
          value={remaining}
          tone="warning"
        />
      </div>

      <TeacherTable teachers={rows} total={total} />
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "default" | "success" | "warning";
}) {
  const toneClasses = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
  };
  return (
    <Card className="flex items-center gap-3 p-4">
      <div
        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${toneClasses[tone]}`}
      >
        {icon}
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
      </div>
    </Card>
  );
}
