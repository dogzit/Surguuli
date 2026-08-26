"use server";

import { prisma } from "@/lib/prisma";

export interface ContactFormState {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<"name" | "email" | "subject" | "body", string>>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContactMessage(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  const fieldErrors: ContactFormState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Овог, нэрээ бичнэ үү";
  if (!email) fieldErrors.email = "И-мэйлээ бичнэ үү";
  else if (!EMAIL_RE.test(email)) fieldErrors.email = "И-мэйл буруу байна";
  if (!subject) fieldErrors.subject = "Гарчгаа бичнэ үү";
  if (!body) fieldErrors.body = "Санал хүсэлтээ бичнэ үү";
  else if (body.length < 5) fieldErrors.body = "Хамгийн багадаа 5 тэмдэгт";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Талбаруудыг шалгана уу", fieldErrors };
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
