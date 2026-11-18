"use client";

import type { ReactNode } from "react";
import type { ThemeVariant } from "@/lib/gameThemes";

export interface ThemeHorizonBackdropProps {
  themeId: ThemeVariant;
  isReverse: boolean;
  horizonTopPx: number;
  cameraDepth: number;
  skyTop: string;
  skyBottom: string;
  abyssHero?: ReactNode;
}

/**
 * Renders a theme-distinctive surface horizon & sky/arena canopy for each Krillion world.
 * Keeps splash screens and depth-0 launches unmistakably tied to their subject matter.
 */
export function ThemeHorizonBackdrop({
  themeId,
  isReverse,
  horizonTopPx,
  cameraDepth,
  skyTop,
  skyBottom,
  abyssHero,
}: ThemeHorizonBackdropProps) {
  // Reverse sky ascent (/noillirk/ or any reverse climb): emerald meadow + floating clouds
  if (isReverse || themeId === "sky") {
    const groundBottom = Math.max(-220, -cameraDepth * 0.75);
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Sun & halo */}
        <div
          className="absolute right-[14%] top-[10%] h-20 w-20 rounded-full bg-amber-200/35 blur-md"
          aria-hidden="true"
        />
        <div
          className="absolute right-[14.8%] top-[11.2%] h-14 w-14 rounded-full bg-amber-100/80 shadow-[0_0_40px_rgba(253,230,138,0.65)]"
          aria-hidden="true"
        />

        {/* Drifting pixel clouds */}
        <div className="absolute left-[10%] top-[18%] h-7 w-24 rounded-full bg-white/30 blur-[1px]" />
        <div className="absolute left-[14%] top-[16.5%] h-6 w-14 rounded-full bg-white/35" />
        <div className="absolute right-[24%] top-[27%] h-6 w-20 rounded-full bg-white/25 blur-[1px]" />

        {/* Surface meadow launchpad */}
        <div
          className="absolute inset-x-0 h-28 transition-[bottom] duration-700 ease-out"
          style={{ bottom: `${groundBottom}px` }}
        >
          <div className="h-3 w-full bg-gradient-to-r from-emerald-400/70 via-lime-300/80 to-emerald-400/70" />
          <div className="h-full w-full bg-gradient-to-b from-emerald-700/90 via-emerald-900 to-[#062418]" />
        </div>
      </div>
    );
  }

  // Visible sky band only while horizon is on screen or near top
  if (horizonTopPx < -120) {
    return null;
  }

  const skyHeight = Math.max(0, horizonTopPx + 10);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden" style={{ height: `${skyHeight + 70}px` }}>
      {/* Upper sky / rafters / stadium canopy */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: `${skyHeight}px`,
          background: `linear-gradient(180deg, ${skyTop} 0%, ${skyBottom} 100%)`,
        }}
      >
        {/* 1. ABYSS: Sunny horizon, sea shimmer, trawler boat */}
        {themeId === "abyss" && (
          <>
            <div className="absolute right-[15%] top-[18%] h-16 w-16 rounded-full bg-amber-200/35 blur-md" />
            <div className="absolute right-[15.5%] top-[20%] h-10 w-10 rounded-full bg-amber-100/75" />
            <div className="absolute left-[12%] top-[26%] h-4 w-16 rounded-full bg-white/25" />
            <div className="absolute left-[15%] top-[24%] h-4 w-10 rounded-full bg-white/30" />
            <div className="absolute bottom-1 right-[18%] flex items-end justify-center opacity-95">
              {abyssHero}
            </div>
          </>
        )}

        {/* 2. PITCH (Footbillion): Floodlight towers + crisscrossing beams + aerial blimp */}
        {themeId === "pitch" && (
          <>
            {/* Stadium Floodlight Beams */}
            <svg
              viewBox="0 0 1200 220"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full opacity-55"
            >
              <defs>
                <linearGradient id="pitchBeamL" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#d9f99d" stopOpacity="0.48" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="pitchBeamR" x1="1" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fef08a" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Left & right pylons */}
              <rect x="82" y="28" width="8" height="192" fill="#064e3b" />
              <rect x="64" y="18" width="44" height="16" rx="2" fill="#1e293b" stroke="#a3e635" strokeWidth="1.5" />
              <circle cx="75" cy="26" r="3" fill="#fef9c3" />
              <circle cx="86" cy="26" r="3" fill="#fef9c3" />
              <circle cx="97" cy="26" r="3" fill="#fef9c3" />

              <rect x="1110" y="28" width="8" height="192" fill="#064e3b" />
              <rect x="1092" y="18" width="44" height="16" rx="2" fill="#1e293b" stroke="#a3e635" strokeWidth="1.5" />
              <circle cx="1103" cy="26" r="3" fill="#fef9c3" />
              <circle cx="1114" cy="26" r="3" fill="#fef9c3" />
              <circle cx="1125" cy="26" r="3" fill="#fef9c3" />

              <polygon points="86,34 490,220 260,220" fill="url(#pitchBeamL)" />
              <polygon points="1114,34 710,220 940,220" fill="url(#pitchBeamR)" />

              {/* Stadium bowl upper stand silhouette */}
              <path
                d="M0 185 Q 300 135 600 135 Q 900 135 1200 185 L 1200 220 L 0 220 Z"
                fill="#03261a"
                opacity="0.7"
              />
            </svg>
            {/* Stadium Hanging LED Matchday Scoreboard */}
            <div className="animate-bob-slow absolute right-[12%] top-[18%] flex flex-col items-center opacity-95">
              <div className="flex gap-8">
                <span className="h-2.5 w-1 bg-lime-300/60" />
                <span className="h-2.5 w-1 bg-lime-300/60" />
              </div>
              <div className="rounded-md border-2 border-lime-400/75 bg-emerald-950/90 px-3 py-1 font-mono text-[10px] font-black tracking-widest text-lime-300 shadow-[0_0_16px_rgba(163,230,53,0.35)]">
                LIVE · MATCHDAY
              </div>
            </div>
          </>
        )}

        {/* 3. HARDWOOD (NBA): Arena rafters + Hanging Jumbotron Scoreboard + twin warm cones */}
        {themeId === "hardwood" && (
          <svg
            viewBox="0 0 1200 220"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            <defs>
              <linearGradient id="arenaBeam" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#fb923c" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#9a3412" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Rafter trusses */}
            <path d="M0 18 L1200 18 M0 38 L1200 38" stroke="#7c2d12" strokeWidth="2" opacity="0.55" />
            <polygon points="320,10 180,220 460,220" fill="url(#arenaBeam)" />
            <polygon points="880,10 740,220 1020,220" fill="url(#arenaBeam)" />

            {/* Hanging Central Jumbotron */}
            <line x1="560" y1="0" x2="560" y2="34" stroke="#f97316" strokeWidth="2" opacity="0.55" />
            <line x1="640" y1="0" x2="640" y2="34" stroke="#f97316" strokeWidth="2" opacity="0.55" />
            <rect x="515" y="34" width="170" height="58" rx="6" fill="#1e0b05" stroke="#fb923c" strokeWidth="2" />
            <rect x="526" y="43" width="64" height="32" rx="3" fill="#431407" stroke="#f97316" strokeWidth="1" />
            <rect x="610" y="43" width="64" height="32" rx="3" fill="#431407" stroke="#fbbf24" strokeWidth="1" />
            <rect x="542" y="54" width="32" height="10" rx="2" fill="#fdba74" opacity="0.85" />
            <rect x="626" y="54" width="32" height="10" rx="2" fill="#fef08a" opacity="0.85" />
            <rect x="545" y="80" width="110" height="5" rx="2" fill="#f97316" opacity="0.7" />
          </svg>
        )}

        {/* 4. POKEDEX: Poké Center Dome + Radar Dish + Glowing Telemetry Orbit */}
        {themeId === "pokedex" && (
          <svg
            viewBox="0 0 1200 220"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            {/* Telemetry radar rings */}
            <circle cx="930" cy="115" r="78" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="5 6" opacity="0.35" />
            <circle cx="930" cy="115" r="46" fill="none" stroke="#f43f5e" strokeWidth="1.5" opacity="0.45" />
            <circle cx="930" cy="115" r="14" fill="#fb7185" opacity="0.4" />
            {/* Poké Lab Dome on horizon */}
            <path d="M120 220 A 110 85 0 0 1 340 220 Z" fill="#4c0519" stroke="#fb7185" strokeWidth="2" opacity="0.8" />
            <path d="M175 220 A 55 42 0 0 1 285 220 Z" fill="#881337" stroke="#38bdf8" strokeWidth="1.5" opacity="0.85" />
            {/* Antenna spire */}
            <line x1="230" y1="135" x2="230" y2="85" stroke="#fda4af" strokeWidth="2.5" />
            <circle cx="230" cy="82" r="5" fill="#38bdf8" />
          </svg>
        )}

        {/* 5. ATLAS (Geography): Globe meridian dome + retro survey zeppelin */}
        {themeId === "atlas" && (
          <svg
            viewBox="0 0 1200 220"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            {/* Cartographic globe arc behind horizon */}
            <circle cx="600" cy="250" r="210" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.32" />
            <ellipse cx="600" cy="250" rx="110" ry="210" fill="none" stroke="#fbbf24" strokeWidth="1.2" opacity="0.28" />
            <line x1="390" y1="175" x2="810" y2="175" stroke="#38bdf8" strokeWidth="1" opacity="0.25" />
            {/* Distant mountain range silhouettes */}
            <polygon points="0,220 90,155 180,220 290,138 410,220" fill="#164e63" opacity="0.6" />
            <polygon points="790,220 910,145 1020,220 1110,160 1200,220" fill="#164e63" opacity="0.6" />
            {/* Retro Survey Zeppelin */}
            <g transform="translate(880, 56)" opacity="0.88">
              <ellipse cx="48" cy="18" rx="44" ry="15" fill="#0e7490" stroke="#fde047" strokeWidth="1.8" />
              <line x1="12" y1="18" x2="84" y2="18" stroke="#fef08a" strokeWidth="1.5" />
              <rect x="34" y="33" width="28" height="7" rx="2" fill="#083344" stroke="#38bdf8" strokeWidth="1" />
              <polygon points="4,10 14,18 4,26" fill="#facc15" />
            </g>
          </svg>
        )}

        {/* 6. CINEMA: Sweeping Premiere Searchlights + Marquee Arch */}
        {themeId === "cinema" && (
          <svg
            viewBox="0 0 1200 220"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            <defs>
              <linearGradient id="cinemaBeam" x1="0.5" y1="1" x2="0.5" y2="0">
                <stop offset="0%" stopColor="#fde047" stopOpacity="0.46" />
                <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points="210,220 40,0 160,0" fill="url(#cinemaBeam)" />
            <polygon points="240,220 420,0 530,0" fill="url(#cinemaBeam)" />
            <polygon points="990,220 820,0 940,0" fill="url(#cinemaBeam)" />
            <polygon points="960,220 1140,0 1200,0" fill="url(#cinemaBeam)" />
            {/* Theater silhouette dome */}
            <rect x="460" y="150" width="280" height="70" rx="6" fill="#2e1065" stroke="#f59e0b" strokeWidth="2" opacity="0.75" />
            <rect x="485" y="164" width="230" height="22" rx="3" fill="#4c1d95" stroke="#fde047" strokeWidth="1.5" />
            <circle cx="505" cy="175" r="3" fill="#fde047" />
            <circle cx="535" cy="175" r="3" fill="#f43f5e" />
            <circle cx="665" cy="175" r="3" fill="#f43f5e" />
            <circle cx="695" cy="175" r="3" fill="#fde047" />
          </svg>
        )}

        {/* 7. STADIUM (Sports): Olympic Grandstand + Blazing Flame Cauldron */}
        {themeId === "stadium" && (
          <svg
            viewBox="0 0 1200 220"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            {/* Olympic tiered grandstand silhouette */}
            <path
              d="M0 190 L 180 140 L 1020 140 L 1200 190 L 1200 220 L 0 220 Z"
              fill="#3f1018"
              opacity="0.75"
            />
            <line x1="180" y1="158" x2="1020" y2="158" stroke="#fb923c" strokeWidth="1.2" opacity="0.35" />
            <line x1="120" y1="176" x2="1080" y2="176" stroke="#fbbf24" strokeWidth="1.2" opacity="0.3" />

            {/* Olympic Torch Cauldron on right terrace */}
            <g transform="translate(960, 72)">
              <polygon points="18,148 34,82 46,82 62,148" fill="#7c2d12" stroke="#f59e0b" strokeWidth="1.5" />
              <polygon points="16,70 64,70 54,84 26,84" fill="#9a3412" stroke="#fbbf24" strokeWidth="1.5" />
              {/* Flame */}
              <path
                d="M40 16 C 55 34, 58 56, 40 68 C 22 56, 25 34, 40 16 Z"
                fill="#f97316"
                opacity="0.9"
              />
              <path
                d="M40 30 C 48 42, 48 56, 40 66 C 32 56, 32 42, 40 30 Z"
                fill="#fde047"
              />
            </g>
          </svg>
        )}
      </div>

      {/* Horizon Divider Line / Turf Crest / Track Ribbon at `horizonTopPx` */}
      <div
        className="absolute inset-x-0"
        style={{ top: `${horizonTopPx}px` }}
      >
        {themeId === "abyss" && (
          <div className="h-3 w-full border-t-2 border-cyan-300/65 bg-gradient-to-b from-cyan-400/35 to-transparent" />
        )}
        {themeId === "pitch" && (
          <div className="h-4 w-full border-t-2 border-lime-300/80 bg-gradient-to-b from-emerald-500/45 to-transparent shadow-[0_0_16px_rgba(163,230,53,0.45)]" />
        )}
        {themeId === "hardwood" && (
          <div className="h-3.5 w-full border-t-2 border-amber-300/80 bg-gradient-to-b from-orange-500/45 to-transparent shadow-[0_0_16px_rgba(251,146,60,0.45)]" />
        )}
        {themeId === "pokedex" && (
          <div className="flex h-4 w-full items-start overflow-hidden border-t-2 border-emerald-400/75 bg-gradient-to-b from-emerald-600/35 to-transparent">
            <div className="h-2 w-full bg-[repeating-linear-gradient(125deg,rgba(52,211,153,0.45)_0_6px,transparent_6px_14px)]" />
          </div>
        )}
        {themeId === "atlas" && (
          <div className="h-3.5 w-full border-t-2 border-dashed border-amber-300/75 bg-gradient-to-b from-sky-400/30 to-transparent" />
        )}
        {themeId === "cinema" && (
          <div className="h-3.5 w-full border-t-2 border-amber-300/80 bg-gradient-to-b from-rose-600/45 to-transparent shadow-[0_0_18px_rgba(244,63,94,0.45)]" />
        )}
        {themeId === "stadium" && (
          <div className="h-4 w-full border-t-2 border-amber-200/85 bg-gradient-to-b from-rose-500/45 to-transparent shadow-[0_0_16px_rgba(251,146,60,0.45)]" />
        )}
      </div>
    </div>
  );
}
