import Icon from "@/components/Icon";
import { bySlug } from "@/lib/catalog";
import { complainr, fmtN } from "@/lib/products";
import { SimpleBars, AcquisitionChart } from "@/components/Charts";
import { C } from "@/lib/palette";

export const dynamic = "force-dynamic";

export default async function Complainr() {
  const p = bySlug("complainr");
  const { counts, sources, categories, paywall, reports, ai, installsDaily, registrationsDaily } =
    await complainr();

  return (
    <>
      <div className="pagehead">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.logo} alt="" /><h1>{p.name}</h1><span className="sub">{p.what}</span><a className="tile-link" href={p.link} target="_blank" rel="noreferrer"><Icon name="link" size={13} />{p.linkLabel}</a></div>
      <p className="pageabout">{p.about}</p>

      <div className="kpis">
        <div className="kpi"><div className="n">{fmtN(counts.users)}</div><div className="l">Users</div></div>
        <div className="kpi"><div className="n">{fmtN(counts.totalComplaints)}</div><div className="l">Complaints logged</div></div>
        <div className="kpi"><div className="n">{counts.avgPerUser}</div><div className="l">Per user</div></div>
        <div className="kpi"><div className="n">{counts.perDay}</div><div className="l">Per user per day</div></div>
        <div className="kpi"><div className="n">{fmtN(counts.repeated)}</div><div className="l">Swiped to repeat</div></div>
        <div className="kpi"><div className="n">{fmtN(counts.distinct)}</div><div className="l">Distinct complaints</div></div>
        <div className={paywall.bought ? "kpi good" : "kpi bad"}><div className="n">{paywall.bought}</div><div className="l">Subscribers</div></div>
        <div className="kpi"><div className="n">{paywall.conversion}%</div><div className="l">Paywall → paid</div></div>
      </div>

      <h2>Week over week</h2>
      <p className="sub">
        Across the whole base. Down is the direction the product promises to move —
        the pitch is that being seen to keep a record is what reduces the number.
      </p>
      <div className="kpis">
        <div className="kpi"><div className="n">{fmtN(counts.thisWeek)}</div><div className="l">This week</div></div>
        <div className="kpi"><div className="n">{fmtN(counts.lastWeek)}</div><div className="l">Last week</div></div>
        <div className={counts.weekDelta <= 0 ? "kpi good" : "kpi bad"}>
          <div className="n">{counts.weekDelta > 0 ? `+${counts.weekDelta}` : counts.weekDelta}</div>
          <div className="l">Change</div>
        </div>
      </div>

      <div className="grid2">
        <div><h2>Users per day</h2><div className="panel"><AcquisitionChart data={installsDaily} /></div></div>
        <div><h2>Complaints registered per day</h2><div className="panel"><AcquisitionChart data={registrationsDaily} /></div></div>
      </div>

      <h2>How they capture it</h2>
      <p className="sub">
        Typed, spoken or from a screenshot. {counts.contextRate}% added context,{" "}
        {counts.imageRate}% attached an image, and {counts.tearsRate}% were marked as
        ending in tears.
      </p>
      <div className="grid2">
        <div><div className="panel"><SimpleBars data={sources} dataKey="value" nameKey="name" height={140} /></div></div>
        <div>
          <div className="kpis">
            <div className="kpi"><div className="n">{counts.contextRate}%</div><div className="l">Added context</div></div>
            <div className="kpi"><div className="n">{counts.tearsRate}%</div><div className="l">Ended in tears</div></div>
            <div className="kpi"><div className="n">{counts.imageRate}%</div><div className="l">Attached a screenshot</div></div>
          </div>
        </div>
      </div>

      <h2>What the complaints are about</h2>
      <p className="sub">
        Categories are per-user, not a fixed list — the model reuses each person&apos;s own
        vocabulary and only invents a new one when nothing fits. This is the aggregate of
        those, so it shows what people independently arrived at.{" "}
        {ai.newCategories > 0 && `${ai.newCategories} were newly coined.`}
      </p>
      <div className="panel">
        <SimpleBars
          data={categories}
          dataKey="value"
          nameKey="name"
          height={Math.max(160, categories.length * 30)}
        />
      </div>

      <h2>The report</h2>
      <p className="sub">
        The growth loop: the report is meant to be sent to the person it is about.
        {reports.opened > 0
          ? ` ${reports.sendRate}% of the reports opened were actually sent.`
          : " Nothing opened yet."}
      </p>
      <div className="kpis">
        <div className="kpi"><div className="n">{reports.opened}</div><div className="l">Opened</div></div>
        <div className="kpi"><div className="n">{reports.sent}</div><div className="l">Sent</div></div>
        <div className="kpi"><div className="n">{reports.senders}</div><div className="l">People who sent one</div></div>
        <div className="kpi"><div className="n">{reports.sendRate}%</div><div className="l">Send rate</div></div>
      </div>

      <h2>The paywall</h2>
      <div className="kpis">
        <div className="kpi"><div className="n">{paywall.shown}</div><div className="l">Times shown</div></div>
        <div className="kpi"><div className="n">{paywall.viewers}</div><div className="l">People who saw it</div></div>
        <div className="kpi"><div className="n">{paywall.bought}</div><div className="l">Bought</div></div>
        <div className="kpi"><div className="n">{paywall.conversion}%</div><div className="l">Conversion</div></div>
      </div>
      <div className="panel">
        <SimpleBars data={paywall.bySource} dataKey="value" nameKey="name" color={C.s2} height={140} />
      </div>

      <h2>The AI</h2>
      <p className="sub">
        Every request goes through a Cloud Function, so no key ships in the app.
        {ai.advice > 0 &&
          ` ${Math.round(((ai.advice - ai.adviceOnDevice) / ai.advice) * 100)}% of advice came from the model rather than the on-device fallback.`}
      </p>
      <div className="kpis">
        <div className="kpi"><div className="n">{fmtN(ai.enriched)}</div><div className="l">Complaints filed</div></div>
        <div className="kpi"><div className="n">{fmtN(ai.newCategories)}</div><div className="l">New categories coined</div></div>
        <div className="kpi"><div className="n">{fmtN(ai.voice)}</div><div className="l">Voice notes</div></div>
        <div className="kpi"><div className="n">{fmtN(ai.advice)}</div><div className="l">Advice requests</div></div>
        <div className="kpi"><div className="n">{fmtN(ai.adviceOnDevice)}</div><div className="l">Fell back on device</div></div>
      </div>
    </>
  );
}
