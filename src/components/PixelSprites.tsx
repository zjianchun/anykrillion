"use client";

import type { ThemeVariant } from "@/lib/gameThemes";

/** Iconic Neon-Pink Pixel Krill Sprite */
export function PixelKrillSprite({
  glow = false,
  className = "h-12 w-12",
}: {
  glow?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={`${className} ${glow ? "drop-shadow-[0_0_16px_rgba(251,191,36,0.95)]" : "drop-shadow-[0_0_10px_rgba(244,63,94,0.85)]"}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {/* Golden aura ring when One in a Krillion */}
      {glow && (
        <circle cx="16" cy="17" r="14" fill="none" stroke="#fde047" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
      )}
      {/* Antennae */}
      <rect x="14" y="4" width="2" height="2" fill="#fda4af" />
      <rect x="16" y="3" width="3" height="1" fill="#fb7185" />
      <rect x="19" y="4" width="2" height="2" fill="#fda4af" />
      <rect x="13" y="6" width="2" height="3" fill="#fb7185" />
      {/* Head / Carapace */}
      <rect x="13" y="9" width="7" height="3" fill="#ff2a6d" />
      <rect x="11" y="12" width="9" height="4" fill="#ff2a6d" />
      <rect x="12" y="10" width="5" height="2" fill="#ff5c8d" />
      {/* Glowing Eye */}
      <rect x="16" y="11" width="2" height="2" fill="#03111f" />
      <rect x="17" y="11" width="1" height="1" fill="#fef08a" />
      {/* Abdomen / Curved Tail Segments */}
      <rect x="12" y="16" width="8" height="3" fill="#e11d48" />
      <rect x="14" y="19" width="7" height="3" fill="#ff2a6d" />
      <rect x="16" y="22" width="6" height="3" fill="#be123c" />
      {/* Tail Fan */}
      <rect x="13" y="25" width="4" height="2" fill="#fb7185" />
      <rect x="10" y="26" width="3" height="2" fill="#fda4af" />
      {/* Swimming Legs */}
      <rect x="9" y="14" width="2" height="1" fill="#fda4af" />
      <rect x="8" y="16" width="3" height="1" fill="#fb7185" />
      <rect x="9" y="18" width="3" height="1" fill="#fda4af" />
      <rect x="11" y="20" width="3" height="1" fill="#fb7185" />
    </svg>
  );
}

/** Surface Pixel Fishing Trawler Boat with Pink Mast Flag */
export function PixelBoatSprite({ className = "w-28 h-16" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 36"
      className={className}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {/* Flag & Mast */}
      <rect x="33" y="4" width="2" height="18" fill="#0f2942" />
      <polygon points="33,5 21,8 33,12" fill="#ff2a6d" />
      {/* Wheelhouse Cabin */}
      <rect x="26" y="14" width="14" height="8" fill="#112236" />
      <rect x="29" y="16" width="4" height="4" fill="#38bdf8" opacity="0.85" />
      <rect x="35" y="16" width="3" height="4" fill="#38bdf8" opacity="0.65" />
      {/* Deck / Hull */}
      <rect x="8" y="22" width="48" height="4" fill="#0b192c" />
      <rect x="10" y="26" width="42" height="4" fill="#071322" />
      <rect x="14" y="30" width="32" height="3" fill="#040c17" />
      {/* Bow Highlight */}
      <rect x="46" y="21" width="10" height="2" fill="#38bdf8" opacity="0.35" />
    </svg>
  );
}

/** Hot-Air Balloon Sprite for Noillirk Reverse Ascent Mode */
export function PixelBalloonSprite({
  glow = false,
  className = "h-14 w-12",
}: {
  glow?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 36"
      className={`${className} ${glow ? "drop-shadow-[0_0_16px_rgba(251,191,36,0.9)]" : "drop-shadow-[0_0_10px_rgba(245,158,11,0.75)]"}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {/* Envelope */}
      <rect x="10" y="2" width="12" height="3" fill="#f59e0b" />
      <rect x="7" y="5" width="18" height="4" fill="#fbbf24" />
      <rect x="5" y="9" width="22" height="6" fill="#f97316" />
      <rect x="7" y="15" width="18" height="4" fill="#ec4899" />
      <rect x="10" y="19" width="12" height="3" fill="#f59e0b" />
      {/* Center Vertical Stripes */}
      <rect x="14" y="2" width="4" height="20" fill="#fef08a" opacity="0.85" />
      {/* Ropes & Burner */}
      <rect x="12" y="22" width="1" height="5" fill="#cbd5e1" />
      <rect x="19" y="22" width="1" height="5" fill="#cbd5e1" />
      <rect x="15" y="23" width="2" height="3" fill="#fde047" />
      {/* Wicker Basket */}
      <rect x="11" y="27" width="10" height="6" fill="#92400e" />
      <rect x="12" y="28" width="8" height="2" fill="#b45309" />
    </svg>
  );
}

/** Theme Protagonist Emblem during dive/ascent */
export function ThemeHeroSprite({
  themeId,
  glow = false,
  className = "h-12 w-12",
}: {
  themeId: ThemeVariant;
  glow?: boolean;
  className?: string;
}) {
  if (themeId === "sky") {
    return <PixelBalloonSprite glow={glow} className={className} />;
  }
  if (themeId === "pitch") {
    return (
      <svg viewBox="0 0 32 32" className={`${className} drop-shadow-[0_0_12px_rgba(74,222,128,0.85)]`} aria-hidden="true">
        <circle cx="16" cy="16" r="12" fill="#f8fafc" stroke="#16a34a" strokeWidth="2" />
        <polygon points="16,9 21,13 19,19 13,19 11,13" fill="#0f172a" />
        <line x1="16" y1="4" x2="16" y2="9" stroke="#0f172a" strokeWidth="1.5" />
        <line x1="27" y1="12" x2="21" y2="13" stroke="#0f172a" strokeWidth="1.5" />
        <line x1="5" y1="12" x2="11" y2="13" stroke="#0f172a" strokeWidth="1.5" />
        <line x1="9" y1="26" x2="13" y2="19" stroke="#0f172a" strokeWidth="1.5" />
        <line x1="23" y1="26" x2="19" y2="19" stroke="#0f172a" strokeWidth="1.5" />
      </svg>
    );
  }
  if (themeId === "hardwood") {
    return (
      <svg viewBox="0 0 32 32" className={`${className} drop-shadow-[0_0_12px_rgba(251,146,60,0.85)]`} aria-hidden="true">
        <circle cx="16" cy="16" r="12" fill="#f97316" stroke="#7c2d12" strokeWidth="2" />
        <line x1="4" y1="16" x2="28" y2="16" stroke="#7c2d12" strokeWidth="1.6" />
        <line x1="16" y1="4" x2="16" y2="28" stroke="#7c2d12" strokeWidth="1.6" />
        <path d="M8 7C12 12 12 20 8 25" fill="none" stroke="#7c2d12" strokeWidth="1.5" />
        <path d="M24 7C20 12 20 20 24 25" fill="none" stroke="#7c2d12" strokeWidth="1.5" />
      </svg>
    );
  }
  if (themeId === "pokedex") {
    return (
      <svg viewBox="0 0 32 32" className={`${className} drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]`} aria-hidden="true">
        <circle cx="16" cy="16" r="12" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
        <path d="M4 16A12 12 0 0 1 28 16Z" fill="#ef4444" />
        <rect x="4" y="14.5" width="24" height="3" fill="#0f172a" />
        <circle cx="16" cy="16" r="4.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
        <circle cx="16" cy="16" r="2" fill="#38bdf8" />
      </svg>
    );
  }
  if (themeId === "atlas") {
    return (
      <svg viewBox="0 0 32 32" className={`${className} drop-shadow-[0_0_12px_rgba(45,212,191,0.85)]`} aria-hidden="true">
        <circle cx="16" cy="16" r="12" fill="#042f2e" stroke="#2dd4bf" strokeWidth="2" />
        <polygon points="16,6 19,16 16,14 13,16" fill="#fb7185" />
        <polygon points="16,26 19,16 16,18 13,16" fill="#5eead4" />
        <circle cx="16" cy="16" r="2" fill="#fef08a" />
      </svg>
    );
  }
  if (themeId === "cinema") {
    return (
      <svg viewBox="0 0 32 32" className={`${className} drop-shadow-[0_0_12px_rgba(192,132,252,0.85)]`} aria-hidden="true">
        <circle cx="16" cy="16" r="12" fill="#2e1065" stroke="#fde047" strokeWidth="2" />
        <circle cx="16" cy="16" r="3" fill="#fde047" />
        <circle cx="16" cy="9" r="2.3" fill="#e9d5ff" />
        <circle cx="16" cy="23" r="2.3" fill="#e9d5ff" />
        <circle cx="9" cy="16" r="2.3" fill="#e9d5ff" />
        <circle cx="23" cy="16" r="2.3" fill="#e9d5ff" />
      </svg>
    );
  }
  if (themeId === "stadium") {
    return (
      <svg viewBox="0 0 32 32" className={`${className} drop-shadow-[0_0_12px_rgba(56,189,248,0.85)]`} aria-hidden="true">
        <path d="M9 6H23V14C23 18.5 19.8 21.5 16 21.5C12.2 21.5 9 18.5 9 14V6Z" fill="#fbbf24" />
        <rect x="14" y="21" width="4" height="5" fill="#f59e0b" />
        <rect x="10" y="26" width="12" height="3" fill="#fcd34d" />
        <path d="M9 8H5V12C5 14 7 15 9 15" fill="none" stroke="#fcd34d" strokeWidth="2" />
        <path d="M23 8H27V12C27 14 25 15 23 15" fill="none" stroke="#fcd34d" strokeWidth="2" />
      </svg>
    );
  }

  return <PixelKrillSprite glow={glow} className={className} />;
}

/** Creature / Reward Tier Sprite shown upon landing at depth */
export function TierCreatureSprite({
  points,
  isMiss,
  themeId,
}: {
  points: number;
  isMiss: boolean;
  themeId: ThemeVariant;
}) {
  if (isMiss || points <= 0) {
    return (
      <svg viewBox="0 0 40 40" className="h-14 w-14 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]" aria-hidden="true">
        <circle cx="15" cy="22" r="7" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 2" />
        <circle cx="26" cy="14" r="5" fill="none" stroke="#fb7185" strokeWidth="2" />
        <circle cx="23" cy="28" r="3" fill="none" stroke="#64748b" strokeWidth="1.8" />
      </svg>
    );
  }

  if (points >= 85) {
    return <ThemeHeroSprite themeId={themeId} glow={true} className="h-16 w-16" />;
  }

  if (points >= 55) {
    // Deep Diver Bioluminescent Jellyfish
    return (
      <svg viewBox="0 0 40 40" className="h-14 w-14 drop-shadow-[0_0_14px_rgba(34,211,238,0.85)]" shapeRendering="crispEdges" aria-hidden="true">
        <rect x="12" y="8" width="16" height="4" fill="#67e8f9" />
        <rect x="9" y="12" width="22" height="7" fill="#22d3ee" />
        <rect x="12" y="14" width="6" height="3" fill="#a5f3fc" />
        <rect x="12" y="19" width="2" height="12" fill="#06b6d4" />
        <rect x="17" y="19" width="2" height="15" fill="#67e8f9" />
        <rect x="22" y="19" width="2" height="13" fill="#06b6d4" />
        <rect x="27" y="19" width="2" height="10" fill="#22d3ee" />
      </svg>
    );
  }

  if (points >= 25) {
    // Schooler Tropical Blue Fish
    return (
      <svg viewBox="0 0 40 40" className="h-14 w-14 drop-shadow-[0_0_12px_rgba(56,189,248,0.75)]" shapeRendering="crispEdges" aria-hidden="true">
        <rect x="12" y="14" width="16" height="10" fill="#38bdf8" />
        <rect x="15" y="12" width="10" height="14" fill="#0ea5e9" />
        <rect x="7" y="15" width="5" height="8" fill="#0284c7" />
        <rect x="5" y="13" width="3" height="12" fill="#38bdf8" />
        <rect x="25" y="16" width="2" height="2" fill="#0f172a" />
        <rect x="26" y="16" width="1" height="1" fill="#f8fafc" />
      </svg>
    );
  }

  // Plankton Bubble Cluster
  return (
    <svg viewBox="0 0 40 40" className="h-14 w-14 drop-shadow-[0_0_10px_rgba(148,163,184,0.65)]" aria-hidden="true">
      <circle cx="17" cy="18" r="8" fill="#64748b" fillOpacity="0.45" stroke="#cbd5e1" strokeWidth="1.5" />
      <circle cx="14" cy="15" r="2.2" fill="#e2e8f0" opacity="0.7" />
      <circle cx="27" cy="24" r="5" fill="#475569" fillOpacity="0.5" stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx="24" cy="11" r="3" fill="#94a3b8" fillOpacity="0.4" stroke="#cbd5e1" strokeWidth="1.2" />
    </svg>
  );
}
