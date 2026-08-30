import {
  getUsers, getEvents, totals, dailySeries, retention, funnel, paywallFunnel,
  engineSplit, signups, todayPulse, recentEvents, fmtTime, fmtUSD, fmtPct,
  acquisitionSeries, cohortMatrix,
} from "@/lib/data";
import { DauChart, CostChart, HourlyChart, AcquisitionChart } from "@/components/Charts";
import { LiveClock, Ago, AutoRefresh } from "@/components/Live";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const [users, events] = await Promise.all([getUsers(), getEvents()]);
  const t = totals(users, events);
  const series = dailySeries(events);
  const ret = retention(users, events);
  const fun = funnel(events);
  const pay = paywallFunnel(events);
  const engines = engineSplit(events);
  const pulse = todayPulse(users, events);
  const joins = signups(users);
  const feed = recentEvents(events);
  const acq = acquisitionSeries(users);
  const cohorts = cohortMatrix(users, events);

  return (
    <>
      <AutoRefresh seconds={30} />
      <div className="pagehead">
        <h1>Overview</h1>
        <LiveClock />
      </div>

      {/* ── New users: impossible to miss ── */}
      {pulse.newUsers.length > 0 ? (
        <div className="newusers">
          <div className="n">+{pulse.newUsers.length}</div>
          <div>
            <div className="t">New {pulse.newUsers.length === 1 ? "user" : "users"} today</div>
            <div className="sub">latest {joins[0]?.firstMs ? <Ago ms={joins[0].firstMs} /> : "today"}</div>
          </div>
          <div className="feed">
            {joins.slice(0, 4).map((u) => (
              <span key={u.uid} className="chip">
                <em>{u.name || u.uid.slice(0, 6)}</em>
                {u.country ? ` · ${u.country}` : ""} · {u.firstMs ? fmtTime(u.firstMs) : u.firstDay}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="panel" style={{ marginBottom: 16, display: "flex", gap: 10, alignItems: "baseline" }}>
          <span className="mono muted">No new users yet today.</span>
          {joins[0] && (
            <span className="mono muted">
              Last signup: {joins[0].name || joins[0].uid.slice(0, 6)} · {joins[0].firstMs ? <Ago ms={joins[0].firstMs} /> : joins[0].firstDay}
            </span>
          )}
        </div>
      )}

      <div className="kpis">
        <div className="kpi hi"><div className="v">{t.users}</div><div className="l">Users</div></div>
        <div className="kpi hi"><div className="v">{pulse.newUsers.length}</div><div className="l">New today</div></div>
        <div className="kpi"><div className="v">{pulse.events}</div><div className="l">Events today</div></div>
        <div className="kpi"><div className="v">{pulse.gens}</div><div className="l">Gens today</div></div>
        <div className="kpi good"><div className="v">{fmtUSD(t.revenueUSD)}</div><div className="l">Revenue</div></div>
        <div className="kpi bad"><div className="v">{fmtUSD(t.spendUSD)}</div><div className="l">API cost (users)</div></div>
        <div className={`kpi ${t.pnlUSD >= 0 ? "good" : "bad"}`}><div className="v">{fmtUSD(t.pnlUSD)}</div><div className="l">P&amp;L</div></div>
        <div className="kpi"><div className="v">{t.generations}</div><div className="l">Generations</div></div>
        <div className="kpi"><div className="v">{t.avgGensPerUser.toFixed(1)}</div><div className="l">Gens / user</div></div>
        <div className="kpi"><div className="v">{fmtPct(t.saveRate)}</div><div className="l">Save rate</div></div>
        <div className="kpi"><div className="v">{fmtUSD(t.avgPnlPerUser)}</div><div className="l">P&amp;L / user</div></div>
        <div className="kpi"><div className="v">{fmtUSD(t.adminCostUSD)}</div><div className="l">Studio cost</div></div>
      </div>

      <h2>Today · hour by hour</h2>
      <div className="panel"><HourlyChart data={pulse.hours} /></div>

      <h2>Daily activity · 30d</h2>
      <div className="panel">{series.length ? <DauChart data={series} /> : <div className="empty">No events yet — use the app.</div>}</div>

      <div className="panel">
        <div className="panel-title">User acquisition <span className="mono muted">new users / day · {acq.reduce((s, r) => s + r.newUsers, 0)} in view · {acq.at(-1)?.total ?? 0} total</span></div>
        <AcquisitionChart data={acq} />
      </div>

      <div className="panel">
        <div className="panel-title">Retention by cohort <span className="mono muted">weekly cohorts · % active each week after joining</span></div>
        <table className="table mono" style={{ fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Cohort week</th><th>Users</th>
              {Array.from({ length: 8 }, (_, i) => <th key={i}>W{i}</th>)}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((c) => (
              <tr key={c.week}>
                <td style={{ textAlign: "left" }}>{c.week}</td>
                <td>{c.size}</td>
                {c.cells.map((v, i) => (
                  <td key={i} style={v == null ? { color: "#3a4150" } : {
                    background: `rgba(57,135,229,${(0.08 + 0.55 * v).toFixed(2)})`,
                    color: v > 0.45 ? "#fff" : "#c8d1e0", borderRadius: 6,
                  }}>
                    {v == null ? "·" : Math.round(v * 100) + "%"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Daily API cost</h2>
      <div className="panel">{series.length ? <CostChart data={series} /> : <div className="empty">No cost data yet.</div>}</div>

      <div className="grid2">
        <div>
          <h2>Live event feed</h2>
          <div className="panel feedlist">
            {feed.length ? feed.map((e, i) => (
              <div className="evt" key={i}>
                <span className="ts">{fmtTime(e.tsMs)}</span>
                <span className={`type ${e.cls}`}>{e.type.replace(/_/g, " ")}</span>
                <span className="detail">{e.detail}{e.uid ? `  ·  ${e.uid}` : ""}</span>
                <span className="ago">{e.tsMs ? <Ago ms={e.tsMs} /> : null}</span>
              </div>
            )) : <div className="empty">Quiet in here.</div>}
          </div>
        </div>

        <div>
          <h2>Latest signups</h2>
          <div className="panel">
            <table>
              <thead><tr><th>User</th><th>Country</th><th>Plan</th><th className="num">Joined</th></tr></thead>
              <tbody>
                {joins.slice(0, 10).map((u) => {
                  const fresh = u.firstMs && Date.now() - u.firstMs < 86400000;
                  return (
                    <tr key={u.uid}>
                      <td className="mono">{u.name || u.uid.slice(0, 8)} {fresh && <span className="pill new">NEW</span>}</td>
                      <td className="mono">{u.country || "—"}</td>
                      <td className="mono">{u.plan}</td>
                      <td className="num">{u.firstMs ? <Ago ms={u.firstMs} /> : u.firstDay}</td>
                    </tr>
                  );
                })}
                {!joins.length && <tr><td colSpan={4} className="empty">No users yet.</td></tr>}
              </tbody>
            </table>
          </div>

          <h2>Retention</h2>
          <div className="panel">
            <table>
              <thead><tr><th>Window</th><th className="num">Cohort</th><th className="num">Retained</th><th className="num">Rate</th></tr></thead>
              <tbody>
                {ret.map((r) => (
                  <tr key={r.label}>
                    <td className="mono">{r.label}</td>
                    <td className="num">{r.eligible}</td>
                    <td className="num">{r.retained}</td>
                    <td className="num"><span className="pill ok">{fmtPct(r.rate)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>Engines</h2>
          <div className="panel">
            <table>
              <thead><tr><th>Engine</th><th className="num">Gens</th><th className="num">Cost</th><th className="num">Avg cost</th><th className="num">Avg time</th></tr></thead>
              <tbody>
                {engines.map((e) => (
                  <tr key={e.engine}>
                    <td className="mono">{e.engine}</td>
                    <td className="num">{e.count}</td>
                    <td className="num">{fmtUSD(e.cost)}</td>
                    <td className="num">${e.avgCost}</td>
                    <td className="num">{e.avgSeconds}s</td>
                  </tr>
                ))}
                {!engines.length && <tr><td colSpan={5} className="empty">No generations yet.</td></tr>}
              </tbody>
            </table>
          </div>

          <h2>Usage funnel</h2>
          <div className="panel">
            <table>
              <tbody>
                {fun.map((s, i) => (
                  <tr key={s.step}>
                    <td>{s.step}</td>
                    <td className="num">{s.n}</td>
                    <td className="num muted">{i > 0 && fun[i - 1].n ? fmtPct(s.n / fun[i - 1].n) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>Paywall funnel</h2>
          <div className="panel">
            <table>
              <tbody>
                {pay.map((s) => (
                  <tr key={s.step}><td>{s.step}</td><td className="num">{s.n}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
