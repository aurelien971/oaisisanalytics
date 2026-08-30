// Everything is private. Unauthenticated requests land on /login, and are sent
// back where they were going once they're in.
import { NextResponse } from "next/server";
import { COOKIE, sessionToken, safeEqual } from "./lib/auth";

export async function middleware(req) {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/login" || pathname === "/api/auth") return NextResponse.next();

  const cookie = req.cookies.get(COOKIE)?.value ?? "";
  if (safeEqual(cookie, await sessionToken())) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Guard every page and API route; leave Next's own assets alone.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
