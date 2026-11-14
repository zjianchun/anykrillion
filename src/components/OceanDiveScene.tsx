"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { PixelBalloonSprite, PixelBoatSprite, ThemeHeroSprite } from "@/components/PixelSprites";
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

interface WorldMarker {
  depth: number;
  label: string;
  sublabel?: string;
  accent?: string;
}

interface WorldLandmark {
  id:
    | "kelp"
    | "diver"
    | "turtle"
    | "submarine"
    | "shipwreck"
    | "jellyfish"
    | "squid"
    | "angler"
    | "vents"
    | "ufo"
    | "leviathan"
    | "paperplane"
    | "birds"
    | "biplane"
    | "balloons"
    | "rainbow"
    | "satellite"
    | "station"
    | "astronaut";
  depth: number;
  xRatio: number;
  title: string;
  discoveryLog: string;
  zone: string;
}

const PX_PER_METER = 3.1;
const SURFACE_OFFSET_PX = 165;

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

const DIVE_LANDMARKS: WorldLandmark[] = [
  {
    id: "kelp",
    depth: 95,
    xRatio: 0.78,
    title: "Giant Kelp Forest",
    discoveryLog: "Kelp Canopy (-95m): swaying fronds shelter early plankton.",
    zone: "Sunlight Reef",
  },
  {
    id: "diver",
    depth: 145,
    xRatio: 0.76,
    title: "Research Diver",
    discoveryLog: "Research Diver (-145m): signaling your descent with a floodlight!",
    zone: "Sunlight Reef",
  },
  {
    id: "turtle",
    depth: 225,
    xRatio: 0.22,
    title: "Green Sea Turtle",
    discoveryLog: "Green Sea Turtle (-225m): gliding along the reef drop-off.",
    zone: "Sunlight Reef",
  },
  {
    id: "submarine",
    depth: 365,
    xRatio: 0.74,
    title: "Submarine ALVIN-7",
    discoveryLog: "ALVIN-7 Research Sub (-365m): floodlights sweeping the thermocline.",
    zone: "Twilight Zone",
  },
  {
    id: "shipwreck",
    depth: 690,
    xRatio: 0.24,
    title: "Sunken Galleon",
    discoveryLog: "Sunken Galleon (-690m): faint gold glinting inside the hull.",
    zone: "Twilight Zone",
  },
  {
    id: "jellyfish",
    depth: 1120,
    xRatio: 0.77,
    title: "Neon Jellyfish",
    discoveryLog: "Neon Jelly Swarm (-1,120m): bioluminescent bells pulsing below.",
    zone: "Bioluminescent Zone",
  },
  {
    id: "squid",
    depth: 1720,
    xRatio: 0.23,
    title: "Giant Squid",
    discoveryLog: "Architeuthis (-1,720m): giant tentacles drifting in dark water.",
    zone: "Bioluminescent Zone",
  },
  {
    id: "angler",
    depth: 2580,
    xRatio: 0.75,
    title: "Abyssal Anglerfish",
    discoveryLog: "Anglerfish (-2,580m): hypnotic golden lantern spotted in the dark.",
    zone: "Midnight Zone",
  },
  {
    id: "vents",
    depth: 3500,
    xRatio: 0.25,
    title: "Black Smoker Vents",
    discoveryLog: "Hydrothermal Vents (-3,500m): mineral plumes rising from the crust.",
    zone: "Abyssal Plain",
  },
  {
    id: "ufo",
    depth: 4700,
    xRatio: 0.75,
    title: "Sunken Relay Disc",
    discoveryLog: "Anomalous Relay (-4,700m): unexplained cyan pulse beneath the silt.",
    zone: "Hadal Trench",
  },
  {
    id: "leviathan",
    depth: 5800,
    xRatio: 0.3,
    title: "Golden Leviathan",
    discoveryLog: "Golden Leviathan (-5,800m): mythical guardian of One-in-a-Krillion.",
    zone: "Hadal Trench",
  },
];

