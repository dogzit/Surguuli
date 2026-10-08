import { prisma } from "@/lib/prisma";
import { renderEmailShell, sendMail } from "@/lib/mail";
import { STAFF_SITE_URL } from "@/lib/staff-site";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

// Recipients are rows in the shared database: staff ("user") accounts,
// students or parents.
export type ActorKind = "user" | "student" | "parent";

// Central notification API. Every place that used to fire off a
// side-effect (news publish, portfolio approval, parent invite) calls
// one of these helpers so we can queue an in-app row, ship an email,
// and expand later (push, SMS) without touching every call site.

export interface NotificationInput {
  actorKind: ActorKind;
  actorId: string;
  category: string;
  title: string;
  body?: string | null;
  href?: string | null;
  data?: Record<string, unknown> | null;
  // Also send an email if the recipient has one on file. Off by
  // default — school-wide broadcasts skip email; per-user updates
  // (portfolio review, direct message) opt in.
  alsoEmail?: boolean;
}

/**
 * Persist a notification for a single actor. Never throws — a
 * notification failure must not roll back the underlying action.
 * Log to stderr instead so ops sees it.
 */
export async function notifyActor(input: NotificationInput): Promise<void> {
  try {
    await prisma.inAppNotification.create({
      data: {
        actorKind: input.actorKind,
        actorId: input.actorId,
        category: input.category,
        title: input.title.slice(0, 200),
        body: input.body?.slice(0, 2000) ?? null,
        href: input.href?.slice(0, 500) ?? null,
        data: input.data ? JSON.stringify(input.data).slice(0, 4000) : null,
      },
    });
  } catch (err) {
    console.error("[notify] failed for", input.actorKind, input.actorId, err);
  }

  if (input.alsoEmail) {
    void sendEmailForActor(input);
  }
}

/**
 * Look up the recipient's email address and send a copy of the
 * notification. Called only when the caller sets `alsoEmail: true` on
 * a NotificationInput.
 */
async function sendEmailForActor(input: NotificationInput): Promise<void> {
  try {
    let email: string | null = null;
    switch (input.actorKind) {
      case "user": {
        const u = await prisma.user.findUnique({
          where: { id: input.actorId },
          select: { email: true },
        });
        email = u?.email ?? null;
        break;
      }
      case "student": {
        const s = await prisma.student.findUnique({
          where: { id: input.actorId },
          select: { email: true },
        });
        email = s?.email ?? null;
        break;
      }
      case "parent": {
        const p = await prisma.parent.findUnique({
          where: { id: input.actorId },
          select: { email: true },
        });
        email = p?.email ?? null;
        break;
      }
    }
    if (!email) return; // no address on file, silently skip

    const absoluteHref =
      input.href && !input.href.startsWith("http")
        ? `${input.actorKind === "user" ? STAFF_SITE_URL || SITE_URL : SITE_URL}${input.href}`
        : input.href ?? undefined;

    const { html, text } = renderEmailShell({
      title: input.title,
      intro: input.body ?? "",
      ctaLabel: absoluteHref ? "Дэлгэрэнгүй харах" : undefined,
      ctaHref: absoluteHref,
      footer: "Энэ мэдэгдлийг сургуулийн албан ёсны цахим порталаас илгээв.",
    });

    await sendMail({
      to: email,
      subject: input.title.slice(0, 120),
      html,
      text,
    });
  } catch (err) {
    console.error("[notify] email dispatch failed", err);
  }
}

/**
 * Fan out a notification to many recipients in one batched insert.
 * Used for school-wide announcements (news publish → all students + parents).
 * Caller is responsible for bounding the list; we don't cap it here.
 */
export async function notifyMany(
  recipients: Array<{ actorKind: ActorKind; actorId: string }>,
  common: Omit<NotificationInput, "actorKind" | "actorId">,
): Promise<void> {
  if (recipients.length === 0) return;
  try {
    await prisma.inAppNotification.createMany({
      data: recipients.map((r) => ({
        actorKind: r.actorKind,
        actorId: r.actorId,
        category: common.category,
        title: common.title.slice(0, 200),
        body: common.body?.slice(0, 2000) ?? null,
        href: common.href?.slice(0, 500) ?? null,
        data: common.data ? JSON.stringify(common.data).slice(0, 4000) : null,
      })),
    });
  } catch (err) {
    console.error("[notify] batch failed", err);
  }
}

/**
 * Convenience: notify every logged-in student + parent. Used for
 * school-wide news publish. Staff already know (they wrote it).
 * Bounded to 10k rows to avoid runaway fanout on huge rosters.
 */
export async function notifyEveryone(
  common: Omit<NotificationInput, "actorKind" | "actorId">,
): Promise<{ count: number }> {
  const [students, parents] = await Promise.all([
    prisma.student.findMany({
      // Only students who've actually logged in at least once — no
      // point queueing rows for accounts nobody uses.
      where: { pin: { not: null } },
      select: { id: true },
      take: 5000,
    }),
    prisma.parent.findMany({ select: { id: true }, take: 5000 }),
  ]);
  const recipients = [
    ...students.map((s) => ({ actorKind: "student" as const, actorId: s.id })),
    ...parents.map((p) => ({ actorKind: "parent" as const, actorId: p.id })),
  ];
  await notifyMany(recipients, common);
  return { count: recipients.length };
}
