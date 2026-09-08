// One session, screen by screen: what they opened, in what order, for how long.
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession, getUser, fmtTime } from "@/lib/data";

export const dynamic = "force-dynamic";

const COLORS = {
  Home: "#C8E6CC", Editor: "#D9D6EF", Paywall: "#EDC7B9", Pong: "#8A8A8F",
  Settings: "#7a86a0", Onboarding: "#9d6ae5", "Sign in": "#7a86a0",
  Studio: "#38b6c9", "Magic Eraser": "#e05587", "Blur Lab": "#5aa0f2",
  "Custom Edit": "#2fae8f", "Create Filter": "#b7791f", "Video Look": "#8f5ae5",
};
const color = (s) => COLORS[s] || "#556077";

const mmss = (sec) => {
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return m ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
};

export default async function OpaqueSession({ params }) {
  const session = await getSession(params.id);
  if (!session) notFound();
  const user = await getUser(session.uid).catch(() => null);
  const total = Math.max(session.screens.reduce((a, x) => a + (x.d || 0), 0), 1);

  return (
    <>
      <div className="pagehead">
        <h1>Session</h1>
        <span className="sub mono">
          {session.day} {session.startMs ? fmtTime(session.startMs) : ""} · {mmss(session.duration)}
        </span>
        <Link className="tile-link" href={`/opaque/users/${session.uid}`}>
          ← {user?.name || session.uid.slice(0, 8)}
        </Link>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="v">{session.screens.length}</div><div className="l">Screens</div></div>
        <div className="kpi"><div className="v">{mmss(session.duration)}</div><div className="l">Length</div></div>
        <div className="kpi"><div className="v">{session.device}</div><div className="l">Device</div></div>
        <div className="kpi"><div className="v">{session.ios}</div><div className="l">iOS</div></div>
        <div className="kpi"><div className="v">v{session.appVersion}</div><div className="l">App</div></div>
      </div>

      <h2>Trajectory</h2>
      <div className="panel">
        <div style={{ display: "flex", height: 30, borderRadius: 8, overflow: "hidden", border: "1px solid #232833" }}>
          {session.screens.map((x, i) => (
            <div key={i} title={`${x.s} — ${mmss(x.d)}`}
              style={{ width: `${Math.max((x.d / total) * 100, 1.2)}%`, background: color(x.s),
                       borderRight: "1px solid rgba(0,0,0,0.35)" }} />
          ))}
        </div>
      </div>

      <h2>Every screen, in order</h2>
      <div className="panel flush">
        <table>
          <thead>
            <tr><th>#</th><th>Screen</th><th>Opened at</th><th>Stayed</th><th>Share</th></tr>
          </thead>
          <tbody>
            {session.screens.map((x, i) => (
              <tr key={i}>
                <td className="mono muted">{i + 1}</td>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: color(x.s) }} />
                    {x.s}
                  </span>
                </td>
                <td className="mono muted">{x.at == null ? "—" : `+${mmss(x.at)}`}</td>
                <td className="mono">{mmss(x.d || 0)}</td>
                <td className="mono muted">{(((x.d || 0) / total) * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
