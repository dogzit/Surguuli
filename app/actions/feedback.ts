"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/admin";
import { logAudit } from "@/lib/audit";
import { getCurrentActor, type Actor } from "@/lib/session";
import { hitRateLimit, getClientIp } from "@/lib/rate-limit";
import { notifyActor, notifyMany } from "@/lib/notifications";
import {
  FEEDBACK_KINDS,
  FEEDBACK_STATUSES,
  FEEDBACK_TOPICS,
  isOption,
} from "@/lib/feedback";
import type { Result } from "./admin";

export interface FeedbackFormState {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<"kind" | "topic" | "title" | "body" | "name" | "contact", string>>;
}

const MAX_TITLE = 150;
const MAX_BODY = 4_000;
const MIN_BODY = 10;
const MAX_NAME = 120;
const MAX_CONTACT = 200;
const MAX_NOTE = 2_000;
const MAX_RESPONSE = 4_000;

// Per-IP limit. Tighter than search, looser than login.
const MAX_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60_000;
const MAX_URLS = 2;
const URL_RE = /\bhttps?:\/\/\S+/gi;

function actorName(actor: Actor): string {
  switch (actor.kind) {
    case "user":
      return actor.user.name;
    case "student":
      return `${actor.student.lastName} ${actor.student.firstName}`;
    case "parent":
      return actor.parent.name;
  }
}

function actorId(actor: Actor): string {
  switch (actor.kind) {
    case "user":
      return actor.user.id;
    case "student":
      return actor.student.id;
    case "parent":
      return actor.parent.id;
  }
}

export async function submitFeedback(
  _prev: FeedbackFormState,
  formData: FormData,
): Promise<FeedbackFormState> {
  const thanks = "Таны санал хүлээж авлаа. Баярлалаа!";

  // Honeypot — bots fill every input. Same success message so they learn nothing.
  if (String(formData.get("company") ?? "").trim()) {
    return { ok: true, message: thanks };
  }

  const ip = await getClientIp();
  if (!hitRateLimit(`feedback:${ip}`, MAX_PER_WINDOW, WINDOW_MS)) {
    return {
      ok: false,
      message: "Та саяхан хэд хэдэн санал илгээсэн байна. 10 минутын дараа дахин оролдоно уу.",
    };
  }

  const kind = String(formData.get("kind") ?? "");
  const topic = String(formData.get("topic") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const anonymous = formData.get("anonymous") === "on";

  const fieldErrors: FeedbackFormState["fieldErrors"] = {};
  if (!isOption(FEEDBACK_KINDS, kind)) fieldErrors.kind = "Төрлөө сонгоно уу";
  if (!isOption(FEEDBACK_TOPICS, topic)) fieldErrors.topic = "Сэдвээ сонгоно уу";
  if (title.length > MAX_TITLE) fieldErrors.title = `Хамгийн ихдээ ${MAX_TITLE} тэмдэгт`;
  if (body.length < MIN_BODY) fieldErrors.body = `Хамгийн багадаа ${MIN_BODY} тэмдэгт бичнэ үү`;
  else if (body.length > MAX_BODY) fieldErrors.body = `Хамгийн ихдээ ${MAX_BODY} тэмдэгт`;

  // Identity: anonymous means we store nothing that points back to the sender,
  // even when they are signed in.
  const actor = anonymous ? null : await getCurrentActor();
  let name: string | null = null;
  let contact: string | null = null;
  if (!anonymous) {
    name = actor ? actorName(actor) : String(formData.get("name") ?? "").trim() || null;
    contact = String(formData.get("contact") ?? "").trim() || null;
    if (name && name.length > MAX_NAME) fieldErrors.name = "Хэт урт байна";
    if (contact && contact.length > MAX_CONTACT) fieldErrors.contact = "Хэт урт байна";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Талбаруудыг шалгана уу", fieldErrors };
  }

  // Link-stuffed bodies are spam; drop silently.
  if ((body.match(URL_RE) || []).length > MAX_URLS) {
    return { ok: true, message: thanks };
  }

  try {
    await prisma.feedback.create({
      data: {
        kind,
        topic,
        title: title || null,
        body,
        anonymous,
        actorKind: actor?.kind ?? null,
        actorId: actor ? actorId(actor) : null,
        name,
        contact,
      },
    });
  } catch (err) {
    console.error("[feedback] failed to persist", err);
    return { ok: false, message: "Илгээх үед алдаа гарлаа. Дараа дахин оролдоно уу." };
  }

  // Let admin accounts know there is something to triage.
  const admins = await prisma.user
    .findMany({ where: { role: "ADMIN" }, select: { id: true } })
    .catch(() => []);
  await notifyMany(
    admins.map((a) => ({ actorKind: "user" as const, actorId: a.id })),
    {
      category: "feedback",
      title: "Шинэ санал хүсэлт ирлээ",
      body: title || body.slice(0, 140),
      href: "/dashboard/admin/feedback",
    },
  );

  revalidatePath("/dashboard/admin/feedback");
  return {
    ok: true,
    message: actor
      ? "Таны санал хүлээж авлаа. Хариуг энэ хуудасны доод хэсгээс харна уу."
      : thanks,
  };
}

// ── Admin ────────────────────────────────────────────────────

export async function updateFeedback(
  id: string,
  input: { status?: string; adminNote?: string; response?: string },
): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const existing = await prisma.feedback.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Санал олдсонгүй." };

  const data: {
    status?: string;
    adminNote?: string | null;
    response?: string | null;
    respondedAt?: Date | null;
  } = {};

  if (input.status !== undefined) {
    if (!isOption(FEEDBACK_STATUSES, input.status)) {
      return { ok: false, error: "Төлөв буруу байна." };
    }
    data.status = input.status;
  }
  if (input.adminNote !== undefined) {
    data.adminNote = input.adminNote.trim().slice(0, MAX_NOTE) || null;
  }

  let newResponse: string | null = null;
  if (input.response !== undefined) {
    const response = input.response.trim().slice(0, MAX_RESPONSE) || null;
    data.response = response;
    if (response !== existing.response) {
      data.respondedAt = response ? new Date() : null;
      newResponse = response;
    }
  }

  await prisma.feedback.update({ where: { id }, data });

  if (newResponse && existing.actorKind && existing.actorId && !existing.anonymous) {
    await notifyActor({
      actorKind: existing.actorKind as Actor["kind"],
      actorId: existing.actorId,
      category: "feedback",
      title: "Таны саналд хариу ирлээ",
      body: newResponse.slice(0, 200),
      href: "/feedback#my-feedback",
      alsoEmail: true,
    });
  }

  await logAudit({
    action: "feedback.update",
    targetType: "Feedback",
    targetId: id,
    metadata: { status: data.status, responded: newResponse !== null },
  });

  revalidatePath("/dashboard/admin/feedback");
  revalidatePath("/dashboard/admin", "layout");
  return { ok: true, message: newResponse ? "Хариу илгээгдлээ." : "Хадгалагдлаа." };
}

export async function deleteFeedback(id: string): Promise<Result> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const deleted = await prisma.feedback.deleteMany({ where: { id } });
  if (deleted.count === 0) return { ok: false, error: "Санал олдсонгүй." };

  await logAudit({ action: "feedback.delete", targetType: "Feedback", targetId: id });
  revalidatePath("/dashboard/admin/feedback");
  revalidatePath("/dashboard/admin", "layout");
  return { ok: true, message: "Устгагдлаа." };
}
