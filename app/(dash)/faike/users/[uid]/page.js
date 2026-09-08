// One install: their money, their sessions, what they typed, what they did.
import Link from "next/link";
import { notFound } from "next/navigation";
import { faikeUser, ago, when } from "@/lib/products";
import { usd } from "@/lib/money";

export const dynamic = "force-dynamic";

const mmss = (s) => {
  s = Math.round(s || 0);
  const m = Math.floor(s / 60);
  return m ? `${m}m ${String(s % 60).padStart(2, "0")}s` : `${s}s`;
};

export default async function FaikeUser({ params }) {
  const data = await faikeUser(params.uid);
  if (!data) notFound();
  const { user, sessions, events, scans, money, queries } = data;

  return (
    <>
      <div className="pagehead">
        <h1>{params.uid.slice(0, 8)}</h1>
        <span className="sub mono">{params.uid}</span>
        <Link className="tile-link" href="/faike/users">← All users</Link>
      </div>

      <div className="kpis">
        <div className="kpi good"><div className="n">{usd(money.revenue)}</div><div className="l">Revenue</div></div>
        <div className="kpi bad"><div className="n">{usd(money.cost)}</div><div className="l">API cost</div></div>
        <div className={money.pnl >= 0 ? "kpi good" : "kpi bad"}><div className="n">{usd(money.pnl)}</div><div className="l">P&amp;L</div></div>
        <div className="kpi"><div className="n">{scans}</div><div className="l">Scans</div></div>
        <div className="kpi"><div className="n">{sessions.length}</div><div className="l">Sessions</div></div>
        <div className="kpi"><div className="n">{user.paywall_views ?? 0}</div><div className="l">Paywall views</div></div>
        <div className="kpi"><div className="n">{user.paywall_converted ? "yes" : "no"}</div><div className="l">Converted</div></div>
        <div className="kpi"><div className="n">{user.device || "—"}</div><div className="l">Device</div></div>
      </div>

      <h2>Sessions</h2>
      <div className="panel flush">
        {sessions.length === 0 ? <div className="empty">No sessions recorded.</div> : (
          <table>
            <thead><tr><th>When</th><th className="num">Length</th><th className="num">Steps</th><th>Journey</th><th>Where</th></tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td className="mono"><Link href={`/faike/sessions/${s.id}`}>{when(s.started_at)}</Link></td>
                  <td className="num mono muted">{mmss(s.duration_s)}</td>
                  <td className="num mono muted">{(s.journey || []).length}</td>
                  <td className="mono muted">
                    {(s.journey || []).slice(0, 5).join(" → ")}{(s.journey || []).length > 5 ? " →…" : ""}
                  </td>
                  <td className="muted mono">{[s.city, s.country].filter(Boolean).join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {queries.length > 0 && (
        <>
          <h2>What they typed</h2>
          <div className="panel flush">
            <table>
              <thead><tr><th>Kind</th><th>Query</th></tr></thead>
              <tbody>
                {queries.map((q, i) => (
                  <tr key={i}><td className="mono muted">{q.kind}</td><td>{q.q}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2>Raw events</h2>
      <div className="panel flush">
        <table>
          <thead><tr><th>When</th><th>Event</th><th>Detail</th></tr></thead>
          <tbody>
            {events.slice(0, 150).map((e, i) => (
              <tr key={i}>
                <td className="mono muted">{ago(e.ts)}</td>
                <td className="mono">{e.name}</td>
                <td className="mono muted">
                  {e.params ? Object.entries(e.params).slice(0, 4).map(([k, v]) => `${k}=${v}`).join(" · ") : "—"}
                </td>
              </tr>
            ))}
            {!events.length && <tr><td colSpan={3} className="empty">No events.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
