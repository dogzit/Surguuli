import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "session_uid";
const ADMIN_COOKIE = "admin_uid";

// Strict allowlist of real static-file extensions. Unlike `pathname.includes(".")`,
// this cannot be bypassed with paths like /dashboard/admin.foo — a dot in a
// path segment no longer skips security checks.
const STATIC_FILE_RE = /\.(png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|map|txt|xml|json|webmanifest|woff2?|ttf|otf|eot|mp4|webm|pdf)$/i;

function sessionSecret(): string | null {
  const s = process.env.SESSION_SECRET || process.env.ADMIN_SECRET;
  return s && s.length >= 16 ? s : null;
}

function base64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacRaw(value: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return new Uint8Array(sig);
}

async function hmacHex(value: string, secret: string): Promise<string> {
  return Array.from(await hmacRaw(value, secret))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Verify the HMAC-signed admin cookie (`lib/admin.ts` format). */
async function hasValidAdminCookie(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = sessionSecret();
  if (!secret) return false; // fail closed
  const expected = await hmacHex("admin", secret);
  return token.length === expected.length && token === expected;
}

/** Verify the HMAC-signed session cookie (`lib/session.ts` format). */
async function hasValidSessionCookie(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = sessionSecret();
  if (!secret) return false; // fail closed
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const userId = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = base64urlEncode(await hmacRaw(userId, secret));
  // Signature comparison only — the DB-backed role check still happens
  // server-side in layouts/pages. This is an early-bounce optimization.
  return sig.length === expected.length && sig === expected;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip real static assets and API routes.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    STATIC_FILE_RE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Early gate for /dashboard/admin/*: require either a cryptographically
  // valid admin cookie or a valid session cookie. Full role authorization
  // (isAdmin/canAccessAdmin) is enforced again server-side in the layout and
  // pages — this middleware exists so forgotten page-level checks cannot
  // expose admin children to anonymous visitors.
  //
  // ⚠️ EXCEPTION: the root `/dashboard/admin` path is *publicly* reachable so
  // AdminGate can render its PIN prompt. Without this exception, an admin
  // who has neither cookie has no way to sign in — the gate is inside the
  // dashboard shell, and the shell used to bounce anonymous visitors to
  // `/login`, which itself only accepts user PINs. Chicken-and-egg.
  if (pathname.startsWith("/dashboard/admin")) {
    // `/dashboard/admin` (root) болон `/dashboard/admin/audit` хоёр нь
    // AdminGate-ыг өөрсдөө үзүүлдэг public entry point-ууд — админ PIN
    // оруулах цорын ганц газар. Бусад sub-route бүгд cookie шаардана.
    if (pathname === "/dashboard/admin" || pathname === "/dashboard/admin/audit") {
      return NextResponse.next();
    }
    const adminOk = await hasValidAdminCookie(req.cookies.get(ADMIN_COOKIE)?.value);
    const sessionOk = await hasValidSessionCookie(req.cookies.get(SESSION_COOKIE)?.value);
    if (!adminOk && !sessionOk) {
      return NextResponse.redirect(new URL("/dashboard/admin/audit", req.url));
    }
    return NextResponse.next();
  }

  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  const adminToken = req.cookies.get(ADMIN_COOKIE)?.value;
  const hasSession = !!sessionToken;

  // 3. Unauthenticated visitors hitting the dashboard -> login. Admin-only
  // cookie counts too so a PIN-only admin can hit /dashboard.
  if (pathname.startsWith("/dashboard") && !hasSession && !adminToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 4. Already signed-in users (session OR verified admin cookie) skip the
  // login page. We verify the admin cookie so a bogus one doesn't lock a
  // guest out of the login page.
  if (pathname === "/login") {
    if (hasSession) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (await hasValidAdminCookie(adminToken)) {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
