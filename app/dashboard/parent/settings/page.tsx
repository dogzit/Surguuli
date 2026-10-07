import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
  Mail,
  Settings as SettingsIcon,
  Shield,
  Users,
} from "lucide-react";
import { requireParent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import EmailForm from "@/components/settings/EmailForm";
import { PinChangeForm } from "@/components/settings/PinChangeForm";

export const dynamic = "force-dynamic";

export default async function ParentSettingsPage() {
  const me = await requireParent();

  const [linkCount, pending] = await Promise.all([
    prisma.parentStudent.count({ where: { parentId: me.id } }),
    prisma.emailVerification
      .findFirst({
        where: {
          actorKind: "parent",
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
          href="/dashboard/parent"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Буцах
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/25 to-indigo-500/5 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Тохиргоо</h1>
            <p className="text-sm text-muted-foreground">{me.name}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <Header
            icon={<Users className="h-4 w-4 text-indigo-500" />}
            title="Профайл"
            subtitle="Хувь хүний тухай мэдээлэл."
          />
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2">
              <Field label="Нэр" value={me.name} />
            </div>
            <Field label="Утас" value={me.phone ?? "—"} />
            <Field label="Хүүхэд" value={`${linkCount} холбоос`} />
          </div>
        </Card>

        <Card className="p-5">
          <Header
            icon={<Mail className="h-4 w-4 text-emerald-500" />}
            title="И-мэйл хаяг"
            subtitle="Ангийн зарлал, үйл явдал, мэдэгдэл имэйлээр ирнэ."
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
            subtitle="Нэвтрэх кодоо тогтмол шинэчилж, өрхийн бусад гишүүдтэй хуваалцахгүй байна уу."
          />
          <div className="mt-4">
            <PinChangeForm />
          </div>
        </Card>

        <Card className="p-5">
          <Header
            icon={<Shield className="h-4 w-4 text-violet-500" />}
            title="Аюулгүй байдал"
            subtitle="Дансны хамгаалалтын тохиргоо."
          />
          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            <Row label="Данс" value="Эцэг эх" />
            <Row label="Хамгаалалт" value="bcrypt PIN · session cookie" />
            <Row label="Мэдэгдэл" value="Имэйл + аппын хонх" />
            <Row label="Хүүхэдтэй холбогдох" value="Урилгын кодоор" />
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
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
