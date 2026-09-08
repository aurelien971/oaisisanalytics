// One scan, whole: what they put in, the picture, the verdict, the full
// explanation, every source, the criteria breakdown, and the follow-ups.
import Link from "next/link";
import { notFound } from "next/navigation";
import { faikeScan } from "@/lib/products";
import { signedUrl } from "@/lib/firebase";

export const dynamic = "force-dynamic";

const stamp = (ms) =>
  !ms ? "—" : new Date(ms).toLocaleString(undefined, {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const domain = (url) => { try { return new URL(url).host.replace(/^www\./, ""); } catch { return url; } };

export default async function FaikeScanDetail({ params }) {
  const s = await faikeScan(decodeURIComponent(params.id));
  if (!s) notFound();
  const imageUrl = s.imagePath ? await signedUrl("faike", s.imagePath, 60) : null;

  return (
    <>
      <div className="pagehead">
        <h1>{s.modeLabel}</h1>
        <span className="sub mono">{stamp(s.at)}</span>
        <Link className="tile-link" href="/faike/scans">← All scans</Link>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="n">{s.score == null ? "—" : `${s.score}%`}</div><div className="l">Score</div></div>
        <div className="kpi"><div className="n">{s.verdict}</div><div className="l">Verdict</div></div>
        <div className="kpi"><div className="n">{s.sourcesCount}</div><div className="l">Sources</div></div>
        <div className="kpi"><div className="n">{s.durationMs == null ? "—" : `${(s.durationMs / 1000).toFixed(1)}s`}</div><div className="l">Took</div></div>
        <div className="kpi"><div className="n">{s.passes ?? "—"}</div><div className="l">Model passes</div></div>
        <div className="kpi"><div className="n">{s.isPro ? "Pro" : "Free"}</div><div className="l">Plan at the time</div></div>
      </div>

      <h2>What they checked</h2>
      <div className="panel">
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Scanned image"
                 style={{ width: 220, borderRadius: 12, display: "block", border: "1px solid #232833" }} />
          )}
          <div style={{ flex: "1 1 320px", minWidth: 260 }}>
            {s.hadImage && !imageUrl && (
              <p className="mono muted">
                An image was scanned but is not stored — this record predates image upload.
              </p>
            )}
            {(s.question || s.text || s.preview) && (
              <p style={{ fontSize: 16, lineHeight: 1.6, margin: 0 }}>
                {s.question || s.text || s.preview}
              </p>
            )}
            <p className="mono muted" style={{ marginTop: 12 }}>
              {[
                s.usedVoice ? "spoken" : null,
                s.hadImage ? "image attached" : null,
                s.backfilled ? "backfilled from device history" : "recorded live",
              ].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      </div>

      {s.reason && (
        <>
          <h2>The answer it gave</h2>
          <div className="panel">
            <p style={{ fontSize: 17, lineHeight: 1.55, margin: 0, fontWeight: 600 }}>{s.reason}</p>
            {s.detail && s.detail !== s.reason && (
              <p style={{ fontSize: 15, lineHeight: 1.7, marginTop: 12, color: "#a9b1c2" }}>{s.detail}</p>
            )}
          </div>
        </>
      )}

      {s.criteria.length > 0 && (
        <>
          <h2>How it scored it</h2>
          <div className="panel flush">
            <table>
              <thead><tr><th>Criterion</th><th className="num">Score</th><th>Out of 5</th></tr></thead>
              <tbody>
                {s.criteria.map((c, i) => (
                  <tr key={i}>
                    <td>{c.name}</td>
                    <td className="num mono">{c.score}</td>
                    <td>
                      <span style={{ display: "inline-flex", gap: 3 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span key={n} style={{
                            width: 18, height: 7, borderRadius: 2,
                            background: n <= c.score ? "#C8E6CC" : "#232833" }} />
                        ))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {s.sources.length > 0 && (
        <>
          <h2>Sources it used</h2>
          <div className="panel flush">
            <table>
              <thead><tr><th>Site</th><th>Title</th></tr></thead>
              <tbody>
                {s.sources.map((src, i) => (
                  <tr key={i}>
                    <td className="mono muted">{domain(src.url)}</td>
                    <td><a href={src.url} target="_blank" rel="noreferrer">{src.title || src.url}</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2>Follow-up questions</h2>
      <div className="panel">
        {s.followUps.length === 0 ? (
          <p className="mono muted" style={{ margin: 0 }}>They did not ask anything afterwards.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {s.followUps.map((f, i) => (
              <div key={i}>
                <div className="mono muted" style={{ fontSize: 11, marginBottom: 6 }}>{stamp(f.at)}</div>
                <p style={{ margin: 0, fontWeight: 600 }}>{f.question}</p>
                <p style={{ margin: "6px 0 0", color: "#a9b1c2", lineHeight: 1.65 }}>{f.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <h2>Who</h2>
      <div className="panel">
        <Link href={`/faike/users/${s.uid}`} className="mono">{s.uid}</Link>
      </div>
    </>
  );
}
