import Link from "next/link";
import {
  History,
  KeyRound,
  ShieldAlert,
  LogIn,
  LogOut,
  AlertTriangle,
  Users as UsersIcon,
  Wrench,
  ArrowRight,
  FileSignature,
  GraduationCap,
  Newspaper,
  Activity,
  ShieldCheck,
  Mail,
  MessageSquare,
  Award,
  HelpCircle,
  Calendar,
  Image as ImageIcon,
  Database,
  Crown,
  UserCheck,
  Clock,
} from "lucide-react";
import { Prisma } from "@prisma/client";
import { canAccessAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import AuditFilter from "./AuditFilter";

export const dynamic = "force-dynamic";

// ─── Action labels ──────────────────────────────────────────────────
const ACTION_LABELS: Record<string, string> = {
  "auth.login_success": "Нэвтэрсэн",
  "auth.login_failed": "Нэвтрэлт амжилтгүй",
  "auth.admin_login_success": "Админ PIN зөв",
  "auth.admin_login_failed": "Админ PIN буруу",
  "auth.admin_rate_limited": "Админ PIN хэт олон оролдлого",
  "auth.super_admin_success": "Super admin нэвтэрсэн",
  "auth.super_admin_failed": "Super admin PIN буруу",
  "user.reset_pin": "PIN шинэчилсэн",
  "user.reset_all_pins": "Бүх PIN бүлгээр шинэчилсэн",
  "user.regen_pin": "PIN шинээр үүсгэсэн",
  "user.regen_all_pins": "Бүгдийн PIN шинээр үүсгэсэн",
  "user.self_change_pin": "Өөрийн PIN солисон",
  "user.create": "Хэрэглэгч үүсгэсэн",
  "user.update": "Хэрэглэгч засварласан",
  "user.delete": "Хэрэглэгч устгасан",
  "signature.delete": "Гарын үсэг устгасан",
  "signature.clear_all": "Бүх гарын үсэг устгасан",
  "signature.clear_for_teacher": "Багшийн гарын үсэг устгасан",
  "classroom.create": "Анги үүсгэсэн",
  "classroom.update": "Анги засварласан",
  "classroom.delete": "Анги устгасан",
  "classroom.create_from_pool": "Шинэ бүлэг үүсгэсэн",
  "classroom.revert": "Бүлэг буцаасан",
  "classroom.revert_empty": "Хоосон бүлэг устгасан",
  "student.create": "Сурагч нэмсэн",
  "student.update": "Сурагч засварласан",
  "student.delete": "Сурагч устгасан",
  "student.import": "Excel-с импорт хийсэн",
};
const labelFor = (action: string) => ACTION_LABELS[action] ?? action;

type Category = "password" | "auth" | "user" | "signature" | "classroom" | "student" | "other";
function categoryFor(action: string): Category {
  if (
    action === "user.reset_pin" ||
    action === "user.reset_all_pins" ||
    action === "user.regen_pin" ||
    action === "user.regen_all_pins" ||
    action === "user.self_change_pin"
  ) return "password";
  if (action.startsWith("auth.")) return "auth";
  if (action.startsWith("user.")) return "user";
  if (action.startsWith("signature.")) return "signature";
  if (action.startsWith("classroom.")) return "classroom";
  if (action.startsWith("student.")) return "student";
  return "other";
}

const CATEGORY_META: Record<Category, { label: string; badge: string; icon: React.ComponentType<{ className?: string }> }> = {
  password: { label: "PIN / password", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: KeyRound },
  auth: { label: "Нэвтрэлт", badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400", icon: LogIn },
  user: { label: "Хэрэглэгч", badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", icon: LogOut },
  signature: { label: "Гарын үсэг", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: ShieldAlert },
  classroom: { label: "Анги", badge: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400", icon: History },
  student: { label: "Сурагч", badge: "bg-teal-500/10 text-teal-600 dark:text-teal-400", icon: History },
  other: { label: "Бусад", badge: "bg-muted text-muted-foreground", icon: History },
};

const ROLE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; badge: string }> = {
  ADMIN: { label: "Админ", icon: Crown, badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  APPROVER: { label: "Баталгаажуулагч", icon: ShieldCheck, badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  TEACHER: { label: "Багш", icon: UserCheck, badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
};

function fmt(d: Date | string): string {
  return new Date(d).toLocaleString("mn-MN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}
function fmtDay(d: Date | string): string {
  return new Date(d).toLocaleDateString("mn-MN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

// ─── Page ───────────────────────────────────────────────────────────
export default async function AuditPage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const access = await canAccessAdmin();
  if (access.role !== "ADMIN") return <AdminGate role={access.role as "APPROVER" | null} />;

  const category = (searchParams?.category ?? "all") as string;

  // Guard against stale Prisma client (dev-server memory) OR missing table.
  const auditLog = (prisma as unknown as { auditLog?: typeof prisma.auditLog }).auditLog;
  if (!auditLog) return <MigrationNeededPanel />;

  let rows: Array<{
    id: string; action: string; actorId: string | null; actorName: string;
    targetType: string | null; targetId: string | null; metadata: string | null;
    ip: string | null; createdAt: Date;
  }> = [];
  try {
    rows = await auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  } catch (err) {
    const code = err instanceof Prisma.PrismaClientKnownRequestError ? err.code : null;
    if (code === "P2021" || code === "P2022") return <MigrationNeededPanel />;
    throw err;
  }

  // Fetch everything the super admin might want in one shot.
  const [
    users,
    signatures,
    classrooms,
    studentCount,
    announcements,
    newsCount,
    galleryCount,
    achievementsCount,
    faqCount,
    eventsCount,
    testimonialsCount,
    clubsCount,
    contactMessages,
    contactNewCount,
  ] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true, name: true, email: true, position: true, role: true, pin: true,
        _count: { select: { managedSignatures: true, signatures: true } },
      },
    }),
    prisma.signature.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        teacher: { select: { id: true, name: true, position: true } },
        approver: { select: { id: true, name: true, position: true } },
      },
    }),
    prisma.classroom.findMany({
      orderBy: [{ grade: "asc" }, { section: "asc" }],
    }),
    prisma.student.count(),
    prisma.announcement.count(),
    prisma.newsItem.count(),
    prisma.galleryImage.count(),
    prisma.achievement.count(),
    prisma.faq.count(),
    prisma.event.count(),
    prisma.testimonial.count(),
    prisma.club.count(),
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.contactMessage.count({ where: { status: "new" } }),
  ]);

  const filtered = category === "all" ? rows : rows.filter((r) => categoryFor(r.action) === category);
  const teachers = users.filter((u) => u.role === "TEACHER");
  const approvers = users.filter((u) => u.role === "APPROVER");
  const admins = users.filter((u) => u.role === "ADMIN");
  const totalStudents = studentCount;
  const totalCapacity = classrooms.reduce((a, c) => a + c.capacity, 0);
  const legacyPinCount = users.filter((u) => !u.pin.startsWith("$2")).length;

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent24 = rows.filter((r) => new Date(r.createdAt).getTime() > dayAgo);
  const passwordCount = rows.filter((r) => categoryFor(r.action) === "password").length;
  const authCount = rows.filter((r) => categoryFor(r.action) === "auth").length;
  const failedLogins24 = rows.filter(
    (r) =>
      (r.action === "auth.login_failed" ||
        r.action === "auth.admin_login_failed" ||
        r.action === "auth.super_admin_failed") &&
      new Date(r.createdAt).getTime() > dayAgo,
  ).length;
  const failedLogins7d = rows.filter(
    (r) =>
      (r.action === "auth.login_failed" ||
        r.action === "auth.admin_login_failed" ||
        r.action === "auth.super_admin_failed") &&
      new Date(r.createdAt).getTime() > weekAgo,
  ).length;

  return (
    <div className="space-y-8">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-600/20 to-slate-900/10 text-slate-700 dark:text-slate-200">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Super Admin Control Center</h1>
          <p className="text-sm text-muted-foreground">
            Далд хуудас · системийн бүх мэдээллийг нэг дор · {fmt(new Date())}
          </p>
        </div>
      </div>

      {/* ─── Hero stats ─────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Ерөнхий тойм" />
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <BigStat icon={<UsersIcon className="h-5 w-5" />} label="Хэрэглэгчид" value={users.length} sub={`${teachers.length} багш · ${approvers.length} approver`} accent="text-blue-500" />
          <BigStat icon={<FileSignature className="h-5 w-5" />} label="Гарын үсэг" value={signatures.length ? "…" : 0} sub={`сүүлийн 15 доор`} accent="text-emerald-500" hideDots />
          <BigStat icon={<GraduationCap className="h-5 w-5" />} label="Ангиуд" value={classrooms.length} sub={`${totalStudents} сурагч`} accent="text-cyan-500" />
          <BigStat icon={<Database className="h-5 w-5" />} label="Багтаамж" value={`${totalStudents}/${totalCapacity}`} sub={`${totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0}% дүүрэлт`} accent="text-teal-500" />
          <BigStat icon={<Mail className="h-5 w-5" />} label="Contact шинэ" value={contactNewCount} sub={`нийт ${contactMessages.length ? "…" : 0}`} accent="text-violet-500" hideDots />
          <BigStat icon={<Activity className="h-5 w-5" />} label="24ц-т үйлдэл" value={recent24.length} sub={`нийт ${rows.length}`} accent="text-amber-500" />
        </div>
      </section>

      {/* ─── Security summary ───────────────────────────────────── */}
      <section>
        <SectionHeader title="Хамгаалалт" />
        <div className="grid gap-3 sm:grid-cols-4">
          <SecurityPill
            icon={<KeyRound className="h-4 w-4" />}
            label="PIN үйлдэл (нийт)"
            value={passwordCount}
            accent="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
          />
          <SecurityPill
            icon={<LogIn className="h-4 w-4" />}
            label="Нэвтрэлт (нийт)"
            value={authCount}
            accent="border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
          />
          <SecurityPill
            icon={<AlertTriangle className="h-4 w-4" />}
            label="24ц-т амжилтгүй"
            value={failedLogins24}
            accent="border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
          />
          <SecurityPill
            icon={<Clock className="h-4 w-4" />}
            label="7 хоногт амжилтгүй"
            value={failedLogins7d}
            accent="border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200"
          />
        </div>
        {legacyPinCount > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong>{legacyPinCount}</strong> хэрэглэгчийн PIN нь bcrypt hash биш plaintext хэлбэрээр үлдсэн байна. Кодоор нэг удаа reset хийхэд bcrypt-т шилжинэ.
            </span>
          </div>
        )}
      </section>

      {/* ─── Sensitive shortcuts ────────────────────────────────── */}
      <section>
        <SectionHeader title="Эмзэг үйлдлүүд" hint="Sidebar-с нуугдсан, зөвхөн эндээс нээгддэг" />
        <div className="grid gap-3 sm:grid-cols-3">
          <ShortcutCard href="/dashboard/admin/users" icon={<UsersIcon className="h-5 w-5" />} label="Хэрэглэгчид"
            hint="Багш, баталгаажуулагч, админ үүсгэх, засах, устгах"
            accent="bg-blue-500/10 text-blue-500"
            badge={String(users.length)}
          />
          <ShortcutCard href="/dashboard/admin/codes" icon={<KeyRound className="h-5 w-5" />} label="PIN кодууд"
            hint="Тухайн хэрэглэгч эсвэл бүгдийн PIN-ийг санамсаргүй үүсгэх"
            accent="bg-amber-500/10 text-amber-500"
            badge={passwordCount > 0 ? String(passwordCount) : undefined}
          />
          <ShortcutCard href="/dashboard/admin/bulk" icon={<Wrench className="h-5 w-5" />} label="Бөөн үйлдэл"
            hint="Бүх PIN-ийг тэг болгох, бүх гарын үсгийг устгах"
            accent="bg-rose-500/10 text-rose-500"
          />
        </div>
      </section>

      {/* ─── Content shortcuts ──────────────────────────────────── */}
      <section>
        <SectionHeader title="Мэдээлэл засах" />
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          <ShortcutMini href="/dashboard/admin/signatures" icon={<FileSignature className="h-4 w-4" />} label="Гарын үсэг" accent="bg-emerald-500/10 text-emerald-500" />
          <ShortcutMini href="/dashboard/admin/classrooms" icon={<GraduationCap className="h-4 w-4" />} label="Ангиуд" accent="bg-cyan-500/10 text-cyan-500" count={classrooms.length} />
          <ShortcutMini href="/dashboard/admin/students" icon={<UsersIcon className="h-4 w-4" />} label="Сурагчид" accent="bg-teal-500/10 text-teal-500" count={totalStudents} />
          <ShortcutMini href="/dashboard/admin/content" icon={<Newspaper className="h-4 w-4" />} label="Контент" accent="bg-violet-500/10 text-violet-500" count={announcements + newsCount} />
          <ShortcutMini href="/dashboard/admin/gallery" icon={<ImageIcon className="h-4 w-4" />} label="Галерей" accent="bg-pink-500/10 text-pink-500" count={galleryCount} />
          <ShortcutMini href="/dashboard/admin/achievements" icon={<Award className="h-4 w-4" />} label="Амжилт" accent="bg-amber-500/10 text-amber-500" count={achievementsCount} />
          <ShortcutMini href="/dashboard/admin/faq" icon={<HelpCircle className="h-4 w-4" />} label="Асуулт" accent="bg-indigo-500/10 text-indigo-500" count={faqCount} />
          <ShortcutMini href="/dashboard/admin/events" icon={<Calendar className="h-4 w-4" />} label="Үйл явдал" accent="bg-orange-500/10 text-orange-500" count={eventsCount} />
          <ShortcutMini href="/dashboard/admin/testimonials" icon={<MessageSquare className="h-4 w-4" />} label="Сэтгэгдэл" accent="bg-teal-500/10 text-teal-500" count={testimonialsCount} />
        </div>
      </section>

      {/* ─── Users detail ───────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Бүх хэрэглэгч"
          hint={`${users.length} нийт · ${admins.length} админ · ${approvers.length} approver · ${teachers.length} багш`}
          right={<Link href="/dashboard/admin/users" className="text-xs font-medium text-primary hover:underline">Дэлгэрэнгүй засах →</Link>}
        />
        <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 border-b border-border/50 bg-card text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Нэр</th>
                  <th className="px-4 py-2 text-left font-medium">Email</th>
                  <th className="px-4 py-2 text-left font-medium">Албан тушаал</th>
                  <th className="px-4 py-2 text-left font-medium">Үүрэг</th>
                  <th className="px-4 py-2 text-right font-medium">Зурсан</th>
                  <th className="px-4 py-2 text-right font-medium">Хүлээж авсан</th>
                  <th className="px-4 py-2 text-left font-medium">PIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {users.map((u) => {
                  const meta = ROLE_META[u.role] ?? ROLE_META.TEACHER!;
                  const Icon = meta.icon;
                  const isLegacy = !u.pin.startsWith("$2");
                  return (
                    <tr key={u.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2 font-medium">{u.name}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{u.email ?? "—"}</td>
                      <td className="px-4 py-2 text-xs">{u.position}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.badge}`}>
                          <Icon className="h-3 w-3" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-xs tabular-nums">{u._count.signatures}</td>
                      <td className="px-4 py-2 text-right text-xs tabular-nums">{u._count.managedSignatures}</td>
                      <td className="px-4 py-2">
                        {isLegacy ? (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">plaintext ⚠</span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">bcrypt ✓</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── Recent signatures ──────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Сүүлийн гарын үсэг"
          hint={`${signatures.length} бичлэг харагдаж байна`}
          right={<Link href="/dashboard/admin/signatures" className="text-xs font-medium text-primary hover:underline">Бүгдийг харах →</Link>}
        />
        {signatures.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
            Гарын үсэг байхгүй.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border/50 bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Багш</th>
                  <th className="px-4 py-2 text-left font-medium">Approver</th>
                  <th className="px-4 py-2 text-left font-medium">Албан тушаал</th>
                  <th className="px-4 py-2 text-left font-medium">Огноо</th>
                  <th className="px-4 py-2 text-left font-medium">Тэмдэглэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {signatures.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2 font-medium">{s.teacher.name}</td>
                    <td className="px-4 py-2">{s.approver.name}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{s.approver.position}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs tabular-nums text-muted-foreground">{fmt(s.createdAt)}</td>
                    <td className="max-w-xs truncate px-4 py-2 text-xs text-muted-foreground">{s.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─── Classrooms table ───────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Бүх анги"
          hint={`${classrooms.length} анги · ${totalStudents} сурагч`}
          right={<Link href="/dashboard/admin/classrooms" className="text-xs font-medium text-primary hover:underline">Ангийн удирдлага →</Link>}
        />
        {classrooms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
            Анги бүртгэгдээгүй.
          </div>
        ) : (
          <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {classrooms.map((c) => {
              const filled = c.capacity > 0 ? Math.min(100, Math.round((c.studentCount / c.capacity) * 100)) : 0;
              return (
                <div key={c.id} className="rounded-xl border border-border/50 bg-card p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{c.label}</div>
                    {c.status === "draft" && (
                      <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">draft</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground truncate">{c.headTeacher}</div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="tabular-nums text-muted-foreground">{c.studentCount}/{c.capacity}</span>
                    <span className="tabular-nums font-medium">{filled}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary/70" style={{ width: `${filled}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Contact messages ───────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Contact хүсэлт"
          hint={`Сүүлийн ${contactMessages.length} мессеж · ${contactNewCount} шинэ`}
        />
        {contactMessages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
            Хүсэлт байхгүй.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border/50 bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Огноо</th>
                  <th className="px-4 py-2 text-left font-medium">Нэр</th>
                  <th className="px-4 py-2 text-left font-medium">Email</th>
                  <th className="px-4 py-2 text-left font-medium">Гарчиг</th>
                  <th className="px-4 py-2 text-left font-medium">Төлөв</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {contactMessages.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/20">
                    <td className="whitespace-nowrap px-4 py-2 text-xs tabular-nums text-muted-foreground">{fmtDay(m.createdAt)}</td>
                    <td className="px-4 py-2 font-medium">{m.name}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{m.email}</td>
                    <td className="max-w-xs truncate px-4 py-2">{m.subject}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        m.status === "new" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                        m.status === "read" ? "bg-sky-500/10 text-sky-600 dark:text-sky-400" :
                        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─── Audit log ──────────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Аудитын бичлэг"
          hint={`${rows.length} нийт · ${filtered.length !== rows.length ? `${filtered.length} шүүсэн · ` : ""}сүүлийн 500`}
        />
        <AuditFilter current={category} />

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
            Аудит бичлэг байхгүй байна.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 border-b border-border/50 bg-card text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Огноо</th>
                    <th className="px-4 py-2 text-left font-medium">Хэрэглэгч</th>
                    <th className="px-4 py-2 text-left font-medium">Ангилал</th>
                    <th className="px-4 py-2 text-left font-medium">Үйлдэл</th>
                    <th className="px-4 py-2 text-left font-medium">Объект</th>
                    <th className="px-4 py-2 text-left font-medium">IP</th>
                    <th className="px-4 py-2 text-left font-medium">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map((r) => {
                    const cat = categoryFor(r.action);
                    const meta = CATEGORY_META[cat];
                    const Icon = meta.icon;
                    return (
                      <tr key={r.id} className="hover:bg-muted/20">
                        <td className="whitespace-nowrap px-4 py-2 text-xs tabular-nums text-muted-foreground">{fmt(r.createdAt)}</td>
                        <td className="px-4 py-2 font-medium">{r.actorName}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.badge}`}>
                            <Icon className="h-3 w-3" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-2">{labelFor(r.action)}</td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">
                          {r.targetType ? `${r.targetType}:${(r.targetId ?? "").slice(0, 8)}` : "—"}
                        </td>
                        <td className="px-4 py-2 text-xs tabular-nums text-muted-foreground">{r.ip ?? "—"}</td>
                        <td className="max-w-xs truncate px-4 py-2 text-[11px] font-mono text-muted-foreground">
                          {r.metadata ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ─── System info footer ─────────────────────────────────── */}
      <section>
        <SectionHeader title="Системийн мэдээлэл" />
        <div className="grid gap-3 sm:grid-cols-4">
          <InfoTile label="Node env" value={process.env.NODE_ENV ?? "development"} />
          <InfoTile label="ADMIN_PIN тохируулагдсан" value={process.env.ADMIN_PIN ? "✓ Тийм" : "✗ Үгүй"} tone={process.env.ADMIN_PIN ? "ok" : "warn"} />
          <InfoTile label="SESSION_SECRET" value={process.env.SESSION_SECRET ? `✓ (${process.env.SESSION_SECRET.length} тэмдэгт)` : "✗ Үгүй"} tone={process.env.SESSION_SECRET ? "ok" : "warn"} />
          <InfoTile label="TRUSTED_PROXY" value={process.env.TRUSTED_PROXY === "1" ? "✓ Тийм" : "✗ Үгүй (IP спуф эрсдэлтэй)"} tone={process.env.TRUSTED_PROXY === "1" ? "ok" : "warn"} />
        </div>
      </section>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────
function SectionHeader({ title, hint, right }: { title: string; hint?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {right}
    </div>
  );
}

function BigStat({ icon, label, value, sub, accent, hideDots }: {
  icon: React.ReactNode; label: string; value: number | string; sub?: string; accent: string; hideDots?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className={`flex items-center gap-1.5 text-xs font-medium ${accent}`}>
        {icon}
        <span className="text-muted-foreground">{label}</span>
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums">
        {hideDots ? value : typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {sub && <div className="mt-0.5 text-[10px] text-muted-foreground truncate">{sub}</div>}
    </div>
  );
}

function SecurityPill({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: number; accent: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${accent}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-widest">{label}</span>
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function ShortcutCard({ href, icon, label, hint, accent, badge }: {
  href: string; icon: React.ReactNode; label: string; hint?: string; accent: string; badge?: string;
}) {
  return (
    <Link href={href} className="group flex items-start gap-3 rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
      <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          {label}
          {badge && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">{badge}</span>
          )}
          <ArrowRight className="h-3.5 w-3.5 shrink-0 -translate-x-0.5 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
        </div>
        {hint && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      </div>
    </Link>
  );
}

function ShortcutMini({ href, icon, label, accent, count }: {
  href: string; icon: React.ReactNode; label: string; accent: string; count?: number;
}) {
  return (
    <Link href={href} className="group flex items-center gap-2 rounded-xl border border-border/50 bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm">
      <div className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold">{label}</div>
        {count !== undefined && <div className="text-[10px] tabular-nums text-muted-foreground">{count}</div>}
      </div>
    </Link>
  );
}

function InfoTile({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  const toneCls = tone === "ok" ? "text-emerald-600 dark:text-emerald-400" : tone === "warn" ? "text-amber-600 dark:text-amber-400" : "";
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${toneCls}`}>{value}</div>
    </div>
  );
}

function MigrationNeededPanel() {
  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500/10 text-slate-500">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Super Admin Control</h1>
          <p className="text-xs text-muted-foreground">Далд хуудас · зөвхөн URL-аар нээгддэг</p>
        </div>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-500/30 dark:bg-amber-500/10">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Аудитын хүснэгт хараахан үүсээгүй байна
            </h2>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Prisma schema-д <code className="rounded bg-amber-500/10 px-1 py-0.5 font-mono text-xs">AuditLog</code> model нэмэгдсэн боловч DB-д хүснэгт нь үүсээгүй байна.
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-amber-100/60 p-3 font-mono text-xs text-amber-900 dark:bg-amber-500/20 dark:text-amber-100">
npx prisma db push
            </pre>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Дараа нь dev server-аа бүрэн restart хийж <code className="rounded bg-amber-500/10 px-1 py-0.5 font-mono text-[11px]">rm -rf .next &amp;&amp; npm run dev</code> ажиллуулаад буцаад орно уу.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
