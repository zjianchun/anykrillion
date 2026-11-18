import type { ThemeVariant } from "@/lib/gameThemes";

export interface KrillionScoreCardSpec {
  kind: "krillion";
  gameTitle: string;
  modeBadge: string;
  themeId: ThemeVariant;
  isReverse: boolean;
  totalScore: number;
  maxScore: number;
  metricLabel: string;
  zoneTitle: string;
  percentile: number;
  rounds: Array<{ category: string; points: number }>;
}

export interface PoopleScoreCardSpec {
  kind: "poople";
  gameTitle: string;
  modeBadge: string;
  startWord: string;
  targetWord: string;
  stepsTaken: number;
  parSteps: number;
  tileRows: Array<Array<"match" | "changed" | "same">>;
}

export type ScoreCardSpec = KrillionScoreCardSpec | PoopleScoreCardSpec;

interface CardPalette {
  bgTop: string;
  bgBottom: string;
  primary: string;
  secondary: string;
  glow: string;
  badgeText: string;
}

const THEME_CARD_PALETTES: Record<ThemeVariant, CardPalette> = {
  abyss: {
    bgTop: "#021120",
    bgBottom: "#062540",
    primary: "#22d3ee",
    secondary: "#38bdf8",
    glow: "rgba(34, 211, 238, 0.22)",
    badgeText: "#a5f3fc",
  },
  sky: {
    bgTop: "#130d26",
    bgBottom: "#241942",
    primary: "#fcd34d",
    secondary: "#f59e0b",
    glow: "rgba(252, 211, 77, 0.24)",
    badgeText: "#fde68a",
  },
  pitch: {
    bgTop: "#031912",
    bgBottom: "#073422",
    primary: "#a3e635",
    secondary: "#34d399",
    glow: "rgba(163, 230, 53, 0.22)",
    badgeText: "#d9f99d",
  },
  hardwood: {
    bgTop: "#1b0e06",
    bgBottom: "#30190a",
    primary: "#fb923c",
    secondary: "#fbbf24",
    glow: "rgba(251, 146, 60, 0.24)",
    badgeText: "#fed7aa",
  },
  pokedex: {
    bgTop: "#1a0915",
    bgBottom: "#2f1025",
    primary: "#fb7185",
    secondary: "#f43f5e",
    glow: "rgba(251, 113, 133, 0.22)",
    badgeText: "#fecdd3",
  },
  atlas: {
    bgTop: "#03191d",
    bgBottom: "#073036",
    primary: "#2dd4bf",
    secondary: "#38bdf8",
    glow: "rgba(45, 212, 191, 0.22)",
    badgeText: "#99f6e4",
  },
  cinema: {
    bgTop: "#160e05",
    bgBottom: "#2b1b08",
    primary: "#fbbf24",
    secondary: "#f59e0b",
    glow: "rgba(251, 191, 36, 0.24)",
    badgeText: "#fde68a",
  },
  stadium: {
    bgTop: "#041326",
    bgBottom: "#092647",
    primary: "#38bdf8",
    secondary: "#60a5fa",
    glow: "rgba(56, 189, 248, 0.22)",
    badgeText: "#bae6fd",
  },
};

