import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { ACCOUNTANT_POSITION } from "./positions";

// One cookie for the token, one for the actor type. Splitting them lets
// middleware verify the signature without a DB hit — the type tells us
// which table to look up if we go further, and both are HMAC-signed so
// they can't be swapped independently.
export const SESSION_COOKIE = "session_uid";
export const SESSION_TYPE_COOKIE = "session_type";
export type ActorKind = "user" | "student" | "parent";

const BCRYPT_ROUNDS = 10;

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set (>=16 chars) in environment");
  }
  return secret;
}

// Namespaced HMAC so a student token can never be replayed as a staff
// token (or vice versa) even if signatures were shared cross-type.
function sign(value: string, kind: ActorKind): string {
  return crypto
    .createHmac("sha256", sessionSecret())
    .update(`${kind}:${value}`)
    .digest("base64url");
}

export function signSession(id: string, kind: ActorKind = "user"): string {
  return `${id}.${sign(id, kind)}`;
}

export function verifySession(
  token: string | undefined,
  kind: ActorKind = "user",
): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const id = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(id, kind);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return id;
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
  // Compare in constant time to avoid leaking the PIN via timing.
  const a = Buffer.from(pin);
  const b = Buffer.from(stored);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isLegacyPin(stored: string | null): boolean {
  return !!stored && !stored.startsWith("$2");
}

/**
 * Get the currently logged-in staff user, if any. Kept as a thin wrapper
 * for backwards compatibility with everything already written against
 * `getCurrentUser()`. Prefer `getCurrentActor()` in new code.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const type = cookieStore.get(SESSION_TYPE_COOKIE)?.value as ActorKind | undefined;
  if (type && type !== "user") return null;
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const uid = verifySession(token, "user");
  if (!uid) return null;
  return prisma.user.findUnique({ where: { id: uid } });
}

// Discriminated union of everyone who might be logged in. Consumers
// switch on `.kind` to know which fields are safe to read.
export type Actor =
  | { kind: "user"; user: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>> }
  | {
      kind: "student";
      student: NonNullable<Awaited<ReturnType<typeof prisma.student.findUnique>>>;
    }
  | {
      kind: "parent";
      parent: NonNullable<Awaited<ReturnType<typeof prisma.parent.findUnique>>>;
    };

/**
 * Look up whoever is currently signed in — could be staff, student, or
 * parent. Returns null if no cookie or an invalid signature.
 */
export async function getCurrentActor(): Promise<Actor | null> {
  const cookieStore = await cookies();
  const type = cookieStore.get(SESSION_TYPE_COOKIE)?.value as ActorKind | undefined;
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!type || !token) return null;

  const id = verifySession(token, type);
  if (!id) return null;

  switch (type) {
    case "user": {
      const user = await prisma.user.findUnique({ where: { id } });
      return user ? { kind: "user", user } : null;
    }
    case "student": {
      const student = await prisma.student.findUnique({ where: { id } });
      return student ? { kind: "student", student } : null;
    }
    case "parent": {
      const parent = await prisma.parent.findUnique({ where: { id } });
      return parent ? { kind: "parent", parent } : null;
    }
    default:
      return null;
  }
}

/**
 * Small helper for server actions: clear whichever session cookie(s)
 * the caller has. Idempotent.
 */
export async function clearAnySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(SESSION_TYPE_COOKIE);
}

export function roleHomePath(
  role: string,
  position?: string | null,
): string {
  // Accountant is an APPROVER with a specific position and has their own
  // dashboard — route there before the generic admin fallback so they
  // don't land on a page they can't act on.
  if (role === "APPROVER" && position === ACCOUNTANT_POSITION) {
    return "/dashboard/accountant";
  }
  if (role === "ADMIN" || role === "APPROVER") return "/dashboard/admin";
  return "/";
}

/** Route the given actor to whichever dashboard makes sense for them. */
export function actorHomePath(actor: Actor): string {
  switch (actor.kind) {
    case "user":
      return roleHomePath(actor.user.role, actor.user.position);
    case "student":
      return "/dashboard/student";
    case "parent":
      return "/dashboard/parent";
  }
}

export async function requireUser(role?: "APPROVER" | "TEACHER") {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (role && me.role !== role) redirect(roleHomePath(me.role, me.position));
  return me;
}

/** Require the current visitor to be a student. Redirects otherwise. */
export async function requireStudent() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  if (actor.kind !== "student") redirect(actorHomePath(actor));
  return actor.student;
}

/** Require the current visitor to be a parent. Redirects otherwise. */
export async function requireParent() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  if (actor.kind !== "parent") redirect(actorHomePath(actor));
  return actor.parent;
}
