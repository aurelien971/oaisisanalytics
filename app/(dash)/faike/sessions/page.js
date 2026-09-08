// Every session as a journey. Click one for the step-by-step.
import Link from "next/link";
import { faike, when } from "@/lib/products";

export const dynamic = "force-dynamic";

const mmss = (s) => {
  s = Math.round(s || 0);
  const m = Math.floor(s / 60);
  return m ? `${m}m ${String(s % 60).padStart(2, "0")}s` : `${s}s`;
};

export default async function FaikeSessions() {
  const { sessions } = await faike();

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
