export type EventArtwork = {
  heroSrc: string;
  portraitSrc: string;
  squareSrc: string;
  heroAlt: string;
  portraitAlt: string;
  squareAlt: string;
};

const defaultArtwork: EventArtwork = {
  heroSrc: "/images/events/global-creator-summit-2026/hero-banner.png",
  portraitSrc: "/images/events/global-creator-summit-2026/poster-portrait.png",
  squareSrc: "/images/events/global-creator-summit-2026/poster-square.png",
  heroAlt: "Editorial banner artwork for Tiko Global Creator Summit 2026.",
  portraitAlt: "Portrait campaign poster artwork for Tiko Global Creator Summit 2026.",
  squareAlt: "Square campaign artwork for Tiko Global Creator Summit 2026.",
};

export function getEventArtwork(slug?: string | null): EventArtwork {
  if (slug === "global-access-pass" || slug === "global-creator-summit-2026") {
    return defaultArtwork;
  }

  return defaultArtwork;
}
