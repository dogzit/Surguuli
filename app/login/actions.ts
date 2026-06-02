"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/session";

export async function loginAs(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return { error: "Хэрэглэгч олдсонгүй." };
  }

  if (user.pin && user.pin !== pin) {
    return { error: "PIN код буруу байна." };
  }

  cookies().set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
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
