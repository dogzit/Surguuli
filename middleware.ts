import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "session_uid";
const SESSION_TYPE_COOKIE = "session_type";
const ADMIN_COOKIE = "admin_uid";

type ActorKind = "user" | "student" | "parent";
const ACTOR_KINDS = new Set<ActorKind>(["user", "student", "parent"]);

// Strict allowlist of real static-file extensions. Unlike `pathname.includes(".")`,
// this cannot be bypassed with paths like /dashboard/admin.foo — a dot in a
// path segment no longer skips security checks.
const STATIC_FILE_RE = /\.(png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|map|txt|xml|json|webmanifest|woff2?|ttf|otf|eot|mp4|webm|pdf)$/i;

function sessionSecret(): string | null {
  const s = process.env.SESSION_SECRET || process.env.ADMIN_SECRET;
  return s && s.length >= 16 ? s : null;
}

// Must match adminSecret() in lib/admin.ts, which signs the cookie with
// ADMIN_SECRET first. Using sessionSecret() here rejected valid admin
// cookies whenever the two env values differ.
function adminSecret(): string | null {
  const s = process.env.ADMIN_SECRET || process.env.SESSION_SECRET;
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
  const secret = adminSecret();
  if (!secret) return false; // fail closed
  const expected = await hmacHex("admin", secret);
  return token.length === expected.length && token === expected;
}

/**
 * Verify the session cookie signature and confirm it matches the declared
 * session type. Namespacing prevents replaying a student token as a
 * user token even if signatures happened to collide.
 */
async function hasValidSessionOfKind(
  token: string | undefined,
  kind: ActorKind,
): Promise<boolean> {
  if (!token) return false;
  const secret = sessionSecret();
  if (!secret) return false; // fail closed
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const id = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = base64urlEncode(await hmacRaw(`${kind}:${id}`, secret));
  return sig.length === expected.length && sig === expected;
}

function readSessionKind(value: string | undefined): ActorKind | null {
  if (!value) return null;
  return ACTOR_KINDS.has(value as ActorKind) ? (value as ActorKind) : null;
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

  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  const sessionKind = readSessionKind(req.cookies.get(SESSION_TYPE_COOKIE)?.value);
  const adminToken = req.cookies.get(ADMIN_COOKIE)?.value;

  const sessionOk = sessionKind
    ? await hasValidSessionOfKind(sessionToken, sessionKind)
    : false;
  const validSession = sessionOk ? sessionKind : null;

  // 2. Admin area gating (unchanged behaviour except sessionKind must match).
  if (pathname.startsWith("/dashboard/admin")) {
    // Root + audit are public entry points so AdminGate can render its
    // PIN prompt for logged-out visitors.
    if (pathname === "/dashboard/admin" || pathname === "/dashboard/admin/audit") {
      return NextResponse.next();
    }
    const adminOk = await hasValidAdminCookie(adminToken);
    // Only staff sessions unlock admin sub-routes — student/parent sessions
    // are recognised elsewhere but never bypass the admin gate.
    if (!adminOk && validSession !== "user") {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }
    return NextResponse.next();
  }

  // 3. Student area — only student sessions may enter. Everyone else is
  // sent to their own home so nobody sees a "wrong dashboard" empty state.
  if (pathname.startsWith("/dashboard/student")) {
    if (validSession === "student") return NextResponse.next();
    if (validSession === "user") return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    if (validSession === "parent") return NextResponse.redirect(new URL("/dashboard/parent", req.url));
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 4. Parent area — same story.
  if (pathname.startsWith("/dashboard/parent")) {
    if (validSession === "parent") return NextResponse.next();
    if (validSession === "user") return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    if (validSession === "student") return NextResponse.redirect(new URL("/dashboard/student", req.url));
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 5. Any other /dashboard path: require SOMEONE to be signed in.
  if (pathname.startsWith("/dashboard") && !validSession && !adminToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 6. Bounce away from /login if already signed in.
  if (pathname === "/login") {
    if (validSession === "user") return NextResponse.redirect(new URL("/", req.url));
    if (validSession === "student") return NextResponse.redirect(new URL("/dashboard/student", req.url));
    if (validSession === "parent") return NextResponse.redirect(new URL("/dashboard/parent", req.url));
    if (await hasValidAdminCookie(adminToken)) {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
