import { getUsers, getEvents, demographics, filterByDemographic, fmtUSD } from "@/lib/data";
import { SimpleBars } from "@/components/Charts";
import { C } from "@/lib/palette";

export const dynamic = "force-dynamic";

export default async function Users() {
  const [users, events] = await Promise.all([getUsers(), getEvents()]);
  const demo = demographics(users);
  const segments = filterByDemographic(users, events);
  const sorted = [...users].sort((a, b) => (b.spendUSD || 0) - (a.spendUSD || 0));

  return (
    <>
      <h1>Users</h1>

      <div className="grid2">
        <div>
          <h2>Gender</h2>
          <div className="panel">
            <SimpleBars data={demo.gender} dataKey="value" nameKey="name" height={Math.max(120, demo.gender.length * 32)} />
          </div>
        </div>
        <div>
          <h2>Age</h2>
          <div className="panel">
            <SimpleBars data={demo.ages} dataKey="value" nameKey="name" color={C.s2} height={200} />
          </div>
        </div>
      </div>

      <h2>Top filters by segment (re-rank the home feed from this)</h2>
      <div className="panel">
        {segments.length ? (
          <table>
            <thead><tr><th>Segment</th><th>Top filters (applies)</th></tr></thead>
            <tbody>
              {segments.map((s) => (
                <tr key={s.segment}>
                  <td className="mono">{s.segment}</td>
                  <td>{s.top.map((t) => `${t.name} (${t.n})`).join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty">No applies with profiles yet.</div>}
      </div>

      <h2>Per-user P&amp;L</h2>
      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>User</th><th>Profile</th><th className="num">Sessions</th><th className="num">Gens</th>
              <th className="num">Saves</th><th className="num">Prompts</th>
              <th className="num">Cost</th><th className="num">Revenue</th><th className="num">P&amp;L</th>
              <th>First seen</th><th>Last seen</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((u) => {
              const pnl = (u.revenueUSD || 0) - (u.spendUSD || 0);
              return (
                <tr key={u.uid}>
                  <td className="mono">{(u.name || u.uid).slice(0, 16)}</td>
                  <td className="muted">{[u.gender, u.age].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="num">{u.sessions || 0}</td>
                  <td className="num">{u.generations || 0}</td>
                  <td className="num">{u.saves || 0}</td>
                  <td className="num">{u.customPrompts || 0}</td>
                  <td className="num">{fmtUSD(u.spendUSD)}</td>
                  <td className="num">{fmtUSD(u.revenueUSD)}</td>
                  <td className="num"><span className={`pill ${pnl >= 0 ? "ok" : "warn"}`}>{fmtUSD(pnl)}</span></td>
                  <td className="muted">{u.firstSeenDay || "—"}</td>
                  <td className="muted">{u.lastSeenDay || "—"}</td>
                </tr>
              );
            })}
            {!sorted.length && <tr><td colSpan={11} className="empty">No users yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
