import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";

import { env } from "@/lib/env";

const MAX_EVENT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const EVENT_IMAGE_UPLOADS_PREFIX = "/uploads/events/";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function hasSignature(buffer: Uint8Array, signature: number[]) {
  if (buffer.length < signature.length) {
    return false;
  }

  return signature.every((byte, index) => buffer[index] === byte);
}

type EventImageFormat = "jpg" | "png" | "webp" | "avif";

function getImageExtensionFromBytes(buffer: Uint8Array): EventImageFormat | null {
  if (hasSignature(buffer, [0xff, 0xd8, 0xff])) {
    return "jpg";
  }

  if (hasSignature(buffer, [0x89, 0x50, 0x4e, 0x47])) {
    return "png";
  }

  if (
    buffer.length >= 12 &&
    String.fromCharCode(...buffer.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...buffer.slice(8, 12)) === "WEBP"
  ) {
    return "webp";
  }

  if (
    buffer.length >= 12 &&
    String.fromCharCode(...buffer.slice(4, 8)) === "ftyp" &&
    (
      String.fromCharCode(...buffer.slice(8, 12)) === "avif" ||
      String.fromCharCode(...buffer.slice(8, 12)) === "avis"
    )
  ) {
    return "avif";
  }

  return null;
}

function getImageExtension(buffer: Uint8Array): EventImageFormat {
  const fromBytes = getImageExtensionFromBytes(buffer);

  if (fromBytes) {
    return fromBytes;
  }

  throw new Error("Event image must be a JPG, PNG, WebP, or AVIF file.");
}

export function getEventImageContentType(buffer: Uint8Array) {
  const format = getImageExtensionFromBytes(buffer);

  switch (format) {
    case "jpg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    default:
      return null;
  }
}

export function toServedEventImageSrc(imageSrc: string | null | undefined) {
  if (!imageSrc) {
    return null;
  }

  if (imageSrc.startsWith("/api/event-images/")) {
    return imageSrc;
  }

  if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
    const encoded = encodeURIComponent(imageSrc);
    return `/api/event-images/${encoded}`;
  }

  if (imageSrc.startsWith(EVENT_IMAGE_UPLOADS_PREFIX)) {
    const fileName = imageSrc.slice(EVENT_IMAGE_UPLOADS_PREFIX.length);
    return `/api/event-images/${encodeURIComponent(fileName)}`;
  }

  return imageSrc;
}

export async function saveUploadedEventImage(params: {
  eventTitle: string;
  file: File;
}) {
  if (params.file.size > MAX_EVENT_IMAGE_SIZE_BYTES) {
    throw new Error("Event image must be 5 MB or smaller.");
  }

  const fileBuffer = new Uint8Array(await params.file.arrayBuffer());
  const extension = getImageExtension(fileBuffer);
  const fileName = `${slugify(params.eventTitle) || "event"}-${randomUUID()}.${extension}`;
  const relativePath = `${EVENT_IMAGE_UPLOADS_PREFIX}${fileName}`;

  if (env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`events/${fileName}`, Buffer.from(fileBuffer), {
      access: "private",
      addRandomSuffix: false,
      contentType: getEventImageContentType(fileBuffer) ?? "application/octet-stream",
    });

    return blob.pathname;
  }

  const outputDirectory = path.join(process.cwd(), "public", "uploads", "events");
  const outputPath = path.join(outputDirectory, fileName);

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, Buffer.from(fileBuffer));

  return relativePath;
}

export async function fetchStoredEventImage(imageIdentifier: string) {
  if (imageIdentifier.startsWith("http://") || imageIdentifier.startsWith("https://")) {
    const blob = await get(imageIdentifier, {
      access: "private",
      useCache: true,
    });

    if (!blob || blob.statusCode !== 200) {
      return null;
    }

    const response = new Response(blob.stream);

    return {
      contentType: blob.blob.contentType,
      cacheControl: blob.blob.cacheControl,
      body: Buffer.from(await response.arrayBuffer()),
    };
  }

  return null;
}
