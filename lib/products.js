// Reads and derived metrics for the three products beyond Opaque.
//
// Opaque keeps its own lib/data.js — it's older, bigger and has its own shape.
// Everything here follows the same pattern: fetch the raw collections, then
// derive in plain functions so a page can stay declarative.
import { db } from "./firebase";

/* ── helpers ─────────────────────────────────────────────────────────── */
import { toUSD } from "./money";

const rows = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
const ms = (t) => (t?.toMillis ? t.toMillis() : t ? new Date(t).getTime() : 0);
const dayKey = (t) => (ms(t) ? new Date(ms(t)).toISOString().slice(0, 10) : null);

/** Counts per day for the last `days`, oldest first — chart-ready. */
export function daily(items, field, days = 30) {
  const out = new Map();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.set(d.toISOString().slice(0, 10), 0);
  }
  for (const it of items) {
    const k = dayKey(it[field]);
    if (k && out.has(k)) out.set(k, out.get(k) + 1);
  }
  return [...out].map(([name, value]) => ({ name: name.slice(5), value }));
}

export const countBy = (items, key, limit = 12) => {
  const m = new Map();
  for (const it of items) {
    const v = typeof key === "function" ? key(it) : it[key];
    if (v === undefined || v === null || v === "") continue;
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name: String(name), value }));
};

export const fmtN = (v) =>
  v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : String(Math.round(v ?? 0));

