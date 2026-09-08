// Every scan: when, who, which of the three checks, what went in, what came back.
import Link from "next/link";
import { faike } from "@/lib/products";
import { SimpleBars } from "@/components/Charts";
import { C } from "@/lib/palette";

export const dynamic = "force-dynamic";

const stamp = (ms) => {
  if (!ms) return "—";
  const d = new Date(ms);
  return d.toLocaleString(undefined, {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const MODE_TONE = { fact_check: C.s1, image: C.s2, text: C.s3 };

function Input({ input, mode }) {
  if (!input) return <span className="muted">—</span>;
  const bits = [];
  if (input.hasImage) bits.push("image");
  if (input.usedVoice) bits.push("voice");
  if (input.chars != null && input.chars > 0) bits.push(`${input.chars} chars`);
  if (!bits.length) bits.push(mode === "image" ? "image" : "typed");
  return <span className="mono muted">{bits.join(" · ")}</span>;
}

export default async function FaikeScans() {
  const { scanFeed, scanMix, kpis: k } = await faike();

  const verdicts = Object.entries(
    scanFeed.reduce((a, s) => { const v = s.failed ? "failed" : s.verdict; a[v] = (a[v] || 0) + 1; return a; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const byMode = Object.entries(
    scanFeed.reduce((a, s) => { a[s.modeLabel] = (a[s.modeLabel] || 0) + 1; return a; }, {})
  ).map(([name, value]) => ({ name, value }));

  const failures = scanFeed.filter((s) => s.failed);
  const withText = scanFeed.filter((s) => s.text).length;

  return (
    <>
      <div className="pagehead">
        <h1>Scans</h1>
        <span className="sub mono">{scanFeed.length} most recent, newest first</span>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="n">{k.scans}</div><div className="l">Scans, lifetime</div></div>
        <div className="kpi"><div className="n">{k.scansPerUser.toFixed(1)}</div><div className="l">Per user</div></div>
        <div className={failures.length ? "kpi bad" : "kpi"}><div className="n">{failures.length}</div><div className="l">Failed</div></div>
        <div className="kpi"><div className="n">{withText}</div><div className="l">With the text recovered</div></div>
      </div>

      {/* The app records that an image was attached, but never uploads it. */}
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="mono muted" style={{ lineHeight: 1.6 }}>
          <b>The uploaded images are not stored anywhere.</b> The app logs{" "}
          <code>has_image: true</code> and the character count, but the picture itself
          never leaves the phone — there is no Storage bucket on <code>faike-2828d</code>,
          and no event field holds a URL. Typed text is recoverable because it is kept on
          the user document, so it is shown below where it can be matched.
          To see the actual images here, the app must upload each scan to Firebase Storage
          and log the path on <code>scan_started</code>.
        </div>
      </div>

      <div className="grid2">
        <div>
          <h2>Which check they ran</h2>
          <div className="panel">
            <SimpleBars data={byMode} dataKey="value" nameKey="name" height={Math.max(140, byMode.length * 34)} />
          </div>
        </div>
        <div>
          <h2>Verdicts returned</h2>
          <div className="panel">
            <SimpleBars data={verdicts} dataKey="value" nameKey="name" color={C.s2} height={Math.max(140, verdicts.length * 30)} />
          </div>
        </div>
      </div>

      <h2>Every scan</h2>
      <div className="panel flush">
        {scanFeed.length === 0 ? (
          <div className="empty">No scans logged yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>When</th><th>User</th><th>Check</th><th>What went in</th>
                <th>What they checked</th><th>Verdict</th>
                <th className="num">Score</th><th className="num">Sources</th><th className="num">Took</th>
              </tr>
            </thead>
            <tbody>
              {scanFeed.map((r, i) => (
                <tr key={i}>
                  <td className="mono muted" style={{ whiteSpace: "nowrap" }}>{stamp(r.at)}</td>
                  <td className="mono">
                    <Link href={`/faike/users/${r.uid}`}>{String(r.uid || "?").slice(0, 8)}</Link>
                  </td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: MODE_TONE[r.mode] || "#556077" }} />
                      {r.modeLabel}
                    </span>
                  </td>
                  <td><Input input={r.input} mode={r.mode} /></td>
                  <td style={{ maxWidth: 320 }}>
                    {r.text ? <span title={r.text}>{r.text.length > 90 ? r.text.slice(0, 90) + "…" : r.text}</span>
                            : <span className="muted">{r.mode === "image" ? "image, not stored" : "—"}</span>}
                  </td>
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
