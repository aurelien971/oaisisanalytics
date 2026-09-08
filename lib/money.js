// Money, in one place.
//
// The App Store charges in the customer's local currency, so a raw price is
// meaningless without its currency code. Everything here normalises to USD
// before anything is added up.
//
// FAIKE deserves a note. This file used to say FAIKE had no revenue because
// "price per conversion is not stored". That was wrong: the app logs the real
// charged price AND its currency onto the purchase_success event
// (params.price, params.currency) — it just never wrote them onto the user doc,
// which is where the old code looked. FAIKE has a real P&L; it was hiding in
// the event log.
import { db } from "./firebase";

// Hand-maintained. App Store Connect remains the source of truth for payouts.
const USD_PER = {
  USD: 1, GBP: 1.27, EUR: 1.08, CAD: 0.74, AUD: 0.66, JPY: 0.0064, CHF: 1.12,
  SEK: 0.095, NOK: 0.094, DKK: 0.145, PLN: 0.25, BRL: 0.185, MXN: 0.055,
  INR: 0.012, SGD: 0.74, NZD: 0.61, ZAR: 0.055, TRY: 0.029,
};

export const toUSD = (amount, currency) => {
  if (!amount) return 0;
  const rate = USD_PER[String(currency || "USD").toUpperCase()];
  return rate == null ? Number(amount) : Number(amount) * rate;
};

// List prices, used only for conversions logged before prices were recorded.
const FAIKE_LIST = { monthly: 3.99, yearly: 19.99 };

// OpenAI list prices per million tokens.
const TOKEN_PRICES = { "gpt-4o": { in: 2.5, out: 10 }, "gpt-4o-mini": { in: 0.15, out: 0.6 } };
const WHISPER_PER_CALL = 0.006;
const WEB_SEARCH_PER_CALL = 0.025;

function apiEventCost(p = {}) {
  if (p.endpoint === "whisper") return WHISPER_PER_CALL;
  const prices = TOKEN_PRICES[p.model] || TOKEN_PRICES["gpt-4o"];
  let c = ((p.tokens_in || 0) / 1e6) * prices.in + ((p.tokens_out || 0) / 1e6) * prices.out;
  if (p.web_search) c += WEB_SEARCH_PER_CALL;
  return c;
}

const iso = (v) => (v && typeof v.toDate === "function" ? v.toDate().toISOString() : v || null);

/**
 * FAIKE's real money, read from the event log.
 * Returns purchases with their true charged amount, plus API spend.
 */
export async function faikeMoney() {
  const [uSnap, eSnap] = await Promise.all([
    db("faike").collection("users").limit(5000).get(),
    db("faike").collection("events").limit(20000).get(),
  ]);

  const users = uSnap.docs.filter((d) => d.id !== "keys").map((d) => ({ uid: d.id, ...d.data() }));
  const events = eSnap.docs.map((d) => d.data()).map((e) => ({ ...e, at: iso(e.ts) || iso(e.client_ts) }));

  const purchases = events
    .filter((e) => e.name === "purchase_success")
    .map((e) => {
      const p = e.params || {};
      const native = typeof p.price === "number" ? p.price : FAIKE_LIST[p.plan] || 0;
      const currency = p.currency || "USD";
      return { uid: e.uid, at: e.at, plan: p.plan || "unknown", native, currency,
               amountUSD: toUSD(native, currency), estimated: false };
    });

  // Conversions from builds that predate purchase event logging: we know they
  // converted and when, but not what they paid. Priced at list and flagged.
  const known = new Set(purchases.map((p) => p.uid));
  for (const u of users) {
    if (!u.paywall_converted || known.has(u.uid) || !u.converted_at) continue;
    const plan = u.conversion_plan || u.sub_plan || "monthly";
    purchases.push({
      uid: u.uid, at: iso(u.converted_at), plan,
      native: FAIKE_LIST[plan] || FAIKE_LIST.monthly, currency: "USD",
      amountUSD: FAIKE_LIST[plan] || FAIKE_LIST.monthly, estimated: true,
    });
  }

  // Real token spend where the app logged it, per-scan estimate where it didn't.
  const withTokens = new Set(users.filter((u) => (u.api_calls || 0) > 0).map((u) => u.uid));
  const FALLBACK = { fact_check: 0.04, image: 0.012, text: 0.005, follow_up: 0.002 };
  let cost = 0;
  for (const e of events) if (e.name === "api_usage") cost += apiEventCost(e.params);
  for (const u of users) {
    if (withTokens.has(u.uid)) continue;
    cost += (u.scans_fact_check || 0) * FALLBACK.fact_check
          + (u.scans_image || 0) * FALLBACK.image
          + (u.scans_text || 0) * FALLBACK.text
          + (u.follow_up_taps || 0) * FALLBACK.follow_up;
  }

  return {
    users,
    purchases,
    revenue: purchases.reduce((s, p) => s + p.amountUSD, 0),
    cost,
    lastEventAt: events.reduce((m, e) => (e.at && e.at > m ? e.at : m), "") || null,
  };
}

export const usd = (v) =>
  v === null || v === undefined
    ? "—"
    : `${v < 0 ? "-" : ""}$${Math.abs(v).toLocaleString(undefined, {
        minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
