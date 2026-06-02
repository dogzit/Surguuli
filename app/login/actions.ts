"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/session";

export type LoginError = { error: string };

export async function loginAs(formData: FormData): Promise<LoginError | void> {
  const userId = String(formData.get("userId") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();

  // 1. Ирж буй утгуудыг хэвлэж шалгах
  console.log("--- Login Attempt ---");
  console.log("Form Data userId:", userId);
  console.log("Form Data pin:", pin);

  // 2. Өгөгдлийн сангаас хайх
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // 3. Олдсон хэрэглэгчийг хэвлэж шалгах
  console.log("Database user result:", user);

  if (!user) {
    console.log("❌ Алдаа: Хэрэглэгч олдсонгүй");
    return { error: "Хэрэглэгч олдсонгүй." };
  }

  if (user.pin && user.pin !== pin) {
    console.log("❌ Алдаа: PIN буруу байна");
    return { error: "PIN буруу байна." };
  }

  // Нэвтрэх амжилттай үед
  console.log("✅ Амжилттай нэвтэрлээ:", user.id);

  cookies().set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(
    user.role === "APPROVER" ? "/dashboard/approver" : "/dashboard/teacher",
  );
}

export async function logout() {
  cookies().delete(SESSION_COOKIE);
  redirect("/login");
}
