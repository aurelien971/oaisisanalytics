// The hub. One tile per product, each carrying its own icon, its own wash, and
// the single number that says whether it's worth opening today.
import Link from "next/link";
import Icon from "@/components/Icon";
import { CATALOG } from "@/lib/catalog";
import { headline } from "@/lib/headline";

export const dynamic = "force-dynamic";

export default async function Hub() {
  const stats = await headline();

  return (
    <>
      <h1>Products</h1>
      <p className="sub" style={{ marginTop: 8 }}>Four apps, four databases, one place.</p>

      <div className="hub">
        {CATALOG.map((p) => {
          const stat = stats[p.slug];
          const inner = (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="tile-logo" src={p.logo} alt="" />
              {stat && (
                <div className="tile-stat">
                  <div className="n">{stat.value}</div>
                  <div className="l">{stat.label}</div>
                </div>
              )}
              <div className="tile-name">{p.name}</div>
              <div className="tile-what">{p.what}</div>
              <p className="tile-blurb">{p.blurb}</p>
              <div className="tile-foot">
                <span className="tile-src">{p.source}</span>
                <span className="tile-go"><Icon name="arrow" size={18} /></span>
              </div>
            </>
          );
          return p.live ? (
            <Link key={p.slug} href={`/${p.slug}`} className={`tile ${p.wash}`}>{inner}</Link>
          ) : (
            <div key={p.slug} className={`tile ${p.wash} is-off`}>{inner}</div>
          );
        })}
      </div>
    </>
  );
}
