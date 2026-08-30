// Everything is private. Unauthenticated requests land on /login, and are sent
// back where they were going once they're in.
import { NextResponse } from "next/server";
import { COOKIE, sessionToken, safeEqual } from "./lib/auth";

export async function middleware(req) {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/login" || pathname === "/api/auth") return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";

  let expected;
  try {
    expected = await sessionToken();
  } catch {
    // AUTH_SECRET missing. Say so on the login page rather than 500-ing every
    // route — a blank 500 tells you nothing about which variable is absent.
    url.search = "?e=config";
    return NextResponse.redirect(url);
  }

  const cookie = req.cookies.get(COOKIE)?.value ?? "";
  if (safeEqual(cookie, expected)) return NextResponse.next();

  url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Guard every page and API route; leave Next's own assets alone.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
