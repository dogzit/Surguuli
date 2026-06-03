import { NextResponse, type NextRequest } from "next/server";

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

  // 2. /dashboard/admin өөрийн PIN gate-тэй учир middleware-аар шалгахгүй
  if (pathname.startsWith("/dashboard/admin")) {
    return NextResponse.next();
  }

  const hasSession = !!req.cookies.get(SESSION_COOKIE)?.value;

  // 3. Хэрэв нэвтрээгүй бөгөөд dashboard руу орох гэж байвал -> login руу шид
  if (pathname.startsWith("/dashboard") && !hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 4. Хэрэв аль хэдийн нэвтэрсэн бөгөөд login хуудас руу орох гэж байвал -> dashboard руу шид
  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
