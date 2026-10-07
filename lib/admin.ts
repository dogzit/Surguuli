import { cookies } from "next/headers";
import crypto from "crypto";

// The admin PIN is entered on the staff site, which has its own cookies.
// What remains here only keeps /api/upload closed on the public site and
// lets logout clear a cookie left over from before the split.

export const ADMIN_COOKIE = "admin_uid";
const ADMIN_MARKER = "admin";

function adminSecret(): string {
  const s = process.env.ADMIN_SECRET || process.env.SESSION_SECRET;
  if (!s || s.length < 16)
    throw new Error("ADMIN_SECRET or SESSION_SECRET must be set");
  return s;
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  const expected = crypto
    .createHmac("sha256", adminSecret())
    .update(ADMIN_MARKER)
    .digest("hex");
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

/**
 * Server-action variant: does NOT redirect. Returns a Result-shaped
 * error the caller can pass straight through.
 */
export async function ensureAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (!(await isAdmin())) {
    return { ok: false, error: "Админы эрх шаардлагатай." };
  }
  return { ok: true };
}
