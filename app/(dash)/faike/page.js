import Icon from "@/components/Icon";
import { bySlug } from "@/lib/catalog";
import { faike, fmtN, ago } from "@/lib/products";
import { usd } from "@/lib/money";
import { SimpleBars, Line1 as Line, AcquisitionChart } from "@/components/Charts";
import { C } from "@/lib/palette";

export const dynamic = "force-dynamic";

export default async function Faike() {
  const p = bySlug("faike");
  const { kpis: k, scanMix, byEvent, byCountry, byDevice, perDay, perUser, queries, money , acquisition, new7d } = await faike();

  return (
    <>
      <div className="pagehead">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.logo} alt="" /><h1>{p.name}</h1><span className="sub">{p.what}</span><a className="tile-link" href={p.link} target="_blank" rel="noreferrer"><Icon name="link" size={13} />{p.linkLabel}</a></div><p className="pageabout">{p.about}</p>

      <div className="kpis">
        <div className="kpi"><div className="n">{usd(money.revenue)}</div><div className="l">Revenue</div></div>
        <div className="kpi"><div className="n" style={{ color: "#f87171" }}>{usd(money.cost)}</div><div className="l">API cost</div></div>
        <div className={money.pnl >= 0 ? "kpi good" : "kpi bad"}><div className="n">{usd(money.pnl)}</div><div className="l">P&amp;L</div></div>
        <div className="kpi"><div className="n">{k.users}</div><div className="l">Users</div></div>
        <div className="kpi"><div className="n">{k.sessions}</div><div className="l">Sessions</div></div>
        <div className="kpi"><div className="n">{fmtN(k.scans)}</div><div className="l">Scans</div></div>
        <div className="kpi"><div className="n">{k.scansPerUser.toFixed(1)}</div><div className="l">Scans / user</div></div>
        <div className="kpi"><div className="n">{Math.round(k.medianSessionS)}s</div><div className="l">Median session</div></div>
        <div className="kpi"><div className="n">{k.sawPaywall}</div><div className="l">Saw paywall</div></div>
        <div className={k.converted ? "kpi good" : "kpi bad"}><div className="n">{k.converted}</div><div className="l">Converted</div></div>
        <div className="kpi"><div className="n">{(k.convRate * 100).toFixed(0)}%</div><div className="l">Paywall conversion</div></div>
        <div className="kpi"><div className="n">{k.ranOut}</div><div className="l">Ran out of scans</div></div>
      </div>

      <h2>New users per day</h2>
      <div className="panel">
        <AcquisitionChart data={acquisition} />
        <div className="mono muted" style={{ marginTop: 8 }}>{new7d} in the last 7 days</div>
      </div>

      <h2>Sessions per day</h2>
      <div className="panel"><Line data={perDay} dataKey="value" nameKey="name" height={180} /></div>

      <div className="grid2">
        <div><h2>What they scan</h2><div className="panel"><SimpleBars data={scanMix} dataKey="value" nameKey="name" height={Math.max(120, scanMix.length * 34)} /></div></div>
        <div><h2>Events</h2><div className="panel"><SimpleBars data={byEvent} dataKey="value" nameKey="name" color={C.s2} height={Math.max(120, byEvent.length * 30)} /></div></div>
      </div>

      <div className="grid2">
        <div><h2>Where</h2><div className="panel"><SimpleBars data={byCountry} dataKey="value" nameKey="name" height={Math.max(120, byCountry.length * 32)} /></div></div>
        <div><h2>Device</h2><div className="panel"><SimpleBars data={byDevice} dataKey="value" nameKey="name" color={C.s2} height={Math.max(120, byDevice.length * 32)} /></div></div>
      </div>

      <h2>Every query typed</h2>
      <p className="sub">{queries.length} in total — the feature requests nobody filed.</p>
      <div className="panel feedlist">
        {queries.length === 0 && <div className="empty">Nothing yet.</div>}
        {queries.slice(0, 60).map((q, i) => (
          <div className="evt" key={i}>
            <span className="mono muted">{q.kind}</span>
            <span className="t">{q.q}</span>
          </div>
        ))}
      </div>

      <h2>Users, heaviest first</h2>
      <div className="panel">
        <table className="mono">
          <thead><tr><th>User</th><th className="num">Scans</th><th className="num">Fact</th><th className="num">Image</th><th className="num">Text</th><th className="num">Paywall</th><th>Paid</th><th>Device</th><th>Last</th></tr></thead>
          <tbody>{perUser.slice(0, 40).map((u) => (
            <tr key={u.id}>
              <td className="muted">{u.id.slice(0, 8)}</td>
              <td className="num">{u.scans}</td>
              <td className="num">{u.fact}</td>
              <td className="num">{u.image}</td>
              <td className="num">{u.text}</td>
              <td className="num">{u.paywallViews}</td>
              <td>{u.converted ? <span className="pill ok">yes</span> : u.ranOut ? <span className="pill new">ran out</span> : "—"}</td>
              <td>{u.device} {u.os}</td>
              <td className="ts">{ago(u.last)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}
