import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--line)] py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 text-sm text-[color:var(--muted)] sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="font-[family:var(--font-display)] text-3xl text-[color:var(--ink)]">
            Tiko
          </p>
          <p className="max-w-2xl leading-7">
            Buy tickets with clear pricing, receive one live QR credential, and keep
            event-day entry simple. Event teams can track payment confirmation and run
            check-in from the same system.
          </p>
        </div>
        <div className="grid gap-6 text-sm sm:grid-cols-3">
          <FooterColumn
            title="Attend"
            links={[
              { href: "/#lineup", label: "Current events" },
              { href: "/#flow", label: "Buying steps" },
            ]}
          />
          <FooterColumn
            title="Event teams"
            links={[
              { href: "/sell", label: "List an event" },
              { href: "/operator", label: "Run check-in" },
              { href: "/operator", label: "Operator console" },
            ]}
          />
          <div className="space-y-2">
            <p className="eyebrow text-[color:var(--muted)]">What stays true</p>
            <p className="max-w-xs leading-6">
              Buyers see the amount before payment, and venue access still follows the
              live Tiko ticket state.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn(props: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <p className="eyebrow text-[color:var(--muted)]">{props.title}</p>
      <div className="space-y-2">
        {props.links.map((link) => (
          <Link
            key={link.href + link.label}
            href={link.href}
            className="block transition hover:text-[color:var(--ink)]"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
