"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { getCurrentActor, type Actor, type ActorKind } from "@/lib/session";
import { notifyActor } from "@/lib/notifications";

export type Result<T = void> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };

// Compact representation used every time a mutation needs to know who
// the caller is — extracted so each server action isn't 6 lines of the
// same branch statement.
interface ActorRef {
  kind: ActorKind;
  id: string;
}

function actorRef(actor: Actor): ActorRef {
  switch (actor.kind) {
    case "user":
      return { kind: "user", id: actor.user.id };
    case "student":
      return { kind: "student", id: actor.student.id };
    case "parent":
      return { kind: "parent", id: actor.parent.id };
  }
}

async function requireActor(): Promise<
  { ok: true; actor: Actor } | { ok: false; error: string }
> {
  const actor = await getCurrentActor();
  if (!actor) return { ok: false, error: "Нэвтрэх шаардлагатай." };
  return { ok: true, actor };
}

function revalidateStudent() {
  revalidatePath("/dashboard/student");
}
function revalidateParent() {
  revalidatePath("/dashboard/parent");
}

// ── Portfolio ─────────────────────────────────────────────────

export async function submitPortfolioItem(input: {
  title: string;
  category?: string;
  description?: string;
  imageUrl?: string | null;
  achievedAt?: string | null;
}): Promise<Result<{ id: string }>> {
  const gate = await requireActor();
  if (!gate.ok) return gate;
  if (gate.actor.kind !== "student") {
    return { ok: false, error: "Зөвхөн сурагч өөрийн ажлаа илгээнэ." };
  }

  const title = input.title.trim();
  if (!title) return { ok: false, error: "Гарчиг шаардлагатай." };
  if (title.length > 200) return { ok: false, error: "Гарчиг хэт урт." };

  const description = input.description?.trim().slice(0, 4000) || null;
  const validCategories = new Set(["achievement", "project", "certificate", "other"]);
  const category = validCategories.has(input.category ?? "")
    ? (input.category as string)
    : "achievement";
  const achievedAt = input.achievedAt ? new Date(input.achievedAt) : null;
  if (achievedAt && Number.isNaN(achievedAt.getTime())) {
    return { ok: false, error: "Огноо буруу байна." };
  }

  const created = await prisma.studentPortfolioItem.create({
    data: {
      studentId: gate.actor.student.id,
      title,
      category,
      description,
      imageUrl: input.imageUrl?.trim() || null,
      achievedAt,
      status: "pending",
    },
    select: { id: true },
  });

  await logAudit({
    action: "portfolio.submit",
    targetType: "portfolio",
    targetId: created.id,
    metadata: { studentId: gate.actor.student.id, title },
  });
  revalidateStudent();
  return { ok: true, data: { id: created.id }, message: "Илгээгдлээ. Админ баталгаажуулна." };
}

export async function deletePortfolioItem(id: string): Promise<Result> {
  const gate = await requireActor();
  if (!gate.ok) return gate;

  const item = await prisma.studentPortfolioItem.findUnique({ where: { id } });
  if (!item) return { ok: false, error: "Ажил олдсонгүй." };

  // Only the student who submitted it; staff remove items on the staff site.
  if (gate.actor.kind !== "student" || gate.actor.student.id !== item.studentId) {
    return { ok: false, error: "Устгах эрхгүй." };
  }

  await prisma.studentPortfolioItem.delete({ where: { id } });
  await logAudit({
    action: "portfolio.delete",
    targetType: "portfolio",
    targetId: id,
    metadata: { by: "owner" },
  });
  revalidateStudent();
  return { ok: true, message: "Устгагдлаа." };
}

// ── Club membership ───────────────────────────────────────────

export async function joinClub(clubId: string): Promise<Result> {
  const gate = await requireActor();
  if (!gate.ok) return gate;
  if (gate.actor.kind !== "student") {
    return { ok: false, error: "Дугуйланд зөвхөн сурагч бүртгүүлнэ." };
  }
  const studentId = gate.actor.student.id;

  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) return { ok: false, error: "Дугуйлан олдсонгүй." };

  // Upsert so pressing "join" on an already-joined club is a no-op
  // rather than a crash. `status:approved` — clubs auto-accept for MVP.
  await prisma.clubMember.upsert({
    where: { clubId_studentId: { clubId, studentId } },
    create: { clubId, studentId, status: "approved" },
    update: { status: "approved", joinedAt: new Date() },
  });
  await logAudit({
    action: "club.join",
    targetType: "club",
    targetId: clubId,
    metadata: { studentId },
  });
  revalidateStudent();
  return { ok: true, message: `${club.name} дугуйланд элслээ.` };
}

