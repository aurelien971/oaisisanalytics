import Icon from "@/components/Icon";
import { bySlug } from "@/lib/catalog";
import { surrender, fmtN } from "@/lib/products";
import { usd } from "@/lib/money";
import { SimpleBars, Line1 as Line, AcquisitionChart } from "@/components/Charts";
import { C } from "@/lib/palette";

export const dynamic = "force-dynamic";

export default async function Surrender() {
  const p = bySlug("surrender");
  const { funnel, worst, answers, confession, paywall, money, retention, att, installsDaily } =
    await surrender();

  return (
    <>
      <div className="pagehead">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.logo} alt="" /><h1>{p.name}</h1><span className="sub">{p.what}</span><a className="tile-link" href={p.link} target="_blank" rel="noreferrer"><Icon name="link" size={13} />{p.linkLabel}</a></div>
      <p className="pageabout">{p.about}</p>

      <div className="kpis">
        <div className="kpi"><div className="n">{usd(money.revenue)}</div><div className="l">Revenue</div></div>
        <div className="kpi"><div className="n" style={{ color: "#f87171" }}>{usd(money.spend)}</div><div className="l">Ad spend</div></div>
        <div className="kpi"><div className="n">{usd(money.apiCost)}</div><div className="l">API cost</div></div>
        <div className={money.profit >= 0 ? "kpi good" : "kpi bad"}><div className="n">{usd(money.profit)}</div><div className="l">P&amp;L</div></div>
        <div className="kpi"><div className="n">{fmtN(money.installs)}</div><div className="l">Installs</div></div>
        <div className="kpi"><div className="n">{usd(money.rpd)}</div><div className="l">RPD</div></div>
        <div className="kpi"><div className="n">{money.cac === null ? "—" : usd(money.cac)}</div><div className="l">CAC</div></div>
        <div className="kpi"><div className="n">{money.roas === null ? "—" : `${money.roas.toFixed(2)}x`}</div><div className="l">ROAS</div></div>
        <div className={money.conversions ? "kpi good" : "kpi bad"}><div className="n">{money.conversions}</div><div className="l">Conversions</div></div>
        <div className="kpi"><div className="n">{money.conversionRate}%</div><div className="l">Install → paid</div></div>
        <div className="kpi"><div className="n">{confession.rate}%</div><div className="l">Wrote a confession</div></div>
        <div className="kpi"><div className="n">{retention.checkIns}</div><div className="l">Check-ins</div></div>
      </div>

      <h2>Onboarding funnel</h2>
      <p className="sub">
        Counted by distinct install, not by event.{" "}
        {worst.lost > 0
          ? `Biggest drop is ${worst.from} → ${worst.name}: ${worst.lost} lost, ${worst.pct}% of everyone who got that far.`
          : "Not enough traffic yet to name a drop-off."}
      </p>
      <div className="panel">
        <SimpleBars data={funnel} dataKey="value" nameKey="name" height={Math.max(160, funnel.length * 30)} />
      </div>

      <div className="grid2">
        <div><h2>Installs per day</h2><div className="panel"><AcquisitionChart data={installsDaily} /></div></div>
        <div><h2>Streak distribution</h2><div className="panel"><SimpleBars data={retention.streakDistribution} dataKey="value" nameKey="name" color={C.s2} height={200} /></div></div>
      </div>

      <h2>The paywall</h2>
      <div className="kpis">
        <div className="kpi"><div className="n">{paywall.viewers}</div><div className="l">Saw it</div></div>
        <div className="kpi"><div className="n">{paywall.dismissals}</div><div className="l">Dismissed</div></div>
        <div className="kpi"><div className="n">{paywall.medianSecondsBeforeDismiss}s</div><div className="l">Median before dismiss</div></div>
        <div className="kpi"><div className="n">{paywall.underFiveSeconds}</div><div className="l">Gone in under 5s</div></div>
        <div className="kpi"><div className="n">{paywall.trialToggledOff}</div><div className="l">Turned trial off</div></div>
        <div className="kpi"><div className="n">{paywall.giftsClaimed}</div><div className="l">Took the 2-day gift</div></div>
      </div>
      <div className="grid2">
        <div><h2>Which plan they tapped</h2><div className="panel"><SimpleBars data={paywall.planTaps} dataKey="value" nameKey="name" height={140} /></div></div>
        <div><h2>Which paywall</h2><div className="panel"><SimpleBars data={paywall.byMode} dataKey="value" nameKey="name" color={C.s2} height={140} /></div></div>
      </div>

      <h2>What they told us</h2>
      <div className="grid2">
        <div><h3>Tradition</h3><div className="panel"><SimpleBars data={answers.tradition} dataKey="value" nameKey="name" height={Math.max(120, answers.tradition.length * 30)} /></div></div>
        <div><h3>How close God feels</h3><div className="panel"><SimpleBars data={answers.closeness} dataKey="value" nameKey="name" color={C.s2} height={Math.max(120, answers.closeness.length * 30)} /></div></div>
      </div>
      <div className="grid2">
        <div><h3>What they confessed to</h3><div className="panel"><SimpleBars data={answers.theme} dataKey="value" nameKey="name" height={Math.max(120, answers.theme.length * 30)} /></div></div>
        <div><h3>What they picked to work on</h3><div className="panel"><SimpleBars data={answers.focus} dataKey="value" nameKey="name" color={C.s2} height={Math.max(120, answers.focus.length * 30)} /></div></div>
      </div>

      <h2>The nightly loop</h2>
      <div className="kpis">
        <div className="kpi"><div className="n">{retention.checkIns}</div><div className="l">Check-ins</div></div>
        <div className="kpi"><div className="n">{retention.withNote}</div><div className="l">Added a note</div></div>
        <div className="kpi"><div className="n">{retention.daysCompleted}</div><div className="l">Days completed</div></div>
        <div className="kpi"><div className="n">{retention.prayersCompleted}</div><div className="l">Prayers finished</div></div>
        <div className="kpi"><div className="n">{retention.prayersAbandoned}</div><div className="l">Prayers abandoned</div></div>
        <div className="kpi"><div className="n">{retention.medianPrayerSeconds}s</div><div className="l">Median prayer</div></div>
        <div className="kpi"><div className="n">{retention.hardNightsOpens}</div><div className="l">Hard-nights opens</div></div>
        <div className="kpi"><div className="n">{retention.repairsBought}</div><div className="l">Restores bought</div></div>
      </div>
      <div className="grid2">
        <div><h3>Where the arrow went</h3><div className="panel"><SimpleBars data={answers.arrow} dataKey="value" nameKey="name" height={140} /></div></div>
        <div><h3>Which hard night</h3><div className="panel"><SimpleBars data={answers.hardNight} dataKey="value" nameKey="name" color={C.s2} height={Math.max(120, answers.hardNight.length * 30)} /></div></div>
      </div>

      <div className="grid2">
        <div><h2>Where</h2><div className="panel"><SimpleBars data={answers.country} dataKey="value" nameKey="name" height={Math.max(120, answers.country.length * 30)} /></div></div>
        <div><h2>Tracking permission</h2><div className="panel"><SimpleBars data={att} dataKey="value" nameKey="name" color={C.s2} height={140} /></div></div>
      </div>

      <p className="sub" style={{ marginTop: 24 }}>
        API cost is genuinely zero — the seven-day plan is generated on device from a fixed library,
        so there is no model to pay for. Ad spend is read from a <code>spend</code> collection in this
        product&apos;s Firestore (one row per day per channel, field <code>amount_usd</code>); with
        nothing in it, CAC and ROAS show as — rather than a guess.
      </p>
    </>
  );
}
