import { clsx } from "clsx";

export function StatusBadge(props: {
  label: string;
  tone?: "success" | "warning" | "danger" | "muted" | "accent";
}) {
  const tone = props.tone ?? "muted";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]",
        tone === "success" &&
          "border-[color:rgba(33,95,69,0.15)] bg-[color:var(--success)] text-white",
        tone === "warning" &&
          "border-[color:rgba(141,95,34,0.15)] bg-[color:var(--warning)] text-white",
        tone === "danger" &&
          "border-[color:rgba(151,37,45,0.15)] bg-[color:var(--danger)] text-white",
        tone === "accent" &&
          "border-[color:rgba(169,43,31,0.12)] bg-[color:var(--accent-strong)] text-white",
        tone === "muted" &&
          "border-[color:var(--line-strong)] bg-[color:var(--panel-contrast)] text-[color:var(--ink)]"
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {props.label}
    </span>
  );
}
