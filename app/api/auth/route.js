import { NextResponse } from "next/server";
import { COOKIE, sessionToken, safeEqual } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req) {
  const { password } = await req.json().catch(() => ({}));
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "No password is configured on the server." }, { status: 500 });
  }
  if (!safeEqual(String(password ?? ""), expected)) {
    // Deliberately slow: makes guessing at scale unattractive.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
