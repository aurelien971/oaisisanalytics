import Link from "next/link";
import Icon from "@/components/Icon";
import { overview, usd } from "@/lib/overview";
import { CATALOG, STUDIO, bySlug } from "@/lib/catalog";
import { AcquisitionByProduct } from "@/components/Charts";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const { products, totals: t, acquisition } = await overview();
  const tracked = products.filter((p) => p.tracked);
  const untracked = products.filter((p) => !p.tracked);

  return (
    <>
      <div className="pagehead">
        <h1>{STUDIO.name}</h1>
        <a className="tile-link" href={STUDIO.link} target="_blank" rel="noreferrer">
          <Icon name="link" size={13} />{STUDIO.linkLabel}
        </a>
      </div>
      <p className="sub" style={{ marginTop: -18, marginBottom: 26, maxWidth: 620 }}>
        {STUDIO.about} Four products, four databases — everything below is read live.
      </p>

      <div className="kpis">
        <div className="kpi"><div className="n">{t.users}</div><div className="l">Users, all products</div></div>
        <div className="kpi hi"><div className="n">{t.paying}</div><div className="l">Paying</div></div>
        <div className="kpi"><div className="n">{(t.payRate * 100).toFixed(1)}%</div><div className="l">Pay rate</div></div>
        <div className="kpi good"><div className="n">{usd(t.revenue)}</div><div className="l">Revenue booked</div></div>
        <div className="kpi bad"><div className="n">{usd(t.cost)}</div><div className="l">API cost</div></div>
        <div className={t.pnl >= 0 ? "kpi good" : "kpi bad"}><div className="n">{usd(t.pnl)}</div><div className="l">P&amp;L</div></div>
      </div>

      {/* The money covers one product, so the page says so rather than
          letting a group total imply it covers all four. */}
      <div className="caveat">
        <Icon name="shield" size={15} />
        <span>
          {tracked.map((p) => p.name).join(" and ")} record what was actually charged —{" "}
          {t.coveredUsers} of {t.users} users, {(t.coverage * 100).toFixed(0)}% of the estate.{" "}
          {untracked.map((p) => p.name).join(", ")} report headcount and conversions but not amounts,
          so the P&amp;L above covers {tracked.map((p) => p.name).join(" and ")} only.
        </span>
      </div>

      <h2>New users per day</h2>
      <div className="panel">
        <AcquisitionByProduct data={acquisition} products={products} />
      </div>

      <h2>By product</h2>
      <div className="panel flush">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th className="num">Users</th>
              <th className="num">Active 30d</th>
              <th className="num">Paying</th>
              <th className="num">Pay rate</th>
              <th className="num">Revenue</th>
              <th className="num">Cost</th>
              <th className="num">P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.slug}>
                <td>
                  <Link href={`/${p.slug}`} className="cellrow">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.logo} alt="" />
                    {p.name}
                  </Link>
                </td>
                <td className="num">{p.users}</td>
                <td className="num">{p.active ?? "—"}</td>
                <td className="num">{p.paying}</td>
                <td className="num">{p.users ? `${((p.paying / p.users) * 100).toFixed(0)}%` : "—"}</td>
                <td className="num">{p.tracked ? usd(p.revenue) : "—"}</td>
                <td className="num">{p.tracked ? usd(p.cost) : "—"}</td>
                <td className="num" style={p.tracked ? { color: p.revenue - p.cost >= 0 ? "var(--sage)" : "var(--neg)" } : undefined}>
                  {p.tracked ? usd(p.revenue - p.cost) : "—"}
                </td>
              </tr>
            ))}
            <tr className="total">
              <td>All</td>
              <td className="num">{t.users}</td>
              <td className="num">—</td>
              <td className="num">{t.paying}</td>
              <td className="num">{(t.payRate * 100).toFixed(1)}%</td>
              <td className="num">{usd(t.revenue)}</td>
              <td className="num">{usd(t.cost)}</td>
              <td className="num" style={{ color: t.pnl >= 0 ? "var(--sage)" : "var(--neg)" }}>{usd(t.pnl)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Share of users</h2>
      <div className="panel">
        <div className="split">
          {products.map((p) => (
            <div
              key={p.slug}
              className={`split-seg seg-${p.slug}`}
              style={{ flex: Math.max(p.users, 0.4) }}
              title={`${p.name} · ${p.users}`}
            />
          ))}
        </div>
        <div className="split-key">
          {products.map((p) => (
            <span key={p.slug}>
              <i className={`seg-${p.slug}`} />
              {p.name}
              <b>{p.users}</b>
            </span>
          ))}
        </div>
      </div>

      <h2>The portfolio</h2>
      <div className="folio">
        {products.map((p) => {
          const meta = bySlug(p.slug);
          return (
            <div className="folio-row" key={p.slug}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.logo} alt="" />
              <div className="folio-body">
                <div className="folio-head">
                  <Link href={`/${p.slug}`} className="folio-name">{meta.name}</Link>
                  <span className="folio-store">{meta.storeName}</span>
                  <a className="tile-link" href={meta.link} target="_blank" rel="noreferrer">
                    <Icon name="link" size={13} />{meta.linkLabel}
                  </a>
                </div>
                <div className="tile-meta">
                  <span>{meta.platform}</span><i />
                  <span>{meta.category}</span><i />
                  <span>{meta.price}</span><i />
                  <span>{meta.source}</span>
                </div>
                <p className="folio-about">{meta.about}</p>
                <p className="folio-note">
                  <b>Billing:</b> {p.note}
                  {p.tokens ? ` ${p.apiCalls.toLocaleString()} API calls and ${(p.tokens / 1000).toFixed(0)}K tokens so far — priceable the moment a rate is set.` : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
