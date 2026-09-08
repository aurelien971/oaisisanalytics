// One session, step by step, with the real event behind each step.
import Link from "next/link";
import { notFound } from "next/navigation";
import { faikeSession, parseStep, when, ago } from "@/lib/products";

export const dynamic = "force-dynamic";

const mmss = (s) => {
  s = Math.round(s || 0);
  const m = Math.floor(s / 60);
  return m ? `${m}m ${String(s % 60).padStart(2, "0")}s` : `${s}s`;
};

export default async function FaikeSession({ params }) {
  const data = await faikeSession(params.id);
  if (!data) notFound();
  const { session: s, events } = data;
  const journey = (s.journey || []).map(parseStep);

  return (
    <>
      <div className="pagehead">
        <h1>Session</h1>
        <span className="sub mono">{when(s.started_at)} · {mmss(s.duration_s)}</span>
        <Link className="tile-link" href={`/faike/users/${s.uid}`}>← {String(s.uid).slice(0, 8)}</Link>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="n">{journey.length}</div><div className="l">Steps</div></div>
        <div className="kpi"><div className="n">{mmss(s.duration_s)}</div><div className="l">Length</div></div>
        <div className="kpi"><div className="n">{s.events_count ?? events.length}</div><div className="l">Events</div></div>
        <div className="kpi"><div className="n">{s.device_model || "—"}</div><div className="l">Device</div></div>
        <div className="kpi"><div className="n">{s.os || "—"}</div><div className="l">iOS</div></div>
        <div className="kpi"><div className="n">{[s.city, s.country].filter(Boolean).join(", ") || "—"}</div><div className="l">Where</div></div>
      </div>

      <h2>The journey, in order</h2>
      <div className="panel flush">
        <table>
          <thead><tr><th>#</th><th>Step</th><th>Detail</th></tr></thead>
          <tbody>
            {journey.map((j, i) => (
              <tr key={i}>
                <td className="mono muted">{i + 1}</td>
                <td className={j.step === "purchase_success" ? "good" : ""}>{j.step}</td>
                <td className="mono muted">{j.detail || "—"}</td>
              </tr>
            ))}
            {!journey.length && <tr><td colSpan={3} className="empty">No steps recorded.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2>Events in this window</h2>
      <div className="panel flush">
        <table>
          <thead><tr><th>When</th><th>Event</th><th>Params</th></tr></thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i}>
                <td className="mono muted">{ago(e.ts)}</td>
                <td className="mono">{e.name}</td>
                <td className="mono muted">
                  {e.params ? Object.entries(e.params).slice(0, 5).map(([k, v]) => `${k}=${v}`).join(" · ") : "—"}
                </td>
              </tr>
            ))}
            {!events.length && <tr><td colSpan={3} className="empty">No events matched this window.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
