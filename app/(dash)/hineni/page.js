import Icon from "@/components/Icon";
import { bySlug } from "@/lib/catalog";
import { NotConnected } from "@/components/NotConnected";
import { hineni, fmtN } from "@/lib/products";
import { usd } from "@/lib/money";
import { SimpleBars, AcquisitionChart } from "@/components/Charts";
import { C } from "@/lib/palette";

export const dynamic = "force-dynamic";

export default async function Hineni() {
  const p = bySlug("hineni");
  let data;
  try {
    data = await hineni();
  } catch (e) {
    return <NotConnected product="Hineni" env="HINENI_SERVICE_ACCOUNT_B64" file="serviceAccount.hineni.json" error={e.message} />;
  }
  const { funnel, worst, answers, utility, location, tefillin, holidays, paywall, money, retention, installsDaily } = data;

  const grantRate = location.asked
    ? Math.round((location.granted / location.asked) * 1000) / 10
    : null;

  return (
    <>
      <div className="pagehead">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.logo} alt="" /><h1>{p.name}</h1><span className="sub">{p.what}</span><a className="tile-link" href={p.link} target="_blank" rel="noreferrer"><Icon name="link" size={13} />{p.linkLabel}</a></div>
      <p className="pageabout">{p.about}</p>

      <div className="kpis">
        <div className="kpi"><div className="n">{usd(money.revenue)}</div><div className="l">Revenue</div></div>
        <div className="kpi"><div className="n" style={{ color: "#f87171" }}>{usd(money.spend)}</div><div className="l">Ad spend</div></div>
        <div className="kpi"><div className="n">{usd(money.apiCost)}</div><div className="l">API cost</div></div>
        <div className={money.profit >= 0 ? "kpi good" : "kpi bad"}><div className="n">{usd(money.profit)}</div><div className="l">P&amp;L</div></div>
        <div className="kpi"><div className="n">{fmtN(money.installs)}</div><div className="l">Users</div></div>
        <div className="kpi"><div className="n">{usd(money.rpd)}</div><div className="l">Revenue / user</div></div>
        <div className="kpi"><div className="n">{money.cac === null ? "—" : usd(money.cac)}</div><div className="l">CAC</div></div>
        <div className="kpi"><div className="n">{money.roas === null ? "—" : `${money.roas.toFixed(2)}x`}</div><div className="l">ROAS</div></div>
        <div className={money.conversions ? "kpi good" : "kpi bad"}><div className="n">{money.conversions}</div><div className="l">Conversions</div></div>
        <div className="kpi"><div className="n">{money.conversionRate}%</div><div className="l">User → paid</div></div>
        <div className="kpi"><div className="n">{retention.checkIns}</div><div className="l">Daily answers</div></div>
        <div className="kpi"><div className="n">{tefillin.completions}</div><div className="l">Tefillin laid</div></div>
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

      <h2>Is the free part the draw?</h2>
      <p className="sub">
        Candle lighting and the zmanim are given away on purpose, because every competitor in this
        category is free and institutionally funded. If these numbers are small, the strategy is
        wrong — and this is where that shows up first, well before conversion does.
      </p>
      <div className="kpis">
        <div className="kpi"><div className="n">{utility.candleViewers}</div><div className="l">Saw a candle time</div></div>
        <div className="kpi"><div className="n">{utility.zmanimViewers}</div><div className="l">Opened the zmanim</div></div>
        <div className="kpi"><div className="n">{utility.brachaSearches}</div><div className="l">Blessing searches</div></div>
        <div className="kpi"><div className={utility.brachaMisses ? "n bad" : "n"}>{utility.brachaMisses}</div><div className="l">Found nothing</div></div>
        <div className="kpi"><div className="n">{utility.readAloud}</div><div className="l">Read-alouds</div></div>
        <div className="kpi"><div className="n">{utility.readAloudHebrew}</div><div className="l">…in Hebrew</div></div>
        <div className="kpi"><div className="n">{utility.omerCounts}</div><div className="l">Omer counts</div></div>
        <div className="kpi"><div className="n">{utility.shabbatModeShows}</div><div className="l">Hit Shabbat mode</div></div>
      </div>
      <div className="grid2">
        <div><h3>Which prayer they opened</h3><div className="panel"><SimpleBars data={utility.prayerOpens} dataKey="value" nameKey="name" height={Math.max(140, utility.prayerOpens.length * 30)} /></div></div>
        <div><h3>Which blessing they looked up</h3><div className="panel"><SimpleBars data={utility.brachaByCategory} dataKey="value" nameKey="name" color={C.s2} height={Math.max(140, utility.brachaByCategory.length * 30)} /></div></div>
      </div>
      <p className="sub">
        A blessing search that found nothing is the food list&apos;s to-do list. Only the length of a
        query and whether it hit are ever recorded — what someone typed never leaves their phone, so
        the misses can be counted but not read.
      </p>

      <h2>Festival guides</h2>
      <p className="sub">
        Each guide offers three intensities, and the whole design bet is that a ten-minute version
        gets more people doing something than describing the full observance would.{" "}
        <strong>Which level they pick is the test of that bet.</strong>
      </p>
      <div className="kpis">
        <div className="kpi"><div className="n">{holidays.guideViewers}</div><div className="l">Opened a guide</div></div>
        <div className="kpi"><div className="n">{holidays.guideOpens}</div><div className="l">Guide opens</div></div>
      </div>
      <div className="grid2">
        <div><h3>Which intensity they chose</h3><div className="panel"><SimpleBars data={holidays.byLevel} dataKey="value" nameKey="name" height={140} /></div></div>
        <div><h3>How far ahead they looked</h3><div className="panel"><SimpleBars data={holidays.daysAhead} dataKey="value" nameKey="name" color={C.s2} height={140} /></div></div>
      </div>
      <div><h3>Which festival</h3><div className="panel"><SimpleBars data={holidays.byHoliday} dataKey="value" nameKey="name" height={Math.max(140, holidays.byHoliday.length * 30)} /></div></div>

      <h2>Tefillin</h2>
      <div className="kpis">
        <div className="kpi"><div className="n">{tefillin.opens}</div><div className="l">Opened the guide</div></div>
        <div className="kpi"><div className="n">{tefillin.completers}</div><div className="l">Finished it</div></div>
        <div className="kpi"><div className="n">{tefillin.completions}</div><div className="l">Days laid</div></div>
        <div className="kpi"><div className="n">{tefillin.opens ? Math.round((tefillin.completions / tefillin.opens) * 100) : 0}%</div><div className="l">Open → finish</div></div>
      </div>
      <div className="grid2">
        <div><h3>How far they get</h3><div className="panel"><SimpleBars data={tefillin.furthestStep} dataKey="value" nameKey="name" height={Math.max(140, tefillin.furthestStep.length * 26)} /></div></div>
        <div><h3>Tefillin streaks</h3><div className="panel"><SimpleBars data={tefillin.streaks} dataKey="value" nameKey="name" color={C.s2} height={160} /></div></div>
      </div>
      <p className="sub">
        Step 4 is the seven wraps and step 6 is the second blessing. A cliff at either is a usability
        problem, not a religious one. The guide refuses to run on Shabbat and yom tov, so
        {" "}{tefillin.blocked.reduce((a, b) => a + b.value, 0)} opens were turned away on purpose.
      </p>

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
        <div><h3>Which plan they tapped</h3><div className="panel"><SimpleBars data={paywall.planTaps} dataKey="value" nameKey="name" height={140} /></div></div>
        <div><h3>Which paywall</h3><div className="panel"><SimpleBars data={paywall.byMode} dataKey="value" nameKey="name" color={C.s2} height={140} /></div></div>
      </div>

      <h2>What they told us</h2>
      <div className="grid2">
        <div><h3>Movement</h3><div className="panel"><SimpleBars data={answers.movement} dataKey="value" nameKey="name" height={Math.max(120, answers.movement.length * 30)} /></div></div>
        <div><h3>How much they currently practise</h3><div className="panel"><SimpleBars data={answers.standing} dataKey="value" nameKey="name" color={C.s2} height={Math.max(120, answers.standing.length * 30)} /></div></div>
      </div>
      <div className="grid2">
        <div><h3>What they picked to build</h3><div className="panel"><SimpleBars data={answers.practice} dataKey="value" nameKey="name" height={Math.max(120, answers.practice.length * 30)} /></div></div>
        <div><h3>Which path they got</h3><div className="panel"><SimpleBars data={answers.theme} dataKey="value" nameKey="name" color={C.s2} height={Math.max(120, answers.theme.length * 30)} /></div></div>
      </div>
      <div className="grid2">
        <div><h3>Were you here today?</h3><div className="panel"><SimpleBars data={answers.kavanah} dataKey="value" nameKey="name" height={140} /></div></div>
        <div><h3>How they read the Hebrew</h3><div className="panel"><SimpleBars data={answers.script} dataKey="value" nameKey="name" color={C.s2} height={140} /></div></div>
      </div>

      <h2>Where</h2>
      <div className="kpis">
        <div className="kpi"><div className="n">{grantRate === null ? "—" : `${grantRate}%`}</div><div className="l">Gave location</div></div>
        <div className="kpi"><div className="n">{retention.withYahrzeit}</div><div className="l">Saved a yahrzeit</div></div>
      </div>
      <div className="grid2">
        <div><h3>How they set their place</h3><div className="panel"><SimpleBars data={location.byMethod} dataKey="value" nameKey="name" height={120} /></div></div>
        <div><h3>Israel or diaspora schedule</h3><div className="panel"><SimpleBars data={answers.schedule} dataKey="value" nameKey="name" color={C.s2} height={120} /></div></div>
      </div>
      <div className="grid2">
        <div><h3>Country</h3><div className="panel"><SimpleBars data={answers.country} dataKey="value" nameKey="name" height={Math.max(120, answers.country.length * 30)} /></div></div>
        <div><h3>City</h3><div className="panel"><SimpleBars data={answers.place} dataKey="value" nameKey="name" color={C.s2} height={Math.max(120, answers.place.length * 30)} /></div></div>
      </div>

      <p className="sub" style={{ marginTop: 24 }}>
        API cost is genuinely zero — the seven-day path, the calendar and every prayer time are
        computed on device, so there is no model and no server to pay for. Coordinates are never sent:
        the city column above is the name the user picked, never the numbers behind it. Ad spend is
        read from a <code>spend</code> collection in this product&apos;s Firestore (one row per day per
        channel, field <code>amount_usd</code>); with nothing in it, CAC and ROAS show as — rather
        than a guess.
      </p>
    </>
  );
}
