// One line per product for the hub — and it is the SAME line for every product.
//
// This used to show whatever each product happened to count: users for Opaque,
// posts for Labs, transcriptions for OAISIS, users for FAIKE. Four different
// units side by side, which made the hub impossible to read as a portfolio.
// Now every product answers the same two questions: how many users, and did it
// make or lose money.
import { db } from "./firebase";
import { faikeMoney } from "./money";

const count = async (product, collection) => {
  try {
    return (await db(product).collection(collection).count().get()).data().count;
  } catch {
    return null;
  }
};

const fmt = (v) => (v === null ? "—" : v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v));

export async function headline() {
  const [opaqueUsers, labsUsers, oaisisUsers, faikeUsers, opaqueMoney, faike] = await Promise.all([
    count("opaque", "users"),
    count("oaisislabs", "users"),
    count("oaisis", "users"),
    count("faike", "users"),
    opaqueMoneyTotals(),
    faikeMoney().catch(() => null),
  ]);

  return {
    opaque: {
      value: fmt(opaqueUsers), label: "users",
      pnl: opaqueMoney ? opaqueMoney.revenue - opaqueMoney.cost : null,
    },
    // Free in beta and no API spend recorded — nothing to report rather than a
    // fabricated zero.
    oaisislabs: { value: fmt(labsUsers), label: "users", pnl: null },
    // Pro members are known; Stripe amounts live in Stripe, not here.
    oaisis: { value: fmt(oaisisUsers), label: "users", pnl: null },
    faike: {
      value: fmt(faikeUsers), label: "users",
      pnl: faike ? faike.revenue - faike.cost : null,
    },
  };
}

async function opaqueMoneyTotals() {
  try {
    const snap = await db("opaque").collection("users").get();
    const users = snap.docs.map((d) => d.data());
    return {
      revenue: users.reduce((s, u) => s + (u.revenueUSD || 0), 0),
      cost: users.reduce((s, u) => s + (u.spendUSD || 0), 0),
    };
  } catch {
    return null;
  }
}
