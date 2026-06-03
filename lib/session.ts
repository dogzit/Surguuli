import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "session_uid";
const BCRYPT_ROUNDS = 10;

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set (>=16 chars) in environment");
  }
  return secret;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export function signSession(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

export function verifySession(token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const userId = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(userId);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return userId;
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, BCRYPT_ROUNDS);
}

export async function verifyPin(pin: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  if (stored.startsWith("$2")) {
    return bcrypt.compare(pin, stored);
  }
  // Legacy plaintext PIN — accept once, caller should re-hash.
  return pin === stored;
}

export function isLegacyPin(stored: string | null): boolean {
  return !!stored && !stored.startsWith("$2");
}

export async function getCurrentUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const uid = verifySession(token);
  if (!uid) return null;
  return prisma.user.findUnique({ where: { id: uid } });
}

export function roleHomePath(role: string): string {
  if (role === "ADMIN") return "/dashboard/admin";
  if (role === "APPROVER") return "/dashboard/approver";
  return "/dashboard/teacher";
}

export async function requireUser(role?: "APPROVER" | "TEACHER") {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (role && me.role !== role) redirect(roleHomePath(me.role));
  return me;
}
