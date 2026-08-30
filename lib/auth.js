// One password for the whole dashboard, held in a signed cookie.
//
// No user accounts, no database: the cookie's value is an HMAC of a fixed
// string under AUTH_SECRET. Anyone holding the password can mint it; nobody can
// forge it without the secret. Rotating AUTH_SECRET signs everyone out.
// Uses Web Crypto so the same code runs in middleware (Edge) and in routes.
export const COOKIE = "oaisis_session";

export async function sessionToken() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set.");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("oaisis-analytics-v1"));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time compare, so a wrong password can't be found a byte at a time. */
export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
