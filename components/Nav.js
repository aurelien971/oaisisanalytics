"use client";
// The rail follows you: the product list at the root, that product's own views
// once you're inside one.
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import { bySlug } from "@/lib/catalog";

export default function Nav() {
  const path = usePathname() || "/";
  const product = bySlug(path.split("/")[1]);

  if (!product) {
    return (
      <>
        <div className="rail-state"><span className="dot on" />All products</div>
        <nav>
          <Link href="/" className={path === "/" ? "on" : undefined}><Icon name="grid" />Products</Link>
          <Link href="/overview" className={path === "/overview" ? "on" : undefined}><Icon name="gauge" />Everything</Link>
        </nav>
        <div className="rail-foot">
          <div className="rail-src">One password · server-rendered</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="rail-state"><span className="dot on" />Live</div>
      <div className="rail-product">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.logo} alt="" />
        <span>{product.name}</span>
      </div>
      <nav>
        {product.views.map(([sub, label, icon]) => {
          const href = sub ? `/${product.slug}/${sub}` : `/${product.slug}`;
          return (
            <Link key={label} href={href} className={path === href ? "on" : undefined}>
              <Icon name={icon} />{label}
            </Link>
          );
        })}
      </nav>
      <div className="rail-foot">
        <Link href="/"><Icon name="back" size={15} />All products</Link>
        <button
          onClick={async () => {
            await fetch("/api/auth", { method: "DELETE" });
            window.location.href = "/login";
          }}
        >
          <Icon name="exit" size={15} />Sign out
        </button>
        <div className="rail-src">Firestore · {product.source}</div>
      </div>
    </>
  );
}