const POOPLE_PALETTE: CardPalette = {
  bgTop: "#021815",
  bgBottom: "#063029",
  primary: "#34d399",
  secondary: "#fbbf24",
  glow: "rgba(52, 211, 153, 0.22)",
  badgeText: "#a7f3d0",
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let clipped = text;
  while (clipped.length > 1 && ctx.measureText(`${clipped}…`).width > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped}…`;
}

function drawKrillionBody(
  ctx: CanvasRenderingContext2D,
  spec: KrillionScoreCardSpec,
  palette: CardPalette,
) {
  const maxScore = Math.max(1, spec.maxScore);
  const ratio = Math.max(0, Math.min(1, spec.totalScore / maxScore));
  const topPct = Math.max(1, 100 - spec.percentile);

  // Big Score Hero
  ctx.textBaseline = "alphabetic";
  ctx.font = "900 76px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#fcd34d";
  const scoreStr = String(spec.totalScore);
  ctx.fillText(scoreStr, 58, 250);
  const scoreW = ctx.measureText(scoreStr).width;

  ctx.font = "700 28px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(`/ ${spec.maxScore}`, 58 + scoreW + 12, 246);

  // Metric Pill
  ctx.font = "800 22px ui-monospace, SFMono-Regular, Menlo, monospace";
  const metricTextW = ctx.measureText(spec.metricLabel).width;
  const metricPillW = Math.min(440, metricTextW + 34);
  drawRoundedRect(ctx, 58, 272, metricPillW, 44, 12);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();
  ctx.strokeStyle = palette.primary;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = palette.badgeText;
  ctx.textBaseline = "middle";
  ctx.fillText(truncateText(ctx, spec.metricLabel, metricPillW - 24), 75, 294);

  // Zone + Percentile Summary
  ctx.textBaseline = "alphabetic";
  ctx.font = "600 18px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText(
    truncateText(ctx, `Zone Reached: ${spec.zoneTitle}`, 455),
    58,
    356,
  );

  ctx.font = "800 19px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = palette.primary;
  ctx.fillText(
    `Top ${topPct}% · Better than ${spec.percentile}% of players`,
    58,
    390,
  );

  // Mini Bell Curve Card
  drawRoundedRect(ctx, 58, 418, 456, 154, 16);
  ctx.fillStyle = "rgba(3, 15, 29, 0.78)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.10)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = "700 13px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("SCORE DISTRIBUTION BELL CURVE", 78, 446);
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText(`TOP ${topPct}%`, 425, 446);

  const curveLeft = 78;
  const curveRight = 494;
  const curveBaseY = 544;
  const curveAmp = 76;

  // Baseline
  ctx.beginPath();
  ctx.moveTo(curveLeft, curveBaseY);
  ctx.lineTo(curveRight, curveBaseY);
  ctx.strokeStyle = "rgba(148,163,184,0.28)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Bell Curve Area & Stroke
  const gaussY = (scoreVal: number) => {
    const z = (scoreVal - 260) / 135;
    return curveBaseY - curveAmp * Math.exp(-0.5 * z * z);
  };

  ctx.beginPath();
  ctx.moveTo(curveLeft, curveBaseY);
  for (let i = 0; i <= 56; i++) {
    const t = i / 56;
    const x = curveLeft + t * (curveRight - curveLeft);
    const y = gaussY(t * maxScore);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(curveRight, curveBaseY);
  ctx.closePath();
  const areaGrad = ctx.createLinearGradient(0, curveBaseY - curveAmp, 0, curveBaseY);
  areaGrad.addColorStop(0, "rgba(34, 211, 238, 0.34)");
  areaGrad.addColorStop(1, "rgba(34, 211, 238, 0.02)");
  ctx.fillStyle = areaGrad;
  ctx.fill();

  ctx.beginPath();
  for (let i = 0; i <= 56; i++) {
    const t = i / 56;
    const x = curveLeft + t * (curveRight - curveLeft);
    const y = gaussY(t * maxScore);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = palette.primary;
  ctx.lineWidth = 3;
  ctx.stroke();

  // YOU marker dot
  const youX = curveLeft + ratio * (curveRight - curveLeft);
  const youY = gaussY(spec.totalScore);
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(youX, youY);
  ctx.lineTo(youX, curveBaseY);
  ctx.strokeStyle = "#fb7185";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(youX, youY, 7, 0, Math.PI * 2);
  ctx.fillStyle = "#fb7185";
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  ctx.font = "800 12px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "#fda4af";
  const youLabel = "YOU";
  const clampedYouX = Math.max(curveLeft + 10, Math.min(curveRight - 36, youX - 12));
  ctx.fillText(youLabel, clampedYouX, 563);

  // Right Column: Spoiler-Free 7-Round Breakdown
  drawRoundedRect(ctx, 550, 74, 592, 498, 20);
  ctx.fillStyle = "rgba(3, 15, 29, 0.72)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = "800 14px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = palette.badgeText;
  ctx.fillText("SPOILER-FREE ROUND BREAKDOWN", 578, 108);
  ctx.fillStyle = "#94a3b8";
  const landedCount = spec.rounds.filter((r) => r.points > 0).length;
  ctx.fillText(`${landedCount}/${spec.rounds.length} LANDED`, 1020, 108);

  const visibleRounds = spec.rounds.slice(0, 7);
  visibleRounds.forEach((round, idx) => {
    const rowY = 128 + idx * 62;
    drawRoundedRect(ctx, 578, rowY, 536, 52, 12);
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textBaseline = "middle";
    ctx.font = "700 15px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "#e2e8f0";
    const rowTitle = truncateText(ctx, `Q${idx + 1} · ${round.category}`, 230);
    ctx.fillText(rowTitle, 594, rowY + 26);

    // Proportional progress bar
    const barX = 838;
    const barW = 186;
    const barY = rowY + 20;
    const barH = 12;
    drawRoundedRect(ctx, barX, barY, barW, barH, 6);
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fill();

    const fillColor =
      round.points >= 85
        ? "#fcd34d"
        : round.points >= 55
          ? "#22d3ee"
          : round.points > 0
            ? "#38bdf8"
            : "#475569";
    const fillW = round.points > 0 ? Math.max(12, Math.round((round.points / 100) * barW)) : 0;
    if (fillW > 0) {
      drawRoundedRect(ctx, barX, barY, fillW, barH, 6);
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    ctx.font = "800 16px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle =
      round.points >= 85
        ? "#fcd34d"
        : round.points >= 55
          ? "#67e8f9"
          : round.points > 0
            ? "#bae6fd"
            : "#64748b";
    ctx.textAlign = "right";
    ctx.fillText(`+${round.points}`, 1098, rowY + 26);
    ctx.textAlign = "left";
  });
}

function drawTileSquare(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  fill: string,
  border: string,
  letter?: string,
  letterColor = "#ffffff",
) {
  drawRoundedRect(ctx, x, y, size, size, 10);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.stroke();

  if (letter) {
    ctx.font = "900 22px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = letterColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter, x + size / 2, y + size / 2 + 1);
    ctx.textAlign = "left";
  }
}

function drawPoopleBody(
  ctx: CanvasRenderingContext2D,
  spec: PoopleScoreCardSpec,
  palette: CardPalette,
) {
  ctx.textBaseline = "alphabetic";
  ctx.font = "900 54px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${spec.startWord} → ${spec.targetWord}`, 58, 240);

  // Steps Badge
  const stepLabel = `${spec.stepsTaken} ${spec.stepsTaken === 1 ? "STEP" : "STEPS"}`;
  const beatPar = spec.stepsTaken <= spec.parSteps;
  drawRoundedRect(ctx, 58, 272, 168, 46, 12);
  ctx.fillStyle = beatPar ? "rgba(16, 185, 129, 0.22)" : "rgba(251, 191, 36, 0.20)";
  ctx.fill();
  ctx.strokeStyle = beatPar ? "#34d399" : "#fbbf24";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.textBaseline = "middle";
  ctx.font = "800 20px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = beatPar ? "#a7f3d0" : "#fde68a";
  ctx.fillText(stepLabel, 78, 295);

  // Par Badge
  drawRoundedRect(ctx, 240, 272, 196, 46, 12);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText(`OPTIMAL PAR: ${spec.parSteps}`, 256, 295);

  ctx.textBaseline = "alphabetic";
  ctx.font = "600 18px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText("Single-letter word ladder · Zero spoilers", 58, 362);

  // Legend Card
  drawRoundedRect(ctx, 58, 404, 456, 168, 16);
  ctx.fillStyle = "rgba(3, 15, 29, 0.78)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.10)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = "800 13px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = palette.badgeText;
  ctx.fillText("HOW TO READ THE LADDER GRID", 78, 434);

  const legendItems = [
    { fill: "#10b981", border: "#6ee7b7", text: "Matches target POOP position" },
    { fill: "#f59e0b", border: "#fcd34d", text: "Changed single letter on that step" },
    { fill: "#1e293b", border: "#475569", text: "Carried over from previous rung" },
  ];
  legendItems.forEach((item, i) => {
    const ly = 456 + i * 36;
    drawTileSquare(ctx, 78, ly, 24, item.fill, item.border);
    ctx.textBaseline = "middle";
    ctx.font = "600 15px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(item.text, 114, ly + 12);
  });

  // Right Column: Spoiler-Free Tile Grid
  drawRoundedRect(ctx, 550, 74, 592, 498, 20);
  ctx.fillStyle = "rgba(3, 15, 29, 0.72)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textBaseline = "alphabetic";
  ctx.font = "800 14px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = palette.badgeText;
  ctx.fillText("SPOILER-FREE WORD LADDER", 578, 108);
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(`${spec.stepsTaken} MOVES`, 1044, 108);

  const gridCenterX = 846;
  const tileSize = 42;
  const tileGap = 12;
  const rowWidth = tileSize * 4 + tileGap * 3;
  const startX = gridCenterX - rowWidth / 2;

  // Start Word Row
  Array.from(spec.startWord.slice(0, 4)).forEach((ch, pos) => {
    const isMatch = ch === spec.targetWord[pos];
    drawTileSquare(
      ctx,
      startX + pos * (tileSize + tileGap),
      128,
      tileSize,
      isMatch ? "rgba(16, 185, 129, 0.25)" : "#0b2030",
      isMatch ? "#34d399" : "#334155",
      ch,
    );
  });

  // Step rows (max 7 shown; collapse middle if longer)
  type DisplayEntry =
    | { kind: "tiles"; tiles: Array<"match" | "changed" | "same"> }
    | { kind: "ellipsis"; hiddenCount: number };

  const displayEntries: DisplayEntry[] = [];
  if (spec.tileRows.length <= 7) {
    for (const row of spec.tileRows) {
      displayEntries.push({ kind: "tiles", tiles: row });
    }
  } else {
    for (const row of spec.tileRows.slice(0, 3)) {
      displayEntries.push({ kind: "tiles", tiles: row });
    }
    displayEntries.push({ kind: "ellipsis", hiddenCount: spec.tileRows.length - 6 });
    for (const row of spec.tileRows.slice(-3)) {
      displayEntries.push({ kind: "tiles", tiles: row });
    }
  }

  const middleTop = 182;
  const middleBottom = 502;
  const availH = middleBottom - middleTop;
  const count = Math.max(1, displayEntries.length);
  const stepPitch = Math.min(45, Math.floor(availH / count));
  const smallTile = Math.min(tileSize, stepPitch - 6);
  const rowsBlockH = displayEntries.length * stepPitch;
  const firstY = middleTop + Math.max(0, Math.floor((availH - rowsBlockH) / 2));

  displayEntries.forEach((entry, idx) => {
    const ry = firstY + idx * stepPitch;
    if (entry.kind === "ellipsis") {
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.font = "700 14px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(`··· +${entry.hiddenCount} intermediate steps ···`, gridCenterX, ry + smallTile / 2);
      ctx.textAlign = "left";
      return;
    }

    const rW = smallTile * 4 + tileGap * 3;
    const rxStart = gridCenterX - rW / 2;
    entry.tiles.slice(0, 4).forEach((state, pos) => {
      const fill =
        state === "match"
          ? "#10b981"
          : state === "changed"
            ? "#f59e0b"
            : "#1e293b";
      const border =
        state === "match"
          ? "#6ee7b7"
          : state === "changed"
            ? "#fcd34d"
            : "#475569";
      drawTileSquare(ctx, rxStart + pos * (smallTile + tileGap), ry, smallTile, fill, border);
    });
  });

  // Target POOP Row
  Array.from(spec.targetWord.slice(0, 4)).forEach((ch, pos) => {
    drawTileSquare(
      ctx,
      startX + pos * (tileSize + tileGap),
      512,
      tileSize,
      "#10b981",
      "#a7f3d0",
      ch,
      "#022c22",
    );
  });
}

