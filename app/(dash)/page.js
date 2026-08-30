// The hub. One card per product: what it is, whether it's wired up yet, and
// the way in. New products get a row here and a folder under app/.
import Link from "next/link";

const PRODUCTS = [
  {
    slug: "opaque",
    name: "Opaque",
    what: "iOS photo editor",
    source: "Firestore · opaque-3964b",
    live: true,
    views: ["Overview", "Filters", "Users", "Sessions", "Prompts"],
    blurb: "Users, per-user P&L, retention, usage and paywall funnels, filter performance, and every custom prompt typed.",
  },
  {
    slug: "oaisis",
    name: "OAISIS Labs",
    what: "TikTok scheduling SaaS",
    source: "Firestore · oaisislabs",
    live: false,
    views: ["Posts", "Delivery", "Reach"],
    blurb: "Scheduled vs delivered posts, per-template performance, follower growth across connected accounts.",
  },
  {
    slug: "faike",
    name: "FAIKE",
    what: "—",
    source: "not connected",
    live: false,
    views: [],
    blurb: "Reserved.",
  },
];

export default function Hub() {
  return (
    <>
      <h1>Products</h1>
      <p className="sub">One place for every product&apos;s numbers.</p>
      <div className="hub">
        {PRODUCTS.map((p) => {
          const card = (
            <>
              <div className="hub-top">
                <b>{p.name}</b>
                <span className={p.live ? "tag live" : "tag"}>{p.live ? "live" : "soon"}</span>
              </div>
              <p className="hub-what">{p.what}</p>
              <p className="hub-blurb">{p.blurb}</p>
              <p className="hub-source">{p.source}</p>
              {p.views.length > 0 && (
                <p className="hub-views">{p.views.join(" · ")}</p>
              )}
            </>
          );
          return p.live ? (
            <Link key={p.slug} href={`/${p.slug}`} className="hub-card">{card}</Link>
          ) : (
            <div key={p.slug} className="hub-card is-off">{card}</div>
          );
        })}
      </div>
    </>
  );
}
