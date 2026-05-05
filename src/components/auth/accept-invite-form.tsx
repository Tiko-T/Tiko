"use client";

import { useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle } from "lucide-react";

import { buttonClasses } from "@/components/common/button";

export function AcceptInviteForm(props: { token: string }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: props.token,
          displayName: displayName || undefined,
          password,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Unable to accept invite");
      }

      startTransition(() => {
        router.replace("/");
        router.refresh();
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to accept invite"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="section-card rounded-[2.25rem] p-6 sm:p-8">
      <div className="space-y-3">
        <p className="eyebrow text-[color:var(--accent-strong)]">Invite</p>
        <h1 className="font-[family:var(--font-display)] text-4xl leading-tight text-[color:var(--ink)] sm:text-5xl">
          Activate your beta account.
        </h1>
        <p className="max-w-xl text-sm leading-7 text-[color:var(--muted)]">
          Set your display name and password to start using the hosted beta.
        </p>
      </div>

      <div className="mt-6 grid gap-5">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[color:var(--ink)]">Display name</span>
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="h-12 w-full rounded-[1rem] border border-[color:var(--line-strong)] bg-[color:var(--panel-input)] px-4 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent-strong)]"
            placeholder="How your name should appear"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[color:var(--ink)]">Password</span>
          <input
            type="password"
            required
            minLength={12}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 w-full rounded-[1rem] border border-[color:var(--line-strong)] bg-[color:var(--panel-input)] px-4 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent-strong)]"
            placeholder="Create a password"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[color:var(--ink)]">Confirm password</span>
          <input
            type="password"
            required
            minLength={12}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="h-12 w-full rounded-[1rem] border border-[color:var(--line-strong)] bg-[color:var(--panel-input)] px-4 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent-strong)]"
            placeholder="Repeat the password"
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
              Activating…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              Activate account
            </>
          )}
        </button>
      </div>
    </form>
  );
}
