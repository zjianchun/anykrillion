"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { PixelBoatSprite, ThemeHeroSprite } from "@/components/PixelSprites";
import type { ThemeVariant } from "@/lib/gameThemes";

interface OceanDiveSceneProps {
  /** Current animated camera depth (or altitude in feet if isReverse) */
  cameraDepth: number;
  isReverse: boolean;
  themeId: ThemeVariant;
  phase: "splash" | "countdown" | "playing" | "sinking" | "revealed" | "summary";
  /** Text displayed on the weighted descending plaque during "sinking" */
  sinkingPlaqueText?: string;
  children: ReactNode;
}

const PX_PER_METER = 3.1;
const SURFACE_OFFSET_PX = 165; // When cameraDepth == 0, horizon sits near upper-third of the viewport

interface WorldMarker {
  depth: number;
  label: string;
  sublabel?: string;
  accent?: string;
}

const DIVE_MARKERS: WorldMarker[] = [
  { depth: 50, label: "— light begins to fade", accent: "text-cyan-200/55" },
  { depth: 100, label: "PLANKTON · 10", sublabel: "crowd favorite zone", accent: "text-rose-300/75" },
  { depth: 200, label: "most sunlight stops here", accent: "text-cyan-300/55" },
  { depth: 300, label: "SCHOOLER · 30", sublabel: "moderate depth", accent: "text-sky-300/80" },
  { depth: 332, label: "deepest scuba dive ever · -332m", accent: "text-slate-300/50" },
  { depth: 550, label: "TWILIGHT ZONE · -550m", accent: "text-indigo-300/60" },
  { depth: 700, label: "DEEP DIVER · 70", sublabel: "rare knowledge band", accent: "text-cyan-300/85" },
  { depth: 1000, label: "ONE IN A KRILLION · 100", sublabel: "single-question max sink", accent: "text-amber-300/90" },
  { depth: 1500, label: "giant squid hunting ground", accent: "text-purple-300/60" },
  { depth: 2200, label: "MIDNIGHT ZONE · -2,200m", accent: "text-slate-400/60" },
  { depth: 3000, label: "sunken shipwreck abyss", accent: "text-cyan-400/65" },
  { depth: 4000, label: "ABYSSAL PLAIN · -4,000m", accent: "text-emerald-300/75" },
  { depth: 5000, label: "HADAL TRENCH · -5,000m", accent: "text-amber-300/80" },
  { depth: 6200, label: "CHALLENGER DEEP TRAIL", accent: "text-emerald-300/90" },
];

const SKY_MARKERS: WorldMarker[] = [
  { depth: 50, label: "treetop updraft", accent: "text-emerald-200/65" },
  { depth: 100, label: "DEEP CUT PENALTY · 10", sublabel: "barely left the ground", accent: "text-rose-300/75" },
  { depth: 300, label: "MAINSTREAM BREEZE · 30", accent: "text-sky-200/80" },
  { depth: 700, label: "CUMULUS CLIMBER · 70", accent: "text-amber-200/85" },
  { depth: 1000, label: "CROWD FAVORITE #1 · 100", sublabel: "max single-round lift", accent: "text-amber-300/95" },
  { depth: 2000, label: "jetstream golden hour", accent: "text-orange-300/75" },
  { depth: 3500, label: "stratosphere cruise", accent: "text-fuchsia-300/75" },
  { depth: 5000, label: "LOW EARTH ORBIT · +5,000 ft", accent: "text-amber-300/90" },
];

function lerpColor(c1: [number, number, number], c2: [number, number, number], t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * clamped);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * clamped);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * clamped);
  return `rgb(${r}, ${g}, ${b})`;
}