export async function renderScoreCardPng(
  spec: ScoreCardSpec,
): Promise<{ blob: Blob; dataUrl: string }> {
  const width = 1200;
  const height = 675;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not acquire 2D canvas context");
  }

  const palette =
    spec.kind === "poople"
      ? POOPLE_PALETTE
      : spec.isReverse
        ? THEME_CARD_PALETTES.sky
        : (THEME_CARD_PALETTES[spec.themeId] ?? THEME_CARD_PALETTES.abyss);

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, palette.bgTop);
  bg.addColorStop(1, palette.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Ambient glow
  const glow = ctx.createRadialGradient(280, 260, 20, 280, 260, 480);
  glow.addColorStop(0, palette.glow);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Subtle retro grid lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
  ctx.lineWidth = 1;
  for (let x = 40; x < width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 40; y < height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Outer card frame
  drawRoundedRect(ctx, 22, 22, width - 44, height - 44, 28);
  ctx.strokeStyle = palette.primary;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Top Header Left Pill
  drawRoundedRect(ctx, 58, 72, 338, 30, 15);
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fill();
  ctx.font = "800 12px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = palette.badgeText;
  ctx.textBaseline = "middle";
  ctx.fillText("ANYKRILLION.COM · FREE DAILY & ENDLESS", 74, 87);

  // Game Title + Mode Badge
  ctx.textBaseline = "alphabetic";
  ctx.font = "900 34px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(spec.gameTitle, 58, 148);
  const titleW = ctx.measureText(spec.gameTitle).width;

  ctx.font = "800 13px ui-monospace, SFMono-Regular, Menlo, monospace";
  const badgeW = Math.min(180, ctx.measureText(spec.modeBadge).width + 24);
  if (58 + titleW + 14 + badgeW <= 515) {
    drawRoundedRect(ctx, 58 + titleW + 14, 123, badgeW, 28, 8);
    ctx.fillStyle = "rgba(255, 255, 255, 0.10)";
    ctx.fill();
    ctx.fillStyle = palette.primary;
    ctx.textBaseline = "middle";
    ctx.fillText(spec.modeBadge, 58 + titleW + 26, 137);
  }

  // Main Left + Right Columns
  if (spec.kind === "krillion") {
    drawKrillionBody(ctx, spec, palette);
  } else {
    drawPoopleBody(ctx, spec, palette);
  }

  // Bottom CTA Bar
  ctx.beginPath();
  ctx.moveTo(58, 594);
  ctx.lineTo(1142, 594);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textBaseline = "middle";
  ctx.font = "700 16px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText(
    "Play this exact board free at anykrillion.com — No login required",
    58,
    622,
  );
  ctx.textAlign = "right";
  ctx.fillStyle = palette.primary;
  ctx.fillText("CAN YOU BEAT THIS SCORE?", 1142, 622);
  ctx.textAlign = "left";

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Canvas toBlob returned null"));
    }, "image/png");
  });

  return { blob, dataUrl };
}