const SKY_LANDMARKS: WorldLandmark[] = [
  {
    id: "paperplane",
    depth: 110,
    xRatio: 0.77,
    title: "Paper Glider",
    discoveryLog: "Paper Glider (+110ft): riding warm morning thermals.",
    zone: "Treetop Updraft",
  },
  {
    id: "birds",
    depth: 195,
    xRatio: 0.23,
    title: "Swallow Flock",
    discoveryLog: "Swallow Flock (+195ft): drafting beside your balloon envelope.",
    zone: "Treetop Updraft",
  },
  {
    id: "biplane",
    depth: 480,
    xRatio: 0.75,
    title: "Vintage Biplane",
    discoveryLog: "Crimson Biplane (+480ft): circling the cumulus ridge!",
    zone: "Cumulus Climb",
  },
  {
    id: "balloons",
    depth: 860,
    xRatio: 0.24,
    title: "Rival Balloons",
    discoveryLog: "Sky Festival (+860ft): neighboring gondolas cheering you up.",
    zone: "Cumulus Climb",
  },
  {
    id: "rainbow",
    depth: 1550,
    xRatio: 0.75,
    title: "Prism Rainbow",
    discoveryLog: "Stratocumulus Arc (+1,550ft): double rainbow over thunderheads.",
    zone: "Jetstream Golden Hour",
  },
  {
    id: "satellite",
    depth: 2700,
    xRatio: 0.75,
    title: "Weather Satellite",
    discoveryLog: "Orbital Relay (+2,700ft): solar wings glinting in lavender air.",
    zone: "Stratosphere",
  },
  {
    id: "station",
    depth: 3650,
    xRatio: 0.25,
    title: "Space Station",
    discoveryLog: "Orbital Module (+3,650ft): cruising along Earth curvature.",
    zone: "Stratosphere",
  },
  {
    id: "astronaut",
    depth: 4600,
    xRatio: 0.74,
    title: "EV-Suit Astronaut",
    discoveryLog: "Spacewalk (+4,600ft): waving beside northern aurora ribbons!",
    zone: "Low Earth Orbit",
  },
];

const OCEAN_SPECIMENS = [
  "Bioluminescent Comb Jelly",
  "Glowing Nautilus Shell",
  "Sunken Message Bottle",
  "Luminous Sea Butterfly",
  "Hydrothermal Amber Pearl",
];

const SKY_SPECIMENS = [
  "Stray Weather Balloon",
  "Monarch Butterfly Swarm",
  "Golden Cumulus Spark",
  "Meteoric Stardust Mote",
  "Radio Telemetry Probe",
];

