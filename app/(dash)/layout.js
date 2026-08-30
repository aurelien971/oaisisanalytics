import Link from "next/link";
import Nav from "@/components/Nav";

export default function DashLayout({ children }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="ring" /><b>OAISIS</b><span>ANALYTICS</span>
        </Link>
        <Nav />
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
