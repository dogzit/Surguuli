import { Activity, ShieldAlert, Users as UsersIcon, FileSignature } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { APPROVER_POSITIONS } from "@/lib/positions";
import { StatCard, StatGrid } from "@/components/StatCard";
import AdminTabs from "./AdminTabs";
import AdminGate from "./AdminGate";

export default async function AdminDashboard() {
  if (!(await isAdmin())) return <AdminGate />;

  const [users, signatures] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { position: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        role: true,
        _count: {
          select: { managedSignatures: true, signatures: true },
        },
      },
    }),
    prisma.signature.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        teacher: { select: { id: true, name: true, position: true } },
        approver: { select: { id: true, name: true, position: true } },
      },
    }),
  ]);

  const teachersCount = users.filter((u) => u.role === "TEACHER").length;
  const approversCount = users.filter((u) => u.role === "APPROVER").length;

  // Бүрэн дууссан багш нарын тоо
  const sigByTeacher = new Map<string, Set<string>>();
  for (const s of signatures) {
    const validPos = new Set<string>(APPROVER_POSITIONS);
    if (!validPos.has(s.approver.position)) continue;
    const set = sigByTeacher.get(s.teacherId) ?? new Set<string>();
    set.add(s.approver.position);
    sigByTeacher.set(s.teacherId, set);
  }
  const totalPositions = APPROVER_POSITIONS.length;
  const completedTeachers = Array.from(sigByTeacher.values()).filter(
    (set) => set.size >= totalPositions,
  ).length;

  const clientUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    position: u.position,
    role: u.role,
    signedCount: u._count.signatures,
    receivedCount: u._count.managedSignatures,
  }));

  const clientSignatures = signatures.map((s) => ({
    id: s.id,
    note: s.note,
    createdAt: s.createdAt.toISOString(),
    teacher: s.teacher,
    approver: s.approver,
  }));

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Админ хяналтын самбар
          </h1>
          <p className="text-sm text-muted-foreground">
            Бүх системийн удирдлага
          </p>
        </div>
      </header>

      <StatGrid>
        <StatCard
          icon={<UsersIcon className="h-4 w-4" />}
          label="Багш"
          value={teachersCount}
          tone="default"
        />
        <StatCard
          icon={<UsersIcon className="h-4 w-4" />}
          label="Баталгаажуулагч"
          value={approversCount}
          tone="default"
        />
        <StatCard
          icon={<FileSignature className="h-4 w-4" />}
          label="Нийт гарын үсэг"
          value={signatures.length}
          tone="success"
        />
        <StatCard
          icon={<Activity className="h-4 w-4" />}
          label="Бүрэн баталгаажсан"
          value={completedTeachers}
          tone="success"
        />
      </StatGrid>

      <AdminTabs
        users={clientUsers}
        signatures={clientSignatures}
      />
    </main>
  );
}
