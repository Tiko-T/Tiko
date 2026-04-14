import Link from "next/link";
import { ArrowUpRight, MapPin, Search } from "lucide-react";

import { buttonClasses } from "@/components/common/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--line)] bg-[color:rgba(248,239,230,0.96)]">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(145deg,var(--accent-soft),#fff1ed)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <span className="font-mono text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--accent-strong)]">
              TI
            </span>
          </div>
          <div>
            <p className="font-[family:var(--font-display)] text-[1.9rem] leading-none text-[color:var(--ink)]">
              Tiko
            </p>
            <p className="eyebrow text-[color:var(--muted)]">Buy tickets. Run events.</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-[color:var(--muted)] md:flex">
          <Link href="/#lineup" className="transition hover:text-[color:var(--ink)]">
            Events
          </Link>
          <Link href="/sell" className="transition hover:text-[color:var(--ink)]">
            List an event
          </Link>
          <Link href="/#flow" className="transition hover:text-[color:var(--ink)]">
            How it works
          </Link>
          <Link href="/operator" className="transition hover:text-[color:var(--ink)]">
            For event teams
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--panel)] px-3 py-2 text-sm text-[color:var(--muted)] lg:flex">
            <MapPin className="h-4 w-4 text-[color:var(--utility)]" />
            <span>Concerts, summits, workshops</span>
          </div>
          <Link
            href="/sell"
            className={buttonClasses({
              variant: "secondary",
              size: "sm",
            })}
          >
            <Search className="h-4 w-4" />
            List an event
          </Link>
          <Link
            href="/operator"
            className={buttonClasses({
              variant: "primary",
              size: "sm",
            })}
          >
            Run check-in
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
