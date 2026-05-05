"use client";

import { useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogOut } from "lucide-react";

type LogoutButtonProps = {
  className?: string;
  compact?: boolean;
};

export function LogoutButton(props: LogoutButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      startTransition(() => {
        router.replace("/login");
        router.refresh();
      });
      setIsSubmitting(false);
    }
  }

  return (
    <button type="button" onClick={handleLogout} className={props.className}>
      {isSubmitting ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" />
          {!props.compact ? "Signing out" : null}
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4" />
          {!props.compact ? "Sign out" : null}
        </>
      )}
    </button>
  );
}