/** Compute the current story zone & nearby landmark hint for HUD status bar */
export function getZoneNarrative(depth: number, isReverse: boolean): { zone: string; hint: string } {
  const list = isReverse ? SKY_LANDMARKS : DIVE_LANDMARKS;
  let closest = list[0];
  let minDiff = Infinity;
  for (const lm of list) {
    const diff = Math.abs(lm.depth - depth);
    if (diff < minDiff) {
      minDiff = diff;
      closest = lm;
    }
  }
  const unit = isReverse ? "ft" : "m";
  const sign = isReverse ? "+" : "-";
  return {
    zone: closest.zone,
    hint: `${closest.title} (${sign}${closest.depth.toLocaleString()}${unit})`,
  };
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

function drawLandmarkSprite(
  ctx: CanvasRenderingContext2D,
  lm: WorldLandmark,
  x: number,
  y: number,
  dpr: number,
  t: number,
): void {
  const s = dpr;
  ctx.save();
  ctx.translate(x, y);

  switch (lm.id) {
    case "kelp": {
      for (let f = -1; f <= 1; f++) {
        ctx.beginPath();
        ctx.moveTo(f * 10 * s, 32 * s);
        for (let seg = 1; seg <= 6; seg++) {
          const sway = Math.sin(t * 2.1 + seg * 0.8 + f) * 6 * s;
          ctx.lineTo(f * 10 * s + sway, (32 - seg * 10) * s);
        }
        ctx.strokeStyle = f === 0 ? "rgba(52, 211, 153, 0.55)" : "rgba(16, 185, 129, 0.42)";
        ctx.lineWidth = 4 * s;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      break;
    }
    case "diver": {
      const bob = Math.sin(t * 2.4) * 4 * s;
      ctx.translate(0, bob);
      // Conical flashlight beam pointing left toward stage center
      const beam = ctx.createLinearGradient(-16 * s, 0, -110 * s, 10 * s);
      beam.addColorStop(0, "rgba(254, 240, 138, 0.42)");
      beam.addColorStop(1, "rgba(254, 240, 138, 0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(-14 * s, -3 * s);
      ctx.lineTo(-105 * s, -22 * s);
      ctx.lineTo(-105 * s, 18 * s);
      ctx.closePath();
      ctx.fill();
      // Scuba body & yellow tank
      ctx.fillStyle = "#0ea5e9";
      ctx.fillRect(-10 * s, -6 * s, 20 * s, 10 * s);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(-5 * s, -12 * s, 12 * s, 5 * s);
      // Helmet & visor
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(-16 * s, -9 * s, 8 * s, 8 * s);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(-16 * s, -7 * s, 4 * s, 4 * s);
      // Flippers
      const kick = Math.sin(t * 6) * 3 * s;
      ctx.fillStyle = "#f43f5e";
      ctx.fillRect(10 * s, -6 * s + kick, 9 * s, 3 * s);
      ctx.fillRect(10 * s, 2 * s - kick, 9 * s, 3 * s);
      break;
    }
    case "turtle": {
      const flap = Math.sin(t * 3.2) * 5 * s;
      const drift = Math.sin(t * 0.7) * 18 * s;
      ctx.translate(drift, 0);
      ctx.fillStyle = "#34d399";
      ctx.beginPath();
      ctx.ellipse(0, 0, 16 * s, 9 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#10b981";
      ctx.fillRect(14 * s, -3 * s, 7 * s, 6 * s);
      ctx.fillRect(-4 * s, -14 * s + flap * 0.4, 7 * s, 6 * s);
      ctx.fillRect(-4 * s, 8 * s - flap * 0.4, 7 * s, 6 * s);
      break;
    }
    case "submarine": {
      const sweep = Math.sin(t * 1.4) * 14 * s;
      // Searchlight cone pointing left
      const cone = ctx.createLinearGradient(-24 * s, 0, -145 * s, sweep);
      cone.addColorStop(0, "rgba(165, 243, 252, 0.35)");
      cone.addColorStop(1, "rgba(165, 243, 252, 0)");
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(-24 * s, 0);
      ctx.lineTo(-145 * s, sweep - 26 * s);
      ctx.lineTo(-145 * s, sweep + 26 * s);
      ctx.closePath();
      ctx.fill();
      // Yellow hull
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.ellipse(0, 0, 26 * s, 13 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#d97706";
      ctx.fillRect(-6 * s, -20 * s, 12 * s, 8 * s);
      // Glowing viewport windows
      ctx.fillStyle = "#67e8f9";
      ctx.beginPath();
      ctx.arc(-10 * s, 0, 3.8 * s, 0, Math.PI * 2);
      ctx.arc(2 * s, 0, 3.8 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "shipwreck": {
      ctx.rotate(-0.14);
      ctx.fillStyle = "rgba(120, 53, 15, 0.72)";
      ctx.fillRect(-26 * s, -6 * s, 52 * s, 16 * s);
      ctx.fillRect(-6 * s, -28 * s, 4 * s, 22 * s);
      ctx.fillRect(12 * s, -20 * s, 3 * s, 14 * s);
      // Treasure chest glow
      const pulse = 0.55 + Math.sin(t * 4) * 0.35;
      ctx.fillStyle = `rgba(250, 204, 21, ${pulse})`;
      ctx.fillRect(-20 * s, -12 * s, 12 * s, 8 * s);
      break;
    }
    case "jellyfish": {
      for (let j = 0; j < 2; j++) {
        const jx = (j === 0 ? -10 : 14) * s;
        const jy = Math.sin(t * 2.5 + j * 1.6) * 7 * s + (j === 1 ? -14 * s : 4 * s);
        const pulse = 1 + Math.sin(t * 4 + j) * 0.12;
        ctx.fillStyle = j === 0 ? "rgba(244, 114, 182, 0.7)" : "rgba(167, 139, 250, 0.65)";
        ctx.beginPath();
        ctx.arc(jx, jy, 10 * s * pulse, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = j === 0 ? "rgba(244, 114, 182, 0.45)" : "rgba(167, 139, 250, 0.45)";
        ctx.lineWidth = 1.5 * s;
        for (let k = -1; k <= 1; k++) {
          ctx.beginPath();
          ctx.moveTo(jx + k * 4 * s, jy);
          ctx.quadraticCurveTo(jx + k * 5 * s + Math.sin(t * 4 + k) * 4 * s, jy + 12 * s, jx + k * 4 * s, jy + 22 * s);
          ctx.stroke();
        }
      }
      break;
    }
    case "squid": {
      ctx.fillStyle = "rgba(190, 24, 93, 0.52)";
      ctx.beginPath();
      ctx.ellipse(-6 * s, -8 * s, 22 * s, 11 * s, -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(-18 * s, -6 * s, 2.8 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(244, 63, 94, 0.55)";
      ctx.lineWidth = 2.2 * s;
      for (let a = 0; a < 4; a++) {
        ctx.beginPath();
        ctx.moveTo(10 * s, (-8 + a * 4) * s);
        ctx.quadraticCurveTo(28 * s, (-6 + a * 5 + Math.sin(t * 3 + a) * 6) * s, 44 * s, (-4 + a * 4) * s);
        ctx.stroke();
      }
      break;
    }
    case "angler": {
      ctx.fillStyle = "rgba(30, 41, 59, 0.85)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 18 * s, 13 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      // Hanging lure stalk & lantern
      const sway = Math.sin(t * 3) * 3 * s;
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.moveTo(-6 * s, -12 * s);
      ctx.quadraticCurveTo(-18 * s, -24 * s, -24 * s + sway, -12 * s);
      ctx.stroke();
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(-24 * s + sway, -11 * s, 4.2 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(-14 * s, 2 * s, 3 * s, 4 * s);
      ctx.fillRect(-8 * s, 2 * s, 3 * s, 4 * s);
      break;
    }
    case "vents": {
      ctx.fillStyle = "rgba(51, 65, 85, 0.9)";
      ctx.fillRect(-18 * s, 0, 12 * s, 24 * s);
      ctx.fillRect(4 * s, 6 * s, 10 * s, 18 * s);
      for (let p = 0; p < 5; p++) {
        const rise = ((t * 28 + p * 9) % 36) * s;
        ctx.fillStyle = `rgba(251, 146, 60, ${Math.max(0, 0.8 - rise / (40 * s))})`;
        ctx.fillRect(-14 * s + Math.sin(t * 3 + p) * 3 * s, -rise, 4 * s, 4 * s);
      }
      break;
    }
    case "ufo": {
      const hover = Math.sin(t * 2) * 5 * s;
      ctx.translate(0, hover);
      ctx.fillStyle = "#67e8f9";
      ctx.beginPath();
      ctx.arc(0, -6 * s, 10 * s, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.ellipse(0, -2 * s, 22 * s, 6 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fde047";
      ctx.fillRect(-12 * s, -3 * s, 4 * s, 2 * s);
      ctx.fillRect(-2 * s, -3 * s, 4 * s, 2 * s);
      ctx.fillRect(8 * s, -3 * s, 4 * s, 2 * s);
      break;
    }
    case "leviathan": {
      for (let seg = 0; seg < 6; seg++) {
        const sx = seg * 10 * s;
        const sy = Math.sin(t * 3.5 + seg * 0.7) * 6 * s;
        ctx.fillStyle = seg === 0 ? "#fbbf24" : "rgba(245, 158, 11, 0.78)";
        ctx.beginPath();
        ctx.arc(sx, sy, (8 - seg * 0.8) * s, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "paperplane": {
      const bob = Math.sin(t * 2.2) * 4 * s;
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.moveTo(-16 * s, bob);
      ctx.lineTo(14 * s, -6 * s + bob);
      ctx.lineTo(8 * s, 6 * s + bob);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "birds": {
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 2 * s;
      for (let b = 0; b < 3; b++) {
        const bx = b * 14 * s;
        const by = (b % 2 === 0 ? -4 : 5) * s + Math.sin(t * 5 + b) * 3 * s;
        ctx.beginPath();
        ctx.moveTo(bx - 5 * s, by - 3 * s);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + 5 * s, by - 3 * s);
        ctx.stroke();
      }
      break;
    }
    case "biplane": {
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(-18 * s, -5 * s, 32 * s, 8 * s);
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(-14 * s, -12 * s, 24 * s, 3 * s);
      ctx.fillRect(-14 * s, 4 * s, 24 * s, 3 * s);
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(-20 * s, -9 * s, 2 * s, 14 * s);
      break;
    }
    case "balloons": {
      const colors = ["#fb7185", "#facc15"];
      for (let i = 0; i < 2; i++) {
        const bx = i * 20 * s;
        const by = Math.sin(t * 1.8 + i) * 5 * s;
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc(bx, by, 9 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#78350f";
        ctx.fillRect(bx - 3 * s, by + 11 * s, 6 * s, 4 * s);
      }
      break;
    }
    case "rainbow": {
      const cols = ["#f43f5e", "#fb923c", "#facc15", "#4ade80", "#38bdf8"];
      cols.forEach((c, idx) => {
        ctx.strokeStyle = c;
        ctx.globalAlpha = 0.48;
        ctx.lineWidth = 2.5 * s;
        ctx.beginPath();
        ctx.arc(0, 12 * s, (26 - idx * 3) * s, Math.PI, 0);
        ctx.stroke();
      });
      break;
    }
    case "satellite": {
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(-22 * s, -4 * s, 14 * s, 8 * s);
      ctx.fillRect(8 * s, -4 * s, 14 * s, 8 * s);
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(-5 * s, -6 * s, 10 * s, 12 * s);
      if (Math.sin(t * 6) > 0) {
        ctx.fillStyle = "#f43f5e";
        ctx.beginPath();
        ctx.arc(0, -10 * s, 2.4 * s, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "station": {
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(-20 * s, -3 * s, 40 * s, 6 * s);
      ctx.fillStyle = "#0ea5e9";
      ctx.fillRect(-16 * s, -16 * s, 8 * s, 26 * s);
      ctx.fillRect(8 * s, -16 * s, 8 * s, 26 * s);
      break;
    }
    case "astronaut": {
      const floatY = Math.sin(t * 2) * 5 * s;
      ctx.translate(0, floatY);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(-7 * s, -14 * s, 14 * s, 12 * s);
      ctx.fillRect(-6 * s, -1 * s, 12 * s, 14 * s);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(-5 * s, -12 * s, 10 * s, 7 * s);
      break;
    }
  }

  ctx.restore();
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
    const landmarks = isReverse ? SKY_LANDMARKS : DIVE_LANDMARKS;
    const specimenNames = isReverse ? SKY_SPECIMENS : OCEAN_SPECIMENS;

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

      // 2. Diagonal sunbeams near the surface
      if (!isReverse && d < 340) {
        const beamAlpha = Math.max(0, 0.09 * (1 - d / 340));
        ctx.fillStyle = `rgba(186, 230, 253, ${beamAlpha})`;
        for (const ox of [0.22, 0.44, 0.68, 0.84]) {
          ctx.beginPath();
          ctx.moveTo(w * ox, 0);
          ctx.lineTo(w * (ox + 0.06), 0);
          ctx.lineTo(w * (ox + 0.22), h);
          ctx.lineTo(w * (ox + 0.08), h);
          ctx.closePath();
          ctx.fill();
        }
      }

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
        drawLandmarkSprite(ctx, lm, lx, ly, dpr, t);
      }

      // 5. Schooling silhouettes (swim & gently slow back down after sonar scatter)
      for (const s of swimmers) {
        s.x += s.vx;
        const sign = s.vx >= 0 ? 1 : -1;
        if (Math.abs(s.vx) > 0.0007) {
          s.vx *= 0.96;
          if (Math.abs(s.vx) < 0.00035) s.vx = sign * 0.00035;
        }
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
        ctx.fillStyle = isReverse ? "rgba(255, 255, 255, 0.35)" : "rgba(2, 12, 24, 0.5)";
        ctx.fillRect(sx - sz, sy - sz * 0.35, sz * 1.6, sz * 0.7);
        ctx.fillRect(sx - dir * sz * 1.35, sy - sz * 0.55, sz * 0.55, sz * 1.1);
      }

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

  const markers = isReverse ? SKY_MARKERS : DIVE_MARKERS;

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
          <div className="absolute right-[10%] top-[18%] h-14 w-14 rounded-full bg-[#fef08a] shadow-[0_0_45px_rgba(254,240,138,0.9)] sm:h-20 sm:w-20" />
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

      {/* Meadow Launch Pad, Clouds, Sun & Mascot Balloon when Noillirk is near launch altitude */}
      {isReverse && cameraDepth < 650 && (
        <div
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
          style={{ opacity: Math.max(0, 1 - cameraDepth / 650) }}
          aria-hidden="true"
        >
          <div
            className="absolute right-[12%] top-[12%] h-14 w-14 rounded-full bg-[#fef08a] shadow-[0_0_45px_rgba(254,240,138,0.9)] sm:h-20 sm:w-20"
            style={{ transform: `translateY(${Math.round(cameraDepth * 0.25)}px)` }}
          />
          <div
            className="animate-ak-float absolute left-[10%] top-[18%] h-7 w-28 rounded-sm bg-white/90 shadow-[12px_-10px_0_0_rgba(255,255,255,0.9),28px_-4px_0_0_rgba(255,255,255,0.85)]"
            style={{ transform: `translateY(${Math.round(cameraDepth * 0.55)}px)` }}
          />
          <div
            className="animate-ak-float absolute right-[18%] top-[30%] h-6 w-24 rounded-sm bg-white/85 shadow-[-10px_-8px_0_0_rgba(255,255,255,0.85)]"
            style={{ transform: `translateY(${Math.round(cameraDepth * 0.7)}px)` }}
          />
          <div
            className="animate-ak-float hidden sm:block absolute left-[58%] top-[54%] h-6 w-24 rounded-sm bg-white/75 shadow-[10px_-8px_0_0_rgba(255,255,255,0.8)]"
            style={{ transform: `translateY(${Math.round(cameraDepth * 0.85)}px)` }}
          />
        </div>
      )}

      {isReverse && horizonTopPx < 900 && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
          style={{ opacity: Math.max(0, 1 - cameraDepth / 220) }}
          aria-hidden="true"
        >
          <div className="h-6 w-full bg-gradient-to-t from-emerald-600/55 via-emerald-700/25 to-transparent" />
          <div className="h-14 w-full border-t-2 border-emerald-400/45 bg-gradient-to-t from-emerald-950/95 via-emerald-900/80 to-emerald-800/60" />
        </div>
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
            {isReverse ? "Ascending through sky..." : "Sinking into the deep..."}
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
