import { clsx } from "clsx";

export function buttonClasses(options?: {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  block?: boolean;
}) {
  const variant = options?.variant ?? "primary";
  const size = options?.size ?? "md";

  return clsx(
    "inline-flex items-center justify-center gap-2 rounded-[1.1rem] font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--page)] disabled:cursor-not-allowed disabled:opacity-55",
    size === "sm" && "h-10 px-4 text-sm",
    size === "md" && "h-12 px-5 text-sm sm:text-[15px]",
    size === "lg" && "h-14 px-6 text-base",
    options?.block && "w-full",
    variant === "primary" &&
      "bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white shadow-[0_20px_48px_rgba(185,49,36,0.22)] hover:-translate-y-0.5 hover:shadow-[0_24px_54px_rgba(185,49,36,0.28)]",
    variant === "secondary" &&
      "border border-[color:var(--line-strong)] bg-[color:var(--panel)] text-[color:var(--ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] hover:-translate-y-0.5 hover:border-[color:var(--accent)] hover:bg-[color:var(--panel-strong)]",
    variant === "ghost" &&
      "text-[color:var(--ink)] hover:bg-[color:rgba(36,19,17,0.05)]",
    variant === "danger" &&
      "bg-[color:var(--danger)] text-white shadow-[0_18px_40px_rgba(162,40,49,0.18)] hover:-translate-y-0.5 hover:bg-[color:#82131c]"
  );
}
