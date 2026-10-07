import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Inbox, MessageSquareReply, ShieldCheck, Zap } from "lucide-react";
import Logo from "@/components/Logo";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { prisma } from "@/lib/prisma";
import { getCurrentActor } from "@/lib/session";
import { loadSchoolInfoBundle } from "@/lib/school-info";
import { FEEDBACK_KINDS, FEEDBACK_STATUSES, optionLabel } from "@/lib/feedback";
import { cn } from "@/lib/utils";

// Standalone page (outside the (public) layout): people arrive here from the
// printed QR poster on their phones, so there is no sidebar or site footer —
// just the form.

export async function generateMetadata(): Promise<Metadata> {
  const info = await loadSchoolInfoBundle();
  return {
    title: "Санал хүсэлт",
    description: `${info.name ?? "Сургууль"}-д санал, хүсэлт, гомдол, талархлаа илгээх. Нэрээ нууцлах боломжтой.`,
  };
}

// Per-visitor: shows the signed-in sender's own submissions.
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  new: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  in_review: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  resolved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  archived: "bg-muted text-muted-foreground",
};

export default async function FeedbackPage() {
  const [info, actor] = await Promise.all([loadSchoolInfoBundle(), getCurrentActor()]);

  const me = actor
    ? actor.kind === "user"
      ? { kind: actor.kind, id: actor.user.id, name: actor.user.name }
      : actor.kind === "student"
        ? {
            kind: actor.kind,
            id: actor.student.id,
            name: `${actor.student.lastName} ${actor.student.firstName}`,
          }
        : { kind: actor.kind, id: actor.parent.id, name: actor.parent.name }
    : null;

  const mine = me
    ? await prisma.feedback.findMany({
        where: { actorKind: me.kind, actorId: me.id, anonymous: false },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          kind: true,
          title: true,
          body: true,
          status: true,
          response: true,
          createdAt: true,
        },
      })
    : [];

  return (
    <div className="min-h-screen bg-muted/40 dark:bg-background">
      {/* Brand header — same palette as the printed QR poster. */}
      <header className="relative overflow-hidden bg-[#0a2f6b] text-white">
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(155deg,#0d4ea6_0%,#0a2f6b_55%,#071f4a_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:20px_20px]"
        />
        <span aria-hidden className="absolute -right-24 -top-28 h-48 w-48 rounded-full border-[5px] border-[#e3262f]/70 sm:-right-16 sm:-top-20 sm:h-60 sm:w-60" />
        <span aria-hidden className="absolute right-24 top-28 hidden h-5 w-5 rounded-full bg-[#ffc928] sm:block" />
        <span aria-hidden className="absolute -bottom-24 right-10 h-44 w-44 rounded-full border-[6px] border-[#2fa84f]/80" />

        <div className="relative mx-auto max-w-2xl px-4 pb-28 pt-5 sm:px-6 sm:pb-32">
          <nav className="flex items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-2.5">
              <Logo size={40} alt={info.name ?? undefined} className="rounded-none drop-shadow" />
              {info.name && (
                <span className="line-clamp-2 text-sm font-semibold leading-tight">{info.name}</span>
              )}
            </Link>
            <Link
              href="/"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium ring-1 ring-white/20 transition hover:bg-white/20"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Нүүр
            </Link>
          </nav>

          <div className="mt-10 sm:mt-14">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest ring-1 ring-white/20">
              <Inbox className="h-3 w-3" /> Санал хүсэлтийн хайрцаг
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              Таны санал
              <br />
              <span className="text-[#ffc928]">бидэнд чухал</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
              Сургуулиа хамтдаа илүү сайхан болгоё. Санал, хүсэлт, гомдол, талархлаа
              хэдхэн минутад илгээгээрэй.
            </p>
          </div>
        </div>
      </header>

      <main className="relative mx-auto -mt-20 max-w-2xl px-4 pb-16 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-xl shadow-[#0a2f6b]/10">
          <FeedbackForm signedInAs={me?.name ?? null} />
        </div>

        <ul className="mt-6 grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
          <TrustItem icon={Zap} title="Бүртгэл шаардлагагүй" body="Нэвтрэхгүйгээр шууд илгээж болно." />
          <TrustItem icon={ShieldCheck} title="Зөвхөн захиргаанд" body="Санал олон нийтэд нийтлэгдэхгүй." />
          <TrustItem
            icon={MessageSquareReply}
            title="Хариугаа эндээс харна"
            body={me ? "Доорх жагсаалтад хариу гарч ирнэ." : "Нэвтэрч илгээвэл хариу энд гарна."}
          />
        </ul>

        {me && (
          <section id="my-feedback" className="mt-10 scroll-mt-6">
            <h2 className="text-sm font-semibold text-foreground">Миний илгээсэн санал</h2>
            {mine.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
                Одоогоор санал илгээгээгүй байна.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {mine.map((f) => (
                  <li key={f.id} className="rounded-2xl border border-border/60 bg-card p-4">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-muted-foreground">
                        {optionLabel(FEEDBACK_KINDS, f.kind)} · {f.createdAt.toLocaleDateString("mn-MN")}
                      </span>
                      <span className={cn("rounded-full px-2 py-0.5 font-medium", STATUS_TONE[f.status])}>
                        {optionLabel(FEEDBACK_STATUSES, f.status)}
                      </span>
                    </div>
                    {f.title && <p className="mt-2 text-sm font-semibold text-foreground">{f.title}</p>}
                    <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{f.body}</p>
                    {f.response && (
                      <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          <MessageSquareReply className="h-3.5 w-3.5" /> Сургуулийн хариу
                        </p>
                        <p className="mt-1 whitespace-pre-line text-sm text-foreground">{f.response}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <footer className="mt-12 text-center text-[11px] text-muted-foreground">
          {info.name && <span>{info.name} · </span>}
          <Link href="/" className="hover:text-foreground hover:underline">Үндсэн сайт</Link>
        </footer>
      </main>
    </div>
  );
}

function TrustItem({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Zap;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-2xl bg-card/60 p-3.5 ring-1 ring-border/60">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span>
        <span className="block font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block leading-relaxed">{body}</span>
      </span>
    </li>
  );
}
