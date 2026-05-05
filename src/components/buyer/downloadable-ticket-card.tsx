"use client";

import Image from "next/image";
import { Download, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { buttonClasses } from "@/components/common/button";
import type { OrderView } from "@/lib/frontend/contracts";

const SVG_WIDTH = 1200;
const SVG_HEIGHT = 720;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function wrapTicketText(value: string, maxChars: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines.slice(0, 3);
}

function fitTicketText(value: string, maxSize: number, minSize: number, factor: number) {
  return Math.max(minSize, Math.min(maxSize, Math.floor(factor / Math.max(value.length, 1))));
}

function buildTicketSvg(order: OrderView, qrCodeSrc: string) {
  const eventTitle = order.event?.title ?? order.product.title;
  const eventLines = wrapTicketText(eventTitle, 20);
  const holder = order.buyer.displayName ?? order.buyer.email;
  const tier = order.tierName ?? order.product.title;
  const price = order.pricing.totalDisplay;
  const ticketCode = order.ticket?.accessCode ?? "";
  const bookingReference = order.reference;
  const ticketCodeSize = fitTicketText(ticketCode, 30, 18, 360);
  const bookingReferenceSize = fitTicketText(bookingReference, 24, 16, 320);
  const lineItems = [
    { label: "Date", value: order.event?.dayLabel ?? "Date pending" },
    { label: "Time", value: order.event?.windowLabel ?? "Schedule pending" },
    { label: "Venue", value: order.event?.venue ?? "Venue pending" },
    { label: "Holder", value: holder },
  ];

  const eventText = eventLines
    .map((line, index) => {
      const y = 162 + index * 88;
      return `<text x="92" y="${y}" fill="#fffaf6" font-family="Georgia, serif" font-size="68" font-weight="600">${escapeXml(line)}</text>`;
    })
    .join("");

  const detailRows = lineItems
    .map((item, index) => {
      const y = 380 + index * 60;

      return `
        <text x="92" y="${y}" fill="#f3ddd2" font-family="Arial, sans-serif" font-size="18" letter-spacing="2.8">${escapeXml(
          item.label.toUpperCase()
        )}</text>
        <text x="92" y="${y + 30}" fill="#fffaf6" font-family="Arial, sans-serif" font-size="28" font-weight="600">${escapeXml(
          item.value
        )}</text>
      `;
    })
    .join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" fill="none">
      <defs>
        <linearGradient id="ticket-shell" x1="0" y1="0" x2="1200" y2="720" gradientUnits="userSpaceOnUse">
          <stop stop-color="#1f120f"/>
          <stop offset="0.55" stop-color="#2f1915"/>
          <stop offset="1" stop-color="#4c231c"/>
        </linearGradient>
        <linearGradient id="ticket-panel" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#fff8f2"/>
          <stop offset="1" stop-color="#f4e7db"/>
        </linearGradient>
        <linearGradient id="ticket-accent" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#ef7b58"/>
          <stop offset="1" stop-color="#d34c36"/>
        </linearGradient>
      </defs>

      <rect width="1200" height="720" rx="48" fill="url(#ticket-shell)"/>
      <rect x="32" y="32" width="1136" height="656" rx="34" stroke="rgba(255,248,245,0.18)"/>

      <circle cx="844" cy="360" r="26" fill="#f8efe6"/>
      <circle cx="1180" cy="360" r="26" fill="#f8efe6"/>
      <path d="M844 96V624" stroke="rgba(248,239,230,0.24)" stroke-width="2" stroke-dasharray="10 14"/>

      <circle cx="230" cy="110" r="132" fill="rgba(239,123,88,0.18)"/>
      <circle cx="654" cy="630" r="180" fill="rgba(54,104,80,0.18)"/>
      <path d="M616 96H764" stroke="rgba(255,248,245,0.16)" stroke-width="18" stroke-linecap="round"/>

      <text x="92" y="98" fill="#f1cab8" font-family="Arial, sans-serif" font-size="20" letter-spacing="6">TIKO EVENT TICKET</text>
      ${eventText}

      <rect x="92" y="100" width="144" height="46" rx="23" fill="url(#ticket-accent)"/>
      <text x="164" y="130" text-anchor="middle" fill="#fffaf6" font-family="Arial, sans-serif" font-size="20" font-weight="700">ADMIT ONE</text>

      ${detailRows}

      <rect x="92" y="628" width="258" height="44" rx="22" fill="rgba(255,248,245,0.12)"/>
      <text x="221" y="656" text-anchor="middle" fill="#fffaf6" font-family="Arial, sans-serif" font-size="20" font-weight="700">${escapeXml(
        tier
      )}</text>

      <rect x="888" y="82" width="236" height="54" rx="27" fill="rgba(255,248,245,0.12)"/>
      <text x="1006" y="116" text-anchor="middle" fill="#fffaf6" font-family="Arial, sans-serif" font-size="24" font-weight="700">${escapeXml(
        price
      )}</text>

      <rect x="890" y="160" width="230" height="230" rx="30" fill="url(#ticket-panel)"/>
      <image href="${qrCodeSrc}" x="918" y="188" width="174" height="174"/>
      <text x="1005" y="426" text-anchor="middle" fill="#5d3a33" font-family="Arial, sans-serif" font-size="16" letter-spacing="3.2">SCAN AT ENTRY</text>

      <rect x="890" y="454" width="230" height="168" rx="28" fill="rgba(255,248,245,0.12)"/>
      <text x="918" y="492" fill="#f1cab8" font-family="Arial, sans-serif" font-size="18" letter-spacing="3">TICKET CODE</text>
      <text x="918" y="532" fill="#fffaf6" font-family="'IBM Plex Mono', 'Courier New', monospace" font-size="${ticketCodeSize}" font-weight="700">${escapeXml(
        ticketCode
      )}</text>
      <text x="918" y="578" fill="#f1cab8" font-family="Arial, sans-serif" font-size="18" letter-spacing="3">BOOKING REF</text>
      <text x="918" y="616" fill="#fffaf6" font-family="'IBM Plex Mono', 'Courier New', monospace" font-size="${bookingReferenceSize}" font-weight="700">${escapeXml(
        bookingReference
      )}</text>
    </svg>
  `.trim();
}

function buildDownloadFileName(order: OrderView) {
  const base = order.event?.slug ?? order.product.slug;
  return `${base}-ticket.svg`;
}

export function DownloadableTicketCard(props: { order: OrderView }) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!props.order.ticket) {
      return;
    }

    let active = true;
    let nextDownloadUrl: string | null = null;

    async function generateTicketAsset() {
      const qrCodeSrc = await QRCode.toDataURL(props.order.ticket!.qrPayload, {
        margin: 0,
        width: 220,
        color: {
          dark: "#101b18",
          light: "#fff8f2",
        },
      });

      const svgMarkup = buildTicketSvg(props.order, qrCodeSrc);
      const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        svgMarkup
      )}`;
      nextDownloadUrl = URL.createObjectURL(
        new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" })
      );

      if (active) {
        setPreviewSrc(svgDataUrl);
        setDownloadUrl(nextDownloadUrl);
      }
    }

    void generateTicketAsset();

    return () => {
      active = false;
      if (nextDownloadUrl) {
        URL.revokeObjectURL(nextDownloadUrl);
      }
    };
  }, [props.order]);

  return (
    <div className="section-card overflow-hidden rounded-[2.25rem] p-6 sm:p-8">
      <div className="flex justify-end">
        <a
          href={downloadUrl ?? "#"}
          download={buildDownloadFileName(props.order)}
          aria-disabled={!downloadUrl}
          className={`${buttonClasses({
            variant: "primary",
            size: "lg",
          })} ${downloadUrl ? "" : "pointer-events-none opacity-60"}`}
        >
          {downloadUrl ? (
            <>
              Download ticket
              <Download className="h-5 w-5" />
            </>
          ) : (
            <>
              Preparing…
              <LoaderCircle className="h-5 w-5 animate-spin" />
            </>
          )}
        </a>
      </div>

      <div className="mt-4 overflow-hidden rounded-[2rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,#fffaf5,#f4e6d9)] p-3 sm:p-4">
        {previewSrc ? (
          <Image
            src={previewSrc}
            alt={`${props.order.product.title} downloadable ticket preview`}
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            unoptimized
            className="h-auto w-full rounded-[1.7rem]"
          />
        ) : (
          <div className="flex aspect-[5/3] w-full items-center justify-center rounded-[1.7rem] bg-[color:rgba(23,12,10,0.06)] text-sm text-[color:var(--muted)]">
            Generating your downloadable ticket…
          </div>
        )}
      </div>
    </div>
  );
}
