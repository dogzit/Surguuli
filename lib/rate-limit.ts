import { headers } from "next/headers";

type Entry = { count: number; firstAt: number };

const buckets = new Map<string, Entry>();

// Hard cap so attackers cannot grow the map without bound by spraying
// random keys (memory-exhaustion DoS).
const MAX_KEYS = 10_000;

/**
 * In-memory fixed-window rate limiter.
 * Returns true when the action is allowed, false when the limit is exceeded.
 *
 * Note: per-process memory only — sufficient for a single-instance deployment.
 * For multi-instance deployments back this with Redis instead.
 */
export function hitRateLimit(
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now - entry.firstAt > windowMs) {
    if (buckets.size >= MAX_KEYS) {
      // Evict expired entries first; if still full, drop oldest keys.
      for (const [k, v] of buckets) {
        if (now - v.firstAt > windowMs) buckets.delete(k);
      }
      while (buckets.size >= MAX_KEYS) {
        const oldest = buckets.keys().next().value;
        if (oldest === undefined) break;
        buckets.delete(oldest);
      }
    }
    buckets.set(key, { count: 1, firstAt: now });
    return true;
  }

  entry.count += 1;
  return entry.count <= max;
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/**
 * Best-effort client IP from proxy headers (for rate-limit bucketing).
 *
 * `x-forwarded-for` is trivially spoofable by clients when the server has no
 * trusted proxy sitting in front. We only trust it when TRUSTED_PROXY=1 (set
 * by the deployment env — Vercel, Cloudflare, etc.). Otherwise we fall back
 * to `x-real-ip` and finally the string "unknown".
 *
 * When XFF contains a chain (`client, proxy1, proxy2, ...`), we take the
 * left-most entry — that's the original client as seen by the outer-most
 * trusted proxy.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const trustProxy = process.env.TRUSTED_PROXY === "1";

  if (trustProxy) {
    const fwd = h.get("x-forwarded-for");
    const ip = fwd?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim();
    return ip || "unknown";
  }

  // Without a trusted proxy, XFF is user-controlled and MUST NOT be used for
  // security decisions. `x-real-ip` is likewise unreliable, but at least the
  // caller can opt in to it by setting TRUSTED_PROXY.
  return "unknown";
}
