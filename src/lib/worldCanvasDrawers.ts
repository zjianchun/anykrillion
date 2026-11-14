import type { ThemeVariant } from "@/lib/gameThemes";
import type { LandmarkVisualKind } from "@/lib/worldThemesData";

export const PX_PER_METER = 3.1;
export const SURFACE_OFFSET_PX = 165;

export interface CanvasSwimmer {
  x: number;
  depth: number;
  vx: number;
  size: number;
}

/** Draw theme-distinctive background architectural/world patterns behind all cards */
export function drawThemeBackdropPattern(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  d: number,
  dpr: number,
  themeId: ThemeVariant,
  isReverse: boolean,
  t: number,
): void {
  if (isReverse || themeId === "sky") {
    // Subtle high-altitude twinkling stars above 1,200ft
    if (d > 900) {
      const starAlpha = Math.min(0.65, (d - 900) / 2200);
      ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha})`;
      for (let i = 0; i < 24; i++) {
        const sx = ((i * 197 + 43) % 100) * 0.01 * w;
        const sy = ((i * 313 + 71) % 100) * 0.01 * h;
        const tw = 1.5 + Math.sin(t * 2 + i) * 0.8;
        ctx.fillRect(sx, sy, tw * dpr, tw * dpr);
      }
    }
    return;
  }

  switch (themeId) {
    case "pitch": {
      // Mowed pitch vertical grass stripes + scrolling horizontal chalk pitch lines
      const stripeCount = 8;
      const stripeW = w / stripeCount;
      for (let i = 0; i < stripeCount; i += 2) {
        ctx.fillStyle = "rgba(16, 185, 129, 0.055)";
        ctx.fillRect(i * stripeW, 0, stripeW, h);
      }
      const spacing = 180 * dpr;
      const offset = ((d * PX_PER_METER * dpr) % spacing + spacing) % spacing;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.09)";
      ctx.lineWidth = 1.5 * dpr;
      for (let y = -offset; y < h + spacing; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w * 0.5, y + spacing * 0.5, 44 * dpr, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case "hardwood": {
      // Diagonal arena spotlight cones + hardwood court plank seams scrolling vertically
      const plankW = w / 10;
      ctx.strokeStyle = "rgba(251, 146, 60, 0.08)";
      ctx.lineWidth = 1 * dpr;
      for (let i = 1; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(i * plankW, 0);
        ctx.lineTo(i * plankW, h);
        ctx.stroke();
      }
      const keySpacing = 220 * dpr;
      const offset = ((d * PX_PER_METER * dpr) % keySpacing + keySpacing) % keySpacing;
      ctx.strokeStyle = "rgba(253, 186, 116, 0.11)";
      ctx.lineWidth = 2 * dpr;
      for (let y = -offset; y < h + keySpacing; y += keySpacing) {
        ctx.beginPath();
        ctx.arc(w * 0.5, y, 76 * dpr, 0, Math.PI);
        ctx.stroke();
      }
      break;
    }

    case "pokedex": {
      // Scrolling Pokédex digital grid + subtle sweeping scanner beam
      const cell = 64 * dpr;
      const offset = ((d * PX_PER_METER * dpr) % cell + cell) % cell;
      ctx.strokeStyle = "rgba(244, 63, 94, 0.09)";
      ctx.lineWidth = 1 * dpr;
      for (let x = 0; x < w; x += cell) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = -offset; y < h + cell; y += cell) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      const scanY = ((t * 95 * dpr) % (h + 80 * dpr)) - 40 * dpr;
      const scanGrad = ctx.createLinearGradient(0, scanY - 24 * dpr, 0, scanY + 24 * dpr);
      scanGrad.addColorStop(0, "rgba(250, 204, 21, 0)");
      scanGrad.addColorStop(0.5, "rgba(250, 204, 21, 0.09)");
      scanGrad.addColorStop(1, "rgba(250, 204, 21, 0)");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 24 * dpr, w, 48 * dpr);
      break;
    }

    case "atlas": {
      // Cartographic latitude/longitude meridian lines
      const latGap = 130 * dpr;
      const offset = ((d * PX_PER_METER * dpr) % latGap + latGap) % latGap;
      ctx.save();
      ctx.setLineDash([6 * dpr, 6 * dpr]);
      ctx.strokeStyle = "rgba(45, 212, 191, 0.14)";
      ctx.lineWidth = 1 * dpr;
      for (let x = w * 0.15; x < w * 0.9; x += w * 0.18) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = -offset; y < h + latGap; y += latGap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case "cinema": {
      // Scrolling 35mm film sprocket strip on left border + sweeping premiere spotlights
      const holeGap = 28 * dpr;
      const offset = ((d * PX_PER_METER * dpr) % holeGap + holeGap) % holeGap;
      ctx.fillStyle = "rgba(15, 7, 36, 0.45)";
      ctx.fillRect(0, 0, 22 * dpr, h);
      ctx.fillStyle = "rgba(232, 121, 249, 0.25)";
      for (let y = -offset; y < h + holeGap; y += holeGap) {
        ctx.fillRect(5 * dpr, y, 12 * dpr, 15 * dpr);
      }
      const sweep1 = Math.sin(t * 0.8) * 0.16;
      ctx.fillStyle = "rgba(250, 204, 21, 0.055)";
      ctx.beginPath();
      ctx.moveTo(w * (0.28 + sweep1), 0);
      ctx.lineTo(w * (0.38 + sweep1), 0);
      ctx.lineTo(w * (0.65 - sweep1), h);
      ctx.lineTo(w * (0.42 - sweep1), h);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case "stadium": {
      // Vertical track lanes along pitch/stadium backdrop
      ctx.strokeStyle = "rgba(56, 189, 248, 0.1)";
      ctx.lineWidth = 1.5 * dpr;
      const laneW = w / 7;
      for (let i = 1; i < 7; i++) {
        ctx.beginPath();
        ctx.moveTo(i * laneW, 0);
        ctx.lineTo(i * laneW, h);
        ctx.stroke();
      }
      break;
    }

    default: {
      // Diagonal sunlit rays in shallow ocean water
      if (d < 340) {
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
      break;
    }
  }
}

/** Draw theme-matched ambient moving objects instead of sea fish everywhere */
export function drawThemeSwimmers(
  ctx: CanvasRenderingContext2D,
  swimmers: CanvasSwimmer[],
  w: number,
  h: number,
  d: number,
  dpr: number,
  themeId: ThemeVariant,
  isReverse: boolean,
  t: number,
): void {
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

    if (isReverse || themeId === "sky") {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.48)";
      ctx.lineWidth = 1.6 * dpr;
      const flap = Math.sin(t * 7 + s.depth) * 3 * dpr;
      ctx.beginPath();
      ctx.moveTo(sx - sz, sy - 3 * dpr + flap);
      ctx.lineTo(sx, sy);
      ctx.lineTo(sx + sz, sy - 3 * dpr + flap);
      ctx.stroke();
      continue;
    }

    switch (themeId) {
      case "pitch": {
        ctx.fillStyle = "rgba(248, 250, 252, 0.48)";
        ctx.beginPath();
        ctx.arc(sx, sy, sz * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(6, 78, 59, 0.7)";
        ctx.fillRect(sx - sz * 0.25, sy - sz * 0.25, sz * 0.5, sz * 0.5);
        break;
      }
      case "hardwood": {
        ctx.fillStyle = "rgba(249, 115, 22, 0.52)";
        ctx.beginPath();
        ctx.arc(sx, sy + Math.sin(t * 4 + s.depth) * 5 * dpr, sz * 0.68, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "pokedex": {
        // Floating glowing diamond encounter sparks
        ctx.fillStyle = "rgba(250, 204, 21, 0.55)";
        ctx.beginPath();
        ctx.arc(sx, sy, sz * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(244, 63, 94, 0.65)";
        ctx.fillRect(sx - sz * 0.55, sy - 1 * dpr, sz * 1.1, 2 * dpr);
        break;
      }
      case "atlas": {
        // Tiny paper gliders / caravels cruising latitude lines
        ctx.fillStyle = "rgba(204, 251, 241, 0.45)";
        ctx.beginPath();
        ctx.moveTo(sx + dir * sz, sy);
        ctx.lineTo(sx - dir * sz, sy - sz * 0.45);
        ctx.lineTo(sx - dir * sz * 0.6, sy + sz * 0.45);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case "cinema": {
        // Glinting 4-point film stars
        ctx.fillStyle = "rgba(245, 208, 254, 0.5)";
        ctx.fillRect(sx - sz * 0.7, sy - 1 * dpr, sz * 1.4, 2 * dpr);
        ctx.fillRect(sx - 1 * dpr, sy - sz * 0.7, 2 * dpr, sz * 1.4);
        break;
      }
      case "stadium": {
        // Racing momentum streak & badge
        ctx.fillStyle = "rgba(125, 211, 252, 0.45)";
        ctx.fillRect(sx - dir * sz * 1.8, sy - 1.5 * dpr, sz * 1.8, 3 * dpr);
        break;
      }
      default: {
        // Classic abyssal fish silhouettes
        ctx.fillStyle = "rgba(2, 12, 24, 0.5)";
        ctx.fillRect(sx - sz, sy - sz * 0.35, sz * 1.6, sz * 0.7);
        ctx.fillRect(sx - dir * sz * 1.35, sy - sz * 0.55, sz * 0.55, sz * 1.1);
        break;
      }
    }
  }
}

/** Procedural crisp canvas artwork for all world landmarks */
export function drawThemeLandmark(
  ctx: CanvasRenderingContext2D,
  id: LandmarkVisualKind,
  x: number,
  y: number,
  dpr: number,
  t: number,
): void {
  const s = dpr;
  ctx.save();
  ctx.translate(x, y);

  switch (id) {
    // --- OCEAN / ABYSS ---
    case "kelp": {
      for (let f = -1; f <= 1; f++) {
        ctx.beginPath();
        ctx.moveTo(f * 10 * s, 32 * s);
        for (let seg = 1; seg <= 6; seg++) {
          ctx.lineTo(f * 10 * s + Math.sin(t * 2.1 + seg * 0.8 + f) * 6 * s, (32 - seg * 10) * s);
        }
        ctx.strokeStyle = f === 0 ? "rgba(52, 211, 153, 0.55)" : "rgba(16, 185, 129, 0.42)";
        ctx.lineWidth = 4 * s;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      break;
    }
    case "diver": {
      ctx.translate(0, Math.sin(t * 2.4) * 4 * s);
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
      ctx.fillStyle = "#0ea5e9";
      ctx.fillRect(-10 * s, -6 * s, 20 * s, 10 * s);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(-5 * s, -12 * s, 12 * s, 5 * s);
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(-16 * s, -9 * s, 8 * s, 8 * s);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(-16 * s, -7 * s, 4 * s, 4 * s);
      const kick = Math.sin(t * 6) * 3 * s;
      ctx.fillStyle = "#f43f5e";
      ctx.fillRect(10 * s, -6 * s + kick, 9 * s, 3 * s);
      ctx.fillRect(10 * s, 2 * s - kick, 9 * s, 3 * s);
      break;
    }
    case "turtle": {
      ctx.translate(Math.sin(t * 0.7) * 18 * s, 0);
      const flap = Math.sin(t * 3.2) * 5 * s;
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
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.ellipse(0, 0, 26 * s, 13 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#d97706";
      ctx.fillRect(-6 * s, -20 * s, 12 * s, 8 * s);
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
      ctx.fillStyle = `rgba(250, 204, 21, ${0.55 + Math.sin(t * 4) * 0.35})`;
      ctx.fillRect(-20 * s, -12 * s, 12 * s, 8 * s);
      break;
    }
    case "jellyfish": {
      for (let j = 0; j < 2; j++) {
        const jx = (j === 0 ? -10 : 14) * s;
        const jy = Math.sin(t * 2.5 + j * 1.6) * 7 * s + (j === 1 ? -14 * s : 4 * s);
        ctx.fillStyle = j === 0 ? "rgba(244, 114, 182, 0.7)" : "rgba(167, 139, 250, 0.65)";
        ctx.beginPath();
        ctx.arc(jx, jy, 10 * s * (1 + Math.sin(t * 4 + j) * 0.12), Math.PI, 0);
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
      ctx.translate(0, Math.sin(t * 2) * 5 * s);
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

    // --- SKY / NOILLIRK ---
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
      ["#f43f5e", "#fb923c", "#facc15", "#4ade80", "#38bdf8"].forEach((c, idx) => {
        ctx.strokeStyle = c;
        ctx.globalAlpha = 0.5;
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
      ctx.translate(0, Math.sin(t * 2) * 5 * s);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(-7 * s, -14 * s, 14 * s, 12 * s);
      ctx.fillRect(-6 * s, -1 * s, 12 * s, 14 * s);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(-5 * s, -12 * s, 10 * s, 7 * s);
      break;
    }

    // --- FOOTBALL / PITCH ---
    case "cornerflag": {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(-2 * s, -18 * s, 2.5 * s, 32 * s);
      const wave = Math.sin(t * 6) * 3 * s;
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.moveTo(0, -18 * s);
      ctx.lineTo(15 * s, -14 * s + wave);
      ctx.lineTo(0, -8 * s);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.arc(0, 14 * s, 12 * s, Math.PI, Math.PI * 1.5);
      ctx.stroke();
      break;
    }
    case "goalkeeper": {
      // Goal frame + diving keeper
      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 2.5 * s;
      ctx.strokeRect(-24 * s, -16 * s, 48 * s, 24 * s);
      const diveX = Math.sin(t * 3) * 10 * s;
      ctx.fillStyle = "#facc15";
      ctx.fillRect(-8 * s + diveX, -8 * s, 16 * s, 7 * s);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(-12 * s + diveX, -9 * s, 4 * s, 4 * s);
      ctx.fillRect(8 * s + diveX, -9 * s, 4 * s, 4 * s);
      break;
    }
    case "flashbulbs": {
      for (let i = 0; i < 4; i++) {
        const fx = (i - 1.5) * 14 * s;
        const fy = (i % 2 === 0 ? -5 : 5) * s;
        const on = Math.sin(t * 10 + i * 2.1) > 0.4;
        ctx.fillStyle = on ? "#fef08a" : "rgba(255,255,255,0.2)";
        ctx.beginPath();
        ctx.arc(fx, fy, (on ? 5 : 2.5) * s, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "varbooth": {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-16 * s, -12 * s, 32 * s, 22 * s);
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 2 * s;
      ctx.strokeRect(-16 * s, -12 * s, 32 * s, 22 * s);
      ctx.fillStyle = Math.sin(t * 4) > 0 ? "#4ade80" : "#38bdf8";
      ctx.fillRect(-11 * s, -7 * s, 22 * s, 12 * s);
      break;
    }
    case "goldenboot": {
      ctx.fillStyle = "#facc15";
      ctx.fillRect(-12 * s, 2 * s, 24 * s, 8 * s);
      ctx.fillRect(-12 * s, -8 * s, 10 * s, 10 * s);
      ctx.fillStyle = "#fde047";
      ctx.fillRect(-10 * s, 10 * s, 4 * s, 3 * s);
      ctx.fillRect(4 * s, 10 * s, 4 * s, 3 * s);
      break;
    }
    case "starball": {
      ctx.rotate(t * 0.8);
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(0, 0, 16 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#4ade80";
      ctx.fillRect(-5 * s, -5 * s, 10 * s, 10 * s);
      break;
    }
    case "worldcup": {
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(0, -8 * s, 11 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-5 * s, 2 * s, 10 * s, 12 * s);
      ctx.fillStyle = "#16a34a";
      ctx.fillRect(-9 * s, 14 * s, 18 * s, 4 * s);
      break;
    }

    // --- NBA HARDWOOD ---
    case "shotclock": {
      ctx.fillStyle = "#09090b";
      ctx.fillRect(-16 * s, -12 * s, 32 * s, 22 * s);
      ctx.strokeStyle = "#fb923c";
      ctx.lineWidth = 2 * s;
      ctx.strokeRect(-16 * s, -12 * s, 32 * s, 22 * s);
      ctx.fillStyle = "#f43f5e";
      ctx.fillRect(-9 * s, -6 * s, 7 * s, 10 * s);
      ctx.fillRect(2 * s, -6 * s, 7 * s, 10 * s);
      break;
    }
    case "hoop": {
      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 2 * s;
      ctx.strokeRect(-18 * s, -18 * s, 36 * s, 22 * s);
      ctx.fillStyle = "#f97316";
      ctx.fillRect(-10 * s, 0, 20 * s, 3.5 * s);
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 1.2 * s;
      const sway = Math.sin(t * 3.5) * 2 * s;
      ctx.beginPath();
      ctx.moveTo(-9 * s, 3.5 * s);
      ctx.lineTo(-6 * s + sway, 18 * s);
      ctx.lineTo(6 * s + sway, 18 * s);
      ctx.lineTo(9 * s, 3.5 * s);
      ctx.stroke();
      break;
    }
    case "jerseys": {
      ["#facc15", "#a855f7"].forEach((col, i) => {
        const bx = (i === 0 ? -12 : 8) * s;
        ctx.fillStyle = col;
        ctx.fillRect(bx, -14 * s, 14 * s, 22 * s);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(bx + 4 * s, -8 * s, 6 * s, 8 * s);
      });
      break;
    }
    case "sneaker": {
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(-14 * s, -4 * s, 26 * s, 10 * s);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(-14 * s, 6 * s, 28 * s, 4 * s);
      ctx.fillStyle = "#09090b";
      ctx.fillRect(-4 * s, -8 * s, 10 * s, 6 * s);
      break;
    }
    case "moneyrack": {
      ctx.fillStyle = "#64748b";
      ctx.fillRect(-20 * s, 4 * s, 40 * s, 4 * s);
      [-14, -5, 4, 13].forEach((bx, idx) => {
        ctx.fillStyle = idx === 3 ? "#facc15" : "#f97316";
        ctx.beginPath();
        ctx.arc(bx * s, -3 * s, 5 * s, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }
    case "obrien": {
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(0, -10 * s, 8 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-3 * s, -2 * s, 6 * s, 14 * s);
      ctx.fillRect(-10 * s, 12 * s, 20 * s, 5 * s);
      break;
    }

    // --- POKEKRILLION / POKEDEX ---
    case "tallgrass": {
      for (let g = -2; g <= 2; g++) {
        const sw = Math.sin(t * 4 + g) * 2.5 * s;
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.moveTo(g * 7 * s, 14 * s);
        ctx.lineTo(g * 7 * s + 3 * s + sw, -8 * s);
        ctx.lineTo(g * 7 * s + 6 * s, 14 * s);
        ctx.fill();
      }
      if (Math.sin(t * 3) > 0.2) {
        ctx.fillStyle = "#fde047";
        ctx.fillRect(-2 * s, -22 * s, 4 * s, 8 * s);
        ctx.fillRect(-2 * s, -12 * s, 4 * s, 3 * s);
      }
      break;
    }
    case "pikachu": {
      // Pointy yellow ears silhouette trap
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(0, 2 * s, 11 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-10 * s, -16 * s, 5 * s, 12 * s);
      ctx.fillRect(5 * s, -16 * s, 5 * s, 12 * s);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-10 * s, -16 * s, 5 * s, 4 * s);
      ctx.fillRect(5 * s, -16 * s, 5 * s, 4 * s);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(-8 * s, 3 * s, 3 * s, 3 * s);
      ctx.fillRect(5 * s, 3 * s, 3 * s, 3 * s);
      break;
    }
    case "pokestop": {
      ctx.rotate(t * 1.1);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3 * s;
      ctx.beginPath();
      ctx.arc(0, 0, 14 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#7dd3fc";
      ctx.fillRect(-3 * s, -18 * s, 6 * s, 36 * s);
      break;
    }
    case "badges": {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-20 * s, -10 * s, 40 * s, 20 * s);
      ["#f43f5e", "#38bdf8", "#facc15", "#4ade80"].forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc((-12 + i * 8) * s, 0, 3 * s, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }
    case "masterball": {
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.arc(0, 0, 14 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#9333ea";
      ctx.beginPath();
      ctx.arc(0, 0, 14 * s, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#ec4899";
      ctx.fillRect(-9 * s, -9 * s, 5 * s, 4 * s);
      ctx.fillRect(4 * s, -9 * s, 5 * s, 4 * s);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-14 * s, -2 * s, 28 * s, 4 * s);
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.arc(0, 0, 4.5 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "evostone": {
      ["#f97316", "#facc15", "#38bdf8"].forEach((col, i) => {
        const yOff = Math.sin(t * 2.5 + i) * 4 * s;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo((-12 + i * 12) * s, -10 * s + yOff);
        ctx.lineTo((-7 + i * 12) * s, yOff);
        ctx.lineTo((-12 + i * 12) * s, 10 * s + yOff);
        ctx.lineTo((-17 + i * 12) * s, yOff);
        ctx.closePath();
        ctx.fill();
      });
      break;
    }
    case "fossil": {
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.ellipse(0, 0, 14 * s, 11 * s, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fde68a";
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(0, 0, 6 * s, 0, Math.PI * 1.5);
      ctx.stroke();
      break;
    }
    case "rift": {
      ctx.rotate(t * 1.4);
      ctx.strokeStyle = "#c084fc";
      ctx.lineWidth = 3 * s;
      ctx.strokeRect(-14 * s, -14 * s, 28 * s, 28 * s);
      ctx.strokeStyle = "#f472b6";
      ctx.strokeRect(-8 * s, -8 * s, 16 * s, 16 * s);
      break;
    }

    // --- ATLAS / GEOGRAPHY ---
    case "compass": {
      ctx.strokeStyle = "#5eead4";
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(0, 0, 16 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.rotate(Math.sin(t * 1.3) * 0.4);
      ctx.fillStyle = "#fb7185";
      ctx.beginPath();
      ctx.moveTo(0, -13 * s);
      ctx.lineTo(4 * s, 0);
      ctx.lineTo(-4 * s, 0);
      ctx.fill();
      ctx.fillStyle = "#2dd4bf";
      ctx.beginPath();
      ctx.moveTo(0, 13 * s);
      ctx.lineTo(4 * s, 0);
      ctx.lineTo(-4 * s, 0);
      ctx.fill();
      break;
    }
    case "pyramids": {
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.moveTo(-24 * s, 14 * s);
      ctx.lineTo(-6 * s, -14 * s);
      ctx.lineTo(12 * s, 14 * s);
      ctx.fill();
      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.moveTo(4 * s, 14 * s);
      ctx.lineTo(18 * s, -6 * s);
      ctx.lineTo(30 * s, 14 * s);
      ctx.fill();
      break;
    }
    case "eiffel": {
      ctx.strokeStyle = "#fcd34d";
      ctx.lineWidth = 2.2 * s;
      ctx.beginPath();
      ctx.moveTo(-12 * s, 18 * s);
      ctx.quadraticCurveTo(-3 * s, 2 * s, 0, -22 * s);
      ctx.quadraticCurveTo(3 * s, 2 * s, 12 * s, 18 * s);
      ctx.stroke();
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(-5 * s, 6 * s, 10 * s, 2 * s);
      break;
    }
    case "everest": {
      ctx.fillStyle = "#0f766e";
      ctx.beginPath();
      ctx.moveTo(-26 * s, 16 * s);
      ctx.lineTo(0, -18 * s);
      ctx.lineTo(26 * s, 16 * s);
      ctx.fill();
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.moveTo(-8 * s, -6 * s);
      ctx.lineTo(0, -18 * s);
      ctx.lineTo(8 * s, -6 * s);
      ctx.lineTo(3 * s, -3 * s);
      ctx.lineTo(0, -7 * s);
      ctx.lineTo(-4 * s, -3 * s);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "airship": {
      ctx.translate(Math.sin(t * 1.1) * 14 * s, 0);
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.ellipse(0, -4 * s, 24 * s, 10 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#78350f";
      ctx.fillRect(-7 * s, 7 * s, 14 * s, 5 * s);
      break;
    }
    case "moai": {
      ctx.fillStyle = "#64748b";
      ctx.fillRect(-9 * s, -16 * s, 18 * s, 30 * s);
      ctx.fillStyle = "#334155";
      ctx.fillRect(-6 * s, -10 * s, 12 * s, 4 * s);
      ctx.fillRect(-2 * s, -6 * s, 4 * s, 10 * s);
      break;
    }
    case "aurora": {
      ["rgba(52,211,153,0.45)", "rgba(56,189,248,0.4)"].forEach((c, i) => {
        ctx.strokeStyle = c;
        ctx.lineWidth = 6 * s;
        ctx.beginPath();
        ctx.moveTo(-36 * s, (-6 + i * 8) * s);
        ctx.quadraticCurveTo(0, (-20 + Math.sin(t * 2 + i) * 8) * s, 36 * s, (-6 + i * 8) * s);
        ctx.stroke();
      });
      break;
    }

    // --- CINEMA / MOVIES ---
    case "clapper": {
      ctx.fillStyle = "#1e1b4b";
      ctx.fillRect(-16 * s, -4 * s, 32 * s, 20 * s);
      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 1.8 * s;
      ctx.strokeRect(-16 * s, -4 * s, 32 * s, 20 * s);
      ctx.rotate(-0.2 + Math.sin(t * 3) * 0.12);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(-16 * s, -11 * s, 32 * s, 6 * s);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-10 * s, -11 * s, 6 * s, 6 * s);
      ctx.fillRect(4 * s, -11 * s, 6 * s, 6 * s);
      break;
    }
    case "popcorn": {
      ctx.fillStyle = "#e11d48";
      ctx.fillRect(-10 * s, -2 * s, 20 * s, 18 * s);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(-4 * s, -2 * s, 4 * s, 18 * s);
      ctx.fillRect(4 * s, -2 * s, 4 * s, 18 * s);
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(-5 * s, -6 * s, 5 * s, 0, Math.PI * 2);
      ctx.arc(3 * s, -8 * s, 6 * s, 0, Math.PI * 2);
      ctx.arc(7 * s, -4 * s, 4 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "projector": {
      const beam = ctx.createLinearGradient(12 * s, 0, 120 * s, 0);
      beam.addColorStop(0, "rgba(254, 240, 138, 0.35)");
      beam.addColorStop(1, "rgba(254, 240, 138, 0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(12 * s, 0);
      ctx.lineTo(120 * s, -26 * s);
      ctx.lineTo(120 * s, 26 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#a855f7";
      ctx.fillRect(-12 * s, -4 * s, 22 * s, 14 * s);
      ctx.fillStyle = "#e9d5ff";
      ctx.beginPath();
      ctx.arc(-8 * s, -10 * s, 7 * s, 0, Math.PI * 2);
      ctx.arc(6 * s, -10 * s, 7 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "walkstar": {
      ctx.fillStyle = "#f43f5e";
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (i * 72 - 90) * (Math.PI / 180);
        const a2 = ((i * 72 + 36) - 90) * (Math.PI / 180);
        if (i === 0) ctx.moveTo(Math.cos(a1) * 16 * s, Math.sin(a1) * 16 * s);
        else ctx.lineTo(Math.cos(a1) * 16 * s, Math.sin(a1) * 16 * s);
        ctx.lineTo(Math.cos(a2) * 7 * s, Math.sin(a2) * 7 * s);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "scifi": {
      ctx.translate(Math.sin(t * 1.8) * 10 * s, Math.cos(t * 2.2) * 4 * s);
      ctx.fillStyle = "#e879f9";
      ctx.beginPath();
      ctx.ellipse(0, 0, 20 * s, 6 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#67e8f9";
      ctx.beginPath();
      ctx.arc(0, -4 * s, 8 * s, Math.PI, 0);
      ctx.fill();
      break;
    }
    case "oscar": {
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(0, -14 * s, 5 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-4 * s, -8 * s, 8 * s, 18 * s);
      ctx.fillStyle = "#b45309";
      ctx.fillRect(-8 * s, 10 * s, 16 * s, 6 * s);
      break;
    }

    // --- STADIUM / ALL-SPORTS ---
    case "hurdles": {
      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 2.5 * s;
      ctx.strokeRect(-18 * s, -8 * s, 36 * s, 18 * s);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(-18 * s, -8 * s, 36 * s, 5 * s);
      break;
    }
    case "torch": {
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.moveTo(-6 * s, -2 * s);
      ctx.lineTo(6 * s, -2 * s);
      ctx.lineTo(2 * s, 18 * s);
      ctx.lineTo(-2 * s, 18 * s);
      ctx.closePath();
      ctx.fill();
      const flick = Math.sin(t * 8) * 3 * s;
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.arc(0, -8 * s, 8 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(flick * 0.4, -10 * s, 5 * s, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "tennis": {
      ctx.fillStyle = "#bef264";
      ctx.beginPath();
      ctx.arc(0, Math.sin(t * 4) * 5 * s, 10 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.arc(0, Math.sin(t * 4) * 5 * s, 6 * s, 0, Math.PI);
      ctx.stroke();
      break;
    }
    case "f1car": {
      ctx.translate(Math.sin(t * 2.5) * 16 * s, 0);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(-20 * s, -4 * s, 40 * s, 8 * s);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-15 * s, -9 * s, 8 * s, 5 * s);
      ctx.fillRect(-15 * s, 4 * s, 8 * s, 5 * s);
      ctx.fillRect(8 * s, -9 * s, 8 * s, 5 * s);
      ctx.fillRect(8 * s, 4 * s, 8 * s, 5 * s);
      break;
    }
    case "podium": {
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(-20 * s, 2 * s, 12 * s, 14 * s);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(-6 * s, -8 * s, 14 * s, 24 * s);
      ctx.fillStyle = "#d97706";
      ctx.fillRect(10 * s, 6 * s, 12 * s, 10 * s);
      break;
    }
  }

  ctx.restore();
}
