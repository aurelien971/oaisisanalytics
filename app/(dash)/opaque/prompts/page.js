import { getPrompts } from "@/lib/data";

export const dynamic = "force-dynamic";

// Every custom prompt users type, verbatim — this is the market telling us
// which filters to build next.
export default async function Prompts() {
  const prompts = await getPrompts();

  return (
    <>
      <h1>Custom prompts</h1>
      <div className="panel">
        {prompts.length ? (
          <table>
            <thead><tr><th>Day</th><th>User</th><th>Prompt</th></tr></thead>
            <tbody>
              {prompts.map((p, i) => (
                <tr key={i}>
                  <td className="muted">{p.day}</td>
                  <td className="mono">{(p.uid || "").slice(0, 8)}</td>
                  <td>{p.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty">No custom prompts yet — they appear when users type their own edits.</div>}
      </div>
    </>
  );
}
