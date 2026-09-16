"use server";

import { prisma } from "@/lib/prisma";
import { hitRateLimit, getClientIp } from "@/lib/rate-limit";

export interface ContactFormState {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<"name" | "email" | "subject" | "body", string>>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Input length caps — reject absurd payloads before they hit the DB.
const MAX_NAME = 120;
const MAX_EMAIL = 200;
const MAX_SUBJECT = 200;
const MAX_BODY = 5_000;

// Spam protection: strict per-IP submission limits + content signals.
const MAX_PER_WINDOW = 3;
const WINDOW_MS = 10 * 60_000; // 10 minutes
const MAX_URLS_IN_BODY = 2;
const MIN_BODY_WORDS = 3;

const URL_RE = /\bhttps?:\/\/\S+/gi;

// Rough English-language SEO/scam keywords that make up the vast majority of
// bot submissions. Not a substitute for a proper filter (Turnstile) but
// catches the obvious drive-by spam. Kept short to avoid false positives.
const SPAM_KEYWORDS = [
  "seo services",
  "viagra",
  "casino",
  "crypto investment",
  "loan approved",
  "cialis",
  "porn",
  "bitcoin",
];

function looksLikeSpam(subject: string, body: string): boolean {
  const hay = `${subject} ${body}`.toLowerCase();
  return SPAM_KEYWORDS.some((k) => hay.includes(k));
}

export async function submitContactMessage(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Honeypot: hidden "company" field must stay empty. Bots that fill every
  // input are silently dropped with the same success message so they learn
  // nothing.
  const honeypot = String(formData.get("company") ?? "").trim();
  if (honeypot) {
    return {
      ok: true,
      message: "Таны санал хүлээж авлаа. Бид 3 хоногийн дотор хариу өгнө.",
    };
  }

  const ip = await getClientIp();
  if (!hitRateLimit(`contact:${ip}`, MAX_PER_WINDOW, WINDOW_MS)) {
    return {
      ok: false,
      message:
        "Та саяхан хэд хэдэн хүсэлт илгээсэн байна. 10 минутын дараа дахин оролдоно уу.",
    };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  const fieldErrors: ContactFormState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Овог, нэрээ бичнэ үү";
  else if (name.length > MAX_NAME) fieldErrors.name = "Хэт урт байна";
  if (!email) fieldErrors.email = "И-мэйлээ бичнэ үү";
  else if (!EMAIL_RE.test(email)) fieldErrors.email = "И-мэйл буруу байна";
  else if (email.length > MAX_EMAIL) fieldErrors.email = "Хэт урт байна";
  if (!subject) fieldErrors.subject = "Гарчгаа бичнэ үү";
  else if (subject.length > MAX_SUBJECT) fieldErrors.subject = "Хэт урт байна";
  if (!body) fieldErrors.body = "Санал хүсэлтээ бичнэ үү";
  else if (body.length < 5) fieldErrors.body = "Хамгийн багадаа 5 тэмдэгт";
  else if (body.length > MAX_BODY) fieldErrors.body = "Хамгийн ихдээ 5000 тэмдэгт";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Талбаруудыг шалгана уу", fieldErrors };
  }

  // Content-shape checks — silent drop (200 OK to the caller) so spammers
  // can't test their payloads against error messages.
  const urlCount = (body.match(URL_RE) || []).length;
  const wordCount = body.split(/\s+/).filter(Boolean).length;
  if (
    urlCount > MAX_URLS_IN_BODY ||
    wordCount < MIN_BODY_WORDS ||
    looksLikeSpam(subject, body)
  ) {
    return {
      ok: true,
      message: "Таны санал хүлээж авлаа. Бид 3 хоногийн дотор хариу өгнө.",
    };
  }

  try {
    await prisma.contactMessage.create({
      data: { name, email, subject, body },
    });
  } catch (err) {
    console.error("[contact] failed to persist message", err);
    return {
      ok: false,
      message: "Илгээх үед алдаа гарлаа. Дараа дахин оролдоно уу.",
    };
  }

  return {
    ok: true,
    message: "Таны санал хүлээж авлаа. Бид 3 хоногийн дотор хариу өгнө.",
  };
}
