import Link from "next/link";
// Sessions: every user visit as a trajectory — which screens, in order, and
// how long on each. Data comes from sessions/{id} written by the app's
// ScreenLog (app version with screen tracking and newer).
import { getSessions, getUsers, fmtTime } from "@/lib/data";
import { AutoRefresh } from "@/components/Live";

export const dynamic = "force-dynamic";

const COLORS = {
  Home: "#C8E6CC", Editor: "#D9D6EF", Paywall: "#EDC7B9", Pong: "#8A8A8F",
  Settings: "#7a86a0", Onboarding: "#9d6ae5", "Sign in": "#7a86a0",
  Studio: "#38b6c9", "Magic Eraser": "#e05587", "Blur Lab": "#5aa0f2",
  "Custom Edit": "#2fae8f", "Create Filter": "#b7791f", "Video Look": "#8f5ae5",
};
const color = (s) => COLORS[s] || "#556077";

const mmss = (sec) => {
  const m = Math.floor(sec / 60), s = sec % 60;
  return m ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
};

export default async function Sessions() {
  const [sessions, users] = await Promise.all([getSessions(), getUsers()]);
  const nameOf = new Map(users.map((u) => [u.uid, u.name || u.uid.slice(0, 6)]));

  return (
    <>
      <AutoRefresh seconds={30} />
      <div className="pagehead">
        <h1>Sessions</h1>
        <span className="mono muted">{sessions.length} most recent · trajectories logged from the screen-tracking app version onward</span>
      </div>

      {sessions.length === 0 && (
        <div className="panel mono muted">
          No session trajectories yet — they start arriving once users are on the
          app version with screen tracking.
        </div>
      )}

      {sessions.map((s) => {
        const total = Math.max(s.screens.reduce((a, x) => a + (x.d || 0), 0), 1);
        return (
          <div className="panel" key={s.id} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "baseline", flexWrap: "wrap" }}>
              <b><Link href={`/opaque/users/${s.uid}`}>{nameOf.get(s.uid) || s.uid.slice(0, 6)}</Link></b>
              <Link className="mono" href={`/opaque/sessions/${s.id}`}>open →</Link>
              <span className="mono muted">
                {s.day} {s.startMs ? fmtTime(s.startMs) : ""} · {mmss(s.duration)} ·{" "}
                {s.screens.length} screen{s.screens.length === 1 ? "" : "s"} · {s.device} · iOS {s.ios} · v{s.appVersion}
              </span>
            </div>

            {/* Trajectory bar: one segment per screen span, width = share of session */}
            <div style={{ display: "flex", height: 26, borderRadius: 8, overflow: "hidden", marginTop: 12, border: "1px solid #232833" }}>
              {s.screens.map((x, i) => (
                <div
                  key={i}
                  title={`${x.s} — ${mmss(x.d)} (at ${mmss(x.at)})`}
                  style={{
                    width: `${Math.max((x.d / total) * 100, 1.2)}%`,
                    background: color(x.s),
                    borderRight: "1px solid rgba(0,0,0,0.35)",
                  }}
                />
              ))}
            </div>

            {/* Step list: the same trajectory in words */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {s.screens.map((x, i) => (
                <span key={i} className="chip mono" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: color(x.s), display: "inline-block" }} />
                  {x.s} <em style={{ color: "#8b93a5", fontStyle: "normal" }}>{mmss(x.d)}</em>
                  {i < s.screens.length - 1 ? <span style={{ color: "#3a4150" }}>→</span> : null}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
