import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "session_uid";

export async function getCurrentUser() {
  const uid = cookies().get(SESSION_COOKIE)?.value;
  if (!uid) return null;
  return prisma.user.findUnique({ where: { id: uid } });
}