function getWorldPalette(themeId: ThemeVariant, isReverse: boolean): {
  shallowTop: [number, number, number];
  shallowBottom: [number, number, number];
  mid: [number, number, number];
  abyss: [number, number, number];
  skyTop: string;
  skyBottom: string;
  particleRgb: string;
} {
  if (isReverse || themeId === "sky") {
    return {
      shallowTop: [56, 134, 198],
      shallowBottom: [37, 99, 175],
      mid: [88, 45, 118],
      abyss: [10, 14, 38],
      skyTop: "#7dd3fc",
      skyBottom: "#bae6fd",
      particleRgb: "253, 224, 71",
    };
  }
  switch (themeId) {
    case "pitch":
      return {
        shallowTop: [6, 95, 70],
        shallowBottom: [4, 65, 52],
        mid: [3, 40, 34],
        abyss: [2, 16, 15],
        skyTop: "#67e8f9",
        skyBottom: "#bae6fd",
        particleRgb: "74, 222, 128",
      };
    case "hardwood":
      return {
        shallowTop: [124, 45, 18],
        shallowBottom: [78, 30, 16],
        mid: [38, 17, 12],
        abyss: [14, 8, 7],
        skyTop: "#fdba74",
        skyBottom: "#fed7aa",
        particleRgb: "251, 146, 60",
      };
    case "pokedex":
      return {
        shallowTop: [127, 29, 58],
        shallowBottom: [76, 20, 56],
        mid: [29, 16, 48],
        abyss: [10, 8, 22],
        skyTop: "#fca5a5",
        skyBottom: "#fecdd3",
        particleRgb: "250, 204, 21",
      };
    case "cinema":
      return {
        shallowTop: [76, 29, 149],
        shallowBottom: [46, 16, 101],
        mid: [24, 12, 58],
        abyss: [8, 5, 22],
        skyTop: "#d8b4fe",
        skyBottom: "#f5d0fe",
        particleRgb: "232, 121, 249",
      };
    case "atlas":
      return {
        shallowTop: [13, 110, 110],
        shallowBottom: [8, 74, 84],
        mid: [5, 42, 56],
        abyss: [2, 15, 24],
        skyTop: "#99f6e4",
        skyBottom: "#ccfbf1",
        particleRgb: "45, 212, 191",
      };
    default:
      // Classic glowing ocean (Krillion Unlimited / Sports / Geography / Daily)
      return {
        shallowTop: [12, 74, 116],
        shallowBottom: [6, 44, 78],
        mid: [4, 24, 52],
        abyss: [2, 9, 20],
        skyTop: "#87ceeb",
        skyBottom: "#d8f3ff",
        particleRgb: "103, 232, 249",
      };
  }
}

