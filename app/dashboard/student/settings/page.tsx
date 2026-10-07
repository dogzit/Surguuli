import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  KeyRound,
  Mail,
  Settings as SettingsIcon,
  Shield,
  User,
} from "lucide-react";
import { requireStudent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import EmailForm from "@/components/settings/EmailForm";
import { PinChangeForm } from "@/components/settings/PinChangeForm";

export const dynamic = "force-dynamic";

export default async function StudentSettingsPage() {
  const me = await requireStudent();

  const [classroom, pending] = await Promise.all([
    prisma.classroom.findUnique({
      where: { id: me.classroomId },
      select: { label: true, headTeacher: true },
    }),
    prisma.emailVerification
      .findFirst({
        where: {
          actorKind: "student",
          actorId: me.id,
          verifiedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
        select: { email: true, expiresAt: true, attempts: true },
      })
      .catch(() => null),
  ]);

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <Link
          href="/dashboard/student"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Буцах
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/25 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Тохиргоо</h1>
            <p className="text-sm text-muted-foreground">
              {me.lastName}. {me.firstName} · {me.code}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <Header
            icon={<User className="h-4 w-4 text-emerald-500" />}
            title="Профайл"
            subtitle="Ерөнхий мэдээлэл — засварлах бол ангийн багштайгаа холбогдоно уу."
          />
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Field label="Овог" value={me.lastName} />
            <Field label="Нэр" value={me.firstName} />
            <Field label="Код" value={me.code} mono />
            {classroom && <Field label="Анги" value={classroom.label} />}
            {classroom && (
              <div className="col-span-2">
                <Field label="Ангийн багш" value={classroom.headTeacher} />
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <Header
            icon={<Mail className="h-4 w-4 text-indigo-500" />}
            title="И-мэйл хаяг"
            subtitle="Мэдэгдэл болон урамшуулал таны имэйл рүү илгээгдэнэ."
          />
          <div className="mt-4">
            <EmailForm
              currentEmail={me.email}
              pending={
                pending
                  ? {
                      email: pending.email,
                      expiresAt: pending.expiresAt.toISOString(),
                      attemptsLeft: Math.max(0, 5 - pending.attempts),
                    }
                  : null
              }
            />
          </div>
        </Card>

        <Card className="p-5">
          <Header
            icon={<KeyRound className="h-4 w-4 text-amber-500" />}
            title="PIN код"
            subtitle="Багшаас өгсөн PIN-ийг өөрийн санаж чадах кодоор солино."
          />
          <div className="mt-4">
            <PinChangeForm />
          </div>
        </Card>

        <Card className="p-5">
          <Header
            icon={<Shield className="h-4 w-4 text-violet-500" />}
            title="Данс"
            subtitle="Сурагчийн булангийн үндсэн мэдээлэл."
          />
          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            <Row label="Данс" value="Сурагч" />
            <Row label="Хамгаалалт" value="bcrypt PIN · session cookie" />
            <Row label="Мэдэгдэл" value="Ирц/дүн ESIS-т, амжилт энд" />
            <Row label="Тусламж" value="Ангийн багш эсвэл захиргаа" />
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
            <GraduationCap className="h-3.5 w-3.5" />
            Амжилт хүсье!
          </div>
        </Card>
      </div>
    </main>
  );
}

function Header({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-base font-semibold">
        {icon}
        {title}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={mono ? "mt-0.5 font-mono text-xs" : "mt-0.5 text-sm font-medium"}>
        {value}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/40 pb-1.5">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
