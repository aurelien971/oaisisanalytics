// Every install, most active first. Click through for the full picture.
import Link from "next/link";
import { faike, ago } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function FaikeUsers() {
  const { perUser, users } = await faike();
  const byId = new Map(users.map((u) => [u.id, u]));
  const sorted = [...perUser].sort((a, b) => b.scans - a.scans);

  return (
    <>
      <div className="pagehead"><h1>Users</h1><span className="sub mono">{users.length} installs</span></div>

      <div className="panel flush">
        <table>
          <thead>
            <tr>
              <th>User</th><th className="num">Scans</th><th className="num">Fact</th><th className="num">Image</th>
              <th className="num">Text</th><th className="num">Paywall views</th><th>Converted</th><th>First seen</th><th>Last active</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((u) => {
              const full = byId.get(u.id) || {};
              return (
                <tr key={u.id}>
                  <td className="mono"><Link href={`/faike/users/${u.id}`}>{u.id.slice(0, 12)}</Link></td>
                  <td className="num">{u.scans}</td>
                  <td className="num muted">{u.fact}</td>
                  <td className="num muted">{u.image}</td>
                  <td className="num muted">{u.text}</td>
                  <td className="num muted">{u.paywallViews}</td>
                  <td>{u.converted ? <span className="pill ok">yes</span> : <span className="muted">—</span>}</td>
                  <td className="muted mono">{ago(full.created_at)}</td>
                  <td className="muted mono">{ago(full.last_active)}</td>
                </tr>
              );
            })}
            {!sorted.length && <tr><td colSpan={9} className="empty">No users yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
