// Every session as a journey. Click one for the step-by-step.
import Link from "next/link";
import { faike, faikeScanHistory, attachScans, when } from "@/lib/products";
import { signedUrl } from "@/lib/firebase";

export const dynamic = "force-dynamic";

const mmss = (s) => {
  s = Math.round(s || 0);
  const m = Math.floor(s / 60);
  return m ? `${m}m ${String(s % 60).padStart(2, "0")}s` : `${s}s`;
};

export default async function FaikeSessions() {
  const [{ sessions: raw }, { scans }] = await Promise.all([faike(), faikeScanHistory({ limit: 300 })]);
  const withUrls = await Promise.all(
    scans.map(async (x) => ({ ...x, imageUrl: x.imagePath ? await signedUrl("faike", x.imagePath, 60) : null }))
  );
  const sessions = attachScans(raw, withUrls);

  return (
    <>
      <div className="pagehead"><h1>Sessions</h1><span className="sub mono">{sessions.length} most recent</span></div>

      {sessions.length === 0 && <div className="panel empty">No sessions recorded yet.</div>}

      {sessions.map((s) => {
        const journey = s.journey || [];
        const converted = journey.some((x) => String(x).startsWith("purchase_success"));
        return (
          <div className="panel" key={s.id} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "baseline", flexWrap: "wrap" }}>
              <b><Link href={`/faike/users/${s.uid}`}>{String(s.uid).slice(0, 8)}</Link></b>
              <Link className="mono" href={`/faike/sessions/${s.id}`}>open →</Link>
              <span className="mono muted">
                {when(s.started_at)} · {mmss(s.duration_s)} · {journey.length} step{journey.length === 1 ? "" : "s"} ·{" "}
                {[s.city, s.country].filter(Boolean).join(", ") || "—"} · {s.device_model || "?"} · v{s.app_version || "?"}
              </span>
              {converted && <span className="pill ok">converted</span>}
            </div>

            {s.scans.length > 0 && (
              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                {s.scans.map((x) => (
                  <Link key={x.id} href={`/faike/scans/${encodeURIComponent(x.id)}`}
                        style={{ display: "flex", gap: 9, alignItems: "center", textDecoration: "none",
                                 border: "1px solid #232833", borderRadius: 10, padding: "6px 10px 6px 6px" }}>
                    {x.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={x.imageUrl} alt="" style={{ width: 34, height: 34, objectFit: "cover", borderRadius: 6 }} />
                    ) : (
                      <span style={{ width: 34, height: 34, borderRadius: 6, background: "#161a22",
                                     display: "grid", placeItems: "center", fontSize: 10, color: "#5a6270" }}>
                        {x.mode === "image" ? "img" : "txt"}
                      </span>
                    )}
                    <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span className="mono" style={{ fontSize: 12 }}>{x.verdict} · {x.score}%</span>
                      <span className="muted" style={{ fontSize: 11, maxWidth: 200, overflow: "hidden",
                                                       textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {x.preview || x.modeLabel}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {journey.map((step, i) => (
                <span key={i} className="chip mono">
                  {step}
                  {i < journey.length - 1 ? <span style={{ color: "#3a4150" }}> →</span> : null}
                </span>
              ))}
              {journey.length === 0 && <span className="muted mono">no steps recorded</span>}
            </div>
          </div>
        );
      })}
    </>
  );
}
