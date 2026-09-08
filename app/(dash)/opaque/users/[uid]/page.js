// One user: who they are, what they cost, and every session they've had.
// Click a session to see the screens in order.
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser, getUserSessions, getEvents, userEvents, fmtUSD, fmtTime } from "@/lib/data";

export const dynamic = "force-dynamic";

const mmss = (sec) => {
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return m ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
};

export default async function OpaqueUser({ params }) {
  const { uid } = params;
  const [user, sessions, events] = await Promise.all([getUser(uid), getUserSessions(uid), getEvents()]);
  if (!user) notFound();

  const mine = userEvents(events, uid);
  const revenue = user.revenueUSD || 0;
  const spend = user.spendUSD || 0;

  return (
    <>
      <div className="pagehead">
        <h1>{user.name || uid.slice(0, 8)}</h1>
        <span className="sub mono">{uid}</span>
        <Link className="tile-link" href="/opaque/users">← All users</Link>
      </div>

      <div className="kpis">
        <div className="kpi good"><div className="v">{fmtUSD(revenue)}</div><div className="l">Revenue</div></div>
        <div className="kpi bad"><div className="v">{fmtUSD(spend)}</div><div className="l">API cost</div></div>
        <div className={`kpi ${revenue - spend >= 0 ? "good" : "bad"}`}>
          <div className="v">{fmtUSD(revenue - spend)}</div><div className="l">P&amp;L</div>
        </div>
        <div className="kpi"><div className="v">{sessions.length}</div><div className="l">Sessions</div></div>
        <div className="kpi"><div className="v">{user.generations ?? 0}</div><div className="l">Generations</div></div>
        <div className="kpi"><div className="v">{user.saves ?? 0}</div><div className="l">Saves</div></div>
        <div className="kpi"><div className="v">{user.plan || "free"}</div><div className="l">Plan</div></div>
        <div className="kpi"><div className="v">{user.country || "—"}</div><div className="l">Country</div></div>
      </div>

      <h2>Sessions</h2>
      <div className="panel flush">
        {sessions.length === 0 ? (
          <div className="mono muted" style={{ padding: 16 }}>
            No session trajectories for this user — they start once they&apos;re on the
            app version with screen tracking.
          </div>
        ) : (
          <table>
            <thead>
              <tr><th>When</th><th>Length</th><th>Screens</th><th>Route</th><th>Device</th></tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td className="mono">
                    <Link href={`/opaque/sessions/${s.id}`}>
                      {s.day} {s.startMs ? fmtTime(s.startMs) : ""}
                    </Link>
                  </td>
                  <td className="mono muted">{mmss(s.duration)}</td>
                  <td className="mono muted">{s.screens.length}</td>
                  <td className="mono muted">
                    {s.screens.slice(0, 6).map((x) => x.s).join(" → ")}
                    {s.screens.length > 6 ? " →…" : ""}
                  </td>
                  <td className="mono muted">{s.device} · iOS {s.ios}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2>Raw events</h2>
      <div className="panel flush">
        {mine.length === 0 ? (
          <div className="mono muted" style={{ padding: 16 }}>Nothing in the last event window.</div>
        ) : (
          <table>
            <thead><tr><th>When</th><th>Event</th><th>Detail</th></tr></thead>
            <tbody>
              {mine.map((e, i) => (
                <tr key={i}>
                  <td className="mono muted">{e.day} {e.tsMs ? fmtTime(e.tsMs) : ""}</td>
                  <td className="mono">{e.type}</td>
                  <td className="mono muted">{e.filterName || e.kind || e.action || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
