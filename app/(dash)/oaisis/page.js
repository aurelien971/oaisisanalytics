import Icon from "@/components/Icon";
import { bySlug } from "@/lib/catalog";
import { oaisisTranscriber, fmtN, ago } from "@/lib/products";
import { Line1 as Line, AcquisitionChart } from "@/components/Charts";
import { C } from "@/lib/palette";

export const dynamic = "force-dynamic";

export default async function Oaisis() {
  const p = bySlug("oaisis");
  const { kpis: k, perDay, optsPerDay, perUser, recent , acquisition, new7d } = await oaisisTranscriber();

  return (
    <>
      <div className="pagehead">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.logo} alt="" /><h1>{p.name}</h1><span className="sub">{p.what}</span><a className="tile-link" href={p.link} target="_blank" rel="noreferrer"><Icon name="link" size={13} />{p.linkLabel}</a></div><p className="pageabout">{p.about}</p>

      <div className="kpis">
        <div className="kpi"><div className="n">{k.users}</div><div className="l">Users</div></div>
        <div className="kpi good"><div className="n">{k.pro}</div><div className="l">Pro members</div></div>
        <div className="kpi"><div className="n">{(k.proRate * 100).toFixed(0)}%</div><div className="l">Pro rate</div></div>
        <div className="kpi hi"><div className="n">{k.active7d}</div><div className="l">Active 7d</div></div>
        <div className="kpi"><div className="n">{fmtN(k.transcriptions)}</div><div className="l">Transcriptions</div></div>
        <div className="kpi"><div className="n">{k.hours.toFixed(1)}h</div><div className="l">Audio transcribed</div></div>
        <div className="kpi"><div className="n">{fmtN(k.words)}</div><div className="l">Words</div></div>
        <div className="kpi"><div className="n">{k.avgClipS.toFixed(1)}s</div><div className="l">Avg clip</div></div>
        <div className="kpi"><div className="n">{fmtN(k.optimizations)}</div><div className="l">Optimizations</div></div>
      </div>

      <h2>New users per day</h2>
      <div className="panel">
        <AcquisitionChart data={acquisition} />
        <div className="mono muted" style={{ marginTop: 8 }}>{new7d} in the last 7 days</div>
      </div>

      <div className="grid2">
        <div><h2>Transcriptions per day</h2><div className="panel"><Line data={perDay} dataKey="value" nameKey="name" height={180} /></div></div>
        <div><h2>Optimizations per day</h2><div className="panel"><Line data={optsPerDay} dataKey="value" nameKey="name" color={C.s2} height={180} /></div></div>
      </div>

      <h2>Users, heaviest first</h2>
      <div className="panel">
        <table className="mono">
          <thead><tr><th>Name</th><th>Email</th><th>Plan</th><th className="num">Words</th><th className="num">Clips</th><th className="num">Opts</th><th>Last seen</th></tr></thead>
          <tbody>{perUser.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td className="muted">{u.email}</td>
              <td>{u.pro ? <span className="pill ok">pro</span> : <span className="pill">free</span>}</td>
              <td className="num">{fmtN(u.words)}</td>
              <td className="num">{u.transcriptions}</td>
              <td className="num">{u.opts}</td>
              <td className="ts">{ago(u.last)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <h2>What people are transcribing</h2>
      <p className="sub">Most recent 40, verbatim.</p>
      <div className="panel feedlist">
        {recent.map((t) => (
          <div className="evt" key={t.id}>
            <span className="ts">{ago(t.timestamp)}</span>
            <span className="t">{(t.transcribedText || "").slice(0, 180)}</span>
            <span className="mono muted">{(t.audioDurationSeconds ?? 0).toFixed(1)}s</span>
          </div>
        ))}
      </div>
    </>
  );
}
