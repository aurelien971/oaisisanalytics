"use client";
// The rail knows which product you're inside and shows only its views. On the
// hub it shows the product list instead.
import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = {
  opaque: {
    name: "Opaque",
    source: "Firestore · opaque-3964b",
    views: [
      ["", "Overview"],
      ["filters", "Filters"],
      ["users", "Users"],
      ["sessions", "Sessions"],
      ["prompts", "Prompts"],
    ],
  },
  oaisislabs: { name: "OAISIS Labs", source: "Firestore · oaisislabs", views: [["", "Overview"]] },
  oaisis: { name: "OAISIS Transcriber", source: "Firestore · oaisis-a6968", views: [["", "Overview"]] },
  faike: { name: "FAIKE", source: "Firestore · faike-2828d", views: [["", "Overview"]] },
};

export default function Nav() {
  const path = usePathname() || "/";
  const slug = path.split("/")[1];
  const section = SECTIONS[slug];

  if (!section) {
    return (
      <>
        <div className="live-row"><span className="live-dot" />all products</div>
        <nav><Link href="/" className="on">Products</Link></nav>
        <div className="foot">One password · server-rendered<br />admin-only</div>
      </>
    );
  }

  return (
    <>
      <div className="live-row"><span className="live-dot" />LIVE · auto-refresh 30s</div>
      <p className="rail-product">{section.name}</p>
      <nav>
        {section.views.map(([sub, label]) => {
          const href = sub ? `/${slug}/${sub}` : `/${slug}`;
          return (
            <Link key={label} href={href} className={path === href ? "on" : undefined}>
              {label}
            </Link>
          );
        })}
      </nav>
      <nav className="rail-back">
        <Link href="/">← All products</Link>
        <button
          onClick={async () => {
            await fetch("/api/auth", { method: "DELETE" });
            window.location.href = "/login";
          }}
        >
          Sign out
        </button>
      </nav>
      <div className="foot">{section.source}<br />server-rendered · admin-only</div>
    </>
  );
}
