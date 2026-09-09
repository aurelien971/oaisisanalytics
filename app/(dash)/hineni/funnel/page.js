import { bySlug } from "@/lib/catalog";
import { NotConnected } from "@/components/NotConnected";
import { hineni } from "@/lib/products";
import { SimpleBars } from "@/components/Charts";
import { C } from "@/lib/palette";

export const dynamic = "force-dynamic";

export default async function HineniFunnel() {
  const p = bySlug("hineni");
  let data;
  try {
    data = await hineni();
  } catch (e) {
    return <NotConnected product="Hineni" env="HINENI_SERVICE_ACCOUNT_B64" file="serviceAccount.hineni.json" error={e.message} />;
  }
  const { funnel, dwell, retention, holidays, tefillin, users } = data;

  const completed = users.filter((u) => u.onboarding_completed === true).length;
  const seconds = users.map((u) => u.onboarding_seconds).filter((n) => typeof n === "number");
  const medianSeconds = seconds.length
    ? seconds.slice().sort((a, b) => a - b)[Math.floor(seconds.length / 2)]
    : 0;

  // Where people who never finished are sitting right now.
  const stalled = new Map();
  for (const u of users) {
    if (u.onboarding_completed === true) continue;
    const name = u.onboarding_last_step_name;
    if (!name) continue;
    stalled.set(name, (stalled.get(name) ?? 0) + 1);
  }
  const stalledRows = [...stalled.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  return (
    <>
      <div className="pagehead"><h1>{p.name}</h1><span className="sub">Funnel</span></div>

      <div className="kpis">
        <div className="kpi"><div className="n">{users.length}</div><div className="l">Started</div></div>
        <div className="kpi"><div className="n">{completed}</div><div className="l">Finished</div></div>
        <div className="kpi"><div className="n">{users.length ? Math.round((completed / users.length) * 1000) / 10 : 0}%</div><div className="l">Completion</div></div>
        <div className="kpi"><div className="n">{medianSeconds}s</div><div className="l">Median to finish</div></div>
      </div>

      <h2>Step by step</h2>
      <div className="panel">
        <table className="mono">
          <thead><tr><th>Step</th><th className="num">Reached</th><th className="num">% of start</th><th className="num">Lost here</th></tr></thead>
          <tbody>{funnel.map((s, i) => {
            const lost = i === 0 ? 0 : funnel[i - 1].value - s.value;
            return (
              <tr key={s.key}>
                <td>{s.name}</td>
                <td className="num">{s.value}</td>
                <td className="num">{s.pct}%</td>
                <td className="num" style={lost > 0 ? { color: "#f87171" } : undefined}>{lost || "—"}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <p className="sub">
        Two steps here are load-bearing and worth watching separately. <strong>Reframe</strong> is the
        screen that tells people there is no lapsed category — everything after it depends on that
        landing. <strong>Place</strong> asks for location, and a drop there is a permissions problem
        rather than a copy problem, because the city list gives identical times without it.
      </p>

      <h2>Median seconds on each step</h2>
      <p className="sub">A step people stall on is either being read or misunderstood. The copy tells you which — the reframe is meant to be slow.</p>
      <div className="panel"><SimpleBars data={dwell} dataKey="value" nameKey="name" color={C.s2} height={Math.max(140, dwell.length * 30)} /></div>

      <h2>Where the unfinished are stuck</h2>
      <p className="sub">Last step recorded for everyone who has not completed onboarding.</p>
      <div className="panel">
        {stalledRows.length === 0
          ? <div className="empty">Nobody is mid-flow.</div>
          : <SimpleBars data={stalledRows} dataKey="value" nameKey="name" height={Math.max(140, stalledRows.length * 30)} />}
      </div>

      <h2>What happens after</h2>
      <div className="kpis">
        <div className="kpi"><div className="n">{retention.checkIns}</div><div className="l">Daily answers</div></div>
        <div className="kpi"><div className="n">{retention.daysCompleted}</div><div className="l">Path days done</div></div>
        <div className="kpi"><div className="n">{retention.pathsStarted}</div><div className="l">Second paths</div></div>
        <div className="kpi"><div className="n">{retention.lockedDayTaps}</div><div className="l">Hit a locked day</div></div>
        <div className="kpi"><div className="n">{tefillin.opens}</div><div className="l">Tefillin opens</div></div>
        <div className="kpi"><div className="n">{holidays.guideOpens}</div><div className="l">Guide opens</div></div>
        <div className="kpi"><div className="n">{retention.restoresUsed}</div><div className="l">Restores used</div></div>
        <div className="kpi"><div className="n">{retention.restoresBought}</div><div className="l">Restores bought</div></div>
      </div>

      <h2>Which push brought them back</h2>
      <div className="panel">
        {retention.pushOpens.length === 0
          ? <div className="empty">No notification opens recorded yet.</div>
          : <SimpleBars data={retention.pushOpens} dataKey="value" nameKey="name" height={140} />}
      </div>
      <p className="sub">
        Nothing is ever scheduled into Shabbat or a festival, so a gap in these numbers across a
        Saturday is the app working rather than failing.
      </p>
    </>
  );
}
