// The combined view: every product's users and, where it exists, its money.
//
// A note on honesty. Only Opaque stores per-user revenue and spend, so only
// Opaque has a real P&L. OAISIS knows who is a pro member and keeps a Stripe
// customer id but no amounts; FAIKE knows who converted and how many API tokens
// were burned but not at what price; OAISIS Labs is free and tracks nothing.
//
// Rather than multiply a guessed price by a headcount and call it revenue, this
// reports what each product actually knows and marks the rest `tracked: false`.
// A blank is honest; an invented number is not.
import { db } from "./firebase";

const all = (product, col) => db(product).collection(col).get().then((s) => s.docs.map((d) => d.data()));

export async function overview() {
  const [opaqueUsers, labsUsers, oaisisUsers, faikeUsers] = await Promise.all([
    all("opaque", "users").catch(() => []),
    all("oaisislabs", "users").catch(() => []),
    all("oaisis", "users").catch(() => []),
    all("faike", "users").catch(() => []),
  ]);

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
      name: "FAIKE",
      logo: "/logos/faike.png",
      users: faikeUsers.length,
      active: active(faikeUsers, "last_active"),
      paying: faikeUsers.filter((u) => u.paywall_converted).length,
      revenue: null,
      cost: null,
      tracked: false,
      note: "Conversions known, price per conversion not stored.",
      tokens: faikeUsers.reduce((s, u) => s + (u.api_tokens_in || 0) + (u.api_tokens_out || 0), 0),
      apiCalls: faikeUsers.reduce((s, u) => s + (u.api_calls || 0), 0),
    },
  ];

  const users = products.reduce((s, p) => s + p.users, 0);
  const paying = products.reduce((s, p) => s + p.paying, 0);

  return {
    products,
    totals: {
      users,
      paying,
      payRate: users ? paying / users : 0,
      revenue: opaqueRevenue,
      cost: opaqueSpend,
      pnl: opaqueRevenue - opaqueSpend,
      // How much of the estate the money figures actually cover.
      coveredUsers: opaqueUsers.length,
      coverage: users ? opaqueUsers.length / users : 0,
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
