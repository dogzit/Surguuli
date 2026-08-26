import {
  ShieldAlert,
  Users,
  FileSignature,
  GraduationCap,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Activity,
} from "lucide-react";
import { canAccessAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { APPROVER_POSITIONS } from "@/lib/positions";
import AdminGate from "./AdminGate";
import RecentActivity from "./RecentActivity";
import ApproverTeacherTable from "./ApproverTeacherTable";

export default async function AdminDashboard() {
  const access = await canAccessAdmin();
  if (!access.allowed) return <AdminGate />;

  const isAdmin = access.role === "ADMIN";
  const isApprover = access.role === "APPROVER";

  const [users, signatures, classrooms, announcements, newsItems, gallery, achievements, faqs, events] =
    await Promise.all([
      prisma.user.findMany({
        orderBy: [{ role: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          position: true,
          role: true,
          _count: { select: { managedSignatures: true, signatures: true } },
        },
      }),
      prisma.signature.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          teacher: { select: { id: true, name: true, position: true } },
          approver: { select: { id: true, name: true, position: true } },
        },
      }),
      prisma.classroom.findMany(),
      prisma.announcement.findMany(),
      prisma.newsItem.findMany(),
      prisma.galleryImage.findMany(),
      prisma.achievement.findMany(),
      prisma.faq.findMany(),
      prisma.event.findMany(),
    ]);

  // ── Computed Stats ──
  const teachers = users.filter((u) => u.role === "TEACHER");
  const approvers = users.filter((u) => u.role === "APPROVER");
  const admins = users.filter((u) => u.role === "ADMIN");
  const totalPositions = APPROVER_POSITIONS.length;
  const validPos = new Set<string>(APPROVER_POSITIONS);

  const sigByTeacher = new Map<string, { signed: Set<string>; lastAt: Date | null }>();
  for (const s of signatures) {
    if (!validPos.has(s.approver.position)) continue;
    const agg = sigByTeacher.get(s.teacherId) ?? { signed: new Set(), lastAt: null };
    agg.signed.add(s.approver.position);
    if (!agg.lastAt || s.createdAt > agg.lastAt) agg.lastAt = s.createdAt;
    sigByTeacher.set(s.teacherId, agg);
  }

  const completedTeachers = Array.from(sigByTeacher.values()).filter((a) => a.signed.size >= totalPositions).length;
  const inProgressTeachers = Array.from(sigByTeacher.values()).filter((a) => a.signed.size > 0 && a.signed.size < totalPositions).length;
  const notStarted = teachers.length - completedTeachers - inProgressTeachers;
  const completionRate = teachers.length > 0 ? Math.round((completedTeachers / teachers.length) * 100) : 0;
  const avgSigs = teachers.length > 0 ? (signatures.length / teachers.length).toFixed(1) : "0";

  // Classroom stats
  const totalStudents = classrooms.reduce((sum, c) => sum + c.studentCount, 0);
  const totalCapacity = classrooms.reduce((sum, c) => sum + c.capacity, 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  // Recent activity (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentSigs = signatures.filter((s) => s.createdAt >= weekAgo);

  const clientSignatures = signatures.map((s) => ({
    id: s.id,
    note: s.note,
    createdAt: s.createdAt.toISOString(),
    teacher: s.teacher,
    approver: s.approver,
  }));

  // Build teacher rows for approver table
  const teacherRows = teachers.map((t) => {
    const validSigs = signatures.filter(
      (s) => s.teacherId === t.id && validPos.has(s.approver.position),
    );
    const signedPositions = new Set(validSigs.map((s) => s.approver.position));
    const signed = signedPositions.size;
    const mine = validSigs.find((s) => s.approverId === access.userId);
    return {
      id: t.id,
      name: t.name,
      position: t.position,
      signed,
      alreadySigned: !!mine,
      myNote: mine?.note ?? null,
      complete: signed >= totalPositions,
    };
  });

  // Sort: already signed first
  const sortedTeacherRows = [...teacherRows].sort((a, b) => {
    if (a.alreadySigned === b.alreadySigned) return 0;
    return a.alreadySigned ? -1 : 1;
  });

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isAdmin ? "Dashboard" : `Сайн байна уу, ${access.name}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? `Бүх системийн удирдлага · ${new Date().toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" })}`
                : access.position}
            </p>
          </div>
        </div>
      </div>

      {/* ── Primary Stats ── */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Нийт багш"
          value={teachers.length}
          color="blue"
          detail={`${approvers.length} баталгаажуулагч`}
        />
        <StatCard
          icon={<FileSignature className="h-5 w-5" />}
          label="Гарын үсэг"
          value={signatures.length}
          color="green"
          detail={`${avgSigs} дундаж/багш`}
        />
        <StatCard
          icon={<GraduationCap className="h-5 w-5" />}
          label="Ангиуд"
          value={classrooms.length}
          color="cyan"
          detail={`${totalStudents} сурагч`}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Баталгаажуулалт"
          value={`${completionRate}%`}
          color="purple"
          detail={`${completedTeachers}/${teachers.length} багш`}
        />
      </div>

      {/* ── Secondary Stats ── */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        <MiniStat
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          label="Баталгаажсан"
          value={completedTeachers}
          bg="bg-emerald-50 dark:bg-emerald-500/10"
        />
        <MiniStat
          icon={<Clock className="h-4 w-4 text-amber-500" />}
          label="Үргэлжилж буй"
          value={inProgressTeachers}
          bg="bg-amber-50 dark:bg-amber-500/10"
        />
        <MiniStat
          icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
          label="Эхлээгүй"
          value={notStarted}
          bg="bg-muted/50"
        />
        <MiniStat
          icon={<BarChart3 className="h-4 w-4 text-cyan-500" />}
          label="Сурагчид"
          value={totalStudents}
          bg="bg-cyan-50 dark:bg-cyan-500/10"
          detail={`${occupancyRate}%`}
        />
        <MiniStat
          icon={<Activity className="h-4 w-4 text-violet-500" />}
          label="7 хоногт"
          value={recentSigs.length}
          bg="bg-violet-50 dark:bg-violet-500/10"
          detail="шинэ үсэг"
        />
      </div>

      {/* ── Completion Progress ── */}
      <div className="mb-8 rounded-2xl border border-border/50 bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Баталгаажуулалтын явц</h2>
          <span className="text-2xl font-bold text-primary">{completionRate}%</span>
        </div>
        <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{completedTeachers}</div>
            <div className="text-xs text-muted-foreground">Баталгаажсан</div>
          </div>
          <div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{inProgressTeachers}</div>
            <div className="text-xs text-muted-foreground">Үргэлжилж буй</div>
          </div>
          <div>
            <div className="text-lg font-bold text-muted-foreground">{notStarted}</div>
            <div className="text-xs text-muted-foreground">Эхлээгүй</div>
          </div>
        </div>
      </div>

      {/* ── Teacher Table (for approvers) ── */}
      {isApprover && (
        <div className="mb-8">
          <h2 className="mb-4 text-base font-semibold">Багш нарын гарын үсэг</h2>
          <ApproverTeacherTable
            teachers={sortedTeacherRows}
            total={totalPositions}
            approverPosition={access.position ?? ""}
          />
        </div>
      )}

      {/* ── Content Overview (admin only) ── */}
      {isAdmin && (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <ContentStat label="Зарлал" count={announcements.length} color="bg-blue-500/10 text-blue-500" />
            <ContentStat label="Мэдээ" count={newsItems.length} color="bg-violet-500/10 text-violet-500" />
            <ContentStat label="Зураг" count={gallery.length} color="bg-pink-500/10 text-pink-500" />
            <ContentStat label="Амжилт" count={achievements.length} color="bg-amber-500/10 text-amber-500" />
          </div>

          {/* ── Recent Activity + Quick Actions ── */}
          <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
            <RecentActivity signatures={clientSignatures} />
            <div>
              <h2 className="mb-3 text-sm font-semibold">Хурдан үзүүлэлт</h2>
              <div className="space-y-3">
                <QuickStat label="Дундаж гарын үсэг / багш" value={avgSigs} suffix="ширхэг" color="text-cyan-500" />
                <QuickStat label="Баталгаажуулагч" value={approvers.length} suffix="хүн" color="text-indigo-500" />
                <QuickStat label="Шаардлагатай гарын үсэг" value={totalPositions} suffix="/ багш" color="text-amber-500" />
                <QuickStat label="Админууд" value={admins.length} suffix="хүн" color="text-rose-500" />
                <QuickStat label="Асуулт" value={faqs.length} suffix="ширхэг" color="text-indigo-500" />
                <QuickStat label="Үйл явдал" value={events.length} suffix="ширхэг" color="text-orange-500" />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function StatCard({ icon, label, value, color, detail }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  detail?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "from-blue-500/20 to-blue-500/5 text-blue-500",
    green: "from-emerald-500/20 to-emerald-500/5 text-emerald-500",
    cyan: "from-cyan-500/20 to-cyan-500/5 text-cyan-500",
    purple: "from-violet-500/20 to-violet-500/5 text-violet-500",
  };
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold tabular-nums">{typeof value === "number" ? value.toLocaleString() : value}</div>
      <div className="mt-1 text-sm font-medium text-muted-foreground">{label}</div>
      {detail && <div className="mt-0.5 text-xs text-muted-foreground/70">{detail}</div>}
    </div>
  );
}

function MiniStat({ icon, label, value, bg, detail }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
  detail?: string;
}) {
  return (
    <div className={`rounded-xl border border-border/50 p-3 ${bg}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
      {detail && <div className="text-[11px] text-muted-foreground/70">{detail}</div>}
    </div>
  );
}

function ContentStat({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
        <span className="text-lg font-bold">{count}</span>
      </div>
      <div className="text-sm font-medium">{label}</div>
    </div>
  );
}

function QuickStat({ label, value, suffix, color }: {
  label: string;
  value: number | string;
  suffix: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/50 p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className={`text-lg font-bold tabular-nums ${color}`}>{value}</span>
        <span className="ml-1 text-xs text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );
}
