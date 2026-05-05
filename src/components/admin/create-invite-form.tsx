"use client";

import { useState } from "react";
import { LoaderCircle, MailPlus } from "lucide-react";

import { CopyButton } from "@/components/common/copy-button";
import { buttonClasses } from "@/components/common/button";

export function CreateInviteForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"TESTER" | "OPERATOR">("TESTER");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setInviteUrl(null);

    try {
      const response = await fetch("/api/admin/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Unable to create invite");
      }

      const nextUrl =
        payload?.data && typeof payload.data === "object" && "inviteUrl" in payload.data
          ? String(payload.data.inviteUrl)
          : "";

      setInviteUrl(nextUrl);
      setEmail("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create invite"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[color:var(--ink)]">Invite email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 w-full rounded-[1rem] border border-[color:var(--line-strong)] bg-[color:var(--panel-input)] px-4 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent-strong)]"
            placeholder="tester@example.com"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[color:var(--ink)]">Role</span>
          <select
            value={role}
            onChange={(event) =>
              setRole(event.target.value === "OPERATOR" ? "OPERATOR" : "TESTER")
            }
            className="h-12 w-full rounded-[1rem] border border-[color:var(--line-strong)] bg-[color:var(--panel-input)] px-4 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent-strong)]"
          >
            <option value="TESTER">Tester</option>
            <option value="OPERATOR">Operator</option>
          </select>
        </label>
      </div>

      {error ? (
        <div className="rounded-[1rem] border border-[color:rgba(162,40,49,0.16)] bg-[color:rgba(162,40,49,0.08)] px-4 py-3 text-sm text-[color:var(--danger)]">
          {error}
        </div>
      ) : null}

      {inviteUrl ? (
        <div className="rounded-[1rem] border border-[color:rgba(53,94,77,0.16)] bg-[color:rgba(53,94,77,0.08)] px-4 py-4">
          <p className="text-sm font-medium text-[color:var(--ink)]">Invite ready</p>
          <p className="mt-2 break-all text-sm text-[color:var(--muted)]">{inviteUrl}</p>
          <div className="mt-3">
            <CopyButton value={inviteUrl} label="Copy invite link" />
          </div>
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={buttonClasses({
            variant: "primary",
            size: "md",
          })}
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            <>
              <MailPlus className="h-4 w-4" />
              Create invite
            </>
          )}
        </button>
      </div>
    </form>
  );
}
