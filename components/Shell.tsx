"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDemo } from "./DemoProvider";
import { BRANDS } from "@/lib/brands";

const NAV = [
  { href: "/dashboard", label: "Dashboard", long: "Owner dashboard", icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
  { href: "/calls", label: "Calls", long: "Calls & texts", icon: "M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1z" },
  { href: "/dispatch", label: "Dispatch", long: "Dispatch board", icon: "M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V9h14v11zM7 11h5v5H7z" },
  { href: "/cross-sell", label: "Cross-sell", long: "Cross-sell", icon: "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" },
  { href: "/field", label: "Field", long: "Field copilot", icon: "M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3zm5.3-3a5.3 5.3 0 01-10.6 0H5a7 7 0 006 6.9V21h2v-3.1a7 7 0 006-6.9h-1.7z" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { role, reset, addedCount } = useDemo();
  const who = role === "owner" ? "Owner view" : BRANDS[role].name;
  const whoSub = role === "owner" ? "LJ's · All Faze · Platinum" : `${BRANDS[role].trade} · ${BRANDS[role].phone}`;

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="logo">
          <div className="logo-mark">TP</div>
          <div>
            Trade Pro AI
            <small>Phoenix trades back office</small>
          </div>
        </Link>
        <nav style={{ display: "contents" }} aria-label="Main">
          {NAV.map((n, i) => (
            <Link key={n.href} href={n.href} className={`nav-link${path.startsWith(n.href) ? " active" : ""}`}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d={n.icon} />
              </svg>
              <span>
                <span className="label-long">{n.long}</span>
                <span className="label-short">{n.label}</span>
              </span>
              <span className="nav-step" title="Suggested demo order">{[5, 1, 2, 4, 3][i]}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="who">
            <strong>{who}</strong>
            <span className="muted">{whoSub}</span>
          </div>
          {addedCount > 0 && (
            <button className="btn btn-sm" onClick={reset} title="Clear calls, jobs and tickets created during this demo">
              Reset demo
            </button>
          )}
          <form action="/api/logout" method="post">
            <button className="btn btn-sm btn-ghost" style={{ width: "100%" }}>Sign out</button>
          </form>
        </div>
      </aside>
      <div style={{ minWidth: 0 }}>
        <div className="demo-banner">
          <span>Demo environment with sample data. Names, numbers and jobs are illustrative.</span>
          <span className="num">Phoenix time</span>
        </div>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
