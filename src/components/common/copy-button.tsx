"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { buttonClasses } from "./button";

export function CopyButton(props: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(props.value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_800);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={buttonClasses({
        variant: "secondary",
        size: "sm",
      })}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : props.label ?? "Copy"}
    </button>
  );
}
