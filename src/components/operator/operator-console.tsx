"use client";

import { useRef, useState, useTransition } from "react";
import { BrowserCodeReader, BrowserQRCodeReader } from "@zxing/browser";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  ClipboardCheck,
  LoaderCircle,
  ScanLine,
  Ticket,
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
  const [activeDeviceId, setActiveDeviceId] = useState("");
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
        submitError instanceof Error ? submitError.message : "Check-in failed."
      );
      startSubmitting(() => {
        setResult(null);
      });
    }
  }

  async function handleDecoded(value: string) {
    const nextCode = extractAccessCode(value);
    setAccessCode(nextCode);
    setScannerMessage("Ticket scanned. Checking entry…");
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
      setScannerMessage("Camera is live. Hold the ticket QR inside the frame.");
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
      setError("Enter or scan a ticket code first.");
      return;
    }

    setError(null);
    await submitAccessCode(nextCode);
  }

  return (
    <div className="space-y-6">
      <section className="section-card rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <StatusBadge label="Operations" tone="accent" />
            <div className="space-y-2">
              <h1 className="font-[family:var(--font-display)] text-4xl leading-tight text-[color:var(--ink)] sm:text-5xl">
                Check in guests.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
                Scan a ticket or paste a code to record entry.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[30rem]">
            <SummaryCard
              icon={<Camera className="h-4 w-4" />}
              label="Scanner"
              value={isScanning ? "Live" : "Ready"}
              hint={isScanning ? "Camera active" : "Ready when doors open"}
            />
            <SummaryCard
              icon={<ClipboardCheck className="h-4 w-4" />}
              label="Manual entry"
              value="Available"
              hint="Paste a code if needed"
            />
            <SummaryCard
              icon={<Ticket className="h-4 w-4" />}
              label="Latest result"
              value={result?.statusLabel ?? "Waiting"}
              hint={result?.orderReference ?? "No recent check-in"}
            />
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[1.2rem] border border-[color:rgba(162,40,49,0.16)] bg-[color:rgba(162,40,49,0.08)] px-4 py-3 text-sm text-[color:var(--danger)]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(21rem,0.8fr)]">
        <div className="space-y-6">
          <section className="section-card overflow-hidden rounded-[2rem]">
            <div className="flex flex-col gap-4 border-b border-[color:var(--line)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[color:var(--ink)]">Scanner</h2>
                <p className="text-sm text-[color:var(--muted)]">
                  Use the camera to scan tickets at the door.
                </p>
              </div>

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
                    <CameraOff className="h-4 w-4" />
                    Stop camera
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    Start camera
                  </>
                )}
              </button>
            </div>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_19rem]">
              <div className="relative aspect-[4/3] bg-[color:#0b0f10]">
                <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-52 w-52 rounded-[1.5rem] border-2 border-white/70 shadow-[0_0_0_9999px_rgba(5,8,10,0.38)]" />
                </div>
                {!isScanning ? (
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/82">
                    <ScanLine className="h-8 w-8" />
                    <p className="text-sm">Camera preview appears here</p>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4 border-t border-[color:var(--line)] p-5 lg:border-l lg:border-t-0">
                <InfoPanel
                  label="Status"
                  value={scannerMessage ?? "Start the camera or use manual entry."}
                />

                {devices.length > 1 ? (
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-[color:var(--ink)]">
                      Camera
                    </span>
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

                <div className="rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--panel-soft)] p-4 text-sm leading-6 text-[color:var(--muted)]">
                  <p className="font-medium text-[color:var(--ink)]">Tip</p>
                  <p className="mt-2">
                    Hold the QR inside the frame and keep glare low.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="section-card rounded-[2rem] p-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[color:var(--ink)]">
                Manual entry
              </h2>
              <p className="text-sm text-[color:var(--muted)]">
                Paste a ticket code or QR payload if the camera is unavailable.
              </p>
            </div>

            <form onSubmit={handleManualSubmit} className="mt-5 space-y-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[color:var(--ink)]">
                  Ticket code or QR payload
                </span>
                <textarea
                  rows={4}
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value)}
                  placeholder="Paste the ticket code or QR payload"
                  className="w-full rounded-[1.2rem] border border-[color:var(--line-strong)] bg-[color:var(--panel-input)] px-4 py-3 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent-strong)]"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[color:var(--muted)]">
                  Accepted formats: ticket code or a QR payload containing
                  <span className="font-mono"> accessCode</span>.
                </p>

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
              </div>
            </form>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="section-card rounded-[2rem] p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="eyebrow text-[color:var(--muted)]">Latest result</p>
                <h2 className="font-[family:var(--font-display)] text-3xl text-[color:var(--ink)]">
                  {result ? "Check-in complete" : "Waiting for ticket"}
                </h2>
              </div>
              {result ? <StatusBadge label={result.statusLabel} tone="success" /> : null}
            </div>

            {result ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-[1rem] border border-[color:rgba(47,111,80,0.16)] bg-[color:rgba(47,111,80,0.08)] p-4">
                  <div className="flex items-center gap-3 text-[color:var(--success)]">
                    <CheckCircle2 className="h-5 w-5" />
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--ink)]">
                        {result.buyerDisplayName ?? result.buyerEmail}
                      </p>
                      <p className="text-sm text-[color:var(--muted)]">
                        {result.checkedInAtLabel ?? "Checked in just now"}
                      </p>
                    </div>
                  </div>
                </div>

                <ResultRow label="Booking" value={result.orderReference} />
                <ResultRow label="Ticket code" value={result.accessCode} />
                <ResultRow
                  label="Guest"
                  value={result.buyerDisplayName ?? result.buyerEmail}
                />
                <ResultRow
                  label="Event"
                  value={result.eventTitle}
                  hint={result.eventVenue}
                />
              </div>
            ) : (
              <div className="mt-5 rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--panel-soft)] p-4 text-sm leading-6 text-[color:var(--muted)]">
                No ticket has been checked in yet. Scan a QR code or use manual entry
                to record the next guest.
              </div>
            )}
          </section>

          <section className="section-card rounded-[2rem] p-6">
            <div className="space-y-2">
              <p className="eyebrow text-[color:var(--muted)]">Process</p>
              <h2 className="text-xl font-semibold text-[color:var(--ink)]">
                Door workflow
              </h2>
            </div>

            <div className="mt-4 space-y-3">
              <ProcessStep
                step="1"
                title="Scan or paste"
                body="Capture the guest ticket with the camera or use manual entry."
              />
              <ProcessStep
                step="2"
                title="Review the result"
                body="Confirm the guest name, booking reference, and event details."
              />
              <ProcessStep
                step="3"
                title="Admit the guest"
                body="Allow entry only after a successful check-in result is shown."
              />
            </div>
          </section>

          {!result && !error ? (
            <section className="section-card rounded-[2rem] p-6">
              <div className="flex items-start gap-3 text-[color:var(--warning)]">
                <TriangleAlert className="mt-0.5 h-5 w-5" />
                <div className="space-y-2 text-sm leading-6 text-[color:var(--muted)]">
                  <p className="font-medium text-[color:var(--ink)]">Entry checks</p>
                  <p>
                    The system blocks invalid tickets and duplicate check-ins
                    automatically.
                  </p>
                </div>
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function SummaryCard(props: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--panel-soft)] p-4">
      <div className="flex items-center gap-2 text-[color:var(--utility)]">
        {props.icon}
        <p className="text-sm font-semibold text-[color:var(--ink)]">{props.label}</p>
      </div>
      <p className="mt-3 text-sm font-semibold text-[color:var(--ink)]">{props.value}</p>
      <p className="mt-1 text-sm text-[color:var(--muted)]">{props.hint}</p>
    </div>
  );
}

function InfoPanel(props: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--panel-soft)] p-4">
      <p className="eyebrow text-[color:var(--muted)]">{props.label}</p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--ink)]">{props.value}</p>
    </div>
  );
}

function ResultRow(props: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--panel-soft)] p-4">
      <p className="eyebrow text-[color:var(--muted)]">{props.label}</p>
      <p className="mt-2 text-sm font-semibold text-[color:var(--ink)]">{props.value}</p>
      {props.hint ? (
        <p className="mt-1 text-sm text-[color:var(--muted)]">{props.hint}</p>
      ) : null}
    </div>
  );
}

function ProcessStep(props: { step: string; title: string; body: string }) {
  return (
    <div className="rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--panel-soft)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[color:var(--ink)]">{props.title}</p>
        <span className="eyebrow text-[color:var(--muted)]">{props.step}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{props.body}</p>
    </div>
  );
}
