"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { QrCode } from "lucide-react";

export function QrCodeCard(props: {
  value: string;
  title: string;
  caption: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      const next = await QRCode.toDataURL(props.value, {
        margin: 1,
        width: 320,
        color: {
          dark: "#0f251d",
          light: "#f8f3ea",
        },
      });

      if (!cancelled) {
        setSrc(next);
      }
    }

    void generate();

    return () => {
      cancelled = true;
    };
  }, [props.value]);

  return (
    <div className="ticket-stub section-card overflow-hidden rounded-[2rem] p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[color:rgba(211,71,57,0.12)] text-[color:var(--accent-strong)]">
          <QrCode className="h-5 w-5" />
        </div>
        <div>
          <p className="eyebrow text-[color:var(--muted)]">Entry ticket</p>
          <p className="text-sm font-semibold text-[color:var(--ink)]">{props.title}</p>
          <p className="text-sm text-[color:var(--muted)]">{props.caption}</p>
        </div>
      </div>
      <div className="rounded-[1.75rem] border border-dashed border-[color:var(--line-strong)] bg-[linear-gradient(180deg,#fffdfb,#f8ebe6)] p-4">
        {src ? (
          <Image
            src={src}
            alt={props.title}
            width={320}
            height={320}
            unoptimized
            className="mx-auto aspect-square w-full max-w-[18rem]"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center rounded-[1.5rem] bg-[color:rgba(17,44,36,0.06)] text-[color:var(--muted)]">
            Generating QR…
          </div>
        )}
      </div>
    </div>
  );
}
