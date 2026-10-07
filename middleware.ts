import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "session_uid";
const SESSION_TYPE_COOKIE = "session_type";

// Staff ("user") sessions belong to the staff site; here only students and
// parents count as signed in.
type ActorKind = "student" | "parent";
const ACTOR_KINDS = new Set<ActorKind>(["student", "parent"]);

// Staff pages moved to the staff site; old bookmarks are forwarded there.
const STAFF_SITE_URL = (process.env.NEXT_PUBLIC_STAFF_SITE_URL ?? "").replace(/\/$/, "");
const STAFF_PATHS = [
  "/dashboard/admin",
  "/dashboard/teacher",
  "/dashboard/accountant",
  "/dashboard/duty",
  "/dashboard/settings",
];

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

  // 2. Old staff URLs → the staff site.
  if (STAFF_SITE_URL && STAFF_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.redirect(`${STAFF_SITE_URL}${pathname}${req.nextUrl.search}`);
  }

  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  const sessionKind = readSessionKind(req.cookies.get(SESSION_TYPE_COOKIE)?.value);
  const validSession =
    sessionKind && (await hasValidSessionOfKind(sessionToken, sessionKind)) ? sessionKind : null;

  // 3. Student area — only student sessions may enter. A parent is sent to
  // their own dashboard so nobody sees a "wrong dashboard" empty state.
  if (pathname.startsWith("/dashboard/student")) {
    if (validSession === "student") return NextResponse.next();
    if (validSession === "parent") return NextResponse.redirect(new URL("/dashboard/parent", req.url));
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 4. Parent area — same story.
  if (pathname.startsWith("/dashboard/parent")) {
    if (validSession === "parent") return NextResponse.next();
    if (validSession === "student") return NextResponse.redirect(new URL("/dashboard/student", req.url));
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 5. Any other /dashboard path: require a student or parent session.
  if (pathname.startsWith("/dashboard") && !validSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 6. Bounce away from /login if already signed in.
  if (pathname === "/login") {
    if (validSession === "student") return NextResponse.redirect(new URL("/dashboard/student", req.url));
    if (validSession === "parent") return NextResponse.redirect(new URL("/dashboard/parent", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