export const ago = (t) => {
  const n = ms(t);
  if (!n) return "—";
  const s = Math.floor((Date.now() - n) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const when = (t) => (ms(t) ? new Date(ms(t)).toLocaleString() : "—");

/* ── OAISIS Labs — the TikTok scheduler ──────────────────────────────── */
export async function oaisisLabs() {
  const d = db("oaisislabs");
  const [posts, users] = await Promise.all([
    d.collection("posts").get().then(rows),
    d.collection("users").get().then(rows),
  ]);

  const by = (s) => posts.filter((p) => p.status === s);
  const delivered = posts.filter((p) => p.deliveredAt);
  const photo = posts.filter((p) => p.mediaType === "PHOTO");

  // How long TikTok took between accepting a post and confirming delivery.
  const lags = delivered
    .map((p) => (ms(p.deliveredAt) - ms(p.postedAt)) / 1000)
    .filter((n) => n > 0 && n < 86400);
  const medianLag = lags.length ? lags.sort((a, b) => a - b)[Math.floor(lags.length / 2)] : null;

  return {
    posts,
    users,
    acquisition: acquisitionOf(users),
    new7d: newSince(users, 7),
    kpis: {
      users: users.length,
      posts: posts.length,
      posted: by("posted").length,
      scheduled: by("scheduled").length,
      failed: by("failed").length,
      drafts: by("draft").length,
      delivered: delivered.length,
      slideshows: photo.length,
      medianLag,
      direct: posts.filter((p) => p.mode === "direct").length,
      inbox: posts.filter((p) => p.mode === "inbox").length,
    },
    byStatus: countBy(posts, "status"),
    byPrivacy: countBy(posts, "privacy"),
    perDay: daily(posts, "createdAt"),
    failures: by("failed").map((p) => ({ id: p.id, name: p.name, error: p.error, at: p.postedAt })),
  };
}

/* ── OAISIS Transcriber ──────────────────────────────────────────────── */
export async function oaisisTranscriber() {
  const d = db("oaisis");
  // 3.5k+ transcriptions: pull a recent window rather than the whole history.
  const [users, transcriptions, optimizations] = await Promise.all([
    d.collection("users").get().then(rows),
    d.collection("transcriptions").orderBy("timestamp", "desc").limit(2000).get().then(rows),
    d.collection("optimizations").orderBy("timestamp", "desc").limit(500).get().then(rows),
  ]);

  const seconds = transcriptions.reduce((a, t) => a + (t.audioDurationSeconds ?? 0), 0);
  const words = users.reduce((a, u) => a + (u.totalWordsTranscribed ?? 0), 0);
  const pro = users.filter((u) => u.isProMember);
  const active = users.filter((u) => Date.now() - ms(u.lastLogin) < 7 * 864e5);

  const perUser = [...users]
    .map((u) => ({
      id: u.id,
      name: u.name || "—",
      email: u.email || "—",
      pro: !!u.isProMember,
      words: u.totalWordsTranscribed ?? 0,
      opts: u.totalOptimizations ?? 0,
      wordsCycle: u.wordsUsedThisCycle ?? 0,
      created: u.dateCreated,
      last: u.lastLogin,
      transcriptions: transcriptions.filter((t) => t.uid === u.id).length,
    }))
    .sort((a, b) => b.words - a.words);

  return {
    users,
    transcriptions,
    optimizations,
    acquisition: acquisitionOf(users),
    new7d: newSince(users, 7),
    kpis: {
      users: users.length,
      pro: pro.length,
      proRate: users.length ? pro.length / users.length : 0,
      active7d: active.length,
      transcriptions: transcriptions.length,
      optimizations: optimizations.length,
      hours: seconds / 3600,
      words,
      avgClipS: transcriptions.length ? seconds / transcriptions.length : 0,
    },
    perDay: daily(transcriptions, "timestamp"),
    optsPerDay: daily(optimizations, "timestamp"),
    perUser,
    recent: transcriptions.slice(0, 40),
    recentOpts: optimizations.slice(0, 30),
  };
}

/* ── FAIKE ───────────────────────────────────────────────────────────── */
export async function faike() {
  const d = db("faike");
  const [users, sessions, events] = await Promise.all([
    d.collection("users").get().then(rows),
    d.collection("sessions").orderBy("started_at", "desc").limit(500).get().then(rows),
    d.collection("events").orderBy("ts", "desc").limit(1000).get().then(rows),
  ]);

  const scans = (u) => (u.scans_image ?? 0) + (u.scans_text ?? 0) + (u.scans_fact_check ?? 0);
  const totalScans = users.reduce((a, u) => a + scans(u), 0);
  const converted = users.filter((u) => u.paywall_converted);
  const sawPaywall = users.filter((u) => (u.paywall_views ?? 0) > 0);
  const durations = sessions.map((s) => s.duration_s ?? 0).filter(Boolean).sort((a, b) => a - b);

  // ── Money ──────────────────────────────────────────────────────────────
  // The charged price and its currency live on the purchase event, not the
  // user doc. Normalise to USD before summing: a GBP 19.99 is not $19.99.
  const LIST = { monthly: 3.99, yearly: 19.99 };
  const purchases = events
    .filter((e) => e.name === "purchase_success")
    .map((e) => {
      const q = e.params || {};
      const native = typeof q.price === "number" ? q.price : LIST[q.plan] || 0;
      return { uid: e.uid, at: ms(e.ts), plan: q.plan || "unknown", native,
               currency: q.currency || "USD", amountUSD: toUSD(native, q.currency || "USD"),
               estimated: false };
    });
  const priced = new Set(purchases.map((x) => x.uid));
  for (const u of users) {
    if (!u.paywall_converted || priced.has(u.id) || !u.converted_at) continue;
    const plan = u.conversion_plan || u.sub_plan || "monthly";
    purchases.push({ uid: u.id, at: ms(u.converted_at), plan, native: LIST[plan] || LIST.monthly,
                     currency: "USD", amountUSD: LIST[plan] || LIST.monthly, estimated: true });
  }
  purchases.sort((a, b) => (b.at || 0) - (a.at || 0));

  const TOKEN = { "gpt-4o": { in: 2.5, out: 10 }, "gpt-4o-mini": { in: 0.15, out: 0.6 } };
  const FALLBACK = { fact_check: 0.04, image: 0.012, text: 0.005, follow_up: 0.002 };
  const withTokens = new Set(users.filter((u) => (u.api_calls || 0) > 0).map((u) => u.id));
  let cost = 0;
  for (const e of events) {
    if (e.name !== "api_usage") continue;
    const q = e.params || {};
    if (q.endpoint === "whisper") { cost += 0.006; continue; }
    const pr = TOKEN[q.model] || TOKEN["gpt-4o"];
    cost += ((q.tokens_in || 0) / 1e6) * pr.in + ((q.tokens_out || 0) / 1e6) * pr.out;
    if (q.web_search) cost += 0.025;
  }
  for (const u of users) {
    if (withTokens.has(u.id)) continue;
    cost += (u.scans_fact_check || 0) * FALLBACK.fact_check + (u.scans_image || 0) * FALLBACK.image
          + (u.scans_text || 0) * FALLBACK.text + (u.follow_up_taps || 0) * FALLBACK.follow_up;
  }
  const revenue = purchases.reduce((a, x) => a + x.amountUSD, 0);

  // ── Scan feed ──────────────────────────────────────────────────────────
  // scan_started carries what went IN (voice? image? how long?), scan_completed
  // carries what came OUT (verdict, score, sources). They are separate events,
  // so pair each completion with the nearest preceding start by the same user.
  const starts = events
    .filter((e) => e.name === "scan_started")
    .map((e) => ({ uid: e.uid, at: ms(e.ts), p: e.params || {} }))
    .sort((a, b) => a.at - b.at);

  const startFor = (uid, at, durationMs) => {
    let best = null;
    for (const st of starts) {
      if (st.uid !== uid || st.at > at) continue;
      const gap = at - st.at;
      // A start belongs to this completion if it sits within the scan's own
      // duration plus a little slack — not just "most recent by this user".
      if (gap <= (durationMs || 0) + 20000 && (!best || st.at > best.at)) best = st;
    }
    return best;
  };

  // Queries live on the user doc, not the event, so they can only be matched by
  // user + kind, newest-first. Good enough to show what a person was checking.
  const queuePerUser = {};
  for (const u of users) {
    queuePerUser[u.id] = {
      fact_check: [...(u.fact_check_queries ?? [])].reverse(),
      text: [...(u.text_check_queries ?? [])].reverse(),
    };
  }

  const MODE_LABEL = {
    fact_check: "Fact check",
    image: "AI image detection",
    text: "AI text detection",
  };

  const scanFeed = events
    .filter((e) => e.name === "scan_completed" || e.name === "scan_failed")
    .map((e) => ({ e, at: ms(e.ts) }))
    .sort((a, b) => b.at - a.at)
    .slice(0, 80)
    .map(({ e, at }) => {
      const q = e.params || {};
      const st = startFor(e.uid, at, q.duration_ms);
      const mode = q.mode || st?.p.mode || "?";
      const queue = queuePerUser[e.uid];
      // Pop the next unused query of that kind for this user.
      let text = null;
      if (queue && (mode === "fact_check" || mode === "text") && queue[mode]?.length) {
        text = queue[mode].shift();
      }
      return {
        uid: e.uid,
        at,
        failed: e.name === "scan_failed",
        mode,
        modeLabel: MODE_LABEL[mode] || mode,
        verdict: q.verdict || (e.name === "scan_failed" ? "failed" : "—"),
        score: q.score,
        sources: q.sources_count,
        durationMs: q.duration_ms,
        reason: q.reason,
        // What went in, from the paired scan_started.
        input: st
          ? {
              hasImage: !!st.p.has_image,
              usedVoice: !!st.p.used_voice,
              chars: st.p.chars ?? null,
              isPro: !!st.p.is_pro,
              scansUsed: st.p.scans_used ?? null,
            }
          : null,
        text,
      };
    });

  // Every query people actually typed — the product's real demand signal.
  const queries = users.flatMap((u) => [
    ...(u.fact_check_queries ?? []).map((q) => ({ q, kind: "fact check", uid: u.id })),
    ...(u.text_check_queries ?? []).map((q) => ({ q, kind: "text check", uid: u.id })),
  ]);

  return {
    users,
    sessions,
    events,
    queries,
    purchases,
    acquisition: acquisitionOf(users),
    new7d: newSince(users, 7),
    scanFeed,
    money: { revenue, cost, pnl: revenue - cost },
    kpis: {
      users: users.length,
      sessions: sessions.length,
      events: events.length,
      scans: totalScans,
      scansPerUser: users.length ? totalScans / users.length : 0,
      sawPaywall: sawPaywall.length,
      converted: converted.length,
      convRate: sawPaywall.length ? converted.length / sawPaywall.length : 0,
      ranOut: users.filter((u) => u.ran_out_of_scans).length,
      medianSessionS: durations.length ? durations[Math.floor(durations.length / 2)] : 0,
    },
    scanMix: [
      { name: "fact check", value: users.reduce((a, u) => a + (u.scans_fact_check ?? 0), 0) },
      { name: "image", value: users.reduce((a, u) => a + (u.scans_image ?? 0), 0) },
      { name: "text", value: users.reduce((a, u) => a + (u.scans_text ?? 0), 0) },
    ].filter((s) => s.value > 0),
    byEvent: countBy(events, "name"),
    byCountry: countBy(sessions, "country", 8),
    byDevice: countBy(sessions, "device_model", 8),
    byVersion: countBy(sessions, "app_version", 5),
    perDay: daily(sessions, "started_at"),
    perUser: [...users]
      .map((u) => ({
        id: u.id,
        scans: scans(u),
        image: u.scans_image ?? 0,
        text: u.scans_text ?? 0,
        fact: u.scans_fact_check ?? 0,
        paywallViews: u.paywall_views ?? 0,
        converted: !!u.paywall_converted,
        ranOut: !!u.ran_out_of_scans,
        device: u.device || "—",
        os: u.os || "—",
        created: u.created_at,
        last: u.last_active,
      }))
      .sort((a, b) => b.scans - a.scans),
  };
}

// ── FAIKE drill-down ────────────────────────────────────────────────────────
// Sessions carry a `journey` array of step strings like
// "paywall_shown[first_launch]" — that IS the ordered trajectory, so the
// session page reads it directly rather than re-deriving one from events.

const faikeScans = (u) =>
  (u.scans_image ?? 0) + (u.scans_text ?? 0) + (u.scans_fact_check ?? 0);

/** Split "paywall_shown[first_launch]" into { step, detail }. */
export const parseStep = (s) => {
  const m = String(s).match(/^([^[]+)(?:\[(.*)\])?$/);
  return { step: m ? m[1] : String(s), detail: m && m[2] ? m[2] : null };
};

export async function faikeUser(uid) {
  const d = db("faike");
  const [userDoc, sessSnap, evSnap] = await Promise.all([
    d.collection("users").doc(uid).get(),
    d.collection("sessions").where("uid", "==", uid).limit(500).get(),
    d.collection("events").where("uid", "==", uid).limit(2000).get(),
  ]);
  if (!userDoc.exists) return null;

  const user = { id: userDoc.id, ...userDoc.data() };
  const sessions = rows(sessSnap).sort((a, b) => ms(b.started_at) - ms(a.started_at));
  const events = rows(evSnap).sort((a, b) => ms(b.ts) - ms(a.ts));

  const purchase = events.find((e) => e.name === "purchase_success");
  const revenue = purchase
    ? toUSD(purchase.params?.price ?? 0, purchase.params?.currency ?? "USD")
    : user.paywall_converted
      ? ({ yearly: 19.99, monthly: 3.99 }[user.conversion_plan || user.sub_plan || "monthly"] ?? 3.99)
      : 0;

  const FALLBACK = { fact_check: 0.04, image: 0.012, text: 0.005, follow_up: 0.002 };
  let cost = 0;
  const apiEvents = events.filter((e) => e.name === "api_usage");
  if (apiEvents.length) {
    for (const e of apiEvents) {
      const q = e.params || {};
      if (q.endpoint === "whisper") { cost += 0.006; continue; }
      const pr = q.model === "gpt-4o-mini" ? { in: 0.15, out: 0.6 } : { in: 2.5, out: 10 };
      cost += ((q.tokens_in || 0) / 1e6) * pr.in + ((q.tokens_out || 0) / 1e6) * pr.out;
      if (q.web_search) cost += 0.025;
    }
  } else {
    cost = (user.scans_fact_check || 0) * FALLBACK.fact_check
         + (user.scans_image || 0) * FALLBACK.image
         + (user.scans_text || 0) * FALLBACK.text
         + (user.follow_up_taps || 0) * FALLBACK.follow_up;
  }

  return {
    user,
    sessions,
    events,
    scans: faikeScans(user),
    money: { revenue, cost, pnl: revenue - cost },
    queries: [
      ...(user.fact_check_queries ?? []).map((q) => ({ q, kind: "fact check" })),
      ...(user.text_check_queries ?? []).map((q) => ({ q, kind: "text check" })),
    ],
  };
}

export async function faikeSession(id) {
  const d = db("faike");
  const doc = await d.collection("sessions").doc(id).get();
  if (!doc.exists) return null;
  const s = { id: doc.id, ...doc.data() };

  // Events the same user fired inside this session's window — gives each
  // journey step its real timestamp and params.
  const from = ms(s.started_at);
  const to = ms(s.last_event_at || s.ended_at) || from + 6 * 3600e3;
  const evSnap = await d.collection("events").where("uid", "==", s.uid).limit(2000).get();
  const events = rows(evSnap)
    .filter((e) => { const t = ms(e.ts); return t >= from - 2000 && t <= to + 2000; })
    .sort((a, b) => ms(a.ts) - ms(b.ts));

  return { session: s, events };
}

// ── Acquisition ─────────────────────────────────────────────────────────────
// "When do I gain users" — the one series every product should have. Products
// disagree about the signup field name, so try each in turn.

const CREATED_FIELDS = [
  "created_at", "firstSeenAt", "createdAt", "dateCreated",
  "firstSeenDay", "onboardedAt", "signupAt", "dateJoined",
];

const signupDay = (u) => {
  for (const f of CREATED_FIELDS) {
    const v = u[f];
    if (!v) continue;
    const t = ms(v);
    if (t) return new Date(t).toLocaleDateString("en-CA");
  }
  return null;
};

/** [{ day, newUsers, total }] — the shape AcquisitionChart wants. */
export function acquisitionOf(list, days = 45) {
  const byDay = new Map();
  for (const u of list) {
    const d = signupDay(u);
    if (d) byDay.set(d, (byDay.get(d) || 0) + 1);
  }
  const sorted = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  let cum = 0;
  return sorted.map(([day, n]) => { cum += n; return { day, newUsers: n, total: cum }; }).slice(-days);
}

export const newSince = (list, n) =>
  list.filter((u) => {
    const d = signupDay(u);
    return d && Date.now() - Date.parse(d) < n * 864e5;
  }).length;

// ── FAIKE scan history ──────────────────────────────────────────────────────
// The full record of each scan, written by the app (ScanArchive) and by the
// one-time backfill of what each install already had stored locally.
// Everything needed to rebuild the result screen lives in one document.

const MODE_LABELS = {
  fact_check: "Fact check",
  image: "AI image detection",
  text: "AI text detection",
  link: "Link check",
};

/** One Firestore doc -> the shape every scan view uses. */
function mapScan(d) {
  return {
    id: d.id,
    itemId: d.item_id,
    uid: d.uid,
    at: ms(d.at),
    mode: d.mode || "?",
    modeLabel: MODE_LABELS[d.mode] || d.mode || "?",
    preview: d.preview || "",
    text: d.text || "",
    question: d.question || "",
    score: d.score,
    verdict: d.verdict || "—",
    reason: d.reason || "",
    detail: d.detail || "",
    sources: d.sources || [],
    sourcesCount: d.sources_count ?? (d.sources || []).length,
    criteria: d.criteria || [],
    followUps: (d.follow_ups || [])
      .map((f) => ({ ...f, at: ms(f.at) }))
      .sort((a, b) => a.at - b.at),
    imagePath: d.image_path || null,
    hadImage: !!d.had_image,
    usedVoice: !!d.used_voice,
    durationMs: d.duration_ms ?? null,
    passes: d.passes ?? null,
    divergence: d.divergence ?? null,
    isPro: !!d.is_pro,
    backfilled: !!d.backfilled,
  };
}

export async function faikeScanHistory({ limit = 200 } = {}) {
  try {
    const snap = await db("faike")
      .collection("scan_history")
      .orderBy("at", "desc")
      .limit(limit)
      .get();
    return { scans: snap.docs.map((d) => mapScan({ id: d.id, ...d.data() })), ready: true };
  } catch {
    // Collection does not exist yet, or its index is still building.
    return { scans: [], ready: false };
  }
}

export async function faikeScan(docId) {
  const doc = await db("faike").collection("scan_history").doc(docId).get();
  if (!doc.exists) return null;
  return mapScan({ id: doc.id, ...doc.data() });
}

// ── Sessions <-> scans ──────────────────────────────────────────────────────
// Scans do not carry a session id yet, so pair them by user and time: a scan
// belongs to the session whose window it falls inside. Works for backfilled
// records too, which never had a session to belong to in the first place.

export function attachScans(sessions, scans) {
  return sessions.map((s) => {
    const from = ms(s.started_at);
    const to = ms(s.last_event_at || s.ended_at) || from + 6 * 3600e3;
    const mine = scans
      .filter((x) => x.uid === s.uid && x.at >= from - 2000 && x.at <= to + 2000)
      .sort((a, b) => a.at - b.at);
    return { ...s, scans: mine };
  });
}
