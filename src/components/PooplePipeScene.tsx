"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { playSonarPingSound } from "@/lib/soundEffects";

export interface PooplePipeSceneProps {
  stepsTaken: number;
  parSteps: number;
  solved: boolean;
  typingPulse?: number;
  onDiscovery?: (label: string) => void;
  children: ReactNode;
}

const PIPE_SECRETS = [
  "Copper U-Bend Valve Unlocked",
  "Golden Soap Bubble Popped",
  "Turbo Flush Pressure Surge",
  "Emerald Siphon Seal Checked",
  "Rubber Duck Sonar Echo",
  "Subterranean Brass Boiler Gauge",
  "Foam Jet Bypass Activated",
];

/**
 * Full-viewport 60fps 2D interactive "Pixel Pipeworks & Golden Duck Ladder World"
 * for /poople-unlimited/. Typing releases rising fizz bubbles; clicking background
 * spawns steam ripples and pops floating golden soap bubbles / pressure valves.
 */
export default function PooplePipeScene({
  stepsTaken,
  parSteps,
  solved,
  typingPulse = 0,
  onDiscovery,
  children,
}: PooplePipeSceneProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stepsRef = useRef(stepsTaken);
  const parRef = useRef(parSteps);
  const solvedRef = useRef(solved);
  const pulseRef = useRef(typingPulse);
  const onDiscoveryRef = useRef(onDiscovery);

  useEffect(() => {
    stepsRef.current = stepsTaken;
    parRef.current = parSteps;
    solvedRef.current = solved;
    onDiscoveryRef.current = onDiscovery;
  }, [stepsTaken, parSteps, solved, onDiscovery]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let lastPulseSeen = pulseRef.current;
    let smoothProgress = solvedRef.current
      ? 1
      : Math.min(0.88, stepsRef.current / Math.max(2, parRef.current));

    interface FizzBubble {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      alpha: number;
      gold: boolean;
    }

    interface ValveOrb {
      x: number;
      y: number;
      vx: number;
      phase: number;
      r: number;
      cooldown: number;
      label: string;
    }

    interface SteamRipple {
      x: number;
      y: number;
      r: number;
      maxR: number;
      alpha: number;
      gold: boolean;
    }

    interface FloatingTag {
      x: number;
      y: number;
      text: string;
      alpha: number;
    }

    const fizz: FizzBubble[] = Array.from({ length: 46 }, (_, i) => ({
      x: ((i * 73 + 19) % 100) * 0.01,
      y: ((i * 41 + 11) % 100) * 0.01,
      vx: (((i % 5) - 2) * 0.00015),
      vy: -(0.0007 + (i % 7) * 0.00022),
      r: 1.5 + (i % 4) * 1.1,
      alpha: 0.16 + (i % 4) * 0.09,
      gold: i % 5 === 0,
    }));

    const valves: ValveOrb[] = PIPE_SECRETS.map((label, i) => ({
      x: 0.16 + ((i * 0.17) % 0.68),
      y: 0.18 + ((i * 0.13) % 0.64),
      vx: (i % 2 === 0 ? 1 : -1) * (0.00032 + (i % 3) * 0.00012),
      phase: i * 1.4,
      r: 10,
      cooldown: 0,
      label,
    }));

    const ripples: SteamRipple[] = [];
    const tags: FloatingTag[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = stage.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };

    resize();
    window.addEventListener("resize", resize);

    const handleStageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("button, a, input, select, form, [data-hud-interactive]")) {
        return;
      }

      const rect = stage.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) * dpr;
      const clickY = (e.clientY - rect.top) * dpr;
      const w = canvas.width;
      const h = canvas.height;
      const t = performance.now() * 0.001;

      let discovered: string | null = null;

      for (const orb of valves) {
        if (orb.cooldown > 0) continue;
        const ox = orb.x * w;
        const oy = (orb.y + Math.sin(t * 1.5 + orb.phase) * 0.03) * h;
        const dist = Math.hypot(clickX - ox, clickY - oy);
        if (dist <= 44 * dpr) {
          orb.cooldown = 360;
          discovered = orb.label;
          ripples.push({ x: ox, y: oy, r: 8 * dpr, maxR: 86 * dpr, alpha: 0.9, gold: true });
          tags.push({ x: ox, y: oy - 12 * dpr, text: `✦ ${orb.label}`, alpha: 1 });
          for (let p = 0; p < 12; p++) {
            const ang = (p / 12) * Math.PI * 2;
            fizz.push({
              x: ox / w,
              y: oy / h,
              vx: Math.cos(ang) * 0.0032,
              vy: Math.sin(ang) * 0.0035 - 0.001,
              r: 3.2,
              alpha: 0.95,
              gold: true,
            });
          }
          break;
        }
      }

      if (!discovered) {
        ripples.push({
          x: clickX,
          y: clickY,
          r: 6 * dpr,
          maxR: 62 * dpr,
          alpha: 0.65,
          gold: false,
        });
        for (let p = 0; p < 6; p++) {
          fizz.push({
            x: clickX / w,
            y: clickY / h,
            vx: (Math.random() - 0.5) * 0.0022,
            vy: -0.0015 - Math.random() * 0.002,
            r: 2.5,
            alpha: 0.75,
            gold: false,
          });
        }
        playSonarPingSound(false);
      } else {
        playSonarPingSound(true);
        onDiscoveryRef.current?.(discovered);
      }
    };

    stage.addEventListener("click", handleStageClick);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const t = performance.now() * 0.001;

      const targetProg = solvedRef.current
        ? 1
        : Math.min(0.88, stepsRef.current / Math.max(2, parRef.current));
      smoothProgress += (targetProg - smoothProgress) * 0.08;

      if (pulseRef.current !== lastPulseSeen) {
        lastPulseSeen = pulseRef.current;
        for (let i = 0; i < 6; i++) {
          fizz.push({
            x: 0.45 + (Math.random() - 0.5) * 0.22,
            y: 0.78,
            vx: (Math.random() - 0.5) * 0.002,
            vy: -0.0024 - Math.random() * 0.002,
            r: 2.6 + Math.random() * 1.8,
            alpha: 0.85,
            gold: i % 2 === 0,
          });
        }
      }
      if (fizz.length > 96) {
        fizz.splice(46, fizz.length - 96);
      }

      // 1. Subterranean emerald-copper pipeworks gradient
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, solvedRef.current ? "#064e3b" : "#073530");
      bg.addColorStop(0.5, "#042122");
      bg.addColorStop(1, "#021014");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // 2. Subtle architectural blueprint grid
      const cell = 56 * dpr;
      const scrollY = ((t * 14 * dpr) % cell + cell) % cell;
      ctx.strokeStyle = "rgba(45, 212, 191, 0.07)";
      ctx.lineWidth = 1 * dpr;
      for (let x = 0; x < w; x += cell) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = -scrollY; y < h + cell; y += cell) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 3. Industrial Side Pipes & Bolted Flanges framing left & right edges
      const pipeW = Math.min(24 * dpr, w * 0.025);
      // Left emerald vertical conduit
      ctx.fillStyle = "rgba(16, 185, 129, 0.16)";
      ctx.fillRect(8 * dpr, 0, pipeW, h);
      ctx.fillStyle = "rgba(110, 231, 183, 0.25)";
      ctx.fillRect(11 * dpr, 0, 3 * dpr, h);

      // Background horizontal cross-pipe + brass valve wheels
      const crossY = h * 0.34;
      ctx.fillStyle = "rgba(13, 148, 136, 0.12)";
      ctx.fillRect(0, crossY - 7 * dpr, w, 14 * dpr);
      for (const flangeX of [0.06, 0.91]) {
        ctx.fillStyle = "rgba(245, 158, 11, 0.22)";
        ctx.fillRect(w * flangeX, crossY - 12 * dpr, 8 * dpr, 24 * dpr);
      }

      // Animated flange joints along left conduit
      const jointGap = 110 * dpr;
      const jointOffset = ((t * 22 * dpr) % jointGap + jointGap) % jointGap;
      ctx.fillStyle = "rgba(251, 191, 36, 0.25)";
      for (let jy = -jointOffset; jy < h + jointGap; jy += jointGap) {
        ctx.fillRect(5 * dpr, jy, pipeW + 6 * dpr, 6 * dpr);
      }

      // 4. Floating Rising Fizz Bubbles
      for (let i = fizz.length - 1; i >= 0; i--) {
        const b = fizz[i];
        b.x += b.vx + Math.sin(t * 2.5 + i) * 0.00018;
        b.y += b.vy;
        if (b.y < -0.05) {
          if (i < 46) {
            b.y = 1.04;
            b.x = Math.random();
          } else {
            fizz.splice(i, 1);
            continue;
          }
        }
        ctx.beginPath();
        ctx.arc(b.x * w, b.y * h, b.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = b.gold
          ? `rgba(253, 224, 71, ${b.alpha})`
          : `rgba(94, 234, 212, ${b.alpha})`;
        ctx.fill();
      }

      // 5. Clickable Golden Soap / Pressure Valve Orbs
      for (const orb of valves) {
        if (orb.cooldown > 0) {
          orb.cooldown -= 1;
          continue;
        }
        orb.x += orb.vx;
        if (orb.x > 0.85 || orb.x < 0.14) orb.vx = -orb.vx;
        const ox = orb.x * w;
        const oy = (orb.y + Math.sin(t * 1.5 + orb.phase) * 0.03) * h;
        const pulse = (orb.r + Math.sin(t * 3.8 + orb.phase) * 2.2) * dpr;

        ctx.beginPath();
        ctx.arc(ox, oy, pulse * 1.35, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(251, 191, 36, 0.35)";
        ctx.lineWidth = 1.4 * dpr;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(ox, oy, 5.5 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(253, 224, 71, 0.88)";
        ctx.fill();
      }

      // 6. Steam Ripples & Floating Discovery Tags
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 2.6 * dpr;
        rp.alpha *= 0.94;
        if (rp.r >= rp.maxR || rp.alpha <= 0.03) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = rp.gold
          ? `rgba(253, 224, 71, ${rp.alpha})`
          : `rgba(94, 234, 212, ${rp.alpha})`;
        ctx.lineWidth = 1.8 * dpr;
        ctx.stroke();
      }

      for (let i = tags.length - 1; i >= 0; i--) {
        const tg = tags[i];
        tg.y -= 0.75 * dpr;
        tg.alpha -= 0.014;
        if (tg.alpha <= 0) {
          tags.splice(i, 1);
          continue;
        }
        ctx.font = `bold ${Math.round(11 * dpr)}px ui-monospace, SFMono-Regular, monospace`;
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(254, 240, 138, ${tg.alpha})`;
        ctx.fillText(tg.text, tg.x, tg.y);
      }

      // 7. Victory Sparkle Shower when solved
      if (solvedRef.current) {
        for (let k = 0; k < 8; k++) {
          const sx = ((Math.sin(t * 2.2 + k * 1.9) * 0.4 + 0.5) * w);
          const sy = (((t * 0.35 + k * 0.14) % 1) * h);
          ctx.fillStyle = k % 2 === 0 ? "rgba(253, 224, 71, 0.7)" : "rgba(52, 211, 153, 0.65)";
          ctx.fillRect(sx, sy, 3.5 * dpr, 3.5 * dpr);
        }
      }

      // Unused local var guard kept clean by using smoothProgress via CSS/SVG or drawing flush glow
      if (smoothProgress > 0) {
        const tubeX = w - 26 * dpr;
        const fillH = h * 0.72 * smoothProgress;
        const grad = ctx.createLinearGradient(0, h - fillH, 0, h);
        grad.addColorStop(0, "rgba(251, 191, 36, 0.25)");
        grad.addColorStop(1, "rgba(16, 185, 129, 0.08)");
        ctx.fillStyle = grad;
        ctx.fillRect(tubeX - 18 * dpr, h * 0.86 - fillH, 36 * dpr, fillH);
      }

      rafId = window.requestAnimationFrame(draw);
    };

    rafId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      stage.removeEventListener("click", handleStageClick);
    };
  }, []);

  // Update pulse ref outside canvas effect cleanly on change
  useEffect(() => {
    pulseRef.current = typingPulse;
  }, [typingPulse]);

  const progressRatio = solved
    ? 1
    : Math.min(0.88, stepsTaken / Math.max(2, parSteps));
  const duckBottomPct = Math.round(10 + progressRatio * 74);

  return (
    <div
      ref={stageRef}
      className="relative h-full w-full cursor-crosshair overflow-hidden select-none"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Right-Side Flush Pipe Progress Gauge + Animated Pixel Rubber Duck */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 top-0 z-20 flex w-14 flex-col items-center border-l border-emerald-400/20 bg-black/20 py-3"
        aria-hidden="true"
      >
        <span className="rounded border border-amber-300/60 bg-amber-500/20 px-1 py-0.5 font-pixel text-[8px] font-bold text-amber-300">
          POOP
        </span>

        <div className="relative my-2 w-4 flex-1 overflow-hidden rounded-full border border-emerald-300/35 bg-[#03191a]/80">
          {/* Rising golden-teal liquid column */}
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-emerald-500/55 via-teal-400/45 to-amber-300/65 transition-[height] duration-500 ease-out"
            style={{ height: `${Math.round(progressRatio * 100)}%` }}
          />
          {/* Step Rungs */}
          {[25, 50, 75].map((pct) => (
            <div
              key={pct}
              className="absolute inset-x-0 h-[1px] bg-white/20"
              style={{ bottom: `${pct}%` }}
            />
          ))}
        </div>

        {/* Pixel Duck Climbing Up Toward POOP */}
        <div
          className="animate-ak-bob absolute right-2 transition-[bottom] duration-500 ease-out"
          style={{ bottom: `${duckBottomPct}%` }}
        >
          <svg
            viewBox="0 0 16 16"
            className="h-9 w-9 drop-shadow-[0_0_10px_rgba(251,191,36,0.75)]"
          >
            {/* Crown when solved */}
            {solved && (
              <path d="M5 1h1v1h2V1h1v1h2V1h1v3H5V1z" fill="#fef08a" />
            )}
            {/* Head & Body */}
            <rect x="6" y="4" width="5" height="4" fill="#facc15" />
            <rect x="3" y="8" width="10" height="5" fill="#facc15" />
            <rect x="4" y="13" width="8" height="1" fill="#eab308" />
            {/* Wing */}
            <rect x="5" y="9" width="4" height="3" fill="#fde047" />
            {/* Orange Beak & Eye */}
            <rect x="11" y="5" width="3" height="2" fill="#f97316" />
            <rect x="9" y="5" width="1" height="1" fill="#0f172a" />
          </svg>
        </div>

        <span className="font-mono text-[9px] font-bold text-emerald-300/80">
          {stepsTaken}/{parSteps}
        </span>
      </div>

      {/* Subtle Retro CRT Scanlines */}
      <div
        className="ak-scanlines pointer-events-none absolute inset-0 z-20 opacity-35"
        aria-hidden="true"
      />

      {/* Sheer Interactive Foreground HUD Wrapper */}
      <div className="pointer-events-none relative z-30 flex h-full w-full flex-col justify-between p-3 pr-16 sm:p-5 sm:pr-20">
        {children}
      </div>
    </div>
  );
}
