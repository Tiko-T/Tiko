"use client";

import { useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogIn } from "lucide-react";

import { buttonClasses } from "@/components/common/button";

export function SignInForm(props: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          nextPath: props.nextPath,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Unable to sign in");
      }

      const redirectTo =
        payload?.data && typeof payload.data === "object" && "redirectTo" in payload.data
          ? String(payload.data.redirectTo)
          : props.nextPath;

      startTransition(() => {
        router.replace(redirectTo || "/");
        router.refresh();
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to sign in"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="section-card rounded-[2.25rem] p-6 sm:p-8">
      <div className="space-y-3">
        <p className="eyebrow text-[color:var(--accent-strong)]">Private beta</p>
        <h1 className="font-[family:var(--font-display)] text-4xl leading-tight text-[color:var(--ink)] sm:text-5xl">
          Sign in to continue.
        </h1>
        <p className="max-w-xl text-sm leading-7 text-[color:var(--muted)]">
          Use your invited account to access booking, order management, and beta tools.
        </p>
      </div>

      <div className="mt-6 grid gap-5">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[color:var(--ink)]">Email address</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 w-full rounded-[1rem] border border-[color:var(--line-strong)] bg-[color:var(--panel-input)] px-4 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent-strong)]"
            placeholder="you@example.com"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[color:var(--ink)]">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 w-full rounded-[1rem] border border-[color:var(--line-strong)] bg-[color:var(--panel-input)] px-4 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent-strong)]"
            placeholder="Your password"
          />
        </label>
      </div>

      {error ? (
        <div className="mt-5 rounded-[1rem] border border-[color:rgba(162,40,49,0.16)] bg-[color:rgba(162,40,49,0.08)] px-4 py-3 text-sm text-[color:var(--danger)]">
          {error}
        </div>
      ) : null}

      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={buttonClasses({
            variant: "primary",
            size: "lg",
          })}
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              <LogIn className="h-5 w-5" />
              Sign in
            </>
          )}
        </button>
      </div>
    </form>
  );
}
