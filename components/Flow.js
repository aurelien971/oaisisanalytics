// A session drawn as the path it actually was: one node per screen, arrows
// between them, wrapping onto as many rows as it needs. Width encodes nothing —
// dwell time is on the node, so a long pause reads without distorting the path.

const COLORS = {
  Home: "#C8E6CC", Editor: "#D9D6EF", Paywall: "#EDC7B9", Pong: "#8A8A8F",
  Settings: "#7a86a0", Onboarding: "#9d6ae5", "Sign in": "#7a86a0",
  Studio: "#38b6c9", "Magic Eraser": "#e05587", "Blur Lab": "#5aa0f2",
  "Custom Edit": "#2fae8f", "Create Filter": "#b7791f", "Video Look": "#8f5ae5",
};
const tone = (s) => COLORS[s] || "#556077";

const mmss = (sec) => {
  sec = Math.round(sec || 0);
  const m = Math.floor(sec / 60);
  return m ? `${m}m ${String(sec % 60).padStart(2, "0")}s` : `${sec}s`;
};

function Arrow() {
  return (
    <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden="true" style={{ flexShrink: 0, opacity: 0.5 }}>
      <line x1="0" y1="6" x2="18" y2="6" stroke="#4a5260" strokeWidth="1.4" strokeDasharray="3 3" />
      <path d="M18 2.5 L24 6 L18 9.5 Z" fill="#4a5260" />
    </svg>
  );
}

/**
 * steps: [{ label, sub?, tone?, badge?, href? }]
 * Anything can be a node — Opaque screens, FAIKE journey steps, a generation.
 */
export function Flow({ steps = [] }) {
  if (!steps.length) return <div className="empty">No path recorded.</div>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, rowGap: 14 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              display: "flex", flexDirection: "column", gap: 3,
              padding: "9px 13px", minWidth: 96,
              borderRadius: 11,
              background: "#12151b",
              border: `1px solid ${s.tone || tone(s.label)}`,
              borderLeftWidth: 3,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: s.tone || tone(s.label) }} />
              {s.label}
              {s.badge && (
                <span className="pill" style={{ marginLeft: 2, fontSize: 10 }}>{s.badge}</span>
              )}
            </span>
            {s.sub && <span className="mono muted" style={{ fontSize: 11 }}>{s.sub}</span>}
          </div>
          {i < steps.length - 1 && <Arrow />}
        </div>
      ))}
    </div>
  );
}

/** Opaque screen spans -> flow nodes. */
export const screensToSteps = (screens = []) =>
  screens.map((x) => ({ label: x.s, sub: mmss(x.d), tone: tone(x.s) }));

export { mmss, tone };
