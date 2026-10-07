import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentActor, type ActorKind } from "@/lib/session";

export const runtime = "nodejs";
// Notifications must always be fresh — the bell polls this.
export const dynamic = "force-dynamic";

/**
 * Return the current actor's notification tray: latest 30 items plus
 * the unread count. Returns `loggedIn: false` for anonymous callers
 * so the client component can just render the bell as "0 unread"
 * without a hard 401.
 */
export async function GET() {
  const actor = await getCurrentActor();
  if (!actor) {
    return NextResponse.json({ loggedIn: false, unread: 0, items: [] });
  }

  const me: { kind: ActorKind; id: string } =
    actor.kind === "user"
      ? { kind: "user", id: actor.user.id }
      : actor.kind === "student"
        ? { kind: "student", id: actor.student.id }
        : { kind: "parent", id: actor.parent.id };

  const [items, unread] = await Promise.all([
    prisma.inAppNotification.findMany({
      where: { actorKind: me.kind, actorId: me.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.inAppNotification.count({
      where: { actorKind: me.kind, actorId: me.id, readAt: null },
    }),
  ]);

  return NextResponse.json({
    loggedIn: true,
    unread,
    items: items.map((n) => ({
      id: n.id,
      category: n.category,
      title: n.title,
      body: n.body,
      href: n.href,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}
