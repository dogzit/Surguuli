import { headers } from "next/headers";
import { prisma } from "./prisma";

/**
 * Fixed-window rate limiter backed by the RateLimit table, so every
 * serverless instance shares the same counters (an in-memory Map only
 * limited each instance separately). Returns true when the action is
 * allowed, false once `max` hits happened inside the current window.
 *
 * One atomic upsert per call; the window is measured on the database clock.
 * Fails open: if the database is unreachable the action itself will fail
 * anyway, and a rate-limit hiccup must not lock every user out.
 */
export async function hitRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, now() + ${windowMs} * interval '1 millisecond')
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."resetAt" <= now() THEN 1
                       ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= now() THEN EXCLUDED."resetAt"
                         ELSE "RateLimit"."resetAt" END
      RETURNING "count"`;
    // Sweep long-expired rows now and then instead of running a cron.
    if (Math.random() < 0.02) {
      void prisma.rateLimit
        .deleteMany({ where: { resetAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
        .catch(() => {});
    }
    return Number(rows[0]?.count ?? 1) <= max;
  } catch (err) {
    console.error("[rate-limit] check failed", err);
    return true;
  }
}

/** True when `key` has used up `max` hits in its current window. Counts nothing. */
export async function isRateLimited(key: string, max: number): Promise<boolean> {
  const row = await prisma.rateLimit.findUnique({ where: { key } }).catch(() => null);
  return !!row && row.resetAt > new Date() && row.count >= max;
}

export async function resetRateLimit(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } }).catch(() => {});
}

/**
 * Client IP for rate-limit bucketing.
 *
 * `x-forwarded-for` is spoofable unless a trusted proxy sets it. Vercel's
 * edge always overwrites `x-real-ip` / `x-forwarded-for` with the real
 * client address, so they are trusted there (and wherever TRUSTED_PROXY=1).
 * Elsewhere (local dev) every caller shares the "unknown" bucket.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  if (process.env.VERCEL === "1" || process.env.TRUSTED_PROXY === "1") {
    const ip = h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim();
    return ip || "unknown";
  }
  return "unknown";
}
