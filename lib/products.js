// Reads and derived metrics for the three products beyond Opaque.
//
// Opaque keeps its own lib/data.js — it's older, bigger and has its own shape.
// Everything here follows the same pattern: fetch the raw collections, then
// derive in plain functions so a page can stay declarative.
import { db } from "./firebase";

/* ── helpers ─────────────────────────────────────────────────────────── */
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
