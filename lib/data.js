// All Firestore reads + aggregations. Every page calls these on the server.
// Collections written by the iOS app (Services/Metrics.swift):
//   events/{auto}    { uid, type, day "YYYY-MM-DD", ts, ...params }
//   users/{uid}      profile + lifetime aggregates
//   filterStats/{id} { name, kind, taps, applies, saves }
//   prompts/{auto}   { uid, text, day, ts }
//   pongScores/{uid} { name, timeSeconds }
import { db } from "./firebase";

const EVENT_LIMIT = 20000;

export async function getUsers() {
  const snap = await db().collection("users").get();
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

export async function getEvents() {
  const snap = await db().collection("events").orderBy("ts", "desc").limit(EVENT_LIMIT).get();
  return snap.docs.map((d) => {
    const x = d.data();
    return { ...x, tsMs: x.ts?.toMillis?.() ?? null, ts: undefined };
  });
}

export async function getFilterStats() {
  const snap = await db().collection("filterStats").get();
  return snap.docs.map((d) => ({ id: d.id, taps: 0, applies: 0, saves: 0, bookmarks: 0, ...d.data() }));
}

export async function getPrompts(limit = 300) {
  const snap = await db().collection("prompts").orderBy("ts", "desc").limit(limit).get();
  return snap.docs.map((d) => {
    const x = d.data();
    return { uid: x.uid, text: x.text, day: x.day };
  });
}

export async function getPongTop(limit = 10) {
  // One doc per player, best run only; higher score = better (winners ≥ 300000).
  const snap = await db().collection("pongScores").orderBy("score", "desc").limit(limit).get();
  return snap.docs.map((d) => d.data());
}

// ── Aggregations ────────────────────────────────────────────────────────────

export function dailySeries(events, days = 30) {
  const byDay = new Map();
  for (const e of events) {
    if (!e.day) continue;
    if (!byDay.has(e.day)) byDay.set(e.day, { day: e.day, uids: new Set(), gens: 0, cost: 0, saves: 0, prompts: 0 });
    const row = byDay.get(e.day);
    row.uids.add(e.uid);
    if (e.type === "generation_completed") { row.gens += 1; row.cost += e.costUSD || 0; }
    if (e.type === "edit_saved") row.saves += 1;
    if (e.type === "custom_prompt") row.prompts += 1;
  }
  return [...byDay.values()]
    .map((r) => ({ day: r.day, dau: r.uids.size, gens: r.gens, cost: +r.cost.toFixed(2), saves: r.saves, prompts: r.prompts }))
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-days);
}

export function totals(users, events) {
  const spend = users.reduce((s, u) => s + (u.spendUSD || 0), 0);
  const revenue = users.reduce((s, u) => s + (u.revenueUSD || 0), 0);
  const gens = users.reduce((s, u) => s + (u.generations || 0), 0);
  const saves = users.reduce((s, u) => s + (u.saves || 0), 0);
  const genEvents = events.filter((e) => e.type === "generation_completed");
  const adminCost = genEvents.filter((e) => e.admin).reduce((s, e) => s + (e.costUSD || 0), 0);
  const n = users.length || 1;
  return {
    users: users.length,
    spendUSD: spend,
    revenueUSD: revenue,
    pnlUSD: revenue - spend,
    adminCostUSD: adminCost,
    generations: gens,
    saves,
    saveRate: gens ? saves / gens : 0,
    avgSpendPerUser: spend / n,
    avgRevenuePerUser: revenue / n,
    avgPnlPerUser: (revenue - spend) / n,
    avgGensPerUser: gens / n,
  };
}

export function engineSplit(events) {
  const map = new Map();
  for (const e of events) {
    if (e.type !== "generation_completed") continue;
    const k = e.engine || "unknown";
    if (!map.has(k)) map.set(k, { engine: k, count: 0, cost: 0, seconds: 0 });
    const r = map.get(k);
    r.count += 1; r.cost += e.costUSD || 0; r.seconds += e.seconds || 0;
  }
  return [...map.values()].map((r) => ({
    engine: r.engine, count: r.count,
    cost: +r.cost.toFixed(2),
    avgCost: r.count ? +(r.cost / r.count).toFixed(4) : 0,
    avgSeconds: r.count ? Math.round(r.seconds / r.count) : 0,
  }));
}

// Interest vs usage: eye-catchers get tapped a lot but rarely applied.
export function filterInsights(stats) {
  const withRates = stats.map((f) => ({
    ...f,
    applyRate: f.taps ? f.applies / f.taps : 0,
    saveRate: f.applies ? (f.saves || 0) / f.applies : 0,
  }));
  return {
    popular: [...withRates].sort((a, b) => b.applies - a.applies).slice(0, 20),
    eyeCatchers: withRates.filter((f) => f.taps >= 5 && f.applyRate < 0.35)
      .sort((a, b) => b.taps - a.taps).slice(0, 20),
    keepers: withRates.filter((f) => f.applies >= 3)
      .sort((a, b) => b.saveRate - a.saveRate).slice(0, 20),
  };
}

