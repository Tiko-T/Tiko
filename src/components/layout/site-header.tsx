import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { getCurrentUser, isAdminUser, isStaffUser } from "@/lib/auth/session";

export async function SiteHeader() {
  const currentUser = await getCurrentUser();
  const showStaffLinks = isStaffUser(currentUser);
  const showAdminLink = isAdminUser(currentUser);

  return (
    <header className="sticky top-0 z-40 px-4 pt-3 sm:px-6 sm:pt-4">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[2rem] border border-[color:rgba(32,16,13,0.12)] bg-[color:rgba(255,250,246,0.8)] backdrop-blur-xl shadow-[0_22px_52px_rgba(39,18,15,0.12),inset_0_1px_0_rgba(255,255,255,0.74)]">
          <div className="flex items-center gap-4 px-4 py-3 sm:px-5 sm:py-4">
            <Link href="/" className="group flex min-w-0 items-center">
              <HeaderLogo />
            </Link>

            <div className="hidden min-w-0 flex-1 justify-center lg:flex">
              <nav className="inline-flex items-center gap-1 rounded-[1.3rem] border border-[color:rgba(32,16,13,0.1)] bg-[color:rgba(255,255,255,0.5)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.66)]">
                <HeaderLink href="/#lineup" label="Events" />
                <HeaderLink href="/faucet" label="Faucet" />
                <HeaderLink href="/#flow" label="Guide" />
                {showStaffLinks ? <HeaderLink href="/sell" label="Host" /> : null}
                {showStaffLinks ? <HeaderLink href="/operator" label="Check-in" /> : null}
                {showAdminLink ? <HeaderLink href="/admin" label="Admin" /> : null}
              </nav>
            </div>

            <div className="ml-auto hidden items-center gap-3 xl:flex">
              {currentUser ? (
                <>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[color:var(--ink)]">
                      {currentUser.displayName ?? currentUser.email}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      {currentUser.role.toLowerCase()}
                    </p>
                  </div>
                  <LogoutButton className="inline-flex items-center gap-2 rounded-[0.95rem] px-3.5 py-2 text-sm font-medium text-[color:var(--muted)] transition hover:bg-[color:rgba(32,16,13,0.06)] hover:text-[color:var(--ink)]" />
                </>
              ) : (
                <HeaderLink href="/login" label="Sign in" />
              )}
            </div>
          </div>

          <div className="border-t border-[color:rgba(32,16,13,0.08)] px-2 py-2 lg:hidden">
            <nav className="flex flex-wrap gap-1">
              <MobileHeaderLink href="/#lineup" label="Events" />
              <MobileHeaderLink href="/faucet" label="Faucet" />
              <MobileHeaderLink href="/#flow" label="Guide" />
              {showStaffLinks ? <MobileHeaderLink href="/sell" label="Host" /> : null}
              {showStaffLinks ? (
                <MobileHeaderLink href="/operator" label="Check-in" />
              ) : null}
              {showAdminLink ? <MobileHeaderLink href="/admin" label="Admin" /> : null}
              {currentUser ? (
                <div className="flex flex-1 items-center justify-end px-2">
                  <LogoutButton
                    compact
                    className="inline-flex items-center gap-2 rounded-[0.95rem] px-3 py-2.5 text-sm font-medium text-[color:var(--muted)] transition hover:bg-[color:rgba(32,16,13,0.06)] hover:text-[color:var(--ink)]"
                  />
                </div>
              ) : (
                <MobileHeaderLink href="/login" label="Sign in" />
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderLogo() {
  return (
    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
      <div className="flex items-end gap-[0.28rem] sm:gap-[0.36rem]">
        <span className="h-9 w-3 rounded-[0.55rem] bg-[color:#19171c] shadow-[0_8px_20px_rgba(22,18,17,0.12)] sm:h-12 sm:w-4" />
        <span className="h-14 w-4 rounded-[0.7rem] bg-[color:#e6be8a] shadow-[0_10px_24px_rgba(184,136,78,0.18)] sm:h-[4.35rem] sm:w-5" />
        <span className="h-20 w-4 rounded-[0.8rem] bg-[linear-gradient(180deg,#ff7a4d,#ff573f)] shadow-[0_14px_30px_rgba(235,88,54,0.22)] sm:h-[6.35rem] sm:w-5" />
        <span className="relative h-28 w-[3.7rem] overflow-hidden rounded-[1rem] bg-[linear-gradient(180deg,#ff5d3f,#f05037)] shadow-[0_18px_34px_rgba(222,86,53,0.2)] sm:h-[8.8rem] sm:w-[4.85rem] sm:rounded-[1.25rem]">
          <span className="absolute left-0 top-[18%] h-[64%] w-[44%] rounded-r-[0.9rem] bg-[color:rgba(255,250,246,0.97)] sm:rounded-r-[1.1rem]" />
          <span className="absolute left-[24%] top-[10%] h-[80%] w-[17%] rounded-[0.7rem] bg-[color:#ff5d3f]" />
          <span className="absolute left-[24%] top-[17%] h-[11%] w-[34%] -rotate-[29deg] rounded-[0.7rem] bg-[color:#ff5d3f]" />
          <span className="absolute bottom-[12%] left-[22%] h-[11%] w-[38%] rotate-[30deg] rounded-[0.7rem] bg-[color:#ff5d3f]" />
        </span>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="truncate text-[2.05rem] font-semibold uppercase tracking-[0.18em] text-[color:#1d1b21] sm:text-[2.8rem] sm:tracking-[0.22em]">
            TIKO
          </span>
          <span className="hidden rounded-full border border-[color:rgba(169,43,31,0.12)] bg-[color:rgba(207,79,64,0.1)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-strong)] sm:inline-flex">
            Live
          </span>
        </div>
        <p className="truncate text-[11px] font-medium uppercase tracking-[0.22em] text-[color:var(--muted)]">
          Events. Booking. Entry.
        </p>
      </div>
    </div>
  );
}

function HeaderLink(props: { href: string; label: string }) {
  return (
    <Link
      href={props.href}
      className="rounded-[0.95rem] px-3.5 py-2 text-sm font-medium text-[color:var(--muted)] transition hover:bg-[color:rgba(32,16,13,0.06)] hover:text-[color:var(--ink)]"
    >
      {props.label}
    </Link>
  );
}

function MobileHeaderLink(props: { href: string; label: string }) {
  return (
    <Link
      href={props.href}
      className="flex items-center justify-center rounded-[0.95rem] px-3 py-2.5 text-sm font-medium text-[color:var(--muted)] transition hover:bg-[color:rgba(32,16,13,0.06)] hover:text-[color:var(--ink)]"
    >
      {props.label}
    </Link>
  );
}
