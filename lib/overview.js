// The combined view: every product's users and, where it exists, its money.
//
// A note on honesty. Opaque and FAIKE both have a real P&L. Opaque stores
// revenue and spend on the user doc; FAIKE logs the charged price AND currency
// onto its purchase_success event (this file previously claimed FAIKE's price
// was not stored — it is, just on the event rather than the user doc).
// OAISIS knows who is a pro member and keeps a Stripe customer id but no
// amounts; OAISIS Labs is free and tracks nothing.
//
// Rather than multiply a guessed price by a headcount and call it revenue, this
// reports what each product actually knows and marks the rest `tracked: false`.
// A blank is honest; an invented number is not.
import { db } from "./firebase";
import { faikeMoney, toUSD } from "./money";

// async, so a missing service account (db() throws synchronously) becomes a
// rejection the caller can .catch() — otherwise it escapes Promise.all and
// takes down the whole overview.
const all = async (product, col) =>
  (await db(product).collection(col).get()).docs.map((d) => d.data());

export async function overview() {
  const [opaqueUsers, labsUsers, oaisisUsers, faikeUsers, faike,
         surrenderUsers, surrenderEvents, complainrUsers, complainrEvents,
         hineniUsers] = await Promise.all([
    all("opaque", "users").catch(() => []),
    all("oaisislabs", "users").catch(() => []),
    all("oaisis", "users").catch(() => []),
    all("faike", "users").catch(() => []),
    faikeMoney().catch(() => null),
    all("surrender", "users").catch(() => []),
    all("surrender", "events").catch(() => []),
    all("complainr", "users").catch(() => []),
    all("complainr", "events").catch(() => []),
    // No service account for Hineni yet; an empty list is the honest answer.
    all("hineni", "users").catch(() => null),
  ]);

  /** Completed purchases, priced in USD. Zero purchases is a real number, not a gap. */
  const purchasesFrom = (events, eventName) =>
    events
      .filter((e) => e.name === eventName)
      .map((e) => {
        const q = e.params || {};
        const native = typeof q.price === "number" ? q.price : 0;
        return { uid: e.uid, amountUSD: toUSD(native, q.currency || "USD") };
      });

  // Signups per day, last 30 days — products disagree on the field name, so try
  // each one. This is the "when do I gain users" series.
  const CREATED = ["created_at", "firstSeenAt", "createdAt", "firstSeenDay", "onboardedAt", "signupAt"];
  const dayOf = (u) => {
    for (const f of CREATED) {
      const v = u[f];
      if (!v) continue;
      const t = v?.toMillis ? v.toMillis() : typeof v === "string" ? Date.parse(v) : 0;
      if (t) return new Date(t).toLocaleDateString("en-CA");
    }
    return null;
  };
  const days = Array.from({ length: 30 }, (_, i) =>
    new Date(Date.now() - (29 - i) * 864e5).toLocaleDateString("en-CA"));
  const signupSeries = (list) => {
    const by = {};
    for (const u of list) { const d = dayOf(u); if (d) by[d] = (by[d] || 0) + 1; }
    return days.map((d) => ({ date: d, label: d.slice(5), count: by[d] || 0 }));
  };
  const newSince = (list, n) =>
    list.filter((u) => { const d = dayOf(u); return d && Date.now() - Date.parse(d) < n * 864e5; }).length;

  // Products disagree about how they store "last seen": Opaque writes a
  // yyyy-mm-dd day key, the others write a Timestamp. Accept both.
  const active = (list, field, days = 30) =>
    list.filter((u) => {
      const v = u[field];
      const t = v?.toMillis ? v.toMillis() : typeof v === "string" ? Date.parse(v) : 0;
      return t && Date.now() - t < days * 864e5;
    }).length;

  const opaqueRevenue = opaqueUsers.reduce((s, u) => s + (u.revenueUSD || 0), 0);
  const opaqueSpend = opaqueUsers.reduce((s, u) => s + (u.spendUSD || 0), 0);

  const products = [
    {
      slug: "opaque",
      signups: signupSeries(opaqueUsers),
      new7d: newSince(opaqueUsers, 7),
      new30d: newSince(opaqueUsers, 30),
      name: "Opaque",
      logo: "/logos/opaque.png",
      users: opaqueUsers.length,
      active: active(opaqueUsers, "lastSeenDay"),
      paying: opaqueUsers.filter((u) => (u.revenueUSD || 0) > 0).length,
      revenue: opaqueRevenue,
      cost: opaqueSpend,
      tracked: true,
      note: "Revenue and API cost recorded per user.",
    },
    {
      slug: "oaisislabs",
      signups: signupSeries(labsUsers),
      new7d: newSince(labsUsers, 7),
      new30d: newSince(labsUsers, 30),
      name: "OAISIS Labs",
      logo: "/logos/oaisislabs.svg",
      users: labsUsers.length,
      active: null,
      paying: labsUsers.filter((u) => u.plan && u.plan !== "free").length,
      revenue: null,
      cost: null,
      tracked: false,
      note: "Free while in beta — no billing to report.",
    },
    {
      slug: "oaisis",
      signups: signupSeries(oaisisUsers),
      new7d: newSince(oaisisUsers, 7),
      new30d: newSince(oaisisUsers, 30),
      name: "OAISIS",
      logo: "/logos/oaisis.png",
      users: oaisisUsers.length,
      active: active(oaisisUsers, "lastLogin"),
      paying: oaisisUsers.filter((u) => u.isProMember).length,
      revenue: null,
      cost: null,
      tracked: false,
      note: "Pro members known, Stripe amounts not stored here.",
    },
    {
      slug: "faike",
      signups: signupSeries(faikeUsers),
      new7d: newSince(faikeUsers, 7),
      new30d: newSince(faikeUsers, 30),
      name: "FAIKE",
      logo: "/logos/faike.png",
      users: faikeUsers.length,
      active: active(faikeUsers, "last_active"),
      paying: faikeUsers.filter((u) => u.paywall_converted).length,
      revenue: faike ? faike.revenue : null,
      cost: faike ? faike.cost : null,
      tracked: !!faike,
      note: faike
        ? "Charged price and currency read from the purchase event."
        : "Could not read the FAIKE event log.",
      lastEventAt: faike ? faike.lastEventAt : null,
      tokens: faikeUsers.reduce((s, u) => s + (u.api_tokens_in || 0) + (u.api_tokens_out || 0), 0),
      apiCalls: faikeUsers.reduce((s, u) => s + (u.api_calls || 0), 0),
    },
    {
      slug: "surrender",
      signups: signupSeries(surrenderUsers),
      new7d: newSince(surrenderUsers, 7),
      new30d: newSince(surrenderUsers, 30),
      name: "Surrender",
      logo: "/logos/surrender.png",
      users: surrenderUsers.length,
      active: active(surrenderUsers, "last_seen"),
      paying: new Set(purchasesFrom(surrenderEvents, "purchase_succeeded").map((x) => x.uid)).size,
      revenue: purchasesFrom(surrenderEvents, "purchase_succeeded").reduce((s2, x) => s2 + x.amountUSD, 0),
      // Everything is generated on device, so there is no API bill to net off.
      cost: 0,
      tracked: true,
      note: "Charged price and currency read from purchase_succeeded. No API spend — generation is on device.",
    },
    {
      slug: "complainr",
      signups: signupSeries(complainrUsers),
      new7d: newSince(complainrUsers, 7),
      new30d: newSince(complainrUsers, 30),
      name: "Complainr",
      logo: "/logos/complainr.png",
      users: complainrUsers.length,
      active: active(complainrUsers, "lastSeen"),
      paying: new Set(purchasesFrom(complainrEvents, "purchase_completed").map((x) => x.uid)).size,
      revenue: purchasesFrom(complainrEvents, "purchase_completed").reduce((s2, x) => s2 + x.amountUSD, 0),
      cost: null,
      tracked: true,
      note: "Paywall is instrumented; no purchase has completed yet. User docs carry no created date, so signups cannot be dated.",
    },
    {
      slug: "hineni",
      signups: signupSeries(hineniUsers || []),
      new7d: 0,
      new30d: 0,
      name: "Hineni",
      logo: "/logos/hineni.png",
      users: (hineniUsers || []).length,
      active: null,
      paying: 0,
      revenue: null,
      cost: null,
      tracked: false,
      note: hineniUsers === null
        ? "No service account yet — set HINENI_SERVICE_ACCOUNT_B64 to bring it online."
        : "Connected, nothing recorded yet.",
    },
  ];

  // One row per day, one column per product — the stacked signup chart.
  const acquisition = days.map((d) => {
    const row = { day: d };
    for (const prod of products) {
      row[prod.slug] = prod.signups.find((x) => x.date === d)?.count ?? 0;
    }
    return row;
  });


  const users = products.reduce((s, p) => s + p.users, 0);
  const paying = products.reduce((s, p) => s + p.paying, 0);

  return {
    products,
    acquisition,
    totals: {
      users,
      paying,
      payRate: users ? paying / users : 0,
      revenue: opaqueRevenue + (faike?.revenue || 0),
      cost: opaqueSpend + (faike?.cost || 0),
      pnl: opaqueRevenue + (faike?.revenue || 0) - opaqueSpend - (faike?.cost || 0),
      new7d: products.reduce((s2, p) => s2 + (p.new7d || 0), 0),
      new30d: products.reduce((s2, p) => s2 + (p.new30d || 0), 0),
      // How much of the estate the money figures actually cover.
      coveredUsers: opaqueUsers.length + (faike ? faikeUsers.length : 0),
      coverage: users ? (opaqueUsers.length + (faike ? faikeUsers.length : 0)) / users : 0,
    },
  };
}

export const usd = (v) =>
  v === null || v === undefined
    ? "—"
    : `${v < 0 ? "-" : ""}$${Math.abs(v).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