// Funnel: session → filter tap → apply → generation → save.
export function funnel(events) {
  const c = (t) => events.filter((e) => e.type === t).length;
  return [
    { step: "Sessions", n: c("session_start") },
    { step: "Filter taps", n: c("filter_tap") },
    { step: "Applies", n: c("filter_apply") },
    { step: "Generations", n: c("generation_completed") },
    { step: "Saves", n: c("edit_saved") },
  ];
}

// Paywall funnel.
export function paywallFunnel(events) {
  const c = (t) => events.filter((e) => e.type === t).length;
  return [
    { step: "Shown", n: c("paywall_shown") },
    { step: "Plan selected", n: c("paywall_selected") },
    { step: "Purchase intent", n: c("paywall_purchase_intent") },
    { step: "Dismissed", n: c("paywall_dismissed") },
  ];
}

// D1 / D7 / D30 retention from first-seen cohorts + event activity days.
export function retention(users, events) {
  const activityByUid = new Map();
  for (const e of events) {
    if (!e.uid || !e.day) continue;
    if (!activityByUid.has(e.uid)) activityByUid.set(e.uid, new Set());
    activityByUid.get(e.uid).add(e.day);
  }
  const dayMs = 86400000;
  const today = new Date();
  const parse = (s) => new Date(`${s}T00:00:00Z`);
  const windows = [ { label: "D1", from: 1, to: 1 }, { label: "D7", from: 1, to: 7 }, { label: "D30", from: 1, to: 30 } ];

  return windows.map(({ label, from, to }) => {
    let eligible = 0, retained = 0;
    for (const u of users) {
      if (!u.firstSeenDay) continue;
      const first = parse(u.firstSeenDay);
      const age = Math.floor((today - first) / dayMs);
      if (age < to) continue;                       // cohort too young for this window
      eligible += 1;
      const days = activityByUid.get(u.uid) || new Set();
      for (let d = from; d <= to; d++) {
        const dd = new Date(first.getTime() + d * dayMs).toISOString().slice(0, 10);
        if (days.has(dd)) { retained += 1; break; }
      }
    }
    return { label, eligible, retained, rate: eligible ? retained / eligible : 0 };
  });
}

export function demographics(users) {
  const gender = {};
  const ages = { "≤17": 0, "18–24": 0, "25–34": 0, "35–44": 0, "45+": 0, unknown: 0 };
  for (const u of users) {
    const g = u.gender || "unknown";
    gender[g] = (gender[g] || 0) + 1;
    const a = u.age;
    if (a == null) ages.unknown += 1;
    else if (a <= 17) ages["≤17"] += 1;
    else if (a <= 24) ages["18–24"] += 1;
    else if (a <= 34) ages["25–34"] += 1;
    else if (a <= 44) ages["35–44"] += 1;
    else ages["45+"] += 1;
  }
  return {
    gender: Object.entries(gender).map(([k, v]) => ({ name: k, value: v })),
    ages: Object.entries(ages).map(([k, v]) => ({ name: k, value: v })),
  };
}

// Which filters each demographic actually applies — feeds re-ranking decisions.
export function filterByDemographic(users, events) {
  const profile = new Map(users.map((u) => [u.uid, u]));
  const seg = (u) => {
    if (!u) return "unknown";
    const g = u.gender || "?";
    const a = u.age == null ? "?" : u.age <= 24 ? "18–24" : u.age <= 34 ? "25–34" : "35+";
    return `${g} · ${a}`;
  };
  const map = new Map();
  for (const e of events) {
    if (e.type !== "filter_apply" || !e.filterId) continue;
    const s = seg(profile.get(e.uid));
    if (!map.has(s)) map.set(s, new Map());
    const inner = map.get(s);
    inner.set(e.filterName || e.filterId, (inner.get(e.filterName || e.filterId) || 0) + 1);
  }
  return [...map.entries()].map(([segment, filters]) => ({
    segment,
    top: [...filters.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([name, n]) => ({ name, n })),
  })).sort((a, b) => b.top.reduce((s, t) => s + t.n, 0) - a.top.reduce((s, t) => s + t.n, 0));
}

// ── Live-console additions ──────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().slice(0, 10);

// New signups, newest first, with millisecond timestamps for precise display.
export function signups(users) {
  return users
    .map((u) => ({ uid: u.uid, name: u.name || null, country: u.country || null,
                   plan: u.plan || "none",
                   firstMs: u.firstSeenAt?.toMillis?.() ?? null, firstDay: u.firstSeenDay || null }))
    .filter((u) => u.firstMs || u.firstDay)
    .sort((a, b) => (b.firstMs || 0) - (a.firstMs || 0));
}

