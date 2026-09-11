// One session as the path it actually was, with whatever was generated along it.
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession, getUser, getEvents, generationsFrom, generationsInSession, fmtTime, fmtUSD } from "@/lib/data";
import { signedUrl } from "@/lib/firebase";
import { Flow, screensToSteps, mmss } from "@/components/Flow";

export const dynamic = "force-dynamic";

export default async function OpaqueSession({ params }) {
  const session = await getSession(params.id);
  if (!session) notFound();

  const [user, events] = await Promise.all([
    getUser(session.uid).catch(() => null),
    getEvents().catch(() => []),
  ]);

  const gens = generationsInSession(session, generationsFrom(events, 4000));
  const withUrls = await Promise.all(
    gens.map(async (g) => ({
      ...g,
      beforeUrl: g.beforePath ? await signedUrl("opaque", g.beforePath, 60) : null,
      afterUrl: g.afterPath ? await signedUrl("opaque", g.afterPath, 60) : null,
    }))
  );

  // Generations sit in the path where they happened, between the screens.
  const steps = [];
  const screens = session.screens || [];
  screens.forEach((x, i) => {
    steps.push({ label: x.s, sub: mmss(x.d) });
    const elapsedEnd = (x.at ?? 0) + (x.d ?? 0);
    withUrls.forEach((g) => {
      const offset = (g.at - (session.startMs ?? 0)) / 1000;
      if (offset >= (x.at ?? 0) && offset < elapsedEnd + 1 && !g._placed) {
        g._placed = true;
        steps.push({
          label: g.failed ? "Generation failed" : "Generated",
          sub: g.filterId || g.kind,
          tone: g.failed ? "#e05587" : "#2fae8f",
          badge: g.failed ? null : fmtUSD(g.costUSD),
        });
      }
    });
    void i;
  });

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
        <div className="kpi"><div className="v">{screens.length}</div><div className="l">Screens</div></div>
        <div className="kpi"><div className="v">{mmss(session.duration)}</div><div className="l">Length</div></div>
        <div className="kpi"><div className="v">{withUrls.length}</div><div className="l">Generations</div></div>
        <div className="kpi"><div className="v">{fmtUSD(withUrls.reduce((s, g) => s + (g.costUSD || 0), 0))}</div><div className="l">Cost</div></div>
        <div className="kpi"><div className="v">{session.device}</div><div className="l">Device</div></div>
        <div className="kpi"><div className="v">v{session.appVersion}</div><div className="l">App</div></div>
      </div>

      <h2>The path they took</h2>
      <div className="panel">
        <Flow steps={steps.length ? steps : screensToSteps(screens)} />
      </div>

      <h2>What they made</h2>
      {withUrls.length === 0 ? (
        <div className="panel empty">No generations in this session.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {withUrls.map((g, i) => (
            <div className="panel" key={i}>
              <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
                {g.beforeUrl || g.afterUrl ? (
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {["before", "after"].map((side) => {
                      const url = side === "before" ? g.beforeUrl : g.afterUrl;
                      return (
                        <figure key={side} style={{ margin: 0 }}>
                          {url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={url} alt={side} style={{ width: 130, borderRadius: 10, display: "block", border: "1px solid #232833" }} />
                          ) : (
                            <div style={{ width: 130, height: 130, borderRadius: 10, background: "#12151b",
                                          border: "1px solid #232833", display: "grid", placeItems: "center" }}
                                 className="mono muted">—</div>
                          )}
                          <figcaption className="mono muted" style={{ fontSize: 11, marginTop: 5 }}>{side}</figcaption>
                        </figure>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mono muted" style={{ maxWidth: 320, lineHeight: 1.6 }}>
                    No images for this one — it predates the app version that archives
                    the before and after. Cost and filter were always recorded.
                  </div>
                )}

                <div style={{ flex: "1 1 240px", minWidth: 200 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>
                    {g.filterId || g.kind}{g.variationId ? ` · ${g.variationId}` : ""}
                  </div>
                  <div className="mono muted" style={{ marginTop: 6, lineHeight: 1.7 }}>
                    {g.engine} · {g.seconds ?? "?"}s · {fmtUSD(g.costUSD)}
                    {g.failed && <><br /><span className="bad">failed — {g.error || "unknown"}</span></>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
