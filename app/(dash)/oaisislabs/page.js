import { oaisisLabs, fmtN, ago, when } from "@/lib/products";
import { SimpleBars, Line1 as Line } from "@/components/Charts";

export const dynamic = "force-dynamic";

export default async function OaisisLabs() {
  const { kpis: k, byStatus, byPrivacy, perDay, failures, posts } = await oaisisLabs();
  const recent = [...posts].sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)).slice(0, 15);

  return (
    <>
      <div className="pagehead"><h1>OAISIS Labs</h1><span className="sub">TikTok scheduling · project oaisislabs</span></div>

      <div className="kpis">
        <div className="kpi"><div className="n">{k.users}</div><div className="l">Accounts</div></div>
        <div className="kpi"><div className="n">{k.posts}</div><div className="l">Posts total</div></div>
        <div className="kpi good"><div className="n">{k.posted}</div><div className="l">Posted</div></div>
        <div className="kpi"><div className="n">{k.scheduled}</div><div className="l">Scheduled</div></div>
        <div className={failures.length ? "kpi bad" : "kpi"}><div className="n">{k.failed}</div><div className="l">Failed</div></div>
        <div className="kpi"><div className="n">{k.drafts}</div><div className="l">Drafts</div></div>
        <div className="kpi"><div className="n">{k.delivered}</div><div className="l">Confirmed delivered</div></div>
        <div className="kpi"><div className="n">{k.slideshows}</div><div className="l">Slideshows</div></div>
        <div className="kpi"><div className="n">{k.medianLag !== null ? `${Math.round(k.medianLag / 60)}m` : "—"}</div><div className="l">Median delivery lag</div></div>
        <div className="kpi hi"><div className="n">{k.direct}</div><div className="l">Direct posts</div></div>
        <div className="kpi"><div className="n">{k.inbox}</div><div className="l">Inbox drafts</div></div>
      </div>

      {failures.length > 0 && (
        <>
          <h2>Failures — read these first</h2>
          <div className="panel">
            <table><thead><tr><th>Post</th><th>Why TikTok refused it</th></tr></thead>
              <tbody>{failures.map((f) => (
                <tr key={f.id}><td className="mono">{f.name}</td><td className="bad-text">{f.error || "—"}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      <h2>Posts created per day</h2>
      <div className="panel"><Line data={perDay} dataKey="value" nameKey="name" height={180} /></div>

      <div className="grid2">
        <div><h2>By status</h2><div className="panel"><SimpleBars data={byStatus} dataKey="value" nameKey="name" height={Math.max(120, byStatus.length * 34)} /></div></div>
        <div><h2>By privacy</h2><div className="panel"><SimpleBars data={byPrivacy} dataKey="value" nameKey="name" color="#60a5fa" height={Math.max(120, byPrivacy.length * 34)} /></div></div>
      </div>

      <h2>Recent posts</h2>
      <div className="panel">
        <table className="mono">
          <thead><tr><th>Name</th><th>Status</th><th>Mode</th><th>Privacy</th><th>Created</th><th>Delivered</th></tr></thead>
          <tbody>{recent.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td><span className={`pill ${p.status === "posted" ? "ok" : p.status === "failed" ? "new" : ""}`}>{p.status}</span></td>
              <td>{p.mode || "—"}</td>
              <td>{p.privacy || "—"}</td>
              <td className="ts">{ago(p.createdAt)}</td>
              <td className="ts">{p.deliveredAt ? when(p.deliveredAt) : "—"}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}
