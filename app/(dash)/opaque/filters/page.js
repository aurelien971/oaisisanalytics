import Link from "next/link";
import { getFilterStats, filterInsights, fmtPct, getEvents, getUsers, filterFeed, fmtTime } from "@/lib/data";
import { SimpleBars } from "@/components/Charts";

export const dynamic = "force-dynamic";

function FilterTable({ rows, showRates = true }) {
  if (!rows.length) return <div className="empty">Nothing here yet.</div>;
  return (
    <table>
      <thead>
        <tr>
          <th>Filter</th><th>Kind</th>
          <th className="num">Taps</th><th className="num">Applies</th><th className="num">Saves</th>
          <th className="num">Bookmarks</th>
          {showRates && <><th className="num">Apply rate</th><th className="num">Save rate</th></>}
        </tr>
      </thead>
      <tbody>
        {rows.map((f) => (
          <tr key={f.id}>
            <td>{f.name || f.id}</td>
            <td><span className="pill">{f.kind}</span></td>
            <td className="num">{f.taps}</td>
            <td className="num">{f.applies}</td>
            <td className="num">{f.saves || 0}</td>
            <td className="num">{f.bookmarks || 0}</td>
            {showRates && (
              <>
                <td className="num">{fmtPct(f.applyRate)}</td>
                <td className="num">{fmtPct(f.saveRate)}</td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function Filters() {
  const [feedEvents, feedUsers] = await Promise.all([getEvents(), getUsers()]);
  const feed = filterFeed(feedEvents);
  const feedNames = new Map(feedUsers.map((u) => [u.uid, u.name || u.uid.slice(0, 6)]));
  const stats = await getFilterStats();
  const { popular, eyeCatchers, keepers } = filterInsights(stats);

  return (
    <>

      <h2>Latest filter taps</h2>
      <div className="panel flush">
        {feed.length === 0 ? (
          <div className="empty">No taps recorded yet.</div>
        ) : (
          <table>
            <thead><tr><th>When</th><th>User</th><th>Filter</th><th>Kind</th><th>Applied?</th></tr></thead>
            <tbody>
              {feed.map((f, i) => (
                <tr key={i}>
                  <td className="mono muted">{f.day} {f.at ? fmtTime(f.at) : ""}</td>
                  <td className="mono">
                    <Link href={`/opaque/users/${f.uid}`}>{feedNames.get(f.uid) || String(f.uid).slice(0, 6)}</Link>
                  </td>
                  <td>{f.name}</td>
                  <td className="mono muted">{f.kind}</td>
                  <td className="mono muted">{f.applied ? "applied" : "tapped"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <h1>Filters</h1>

      <h2>Most applied</h2>
      <div className="panel">
        {popular.length ? (
          <SimpleBars data={popular.slice(0, 12).map((f) => ({ name: f.name || f.id, applies: f.applies }))}
                      dataKey="applies" nameKey="name" height={Math.max(160, popular.slice(0, 12).length * 26)} />
        ) : <div className="empty">No applies yet.</div>}
      </div>
      <div className="panel" style={{ marginTop: 12 }}><FilterTable rows={popular} /></div>

      <h2>Eye-catchers (tapped a lot, rarely used → fix cover or price)</h2>
      <div className="panel"><FilterTable rows={eyeCatchers} /></div>

      <h2>Keepers (highest save rate → promote these)</h2>
      <div className="panel"><FilterTable rows={keepers} /></div>
    </>
  );
}
