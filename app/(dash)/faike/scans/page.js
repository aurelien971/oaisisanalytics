// What was scanned, and what came back.
import Link from "next/link";
import { faike, ago } from "@/lib/products";
import { SimpleBars } from "@/components/Charts";
import { C } from "@/lib/palette";

export const dynamic = "force-dynamic";

export default async function FaikeScans() {
  const { scanFeed, scanMix, kpis: k } = await faike();

  const verdicts = Object.entries(
    scanFeed.reduce((a, s) => { const v = s.failed ? "failed" : s.verdict; a[v] = (a[v] || 0) + 1; return a; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const failures = scanFeed.filter((s) => s.failed);

  return (
    <>
      <div className="pagehead"><h1>Scans</h1><span className="sub mono">{scanFeed.length} most recent</span></div>

      <div className="kpis">
        <div className="kpi"><div className="n">{k.scans}</div><div className="l">Scans, lifetime</div></div>
        <div className="kpi"><div className="n">{k.scansPerUser.toFixed(1)}</div><div className="l">Per user</div></div>
        <div className={failures.length ? "kpi bad" : "kpi"}><div className="n">{failures.length}</div><div className="l">Failed (recent)</div></div>
      </div>

      <div className="grid2">
        <div>
          <h2>What they scan</h2>
          <div className="panel"><SimpleBars data={scanMix} dataKey="value" nameKey="name" height={160} /></div>
        </div>
        <div>
          <h2>Verdicts returned</h2>
          <div className="panel">
            <SimpleBars data={verdicts} dataKey="value" nameKey="name" color={C.s2} height={Math.max(160, verdicts.length * 30)} />
          </div>
        </div>
      </div>

      <h2>Latest scans</h2>
      <div className="panel flush">
        {scanFeed.length === 0 ? (
          <div className="empty">No scans logged yet.</div>
        ) : (
          <table>
            <thead><tr><th>When</th><th>User</th><th>Kind</th><th>Verdict</th><th className="num">Score</th><th className="num">Sources</th><th className="num">Took</th></tr></thead>
            <tbody>
              {scanFeed.map((r, i) => (
                <tr key={i}>
                  <td className="mono muted">{ago(r.at)}</td>
                  <td className="mono"><Link href={`/faike/users/${r.uid}`}>{String(r.uid || "?").slice(0, 8)}</Link></td>
                  <td className="mono">{r.mode}</td>
                  <td className={r.failed ? "bad" : ""}>{r.failed ? `failed — ${r.reason || "unknown"}` : r.verdict}</td>
                  <td className="num mono">{r.score == null ? "—" : `${r.score}%`}</td>
                  <td className="num mono muted">{r.sources ?? "—"}</td>
                  <td className="num mono muted">{r.durationMs == null ? "—" : `${(r.durationMs / 1000).toFixed(1)}s`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
