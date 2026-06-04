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

  // Багш бүрийн сүүлийн төлөв (нэгдсэн дүнд хэрэглэнэ)
  const validPos = new Set<string>(APPROVER_POSITIONS);
  const totalPositions = APPROVER_POSITIONS.length;
  type TeacherAgg = {
    signed: Set<string>;
    lastAt: Date | null;
    lastApprover: string | null;
  };
  const sigByTeacher = new Map<string, TeacherAgg>();
  // signatures нь createdAt DESC байгаа тул эхний орох signature хамгийн сүүлийнх
  for (const s of signatures) {
    if (!validPos.has(s.approver.position)) continue;
    const agg = sigByTeacher.get(s.teacherId) ?? {
      signed: new Set<string>(),
      lastAt: null,
      lastApprover: null,
    };
    agg.signed.add(s.approver.position);
    if (!agg.lastAt || s.createdAt > agg.lastAt) {
      agg.lastAt = s.createdAt;
      agg.lastApprover = s.approver.name;
    }
    sigByTeacher.set(s.teacherId, agg);
  }
  const completedTeachers = Array.from(sigByTeacher.values()).filter(
    (a) => a.signed.size >= totalPositions,
  ).length;

  const teacherUsers = users.filter((u) => u.role === "TEACHER");
  const overviewRows = teacherUsers
    .map((t) => {
      const agg = sigByTeacher.get(t.id);
      const signedSet = agg?.signed ?? new Set<string>();
      const signedPositions = APPROVER_POSITIONS.filter((p) =>
        signedSet.has(p),
      );
      const missingPositions = APPROVER_POSITIONS.filter(
        (p) => !signedSet.has(p),
      );
      return {
        id: t.id,
        name: t.name,
        position: t.position,
        signed: signedSet.size,
        total: totalPositions,
        complete: signedSet.size >= totalPositions,
        signedPositions: [...signedPositions],
        missingPositions: [...missingPositions],
        lastSignedAt: agg?.lastAt ? agg.lastAt.toISOString() : null,
        lastApproverName: agg?.lastApprover ?? null,
      };
    })
    .sort((a, b) => {
      // Эхэнд хагас үргэлжилж буй, дараа нь баталгаажсан, эцэст нь эхлээгүй
      const aGroup = a.complete ? 1 : a.signed === 0 ? 2 : 0;
      const bGroup = b.complete ? 1 : b.signed === 0 ? 2 : 0;
      if (aGroup !== bGroup) return aGroup - bGroup;
      // Хагас үргэлжилж буй дотроо: сүүлд хөдөлсөн нь дээгүүр
      if (aGroup === 0) {
        const at = a.lastSignedAt ? new Date(a.lastSignedAt).getTime() : 0;
        const bt = b.lastSignedAt ? new Date(b.lastSignedAt).getTime() : 0;
        return bt - at;
      }
      return a.name.localeCompare(b.name);
    });

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
        overview={overviewRows}
      />
    </main>
  );
}