export async function leaveClub(clubId: string): Promise<Result> {
  const gate = await requireActor();
  if (!gate.ok) return gate;
  if (gate.actor.kind !== "student") {
    return { ok: false, error: "Зөвхөн сурагч гарна." };
  }
  const studentId = gate.actor.student.id;

  try {
    await prisma.clubMember.delete({
      where: { clubId_studentId: { clubId, studentId } },
    });
  } catch {
    return { ok: false, error: "Бүртгэл олдсонгүй." };
  }
  await logAudit({
    action: "club.leave",
    targetType: "club",
    targetId: clubId,
    metadata: { studentId },
  });
  revalidateStudent();
  return { ok: true, message: "Гарлаа." };
}

// ── Event RSVP ────────────────────────────────────────────────

export async function setEventRsvp(
  eventId: string,
  status: "going" | "interested" | "no",
): Promise<Result<{ status: string }>> {
  const gate = await requireActor();
  if (!gate.ok) return gate;
  const me = actorRef(gate.actor);

  if (!["going", "interested", "no"].includes(status)) {
    return { ok: false, error: "Төлөв буруу." };
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { ok: false, error: "Үйл явдал олдсонгүй." };

  await prisma.eventRsvp.upsert({
    where: {
      eventId_actorKind_actorId: {
        eventId,
        actorKind: me.kind,
        actorId: me.id,
      },
    },
    create: {
      eventId,
      actorKind: me.kind,
      actorId: me.id,
      status,
    },
    update: { status },
  });
  await logAudit({
    action: "event.rsvp",
    targetType: "event",
    targetId: eventId,
    metadata: { status, actor: me.kind },
  });
  if (me.kind === "student") revalidateStudent();
  if (me.kind === "parent") revalidateParent();
  return { ok: true, data: { status }, message: "Хадгалагдлаа." };
}

// ── Bookmarks ─────────────────────────────────────────────────

export async function toggleBookmark(
  targetKind: "news" | "achievement" | "event",
  targetId: string,
): Promise<Result<{ bookmarked: boolean }>> {
  const gate = await requireActor();
  if (!gate.ok) return gate;
  const me = actorRef(gate.actor);

  if (!["news", "achievement", "event"].includes(targetKind)) {
    return { ok: false, error: "Төрөл буруу." };
  }
  if (!targetId) return { ok: false, error: "ID шаардлагатай." };

  const existing = await prisma.bookmark.findUnique({
    where: {
      actorKind_actorId_targetKind_targetId: {
        actorKind: me.kind,
        actorId: me.id,
        targetKind,
        targetId,
      },
    },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    if (me.kind === "student") revalidateStudent();
    if (me.kind === "parent") revalidateParent();
    return { ok: true, data: { bookmarked: false }, message: "Хадгалалт цуцлагдлаа." };
  }
  await prisma.bookmark.create({
    data: {
      actorKind: me.kind,
      actorId: me.id,
      targetKind,
      targetId,
    },
  });
  if (me.kind === "student") revalidateStudent();
  if (me.kind === "parent") revalidateParent();
  return { ok: true, data: { bookmarked: true }, message: "Хадгаллаа." };
}

// ── Reactions ─────────────────────────────────────────────────

export async function toggleReaction(
  newsItemId: string,
  kind: "heart" | "clap",
): Promise<Result<{ active: boolean }>> {
  const gate = await requireActor();
  if (!gate.ok) return gate;
  const me = actorRef(gate.actor);

  if (!["heart", "clap"].includes(kind)) return { ok: false, error: "Төрөл буруу." };
  if (!newsItemId) return { ok: false, error: "ID шаардлагатай." };

  const existing = await prisma.newsReaction.findUnique({
    where: {
      newsItemId_actorKind_actorId_kind: {
        newsItemId,
        actorKind: me.kind,
        actorId: me.id,
        kind,
      },
    },
  });

  if (existing) {
    await prisma.newsReaction.delete({ where: { id: existing.id } });
    // Revalidate the news detail page so the new count is fresh.
    const news = await prisma.newsItem.findUnique({
      where: { id: newsItemId },
      select: { slug: true },
    });
    if (news?.slug) revalidatePath(`/news/${news.slug}`);
    return { ok: true, data: { active: false } };
  }
  await prisma.newsReaction.create({
    data: {
      newsItemId,
      actorKind: me.kind,
      actorId: me.id,
      kind,
    },
  });
  const news = await prisma.newsItem.findUnique({
    where: { id: newsItemId },
    select: { slug: true },
  });
  if (news?.slug) revalidatePath(`/news/${news.slug}`);
  return { ok: true, data: { active: true } };
}