export default function OceanDiveScene({
  cameraDepth,
  isReverse,
  themeId,
  phase,
  sinkingPlaqueText,
  children,
}: OceanDiveSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const depthRef = useRef<number>(cameraDepth);
  const prevDepthRef = useRef<number>(cameraDepth);
  const phaseRef = useRef(phase);

  useEffect(() => {
    depthRef.current = cameraDepth;
  }, [cameraDepth]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Continuous 60fps HTML5 Canvas for water gradient, sunbeams, plankton particles, bubbles & silhouettes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const palette = getWorldPalette(themeId, isReverse);

    interface Particle {
      x: number;
      y: number;
      r: number;
      speed: number;
      alpha: number;
      isBubble: boolean;
    }

    interface Swimmer {
      x: number;
      depth: number;
      vx: number;
      size: number;
    }

    const particles: Particle[] = Array.from({ length: 58 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1 + Math.random() * 2.2,
      speed: 0.00018 + Math.random() * 0.0004,
      alpha: 0.16 + Math.random() * 0.45,
      isBubble: Math.random() < 0.22,
    }));

    const swimmers: Swimmer[] = Array.from({ length: 12 }, (_, idx) => ({
      x: Math.random(),
      depth: 45 + idx * 140 + Math.random() * 80,
      vx: (idx % 2 === 0 ? 1 : -1) * (0.00025 + Math.random() * 0.0003),
      size: 6 + (idx % 4) * 2.5,
    }));

    let rafId = 0;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(300, Math.floor(rect.width * dpr));
      canvas.height = Math.max(400, Math.floor(rect.height * dpr));
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const drawFrame = () => {
      const w = canvas.width;
      const h = canvas.height;
      const d = depthRef.current;
      const delta = d - prevDepthRef.current;
      prevDepthRef.current = d;

      // Water/Atmosphere Gradient interpolated smoothly by depth
      const depthNorm = Math.min(1, d / 1600);
      const topColor =
        d < 400
          ? lerpColor(palette.shallowTop, palette.mid, d / 400)
          : lerpColor(palette.mid, palette.abyss, (d - 400) / 1200);
      const bottomColor =
        d < 400
          ? lerpColor(palette.shallowBottom, palette.mid, d / 400)
          : lerpColor(palette.mid, palette.abyss, (d - 400) / 1400);

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, topColor);
      grad.addColorStop(1, bottomColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Diagonal sunbeams near the surface (fade out as depth increases past 280m)
      if (!isReverse && d < 320) {
        const beamAlpha = Math.max(0, 0.08 * (1 - d / 320));
        ctx.fillStyle = `rgba(186, 230, 253, ${beamAlpha})`;
        const beamOrigins = [0.22, 0.44, 0.68, 0.84];
        for (const ox of beamOrigins) {
          ctx.beginPath();
          ctx.moveTo(w * ox, 0);
          ctx.lineTo(w * (ox + 0.06), 0);
          ctx.lineTo(w * (ox + 0.22), h);
          ctx.lineTo(w * (ox + 0.08), h);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Vertical camera motion shift for ambient specks
      const scrollNorm = (delta * PX_PER_METER) / Math.max(400, h);
      const activePhase = phaseRef.current;

      for (const p of particles) {
        p.y -= p.speed + (isReverse ? -scrollNorm * 1.4 : scrollNorm * 1.4);
        if (p.y < -0.04) p.y = 1.04;
        if (p.y > 1.04) p.y = -0.04;

        const px = p.x * w;
        const py = p.y * h;

        if (p.isBubble) {
          ctx.beginPath();
          ctx.arc(px, py, p.r * 1.4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${palette.particleRgb}, ${p.alpha * (0.45 + 0.55 * (1 - depthNorm * 0.5))})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(${palette.particleRgb}, ${p.alpha * (0.35 + 0.65 * depthNorm)})`;
          ctx.fillRect(px, py, p.r * 1.5, p.r * 1.5);
        }
      }

      // Extra rushing sink bubbles in the middle column during "sinking" animation
      if (activePhase === "sinking") {
        const now = performance.now() * 0.008;
        for (let i = 0; i < 16; i++) {
          const bx = w * 0.5 + Math.sin(now * 0.4 + i * 1.7) * (w * 0.07);
          const by = ((h * 0.6 - ((now * 28 + i * 37) % (h * 0.5))) + h) % h;
          ctx.beginPath();
          ctx.arc(bx, by, 2.5 + (i % 3) * 1.5, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(165, 243, 252, ${0.25 + (i % 4) * 0.12})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Schooling fish silhouettes (or birds in sky mode) positioned in world coordinates
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const s of swimmers) {
        s.x += s.vx;
        if (s.x > 1.08) s.x = -0.08;
        if (s.x < -0.08) s.x = 1.08;

        const worldDeltaPx = isReverse
          ? (d - s.depth) * PX_PER_METER * dpr
          : (s.depth - d) * PX_PER_METER * dpr;
        const sy = SURFACE_OFFSET_PX * dpr + worldDeltaPx;
        if (sy < -40 || sy > h + 40) continue;

        const sx = s.x * w;
        const dir = s.vx >= 0 ? 1 : -1;
        const sz = s.size * dpr;

        ctx.fillStyle = isReverse
          ? "rgba(255, 255, 255, 0.35)"
          : "rgba(2, 12, 24, 0.5)";
        // Pixel silhouette fish body + tail
        ctx.fillRect(sx - sz, sy - sz * 0.35, sz * 1.6, sz * 0.7);
        ctx.fillRect(sx - dir * sz * 1.35, sy - sz * 0.55, sz * 0.55, sz * 1.1);
      }

      rafId = window.requestAnimationFrame(drawFrame);
    };

    rafId = window.requestAnimationFrame(drawFrame);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isReverse, themeId]);

  const markers = isReverse ? SKY_MARKERS : DIVE_MARKERS;

  // Horizon offset in pixels from top of viewport
  const horizonTopPx = isReverse
    ? SURFACE_OFFSET_PX + cameraDepth * PX_PER_METER
    : SURFACE_OFFSET_PX - cameraDepth * PX_PER_METER;

  // Ruler ticks spanning visible window around current cameraDepth
  const rulerTicks = useMemo(() => {
    const startStep = Math.max(0, Math.floor((cameraDepth - 220) / 20) * 20);
    const endStep = startStep + 540;
    const ticks: number[] = [];
    for (let m = startStep; m <= endStep; m += 20) {
      ticks.push(m);
    }
    return ticks;
  }, [cameraDepth]);

  const palette = getWorldPalette(themeId, isReverse);

  return (
    <div className="relative h-full w-full overflow-hidden select-none">
      {/* 1. Dynamic 60FPS Canvas Ocean / Sky Column */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* 2. Surface Sky / Clouds / Boat (scrolls up out of view as player dives deeper) */}
      {!isReverse && horizonTopPx > -220 && (
        <div
          className="pointer-events-none absolute inset-x-0 z-10 overflow-hidden"
          style={{
            top: 0,
            height: `${Math.max(0, horizonTopPx)}px`,
            background: `linear-gradient(180deg, ${palette.skyTop} 0%, ${palette.skyBottom} 100%)`,
          }}
          aria-hidden="true"
        >
          {/* Pixel Sun */}
          <div className="absolute right-[10%] top-[18%] h-14 w-14 rounded-full bg-[#fef08a] shadow-[0_0_45px_rgba(254,240,138,0.9)] sm:h-20 sm:w-20" />
          {/* Pixel Clouds */}
          <div className="animate-ak-float absolute left-[12%] top-[24%] h-7 w-28 rounded-sm bg-white/90 shadow-[12px_-10px_0_0_rgba(255,255,255,0.9),28px_-4px_0_0_rgba(255,255,255,0.85)]" />
          <div className="animate-ak-float absolute left-[56%] top-[34%] h-6 w-24 rounded-sm bg-white/85 shadow-[-10px_-8px_0_0_rgba(255,255,255,0.85)]" />
        </div>
      )}

      {/* Wave Horizon Line + Bobbing Trawler Boat (Dive Modes) */}
      {!isReverse && horizonTopPx > -60 && horizonTopPx < 900 && (
        <div
          className="pointer-events-none absolute inset-x-0 z-10"
          style={{ top: `${horizonTopPx - 36}px` }}
          aria-hidden="true"
        >
          <div className="animate-ak-bob ml-[22%] inline-block">
            <PixelBoatSprite className="h-12 w-24 sm:h-14 sm:w-28" />
          </div>
          <div className="h-2.5 w-full bg-gradient-to-b from-cyan-300/35 to-transparent" />
        </div>
      )}

      {/* Meadow Launch Pad at bottom when Noillirk starts near 0 ft */}
      {isReverse && horizonTopPx < 900 && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-emerald-950/90 via-emerald-900/40 to-transparent"
          style={{ opacity: Math.max(0, 1 - cameraDepth / 180) }}
          aria-hidden="true"
        />
      )}

      {/* 3. Scrolling World Depth Milestone Lines & Labels */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
        {markers.map((marker) => {
          const yPx = isReverse
            ? SURFACE_OFFSET_PX + (cameraDepth - marker.depth) * PX_PER_METER
            : SURFACE_OFFSET_PX + (marker.depth - cameraDepth) * PX_PER_METER;
          if (yPx < -40 || yPx > 960) return null;
          return (
            <div
              key={`${marker.depth}-${marker.label}`}
              className="absolute inset-x-4 flex items-center justify-between border-t border-dashed border-white/15 pt-1 text-[10px] font-mono tracking-wider sm:inset-x-10 sm:text-xs"
              style={{ top: `${yPx}px` }}
            >
              <span className={marker.accent ?? "text-cyan-200/70"}>{marker.label}</span>
              {marker.sublabel && (
                <span className="hidden text-slate-300/45 sm:inline">{marker.sublabel}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Right-Side Vertical Scrolling Depth / Altitude Ruler */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 top-0 z-20 w-14 border-l border-white/10 bg-black/15"
        aria-hidden="true"
      >
        {rulerTicks.map((m) => {
          const yPx = isReverse
            ? SURFACE_OFFSET_PX + (cameraDepth - m) * PX_PER_METER
            : SURFACE_OFFSET_PX + (m - cameraDepth) * PX_PER_METER;
          if (yPx < -20 || yPx > 980) return null;
          const isMajor = m % 100 === 0;
          return (
            <div
              key={m}
              className="absolute right-0 flex items-center gap-1"
              style={{ top: `${yPx}px` }}
            >
              {isMajor && (
                <span className="font-mono text-[9px] font-bold text-slate-300/65">
                  {isReverse ? `${m}ft` : `-${m}m`}
                </span>
              )}
              <span
                className={`block bg-slate-300/40 ${
                  isMajor ? "h-[1.5px] w-3" : "h-[1px] w-1.5"
                }`}
              />
            </div>
          );
        })}

        {/* Fixed YOU cursor aligned to player hero position */}
        <div
          className="absolute right-0 flex items-center gap-0.5 pr-0.5"
          style={{ top: `${SURFACE_OFFSET_PX - 7}px` }}
        >
          <span className="font-pixel text-[9px] font-bold text-rose-400">YOU</span>
          <span className="text-[10px] text-rose-400">◄</span>
        </div>
      </div>

      {/* 5. Protagonist Sprite (Swimming alongside during question, or Riding Weighted Plaque during dive!) */}
      {phase === "playing" && (
        <div
          className="pointer-events-none absolute left-3 z-20 sm:left-8 animate-ak-krill"
          style={{ top: "48%" }}
          aria-hidden="true"
        >
          <ThemeHeroSprite themeId={themeId} className="h-12 w-12 sm:h-14 sm:w-14" />
        </div>
      )}

      {phase === "sinking" && sinkingPlaqueText && (
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center px-4">
          <div className="animate-ak-plaque flex flex-col items-center">
            <div className="-mb-3 z-10">
              <ThemeHeroSprite themeId={themeId} glow={false} className="h-12 w-12 sm:h-14 sm:w-14" />
            </div>
            <div className="rounded-lg border-2 border-cyan-300/70 bg-[#07182d]/95 px-6 py-3.5 shadow-[0_14px_40px_rgba(0,0,0,0.65)]">
              <p className="font-pixel text-center text-base font-bold uppercase tracking-wider text-white sm:text-xl">
                &ldquo;{sinkingPlaqueText}&rdquo; {isReverse ? "▲" : "▼"}
              </p>
            </div>
          </div>
          <p className="mt-6 font-mono text-xs font-bold uppercase tracking-widest text-cyan-200/90 animate-pulse">
            {isReverse ? "Ascending through sky..." : "Sinking into the deep..."}
          </p>
        </div>
      )}

      {/* 6. Subtle Retro CRT Scanline Overlay */}
      <div
        className="ak-scanlines pointer-events-none absolute inset-0 z-20 opacity-45"
        aria-hidden="true"
      />

      {/* 7. Foreground Game HUD & Cards */}
      <div className="relative z-30 flex h-full w-full flex-col justify-between p-3 pr-14 sm:p-5 sm:pr-16">
        {children}
      </div>
    </div>
  );
}
