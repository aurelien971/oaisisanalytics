// Every scan, newest first. Click one for the whole result screen.
import Link from "next/link";
import { faike, faikeScanHistory } from "@/lib/products";
import { signedUrl } from "@/lib/firebase";
import { AutoRefresh } from "@/components/Live";
import { SimpleBars } from "@/components/Charts";
import { C } from "@/lib/palette";

export const dynamic = "force-dynamic";

const stamp = (ms) =>
  !ms ? "—" : new Date(ms).toLocaleString(undefined, {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const MODE_TONE = { fact_check: C.s1, image: C.s2, text: C.s3, link: C.s4 };

export default async function FaikeScans() {
  const [{ scans, ready }, { scanFeed, kpis: k }] = await Promise.all([
    faikeScanHistory({ limit: 120 }),
    faike(),
  ]);

  // Sign the thumbnails we can (local signing, no network round-trip).
  const withImages = await Promise.all(
    scans.map(async (s) => ({ ...s, imageUrl: s.imagePath ? await signedUrl("faike", s.imagePath, 60) : null }))
  );

  const backfilled = withImages.filter((s) => s.backfilled).length;
  const live = withImages.length - backfilled;
  const withPhoto = withImages.filter((s) => s.imageUrl).length;

  const verdicts = Object.entries(
    withImages.reduce((a, s) => { a[s.verdict] = (a[s.verdict] || 0) + 1; return a; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  return (
    <>
      <AutoRefresh seconds={15} />
      <div className="pagehead">
        <h1>Scans</h1>
        <span className="sub mono">
          {withImages.length} full records · refreshing every 15s
        </span>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="n">{k.scans}</div><div className="l">Scans, lifetime</div></div>
        <div className="kpi"><div className="n">{withImages.length}</div><div className="l">Full records</div></div>
        <div className="kpi"><div className="n">{backfilled}</div><div className="l">Backfilled</div></div>
        <div className="kpi"><div className="n">{live}</div><div className="l">Live</div></div>
        <div className="kpi"><div className="n">{withPhoto}</div><div className="l">With the image</div></div>
      </div>

      {withImages.length === 0 && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="mono muted" style={{ lineHeight: 1.7 }}>
            <b>No full records yet.</b> They appear here the moment the app writes
            to <code>scan_history</code> — the backfill starts about four seconds
            after launch and uploads one item every 0.4s.
            <br /><br />
            If nothing arrives: the Firestore rules must allow{" "}
            <code>create, update</code> on <code>scan_history</code>, and the
            Storage rules must allow writes to <code>scans/&#123;uid&#125;/</code>.
            Without those the app fails silently.
            <br /><br />
            The older event-derived feed is still below, so the page is never blank.
          </div>
        </div>
      )}

      {verdicts.length > 0 && (
        <>
          <h2>Verdicts</h2>
          <div className="panel">
            <SimpleBars data={verdicts} dataKey="value" nameKey="name" color={C.s2}
                        height={Math.max(140, verdicts.length * 30)} />
          </div>
        </>
      )}

      {withImages.length > 0 && (
        <>
          <h2>Every scan</h2>
          <div className="panel flush">
            <table>
              <thead>
                <tr>
                  <th></th><th>When</th><th>User</th><th>Check</th><th>What they checked</th>
                  <th>Verdict</th><th className="num">Score</th><th className="num">Sources</th><th className="num">Follow-ups</th>
                </tr>
              </thead>
              <tbody>
                {withImages.map((s) => (
                  <tr key={s.id}>
                    <td style={{ width: 52 }}>
                      {s.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.imageUrl} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, display: "block" }} />
                      ) : (
                        <span className="muted mono" style={{ fontSize: 11 }}>{s.hadImage ? "—" : ""}</span>
                      )}
                    </td>
                    <td className="mono muted" style={{ whiteSpace: "nowrap" }}>
                      <Link href={`/faike/scans/${encodeURIComponent(s.id)}`}>{stamp(s.at)}</Link>
                    </td>
                    <td className="mono"><Link href={`/faike/users/${s.uid}`}>{String(s.uid).slice(0, 8)}</Link></td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: MODE_TONE[s.mode] || "#556077" }} />
                        {s.modeLabel}
                      </span>
                      {s.backfilled && <span className="pill" style={{ marginLeft: 8 }}>backfilled</span>}
                    </td>
                    <td style={{ maxWidth: 320 }}>
                      {s.preview ? (s.preview.length > 80 ? s.preview.slice(0, 80) + "…" : s.preview)
                                 : <span className="muted">—</span>}
                    </td>
                    <td>{s.verdict}</td>
                    <td className="num mono">{s.score == null ? "—" : `${s.score}%`}</td>
                    <td className="num mono muted">{s.sourcesCount}</td>
                    <td className="num mono muted">{s.followUps.length || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2>From the event log</h2>
      <div className="panel flush">
        <table>
          <thead><tr><th>When</th><th>User</th><th>Check</th><th>Verdict</th><th className="num">Score</th></tr></thead>
          <tbody>
            {scanFeed.slice(0, 20).map((r, i) => (
              <tr key={i}>
                <td className="mono muted" style={{ whiteSpace: "nowrap" }}>{stamp(r.at)}</td>
                <td className="mono"><Link href={`/faike/users/${r.uid}`}>{String(r.uid).slice(0, 8)}</Link></td>
                <td className="mono">{r.modeLabel}</td>
                <td className={r.failed ? "bad" : ""}>{r.verdict}</td>
                <td className="num mono">{r.score == null ? "—" : `${r.score}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
