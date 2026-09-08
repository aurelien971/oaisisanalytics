// The money: what was charged, and what the paywall did to get there.
import Link from "next/link";
import { faike, ago } from "@/lib/products";
import { usd } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function FaikeRevenue() {
  const { money, purchases, kpis: k, events, users } = await faike();

  // Which trigger showed the paywall, and which one actually converted.
  const triggers = {};
  for (const e of events) {
    if (e.name === "paywall_shown") {
      const t = e.params?.trigger || "unknown";
      (triggers[t] ??= { trigger: t, shows: 0, conversions: 0 }).shows++;
    }
    if (e.name === "purchase_success") {
      const t = e.params?.trigger || "unknown";
      (triggers[t] ??= { trigger: t, shows: 0, conversions: 0 }).conversions++;
    }
  }
  const rows = Object.values(triggers).sort((a, b) => b.shows - a.shows);

  const funnel = [
    { stage: "Installed", n: users.length },
    { stage: "Saw paywall", n: k.sawPaywall },
    { stage: "Ran out of scans", n: k.ranOut },
    { stage: "Converted", n: k.converted },
  ];

  return (
    <>
      <div className="pagehead"><h1>Revenue</h1><span className="sub mono">amounts normalised to USD</span></div>

      <div className="kpis">
        <div className="kpi good"><div className="n">{usd(money.revenue)}</div><div className="l">Revenue</div></div>
        <div className="kpi bad"><div className="n">{usd(money.cost)}</div><div className="l">API cost</div></div>
        <div className={money.pnl >= 0 ? "kpi good" : "kpi bad"}><div className="n">{usd(money.pnl)}</div><div className="l">P&amp;L</div></div>
        <div className="kpi"><div className="n">{k.converted}</div><div className="l">Conversions</div></div>
        <div className="kpi"><div className="n">{(k.convRate * 100).toFixed(0)}%</div><div className="l">Of those who saw it</div></div>
      </div>

      <h2>Purchases</h2>
      <div className="panel flush">
        {purchases.length === 0 ? <div className="empty">No purchases yet.</div> : (
          <table>
            <thead><tr><th>When</th><th>User</th><th>Plan</th><th>Charged</th><th className="num">In USD</th></tr></thead>
            <tbody>
              {purchases.map((r, i) => (
                <tr key={i}>
                  <td className="mono muted">{ago(r.at)}</td>
                  <td className="mono"><Link href={`/faike/users/${r.uid}`}>{String(r.uid).slice(0, 8)}</Link></td>
                  <td className="mono">{r.plan}{r.estimated ? " · inferred" : ""}</td>
                  <td className="mono">{r.estimated ? "—" : `${r.native} ${r.currency}`}</td>
                  <td className="num mono good">{usd(r.amountUSD)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid2">
        <div>
          <h2>Funnel</h2>
          <div className="panel flush">
            <table>
              <thead><tr><th>Stage</th><th className="num">People</th><th className="num">Of previous</th></tr></thead>
              <tbody>
                {funnel.map((f, i) => (
                  <tr key={f.stage}>
                    <td>{f.stage}</td>
                    <td className="num">{f.n}</td>
                    <td className="num muted">
                      {i === 0 || !funnel[i - 1].n ? "—" : `${((f.n / funnel[i - 1].n) * 100).toFixed(0)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2>Which trigger converts</h2>
          <div className="panel flush">
            {rows.length === 0 ? <div className="empty">No paywall data.</div> : (
              <table>
                <thead><tr><th>Trigger</th><th className="num">Shows</th><th className="num">Conv</th><th className="num">Rate</th></tr></thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.trigger}>
                      <td className="mono">{t.trigger}</td>
                      <td className="num muted">{t.shows}</td>
                      <td className={`num ${t.conversions ? "good" : "muted"}`}>{t.conversions}</td>
                      <td className="num muted">{t.shows ? `${((t.conversions / t.shows) * 100).toFixed(1)}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
