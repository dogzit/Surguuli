"use server";

import { prisma } from "@/lib/prisma";
import { hitRateLimit, getClientIp } from "@/lib/rate-limit";
import { notifyMany } from "@/lib/notifications";
import { FEEDBACK_KINDS, FEEDBACK_TOPICS, isOption } from "@/lib/feedback";

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

// Per-IP limit. Tighter than search, looser than login.
const MAX_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60_000;
const MAX_URLS = 2;
const URL_RE = /\bhttps?:\/\/\S+/gi;

// Must match SOCIAL_WORKER_POSITION in the staff site's lib/positions.ts.
const SOCIAL_WORKER_POSITION = "Нийгмийн ажилтан";

export async function submitFeedback(
  _prev: FeedbackFormState,
  formData: FormData,
): Promise<FeedbackFormState> {
  const thanks = "Таны санал сургуулийн захиргаанд амжилттай хүрлээ.";

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

  // Identity: anonymous means we store nothing that points back to the sender.
  let name: string | null = null;
  let contact: string | null = null;
  if (!anonymous) {
    name = String(formData.get("name") ?? "").trim() || null;
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
        name,
        contact,
      },
    });
  } catch (err) {
    console.error("[feedback] failed to persist", err);
    return { ok: false, message: "Илгээх үед алдаа гарлаа. Дараа дахин оролдоно уу." };
  }

  // Let the people who triage feedback on the staff site know: admin
  // accounts and the social worker (who has full access there).
  const admins = await prisma.user
    .findMany({
      where: { OR: [{ role: "ADMIN" }, { role: "APPROVER", position: SOCIAL_WORKER_POSITION }] },
      select: { id: true },
    })
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

  return { ok: true, message: thanks };
}