export function todayPulse(users, events) {
  const today = todayStr();
  const todayEvents = events.filter((e) => e.day === today);
  const newUsers = users.filter((u) => u.firstSeenDay === today);
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: `${String(h).padStart(2, "0")}h`, events: 0 }));
  for (const e of todayEvents) {
    if (!e.tsMs) continue;
    hours[new Date(e.tsMs).getHours()].events += 1;
  }
  return {
    newUsers,
    events: todayEvents.length,
    gens: todayEvents.filter((e) => e.type === "generation_completed").length,
    revenue: todayEvents.filter((e) => e.type === "revenue").reduce((s, e) => s + (e.usd || 0), 0),
    cost: todayEvents.filter((e) => e.type === "generation_completed").reduce((s, e) => s + (e.costUSD || 0), 0),
    hours,
  };
}

// Latest events for the live feed — compact, pre-classified.
export function recentEvents(events, n = 40) {
  const classify = (t) => {
    if (t === "session_start") return "user";
    if (t.startsWith("generation")) return "gen";
    if (t === "revenue" || t === "credit_consumed" || t === "free_edit_consumed") return "money";
    if (t.startsWith("paywall")) return "pay";
    return "";
  };
  const detail = (e) => {
    if (e.filterName) return e.filterName;
    if (e.plan) return e.plan;
    if (e.usd != null) return `$${Number(e.usd).toFixed(2)}`;
    if (e.hero) return e.hero;
    if (e.action) return e.action;
    return "";
  };
  return events.slice(0, n).map((e) => ({
    type: e.type, cls: classify(e.type), uid: (e.uid || "").slice(0, 6),
    detail: detail(e), tsMs: e.tsMs,
  }));
}

export const fmtTime = (ms) => {
  if (!ms) return "—";
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

export const fmtUSD = (n) => `$${(n || 0).toFixed(2)}`;
export const fmtPct = (n) => `${((n || 0) * 100).toFixed(0)}%`;

// ── Acquisition, cohorts, sessions ──────────────────────────────────────────

// New users per day (from users.firstSeenDay), with cumulative total.
export function acquisitionSeries(users, days = 45) {
  const byDay = new Map();
  for (const u of users) {
    if (!u.firstSeenDay) continue;
    byDay.set(u.firstSeenDay, (byDay.get(u.firstSeenDay) || 0) + 1);
  }
  const sorted = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  let cum = 0;
  const all = sorted.map(([day, n]) => { cum += n; return { day, newUsers: n, total: cum }; });
  return all.slice(-days);
}

// Weekly cohorts: rows = the week a user first appeared, columns = weeks since,
// cells = % of that cohort active in that week. Activity comes from
// users.activeDays (new app versions) with events as fallback for old data.
export function cohortMatrix(users, events, maxWeeks = 8) {
  const week = (day) => {
    const d = new Date(day + "T00:00:00Z");
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return monday.toISOString().slice(0, 10);
  };
  const activeDays = new Map(); // uid → Set(day)
  for (const u of users) {
    const set = new Set(u.activeDays || []);
    if (u.firstSeenDay) set.add(u.firstSeenDay);
    if (u.lastSeenDay) set.add(u.lastSeenDay);
    activeDays.set(u.uid, set);
  }
  for (const e of events) {
    if (!e.uid || !e.day) continue;
    if (!activeDays.has(e.uid)) activeDays.set(e.uid, new Set());
    activeDays.get(e.uid).add(e.day);
  }
  const cohorts = new Map(); // cohortWeek → { size, weeks: Map(offset → Set(uid)) }
  for (const u of users) {
    if (!u.firstSeenDay) continue;
    const cw = week(u.firstSeenDay);
    if (!cohorts.has(cw)) cohorts.set(cw, { week: cw, uids: new Set(), weeks: new Map() });
    const c = cohorts.get(cw);
    c.uids.add(u.uid);
    const cwMs = new Date(cw + "T00:00:00Z").getTime();
    for (const day of activeDays.get(u.uid) || []) {
      const off = Math.floor((new Date(day + "T00:00:00Z").getTime() - cwMs) / (7 * 86400e3));
      if (off >= 0 && off < maxWeeks) {
        if (!c.weeks.has(off)) c.weeks.set(off, new Set());
        c.weeks.get(off).add(u.uid);
      }
    }
  }
  return [...cohorts.values()]
    .sort((a, b) => a.week.localeCompare(b.week))
    .map((c) => ({
      week: c.week,
      size: c.uids.size,
      cells: Array.from({ length: maxWeeks }, (_, i) =>
        c.weeks.has(i) ? c.weeks.get(i).size / c.uids.size : (i === 0 ? 1 : null)),
    }));
}

// Session trajectories (written by the app's ScreenLog).
export async function getSessions(limit = 150) {
  const snap = await db().collection("sessions").orderBy("start", "desc").limit(limit).get();
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      uid: x.uid,
      day: x.day,
      startMs: x.start?.toMillis?.() ?? null,
      duration: x.duration || 0,
      screens: x.screens || [],
      device: x.device || "?",
      ios: x.ios || "?",
      appVersion: x.appVersion || "?",
    };
  });
}
