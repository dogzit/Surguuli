import { getCurrentUser, roleHomePath } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  KeyRound,
  Mail,
  Settings as SettingsIcon,
  Shield,
  User,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import EmailForm from "./EmailForm";
import PinForm from "./PinForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const backHref = roleHomePath(me.role, me.position);

  // Surface any active pending email verification so the form can
  // start on step 2 instead of step 1.
  const pendingVerification = await prisma.emailVerification
    .findFirst({
      where: {
        actorKind: "user",
        actorId: me.id,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: { email: true, expiresAt: true, attempts: true },
    })
    .catch(() => null);

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Буцах
        </Link>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/20">
              <SettingsIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Тохиргоо</h1>
              <p className="text-sm text-muted-foreground">
                {me.name} · {me.position}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Two-column layout on lg+, single column on smaller screens. */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Profile summary — pinned top-left, non-editable */}
        <Card className="p-5">
          <SectionHeader
            icon={<User className="h-4 w-4 text-primary" />}
            title="Профайл"
            subtitle="Ерөнхий мэдээлэл. Нэр, албан тушаалыг админ хариуцна."
          />
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Field label="Нэр" value={me.name} />
            <Field label="Албан тушаал" value={me.position} />
            <Field
              label="Үүрэг"
              value={
                me.role === "ADMIN"
                  ? "Админ"
                  : me.role === "APPROVER"
                    ? "Баталгаажуулагч"
                    : "Багш"
              }
            />
            <Field label="ID" value={me.id.slice(0, 8) + "…"} mono />
          </div>
        </Card>

        {/* Email + OTP */}
        <Card className="p-5">
          <SectionHeader
            icon={<Mail className="h-4 w-4 text-emerald-500" />}
            title="И-мэйл хаяг"
            subtitle="Шинэ имэйл рүү илгээгдэх 6 оронтой код нь баталгаажуулна."
          />
          <div className="mt-4">
            <EmailForm
              currentEmail={me.email}
              pending={
                pendingVerification
                  ? {
                      email: pendingVerification.email,
                      expiresAt: pendingVerification.expiresAt.toISOString(),
                      attemptsLeft: Math.max(0, 5 - pendingVerification.attempts),
                    }
                  : null
              }
            />
          </div>
        </Card>

        {/* PIN */}
        <Card className="p-5">
          <SectionHeader
            icon={<KeyRound className="h-4 w-4 text-amber-500" />}
            title="PIN код"
            subtitle="Нэвтрэх кодоо тогтмол шинэчилж байна уу."
          />
          <div className="mt-4">
            <PinForm />
          </div>
        </Card>

        {/* Security card — read-only, for now just an info panel */}
        <Card className="p-5">
          <SectionHeader
            icon={<Shield className="h-4 w-4 text-indigo-500" />}
            title="Аюулгүй байдал"
            subtitle="Тохирсон практик, засварлах шаардлагагүй."
          />
          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            <SecurityRow label="Session cookie" value="HMAC-signed · SameSite=Lax · 30 хоног" />
            <SecurityRow label="PIN хадгалалт" value="bcrypt · 10 rounds" />
            <SecurityRow label="Rate limit" value="5 буруу оролдлого / минут" />
            <SecurityRow label="Audit log" value="Бүх эмзэг үйлдэл бичигдэнэ" />
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
            <BadgeCheck className="h-3.5 w-3.5" />
            Таны данс баталгаатай тохиргоотой байна.
          </div>
        </Card>
      </div>
    </main>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
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

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
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

function SecurityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/40 pb-1.5">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
