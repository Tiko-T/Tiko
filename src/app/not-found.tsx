import Link from "next/link";

import { buttonClasses } from "@/components/common/button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center px-5 py-12 sm:px-8">
        <section className="section-card w-full rounded-[2.5rem] p-8 text-center sm:p-12">
          <p className="eyebrow text-[color:var(--accent-strong)]">Tiko</p>
          <h1 className="mt-4 font-[family:var(--font-display)] text-5xl text-[color:var(--ink)] sm:text-6xl">
            We couldn’t find that page.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
            Return to the current event listings, or open the check-in tools if you are
            working an event.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className={buttonClasses({
                variant: "primary",
                size: "lg",
              })}
            >
              View events
            </Link>
            <Link
              href="/operator"
              className={buttonClasses({
                variant: "secondary",
                size: "lg",
              })}
            >
              Open check-in tools
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
