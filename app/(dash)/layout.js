import Link from "next/link";
import Nav from "@/components/Nav";
import { Mark } from "@/components/Icon";

export default function DashLayout({ children }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <Mark />
          <span className="brand-txt"><b>OAISIS</b><span>Analytics</span></span>
        </Link>
        <Nav />
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
