import { NextResponse, type NextRequest } from "next/server";

// The public site has no sign-in: visitors, students and parents all see the
// same pages, and staff use the separate staff site. Middleware only
// forwards old bookmarks.

// Staff pages moved to the staff site.
const STAFF_SITE_URL = (process.env.NEXT_PUBLIC_STAFF_SITE_URL ?? "").replace(/\/$/, "");
const STAFF_PATHS = [
  "/dashboard/admin",
  "/dashboard/teacher",
  "/dashboard/accountant",
  "/dashboard/duty",
  "/dashboard/settings",
];

function under(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (STAFF_SITE_URL && STAFF_PATHS.some((p) => under(pathname, p))) {
    return NextResponse.redirect(`${STAFF_SITE_URL}${pathname}${search}`);
  }

  // Student/parent login and dashboards were removed.
  if (under(pathname, "/login") || under(pathname, "/dashboard")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login/:path*", "/dashboard/:path*"],
};
