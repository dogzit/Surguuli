import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { CheckCircle2, GraduationCap, History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { APPROVER_POSITIONS } from "@/lib/positions";
import SignatureList from "@/components/SignatureList";
import CircularProgress from "@/components/CircularProgress";
import ProgressBar from "@/components/ProgressBar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import HeaderActions from "@/components/HeaderActions";

export default async function TeacherDashboard() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "TEACHER") redirect("/dashboard/teacher");

  const signatures = await prisma.signature.findMany({
    where: { teacherId: me.id },
    include: {
      approver: { select: { id: true, name: true, position: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const signedEntries = signatures.map((s) => ({
    position: s.approver.position,
    note: s.note,
    approverName: s.approver.name,
  }));
  const total = APPROVER_POSITIONS.length;
  const signed = signedEntries.length;
  const pct = Math.round((signed / total) * 100);
  const complete = signed >= total;
  const remaining = total - signed;

  const readyBadge = complete && (
    <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
      <CheckCircle2 className="h-4 w-4" />
      Олговор олгоход бэлэн боллоо
    </div>
  );

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Сайн байна уу, {me.name}
            </h1>
            <p className="text-sm text-muted-foreground">{me.position}</p>
          </div>
        </div>

      </header>

      <Card className="mb-6 p-6">
        <div className="flex flex-col items-center gap-5 text-center lg:hidden">
          <CircularProgress signed={signed} total={total} size={170} />
          <div>
            <h2 className="text-lg font-semibold">Нийт явц</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {total} хүний гарын үсгээс бүрдэнэ
            </p>
            <p className="mt-3 text-sm tabular-nums">
              <span className="font-semibold text-foreground">{signed}</span>
              <span className="text-muted-foreground">/{total}</span>
              <span className="text-muted-foreground">
                {" "}
                · {remaining} үлдсэн
              </span>
            </p>
            {readyBadge}
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Нийт явц</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Амралтын олговрын баталгаажуулалт {total} хүнээс бүрдэнэ.
              </p>
            </div>
            <span
              className={cn(
                "text-4xl font-bold tabular-nums",
                complete ? "text-emerald-600" : "text-primary",
              )}
            >
              {pct}%
            </span>
          </div>
          <ProgressBar signed={signed} total={total} showLabels={false} />
          <p className="mt-3 text-sm tabular-nums">
            <span className="font-semibold text-foreground">{signed}</span>
            <span className="text-muted-foreground">/{total}</span>
            <span className="text-muted-foreground">
              {" "}
              гарын үсэг зурагдсан · {remaining} үлдсэн
            </span>
          </p>
          {readyBadge}
        </div>
      </Card>

      <section className="mb-6">
        <h2 className="mb-3 text-base font-semibold">
          Албан тушаалтнуудын гарын үсэг
        </h2>
        <SignatureList
          positions={[...APPROVER_POSITIONS]}
          signed={signedEntries}
        />
      </section>

      {signatures.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Түүх</h2>
          </div>
          <Card>
            <ul className="divide-y divide-border">
              {signatures.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <div className="font-medium">{s.approver.position}</div>
                    {s.note && (
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {s.note}
                      </div>
                    )}
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {new Date(s.createdAt).toLocaleString("mn-MN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </main>
  );
}
