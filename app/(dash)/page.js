// The hub. One tile per product: what it is, where it lives publicly, and the
// single number that says whether it's worth opening today.
import Link from "next/link";
import Icon from "@/components/Icon";
import { CATALOG, STUDIO } from "@/lib/catalog";
import { headline } from "@/lib/headline";

export const dynamic = "force-dynamic";

export default async function Hub() {
  const stats = await headline();

  return (
    <>
      <h1>{STUDIO.name}</h1>
      <p className="sub" style={{ marginTop: 8, maxWidth: 560 }}>{STUDIO.about}</p>

      <div className="hub">
        {CATALOG.map((p) => {
          const stat = stats[p.slug];
          return (
            <div key={p.slug} className={`tile ${p.wash} ${p.live ? "" : "is-off"}`}>
              <Link href={`/${p.slug}`} className="tile-hit" aria-label={p.name} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="tile-logo" src={p.logo} alt="" />
              {stat && (
                <div className="tile-stat">
                  <div className="n">{stat.value}</div>
                  <div className="l">{stat.label}</div>
                  {/* Same second number on every tile: made or lost. A dash
                      where the product genuinely does not record amounts. */}
                  <div className="n" style={{ marginTop: 6, color: stat.pnl == null ? undefined : stat.pnl >= 0 ? "#4ade80" : "#f87171" }}>
                    {stat.pnl == null ? "—" : `${stat.pnl < 0 ? "-" : ""}$${Math.abs(stat.pnl).toFixed(2)}`}
                  </div>
                  <div className="l">P&amp;L</div>
                </div>
              )}
              <div className="tile-name">{p.name}</div>
              <div className="tile-what">{p.what}</div>
              <div className="tile-meta">
                <span>{p.platform}</span><i />
                <span>{p.category}</span><i />
                <span>{p.price}</span>
              </div>
              <p className="tile-blurb">{p.about}</p>
              <div className="tile-foot">
                {/* Sits above the full-tile link so it can win the click. */}
                <a className="tile-link" href={p.link} target="_blank" rel="noreferrer">
                  <Icon name="link" size={13} />{p.linkLabel}
                </a>
                <span className="tile-go"><Icon name="arrow" size={18} /></span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
