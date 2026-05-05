export type EventArtwork = {
  heroSrc: string;
  portraitSrc: string;
  squareSrc: string;
  heroAlt: string;
  portraitAlt: string;
  squareAlt: string;
  unoptimized?: boolean;
};

type EventArtworkInput = {
  imageSrc?: string | null;
  title?: string | null;
};

const defaultArtwork: EventArtwork = {
  heroSrc: "/images/events/global-creator-summit-2026/hero-banner.png",
  portraitSrc: "/images/events/global-creator-summit-2026/poster-portrait.png",
  squareSrc: "/images/events/global-creator-summit-2026/poster-square.png",
  heroAlt: "Editorial banner artwork for Tiko Global Creator Summit 2026.",
  portraitAlt: "Portrait campaign poster artwork for Tiko Global Creator Summit 2026.",
  squareAlt: "Square campaign artwork for Tiko Global Creator Summit 2026.",
};

export function getEventArtwork(input?: EventArtworkInput): EventArtwork {
  if (input?.imageSrc) {
    const title = input.title?.trim() || "Event";
    const unoptimized =
      !input.imageSrc.startsWith("/") ||
      input.imageSrc.startsWith("/uploads/events/") ||
      input.imageSrc.startsWith("/api/event-images/");

    return {
      heroSrc: input.imageSrc,
      portraitSrc: input.imageSrc,
      squareSrc: input.imageSrc,
      heroAlt: `${title} event artwork.`,
      portraitAlt: `${title} event poster.`,
      squareAlt: `${title} event image.`,
      unoptimized,
    };
  }

  return defaultArtwork;
}
