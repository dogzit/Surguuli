import type { Metadata } from "next";
import { MessageSquareReply } from "lucide-react";
import { SectionShell } from "@/components/home/SectionShell";
import { FeedbackForm } from "@/components/home/FeedbackForm";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getCurrentActor } from "@/lib/session";
import { loadSchoolName } from "@/lib/school-info";
import { FEEDBACK_KINDS, FEEDBACK_STATUSES, optionLabel } from "@/lib/feedback";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const name = await loadSchoolName();
  return {
    title: name ? `Санал хүсэлт · ${name}` : "Санал хүсэлт",
    description: "Сургуульд санал, хүсэлт, гомдол, талархлаа илгээх. Нэрээ нууцлах боломжтой.",
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
  const actor = await getCurrentActor();
  const me = actor
    ? {
        kind: actor.kind,
        id: actor.kind === "user" ? actor.user.id : actor.kind === "student" ? actor.student.id : actor.parent.id,
        name:
          actor.kind === "user"
            ? actor.user.name
            : actor.kind === "student"
              ? `${actor.student.lastName} ${actor.student.firstName}`
              : actor.parent.name,
      }
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
          respondedAt: true,
          createdAt: true,
        },
      })
    : [];

  return (
    <SectionShell
      id="feedback"
      tone="light"
      eyebrow="Санал хүсэлт"
      title="Таны санал бидэнд чухал"
      description="Сургуулийн сургалт, орчин, үйлчилгээг сайжруулах санал, хүсэлт, гомдол эсвэл талархлаа илгээнэ үү. Хүсвэл нэрээ нууцалж болно."
    >
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <FeedbackForm signedInAs={me?.name ?? null} />

        <div id="my-feedback" className="scroll-mt-24 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Миний илгээсэн санал</h3>
          {!me ? (
            <p className="text-sm text-muted-foreground">
              Нэвтэрч илгээсэн саналынхаа явц, сургуулийн хариуг энд харна.
            </p>
          ) : mine.length === 0 ? (
            <p className="text-sm text-muted-foreground">Одоогоор санал илгээгээгүй байна.</p>
          ) : (
            mine.map((f) => (
              <Card key={f.id} className="p-4">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-muted-foreground">
                    {optionLabel(FEEDBACK_KINDS, f.kind)} ·{" "}
                    {f.createdAt.toLocaleDateString("mn-MN")}
                  </span>
                  <span className={cn("rounded-full px-2 py-0.5 font-medium", STATUS_TONE[f.status])}>
                    {optionLabel(FEEDBACK_STATUSES, f.status)}
                  </span>
                </div>
                {f.title && <p className="mt-2 text-sm font-semibold text-foreground">{f.title}</p>}
                <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{f.body}</p>
                {f.response && (
                  <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      <MessageSquareReply className="h-3.5 w-3.5" /> Сургуулийн хариу
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm text-foreground">{f.response}</p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </SectionShell>
  );
}
