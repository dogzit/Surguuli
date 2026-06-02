import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin";

const SESSION_COOKIE = "session_uid";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Статик файлууд болон API-г алгасах (loop үүсэхээс сэргийлнэ)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const hasSession = !!req.cookies.get(SESSION_COOKIE)?.value;
  const hasAdminSession = !!req.cookies.get(ADMIN_COOKIE)?.value;
  const isAuthenticated = hasSession || hasAdminSession;

  // 2. Хэрэв нэвтрээгүй бөгөөд dashboard руу орох гэж байвал -> login руу шид
  if (pathname.startsWith("/dashboard") && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 3. Хэрэв аль хэдийн нэвтэрсэн бөгөөд login хуудас руу орох гэж байвал -> dashboard руу шид
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
