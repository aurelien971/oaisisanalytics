import { bySlug } from "@/lib/catalog";
import { surrender } from "@/lib/products";
import { SimpleBars } from "@/components/Charts";
import { C } from "@/lib/palette";

export const dynamic = "force-dynamic";

export default async function SurrenderFunnel() {
  const p = bySlug("surrender");
  const { funnel, dwell, confession, events } = await surrender();
  const changes = events.filter((e) => e.name === "answer_changed");

  return (
    <>
      <div className="pagehead"><h1>{p.name}</h1><span className="sub">Funnel</span></div>

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

      <h2>Median seconds on each step</h2>
      <p className="sub">A step people stall on is either being read or misunderstood. The copy tells you which.</p>
      <div className="panel"><SimpleBars data={dwell} dataKey="value" nameKey="name" color={C.s2} height={Math.max(140, dwell.length * 30)} /></div>

      <h2>The confession</h2>
      <div className="kpis">
        <div className="kpi"><div className="n">{confession.written}</div><div className="l">Wrote one</div></div>
        <div className="kpi"><div className="n">{confession.skipped}</div><div className="l">Skipped it</div></div>
        <div className="kpi"><div className="n">{confession.rate}%</div><div className="l">Write rate</div></div>
        <div className="kpi"><div className="n">{confession.medianLength}</div><div className="l">Median characters</div></div>
      </div>
      <p className="sub">
        Only the length is ever recorded. What people write never leaves their phone, so it cannot
        appear here.
      </p>

      <h2>Answers they changed their mind about</h2>
      <p className="sub">{changes.length} in the last 3,000 events — hesitation is a copy problem.</p>
      <div className="panel feedlist">
        {changes.length === 0 && <div className="empty">Nothing yet.</div>}
        {changes.slice(0, 50).map((e, i) => (
          <div className="evt" key={i}>
            <span className="mono muted">{(e.params || {}).screen}</span>
            <span className="t">{(e.params || {}).value}</span>
          </div>
        ))}
      </div>
    </>
  );
}
