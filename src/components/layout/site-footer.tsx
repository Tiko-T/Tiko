import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="px-4 pb-6 pt-2 sm:px-6 sm:pb-8">
      <div className="mx-auto max-w-7xl">
        <div className="section-card-dark overflow-hidden rounded-[2.3rem] px-6 py-8 sm:px-8 sm:py-10">
          <div className="relative">
            <div className="absolute -right-10 top-0 h-44 w-44 rounded-full bg-[color:rgba(207,79,64,0.16)] blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-[color:rgba(70,120,94,0.12)] blur-3xl" />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1.25rem] bg-[linear-gradient(145deg,rgba(255,250,246,0.2),rgba(255,250,246,0.08))] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
                    <span className="font-mono text-sm font-semibold uppercase tracking-[0.24em] text-white">
                      TI
                    </span>
                  </div>
                  <div>
                    <p className="font-[family:var(--font-display)] text-3xl leading-none text-white">
                      Tiko
                    </p>
                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/58">
                      Events. Booking. Entry.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="max-w-xl font-[family:var(--font-display)] text-3xl leading-tight text-white sm:text-4xl">
                    Keep the night simple.
                  </p>
                  <p className="max-w-md text-sm leading-7 text-white/74">
                    One event page. One booking flow. One ticket ready at the door.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-start gap-4 lg:items-end">
                <Link
                  href="#"
                  className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/12"
                >
                  Back to top
                </Link>
                <p className="text-xs uppercase tracking-[0.2em] text-white/46">
                  Live events, {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
