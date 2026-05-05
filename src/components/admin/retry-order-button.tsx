"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RefreshCcw } from "lucide-react";

import { buttonClasses } from "@/components/common/button";

export function RetryOrderButton(props: { orderId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRetry() {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/orders/${props.orderId}/retry`, {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Unable to retry order jobs");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to retry order jobs"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleRetry}
        disabled={isSubmitting}
        className={buttonClasses({
          variant: "secondary",
          size: "sm",
        })}
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Queueing…
          </>
        ) : (
          <>
            <RefreshCcw className="h-4 w-4" />
            Retry jobs
          </>
        )}
      </button>

      {error ? (
        <p className="text-sm text-[color:var(--danger)]">{error}</p>
      ) : null}
    </div>
  );
}
