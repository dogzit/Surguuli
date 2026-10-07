"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentActor, type ActorKind } from "@/lib/session";

export type Result<T = void> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };

function actorRef(
  actor: NonNullable<Awaited<ReturnType<typeof getCurrentActor>>>,
): { kind: ActorKind; id: string } {
  switch (actor.kind) {
    case "user":
      return { kind: "user", id: actor.user.id };
    case "student":
      return { kind: "student", id: actor.student.id };
    case "parent":
      return { kind: "parent", id: actor.parent.id };
  }
}

/** Mark a single notification read; only allowed if it's mine. */
export async function markNotificationRead(id: string): Promise<Result> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "Нэвтрэх шаардлагатай." };
  const me = actorRef(actor);

  const existing = await prisma.inAppNotification.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Мэдэгдэл олдсонгүй." };
  if (existing.actorKind !== me.kind || existing.actorId !== me.id) {
    return { ok: false, error: "Эрхгүй." };
  }
  if (existing.readAt) return { ok: true };

  await prisma.inAppNotification.update({
    where: { id },
    data: { readAt: new Date() },
  });
  return { ok: true };
}

/** Mark all of my unread notifications read in one query. */
export async function markAllNotificationsRead(): Promise<Result<{ count: number }>> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "Нэвтрэх шаардлагатай." };
  const me = actorRef(actor);

  const res = await prisma.inAppNotification.updateMany({
    where: { actorKind: me.kind, actorId: me.id, readAt: null },
    data: { readAt: new Date() },
  });
  // Bell lives across several routes — cheap to revalidate the pages
  // that render it.
  revalidatePath("/");
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/parent");
  return { ok: true, data: { count: res.count } };
}
