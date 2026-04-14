"use client";

import { useRef, useState, useTransition } from "react";
import { BrowserCodeReader, BrowserQRCodeReader } from "@zxing/browser";
import {
  Camera,
  CheckCircle2,
  LoaderCircle,
  ScanLine,
  TicketSlash,
  TriangleAlert,
} from "lucide-react";

import { buttonClasses } from "@/components/common/button";
import { StatusBadge } from "@/components/common/status-badge";
import { tikoApi } from "@/lib/frontend/api";
import { extractAccessCode, type CheckInResultView } from "@/lib/frontend/contracts";

export function OperatorConsole() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>("");
  const [scannerMessage, setScannerMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckInResultView | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, startSubmitting] = useTransition();

  function stopScanner() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    readerRef.current = null;
    setIsScanning(false);
  }

  async function submitAccessCode(code: string) {
    try {
      const next = await tikoApi.checkIn(code);
      startSubmitting(() => {
        setResult(next);
      });
      setError(null);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Check-in request failed."
      );
      startSubmitting(() => {
        setResult(null);
      });
    }
  }

  async function handleDecoded(value: string) {
    const nextCode = extractAccessCode(value);
    setAccessCode(nextCode);
    setScannerMessage("QR captured. Submitting access code…");
    stopScanner();
    await submitAccessCode(nextCode);
  }

  async function handleStartScanner() {
    setError(null);
    setScannerMessage("Requesting camera access…");

    try {
      const availableDevices = await BrowserCodeReader.listVideoInputDevices();
      setDevices(availableDevices);
      const targetDeviceId = activeDeviceId || availableDevices.at(0)?.deviceId;

      if (!targetDeviceId || !videoRef.current) {
        throw new Error("No camera device is available.");
      }

      const reader = new BrowserQRCodeReader();
      readerRef.current = reader;
      controlsRef.current = await reader.decodeFromVideoDevice(
        targetDeviceId,
        videoRef.current,
        (scanResult) => {
          if (scanResult) {
            void handleDecoded(scanResult.getText());
          }
        }
      );
      setActiveDeviceId(targetDeviceId);
      setScannerMessage("Camera is live. Hold a ticket QR in frame.");
      setIsScanning(true);
    } catch (scanError) {
      setScannerMessage(null);
      setError(
        scanError instanceof Error
          ? scanError.message
          : "Unable to start the scanner."
      );
      stopScanner();
    }
  }

  async function handleManualSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextCode = extractAccessCode(accessCode);

    if (!nextCode) {
      setError("Enter or scan an access code first.");
      return;
    }

    setError(null);
    await submitAccessCode(nextCode);
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <section className="section-card space-y-6 rounded-[2.4rem] p-6 sm:p-8">
        <div className="space-y-3">
          <StatusBadge label="Operator console" tone="accent" />
          <h2 className="font-[family:var(--font-display)] text-4xl leading-tight text-[color:var(--ink)] sm:text-5xl">
            Move guests through the door without second-guessing the ticket state.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
            The operator checks the live Tiko credential first. Onchain ownership still
            matters for provenance, but the venue should only care whether this pass is
            valid right now.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <LaneCard
            title="Live scanner"
            body="Keep the camera open for the fast lane and fall back to manual code entry when needed."
          />
          <LaneCard
            title="Manual fallback"
            body="Paste any access code or QR payload and Tiko will extract the valid ticket identifier."
          />
          <LaneCard
            title="Duplicate guard"
            body="Backend validation still blocks invalid or already-used passes at the moment of check-in."
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="overflow-hidden rounded-[2rem] border border-[color:rgba(255,255,255,0.08)] bg-[color:#09110d]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-sm text-white/82">
              <p className="eyebrow text-white/78">Scanner feed</p>
              <button
                type="button"
                onClick={isScanning ? stopScanner : handleStartScanner}
                className={buttonClasses({
                  variant: isScanning ? "danger" : "secondary",
                  size: "sm",
                })}
              >
                {isScanning ? (
                  <>
                    <TicketSlash className="h-4 w-4" />
                    Stop scanner
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    Start scanner
                  </>
                )}
              </button>
            </div>
            <div className="relative aspect-[4/3] bg-[radial-gradient(circle_at_top,_rgba(211,71,57,0.18),_transparent_44%),linear-gradient(180deg,#111614,#060908)]">
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 rounded-[2rem] border border-dashed border-white/50 shadow-[0_0_0_9999px_rgba(5,16,12,0.34)]" />
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-[2rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,var(--panel),var(--panel-contrast))] p-5">
            <div>
              <p className="eyebrow text-[color:var(--muted)]">Camera state</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--ink)]">
                {scannerMessage ?? "Use manual mode or start the camera for QR scanning."}
              </p>
            </div>

            {devices.length > 1 ? (
              <label className="space-y-2">
                <span className="text-sm font-medium text-[color:var(--ink)]">Camera</span>
                <select
                  value={activeDeviceId}
                  onChange={(event) => setActiveDeviceId(event.target.value)}
                  className="h-11 w-full rounded-[1rem] border border-[color:var(--line-strong)] bg-[color:var(--panel-input)] px-3 text-sm text-[color:var(--ink)]"
                >
                  {devices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || "Camera device"}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4 text-sm leading-7 text-[color:var(--muted)]">
              <p>Manual fallback stays available at all times.</p>
              <p>QR codes may contain raw access codes or a JSON payload with `accessCode`.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-[color:var(--ink)]">
              Access code or scanned payload
            </span>
            <textarea
              rows={3}
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              placeholder="Paste the access code or let the scanner fill it"
              className="w-full rounded-[1.2rem] border border-[color:var(--line-strong)] bg-[color:var(--panel-input)] px-4 py-3 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent-strong)]"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                  Checking ticket…
                </>
              ) : (
                <>
                  <ScanLine className="h-5 w-5" />
                  Validate ticket
                </>
              )}
            </button>
            <p className="text-sm text-[color:var(--muted)]">
              Use this if the guest opens a copied code, screenshot, or raw QR payload.
            </p>
          </div>
        </form>

        {error ? (
          <div className="rounded-[1.2rem] border border-[color:rgba(162,40,49,0.16)] bg-[color:rgba(162,40,49,0.08)] px-4 py-3 text-sm text-[color:var(--danger)]">
            {error}
          </div>
        ) : null}
      </section>

      <aside className="section-card space-y-5 rounded-[2.4rem] p-6 sm:p-8">
        <div className="space-y-2">
          <p className="eyebrow text-[color:var(--muted)]">Check-in result</p>
          <h3 className="font-[family:var(--font-display)] text-3xl text-[color:var(--ink)]">
            {result ? "Guest status updated" : "Awaiting scan"}
          </h3>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-[1.5rem] border border-[color:rgba(47,111,80,0.16)] bg-[color:rgba(47,111,80,0.08)] p-4 text-[color:var(--success)]">
              <CheckCircle2 className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">{result.statusLabel}</p>
                <p className="text-sm text-[color:var(--ink)]">
                  {result.checkedInAtLabel ?? "Recorded just now"}
                </p>
              </div>
            </div>

            <ResultRow label="Access code" value={result.accessCode} />
            <ResultRow label="Order" value={result.orderReference} />
            <ResultRow label="Guest" value={result.buyerDisplayName ?? result.buyerEmail} />
            <ResultRow label="Event" value={result.eventTitle} hint={result.eventVenue} />
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,var(--panel),var(--panel-contrast))] p-5 text-sm leading-7 text-[color:var(--muted)]">
            <div className="mb-3 flex items-center gap-3 text-[color:var(--warning)]">
              <TriangleAlert className="h-5 w-5" />
              <p className="font-medium text-[color:var(--ink)]">No ticket checked in yet</p>
            </div>
            <p>Use the scanner for a faster lane or paste the access code manually.</p>
            <p>Tiko will block duplicates and invalid entries with the backend state.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function ResultRow(props: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--panel-soft)] p-4">
      <p className="eyebrow text-[color:var(--muted)]">{props.label}</p>
      <p className="mt-2 text-sm font-semibold text-[color:var(--ink)]">{props.value}</p>
      {props.hint ? (
        <p className="mt-2 text-sm text-[color:var(--muted)]">{props.hint}</p>
      ) : null}
    </div>
  );
}

function LaneCard(props: { title: string; body: string }) {
  return (
    <div className="rounded-[1.6rem] border border-[color:var(--line)] bg-[color:var(--panel-soft)] p-4">
      <p className="text-sm font-semibold text-[color:var(--ink)]">{props.title}</p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{props.body}</p>
    </div>
  );
}
