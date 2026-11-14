"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { PixelBalloonSprite, PixelBoatSprite, ThemeHeroSprite } from "@/components/PixelSprites";
import { ThemeHorizonBackdrop } from "@/components/ThemeHorizonBackdrop";
import { getWorldThemeMeta } from "@/lib/worldThemesData";
import {
  drawThemeBackdropPattern,
  drawThemeLandmark,
  drawThemeSwimmers,
  PX_PER_METER,
  SURFACE_OFFSET_PX,
} from "@/lib/worldCanvasDrawers";
import { playSonarPingSound } from "@/lib/soundEffects";
import type { ThemeVariant } from "@/lib/gameThemes";

export interface OceanDiveSceneProps {
  /** Current animated camera depth (or altitude in feet if isReverse) */
  cameraDepth: number;
  isReverse: boolean;
  themeId: ThemeVariant;
  phase: "splash" | "countdown" | "playing" | "sinking" | "revealed" | "summary";
  /** Text displayed on the weighted descending plaque during "sinking" */
  sinkingPlaqueText?: string;
  /** Incremented on each keystroke to trigger sonar rings & bubbles */
  typingPulse?: number;
  /** Current score to unlock subtle protagonist visual evolution */
  score?: number;
  /** True when round timer is in urgent final seconds */
  urgentTimer?: boolean;
  /** Invoked when player clicks a world landmark or mystery orb with sonar */
  onDiscovery?: (label: string) => void;
  children: ReactNode;
}

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
        skyTop: "#03261a",
        skyBottom: "#064e3b",
        particleRgb: "74, 222, 128",
      };
    case "hardwood":
      return {
        shallowTop: [124, 45, 18],
        shallowBottom: [78, 30, 16],
        mid: [38, 17, 12],
        abyss: [14, 8, 7],
        skyTop: "#1c0a05",
        skyBottom: "#431407",
        particleRgb: "251, 146, 60",
      };
    case "pokedex":
      return {
        shallowTop: [127, 29, 58],
        shallowBottom: [76, 20, 56],
        mid: [29, 16, 48],
        abyss: [10, 8, 22],
        skyTop: "#2c071b",
        skyBottom: "#6b1138",
        particleRgb: "250, 204, 21",
      };
    case "cinema":
      return {
        shallowTop: [76, 29, 149],
        shallowBottom: [46, 16, 101],
        mid: [24, 12, 58],
        abyss: [8, 5, 22],
        skyTop: "#160730",
        skyBottom: "#3b0764",
        particleRgb: "232, 121, 249",
      };
    case "atlas":
      return {
        shallowTop: [13, 110, 110],
        shallowBottom: [8, 74, 84],
        mid: [5, 42, 56],
        abyss: [2, 15, 24],
        skyTop: "#082f49",
        skyBottom: "#0e7490",
        particleRgb: "45, 212, 191",
      };
    case "stadium":
      return {
        shallowTop: [110, 24, 46],
        shallowBottom: [68, 16, 46],
        mid: [24, 20, 54],
        abyss: [8, 8, 22],
        skyTop: "#171438",
        skyBottom: "#4c0519",
        particleRgb: "251, 191, 36",
      };
    default:
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
  typingPulse = 0,
  score = 0,
  urgentTimer = false,
  onDiscovery,
  children,
}: OceanDiveSceneProps) {
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const depthRef = useRef<number>(cameraDepth);
  const prevDepthRef = useRef<number>(cameraDepth);
  const phaseRef = useRef(phase);
  const scoreRef = useRef<number>(score);
  const urgentRef = useRef<boolean>(urgentTimer);
  const typingPulseRef = useRef<number>(typingPulse);
  const prevTypingPulseRef = useRef<number>(typingPulse);
  const onDiscoveryRef = useRef(onDiscovery);

  useEffect(() => {
    depthRef.current = cameraDepth;
  }, [cameraDepth]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    urgentRef.current = urgentTimer;
  }, [urgentTimer]);

  useEffect(() => {
    typingPulseRef.current = typingPulse;
  }, [typingPulse]);

  useEffect(() => {
    onDiscoveryRef.current = onDiscovery;
  }, [onDiscovery]);

  // Continuous 60fps HTML5 Canvas + native sonar click handler (all mutable animation entities scoped inside this effect)
  useEffect(() => {
    const canvas = canvasRef.current;
    const stageEl = stageContainerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const palette = getWorldPalette(themeId, isReverse);
    const themeMeta = getWorldThemeMeta(themeId, isReverse);
    const landmarks = themeMeta.landmarks;
    const specimenNames = themeMeta.specimens;

    interface Particle {
      x: number;
      y: number;
      r: number;
      speed: number;
      alpha: number;
      isBubble: boolean;
    }

    interface SonarRipple {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      alpha: number;
      color: string;
    }

    interface FloatingLabel {
      x: number;
      y: number;
      text: string;
      alpha: number;
    }

    const particles: Particle[] = Array.from({ length: 64 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1 + Math.random() * 2.2,
      speed: 0.00018 + Math.random() * 0.0004,
      alpha: 0.16 + Math.random() * 0.45,
      isBubble: Math.random() < 0.25,
    }));

    const swimmers = Array.from({ length: 14 }, (_, idx) => ({
      x: Math.random(),
      depth: 50 + idx * 145 + Math.random() * 80,
      vx: (idx % 2 === 0 ? 1 : -1) * (0.00025 + Math.random() * 0.00035),
      size: 6 + (idx % 4) * 2.5,
    }));

    const orbs = specimenNames.slice(0, 4).map((name, i) => ({
      x: 0.2 + i * 0.22,
      y: 0.26 + ((i * 0.19) % 0.56),
      vx: (i % 2 === 0 ? 1 : -1) * 0.00032,
      phaseOffset: i * 1.4,
      name,
      cooldown: 0,
    }));

    let ripples: SonarRipple[] = [];
    let labels: FloatingLabel[] = [];

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
      const t = performance.now() * 0.001;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const activePhase = phaseRef.current;

      // Keystroke reactivity: emit sonar ring + bubble burst from protagonist when typing
      if (typingPulseRef.current !== prevTypingPulseRef.current) {
        prevTypingPulseRef.current = typingPulseRef.current;
        const heroX = w < 640 ? w * 0.09 : w * 0.06;
        const heroY = h * 0.5;
        ripples.push({
          x: heroX,
          y: heroY,
          radius: 8 * dpr,
          maxRadius: 72 * dpr,
          alpha: 0.55,
          color: isReverse ? "251, 191, 36" : "103, 232, 249",
        });
      }

      // 1. Depth-interpolated ocean/atmosphere column gradient
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

      // 2. Theme-distinctive background architectural / atmospheric pattern
      drawThemeBackdropPattern(ctx, w, h, d, dpr, themeId, isReverse, t);

      // 3. Ambient particles & rising bubbles
      const scrollNorm = (delta * PX_PER_METER) / Math.max(400, h);
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

      // 4. Narrative World Landmarks (submarines, divers, shipwrecks, squid, satellites...)
      for (const lm of landmarks) {
        const worldDeltaPx = isReverse
          ? (d - lm.depth) * PX_PER_METER * dpr
          : (lm.depth - d) * PX_PER_METER * dpr;
        const ly = SURFACE_OFFSET_PX * dpr + worldDeltaPx;
        if (ly < -80 * dpr || ly > h + 80 * dpr) continue;
        const lx = w * lm.xRatio;
        drawThemeLandmark(ctx, lm.id, lx, ly, dpr, t);
      }

      // 5. Ambient moving world objects (fish / birds / balls / sparks / planes / stars)
      drawThemeSwimmers(ctx, swimmers, w, h, d, dpr, themeId, isReverse, t);

      // 6. Clickable Golden Mystery Specimen Orbs drifting across background
      for (const orb of orbs) {
        if (orb.cooldown > 0) {
          orb.cooldown -= 1;
          continue;
        }
        orb.x += orb.vx;
        if (orb.x > 0.88 || orb.x < 0.12) orb.vx = -orb.vx;
        const ox = orb.x * w;
        const oy = (orb.y + Math.sin(t * 1.6 + orb.phaseOffset) * 0.03) * h;
        const pulseR = (8 + Math.sin(t * 4 + orb.phaseOffset) * 2) * dpr;

        ctx.beginPath();
        ctx.arc(ox, oy, pulseR * 1.6, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(251, 191, 36, 0.35)";
        ctx.lineWidth = 1.2 * dpr;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(ox, oy, 5.5 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(253, 224, 71, 0.88)";
        ctx.fill();
      }

      // 7. Protagonist Gear Evolution beams / aura when playing
      if (activePhase === "playing") {
        const heroX = (w < 640 ? 44 : 62) * dpr;
        const heroY = h * 0.5;
        const curScore = scoreRef.current;

        if (curScore >= 120) {
          const beam = ctx.createLinearGradient(heroX, heroY, heroX + 180 * dpr, heroY);
          beam.addColorStop(0, "rgba(103, 232, 249, 0.24)");
          beam.addColorStop(1, "rgba(103, 232, 249, 0)");
          ctx.fillStyle = beam;
          ctx.beginPath();
          ctx.moveTo(heroX, heroY);
          ctx.lineTo(heroX + 180 * dpr, heroY - 46 * dpr);
          ctx.lineTo(heroX + 180 * dpr, heroY + 46 * dpr);
          ctx.closePath();
          ctx.fill();
        }

        if (curScore >= 280) {
          // Companion baby-krill / ember followers
          for (let c = 0; c < 2; c++) {
            const cx = heroX - (18 + c * 12) * dpr;
            const cy = heroY + (c === 0 ? -18 : 20) * dpr + Math.sin(t * 4 + c) * 4 * dpr;
            ctx.fillStyle = isReverse ? "rgba(253, 224, 71, 0.85)" : "rgba(255, 42, 109, 0.85)";
            ctx.fillRect(cx - 4 * dpr, cy - 2 * dpr, 8 * dpr, 4 * dpr);
          }
        }

        if (curScore >= 450) {
          ctx.beginPath();
          ctx.arc(heroX, heroY, 34 * dpr, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(251, 191, 36, ${0.35 + Math.sin(t * 3) * 0.15})`;
          ctx.lineWidth = 2 * dpr;
          ctx.stroke();
        }
      }

      // 8. Rushing sink bubbles during physical plaque descent
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

      // 9. Sonar Ripples (keystroke pulses + click pings)
      const nextRipples: SonarRipple[] = [];
      for (const rp of ripples) {
        rp.radius += 2.6 * dpr;
        rp.alpha *= 0.94;
        if (rp.alpha > 0.03 && rp.radius < rp.maxRadius) {
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, rp.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${rp.color}, ${rp.alpha})`;
          ctx.lineWidth = 1.6 * dpr;
          ctx.stroke();
          nextRipples.push(rp);
        }
      }
      ripples = nextRipples;

      // 10. Floating Discovery Labels on Canvas
      const nextLabels: FloatingLabel[] = [];
      ctx.font = `bold ${11 * dpr}px monospace`;
      ctx.textAlign = "center";
      for (const lb of labels) {
        lb.y -= 0.7 * dpr;
        lb.alpha *= 0.985;
        if (lb.alpha > 0.05) {
          ctx.fillStyle = `rgba(253, 224, 71, ${lb.alpha})`;
          ctx.fillText(lb.text, lb.x, lb.y);
          nextLabels.push(lb);
        }
      }
      labels = nextLabels;

      // 11. Subtle Urgent Oxygen / Countdown Vignette in Final 5 Seconds
      if (urgentRef.current && activePhase === "playing") {
        const pulse = 0.09 + Math.sin(t * 8) * 0.05;
        ctx.strokeStyle = `rgba(244, 63, 94, ${pulse * 3})`;
        ctx.lineWidth = 12 * dpr;
        ctx.strokeRect(0, 0, w, h);
      }

      rafId = window.requestAnimationFrame(drawFrame);
    };

    const onStageClick = (e: globalThis.MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("button, a, input, select, form, [data-hud-interactive]")) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cx = (e.clientX - rect.left) * dpr;
      const cy = (e.clientY - rect.top) * dpr;
      const w = canvas.width;
      const h = canvas.height;
      const d = depthRef.current;
      const t = performance.now() * 0.001;

      for (const s of swimmers) {
        const worldDeltaPx = isReverse
          ? (d - s.depth) * PX_PER_METER * dpr
          : (s.depth - d) * PX_PER_METER * dpr;
        const sy = SURFACE_OFFSET_PX * dpr + worldDeltaPx;
        const sx = s.x * w;
        if (Math.hypot(sx - cx, sy - cy) < 120 * dpr) {
          s.vx = (sx >= cx ? 1 : -1) * 0.0038;
        }
      }

      let discoveredText: string | null = null;
      for (const orb of orbs) {
        if (orb.cooldown > 0) continue;
        const ox = orb.x * w;
        const oy = (orb.y + Math.sin(t * 1.6 + orb.phaseOffset) * 0.03) * h;
        if (Math.hypot(ox - cx, oy - cy) < 42 * dpr) {
          orb.cooldown = 240;
          orb.x = 0.14 + Math.random() * 0.72;
          orb.y = 0.22 + Math.random() * 0.56;
          discoveredText = `Scanned ${orb.name}`;
          break;
        }
      }

      if (!discoveredText) {
        for (const lm of landmarks) {
          const worldDeltaPx = isReverse
            ? (d - lm.depth) * PX_PER_METER * dpr
            : (lm.depth - d) * PX_PER_METER * dpr;
          const ly = SURFACE_OFFSET_PX * dpr + worldDeltaPx;
          const lx = w * lm.xRatio;
          if (Math.hypot(lx - cx, ly - cy) < 75 * dpr) {
            discoveredText = lm.discoveryLog;
            break;
          }
        }
      }

      const color = discoveredText ? "253, 224, 71" : "103, 232, 249";
      ripples.push(
        { x: cx, y: cy, radius: 6 * dpr, maxRadius: 95 * dpr, alpha: 0.7, color },
        { x: cx, y: cy, radius: 2 * dpr, maxRadius: 58 * dpr, alpha: 0.45, color },
      );

      if (discoveredText) {
        labels.push({ x: cx, y: cy - 12 * dpr, text: "★ SONAR LOCK", alpha: 1 });
        playSonarPingSound(true);
        onDiscoveryRef.current?.(discoveredText);
      } else {
        playSonarPingSound(false);
      }
    };

    stageEl?.addEventListener("click", onStageClick);
    rafId = window.requestAnimationFrame(drawFrame);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      stageEl?.removeEventListener("click", onStageClick);
    };
  }, [isReverse, themeId]);

  const themeMeta = getWorldThemeMeta(themeId, isReverse);
  const markers = themeMeta.markers;

  const horizonTopPx = isReverse
    ? SURFACE_OFFSET_PX + cameraDepth * PX_PER_METER
    : SURFACE_OFFSET_PX - cameraDepth * PX_PER_METER;

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
    <div
      ref={stageContainerRef}
      className="relative h-full w-full cursor-crosshair overflow-hidden select-none"
    >
      {/* 1. Dynamic 60FPS Canvas Ocean / Sky Column */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* 2. Theme-Distinctive Surface Horizon / Stadium Lights / Arena Jumbotron / Meadow */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
        <ThemeHorizonBackdrop
          themeId={themeId}
          isReverse={isReverse}
          horizonTopPx={horizonTopPx}
          cameraDepth={cameraDepth}
          skyTop={palette.skyTop}
          skyBottom={palette.skyBottom}
          abyssHero={
            <div className="animate-ak-bob">
              <PixelBoatSprite className="h-12 w-24 sm:h-14 sm:w-28" />
            </div>
          }
        />
      </div>

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
              className="absolute left-4 right-16 flex items-center justify-between border-t border-dashed border-white/15 pt-1 text-[10px] font-mono tracking-wider sm:left-8 sm:right-20 sm:text-xs"
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
                  {`${themeMeta.unitPrefix}${m}${themeMeta.unitSuffix}`}
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

        <div
          className="absolute right-0 flex items-center gap-0.5 pr-0.5"
          style={{ top: `${SURFACE_OFFSET_PX - 7}px` }}
        >
          <span className="font-pixel text-[9px] font-bold text-rose-400">YOU</span>
          <span className="text-[10px] text-rose-400">◄</span>
        </div>
      </div>

      {/* 5. Protagonist Sprite */}
      {phase === "splash" && (
        <div
          className={`pointer-events-none absolute left-5 z-20 sm:left-12 ${
            isReverse ? "top-[16%] sm:top-[28%] animate-ak-bob" : "top-[185px] animate-ak-krill"
          }`}
          aria-hidden="true"
        >
          {isReverse ? (
            <PixelBalloonSprite glow className="h-16 w-14 sm:h-20 sm:w-16" />
          ) : (
            <ThemeHeroSprite themeId={themeId} glow className="h-12 w-12 sm:h-14 sm:w-14" />
          )}
        </div>
      )}

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
            <div className="rounded-lg border-2 border-cyan-300/70 bg-[#07182d]/85 px-6 py-3.5 backdrop-blur-sm shadow-[0_14px_40px_rgba(0,0,0,0.65)]">
              <p className="font-pixel text-center text-base font-bold uppercase tracking-wider text-white sm:text-xl">
                &ldquo;{sinkingPlaqueText}&rdquo; {isReverse ? "▲" : "▼"}
              </p>
            </div>
          </div>
          <p className="mt-6 font-mono text-xs font-bold uppercase tracking-widest text-cyan-200/90 animate-pulse">
            {themeMeta.sinkingVerb}
          </p>
        </div>
      )}

      {/* 6. Subtle Retro CRT Scanline Overlay */}
      <div
        className="ak-scanlines pointer-events-none absolute inset-0 z-20 opacity-40"
        aria-hidden="true"
      />

      {/* 7. Foreground Game HUD & Cards (pointer-events-none wrapper lets empty-area clicks trigger background sonar!) */}
      <div className="pointer-events-none relative z-30 flex h-full w-full flex-col justify-between p-3 pr-14 sm:p-5 sm:pr-16">
        {children}
      </div>
    </div>
  );
}
