/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const sharp = require("sharp");

const svgBuffer = Buffer.from(`
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="oceanBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#041527"/>
      <stop offset="55%" stop-color="#06213e"/>
      <stop offset="100%" stop-color="#020b16"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#22d3ee"/>
      <stop offset="55%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#a7f3d0"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#oceanBg)"/>

  <!-- Bioluminescent depth glows -->
  <circle cx="220" cy="140" r="280" fill="#06b6d4" opacity="0.12"/>
  <circle cx="1010" cy="500" r="310" fill="#10b981" opacity="0.10"/>

  <!-- Sonar rings -->
  <circle cx="960" cy="315" r="220" fill="none" stroke="#22d3ee" stroke-opacity="0.12" stroke-width="2"/>
  <circle cx="960" cy="315" r="150" fill="none" stroke="#22d3ee" stroke-opacity="0.18" stroke-width="2"/>
  <circle cx="960" cy="315" r="80" fill="none" stroke="#34d399" stroke-opacity="0.28" stroke-width="2"/>

  <!-- Brand Pill -->
  <rect x="90" y="84" width="240" height="44" rx="22" fill="#0891b2" fill-opacity="0.25" stroke="#22d3ee" stroke-opacity="0.5" stroke-width="1.5"/>
  <text x="210" y="112" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="18" font-weight="800" fill="#67e8f9" text-anchor="middle" letter-spacing="1.5">ANYKRILLION.COM</text>

  <!-- Main Heading -->
  <text x="90" y="218" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="64" font-weight="900" fill="#ffffff">
    Krillion <tspan fill="url(#accentGrad)">Unlimited</tspan>
  </text>
  <text x="90" y="286" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="34" font-weight="700" fill="#cbd5e1">
    Free Endless &amp; Daily Dive Rarity Trivia
  </text>

  <!-- Feature Pills -->
  <g transform="translate(90, 345)">
    <rect x="0" y="0" width="265" height="56" rx="14" fill="#0b2948" stroke="#22d3ee" stroke-opacity="0.35"/>
    <text x="22" y="34" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="18" font-weight="700" fill="#67e8f9">Unlimited &amp; Daily Dive</text>

    <rect x="285" y="0" width="250" height="56" rx="14" fill="#0b2948" stroke="#34d399" stroke-opacity="0.35"/>
    <text x="307" y="34" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="18" font-weight="700" fill="#6ee7b7">Smart Typo Tolerance</text>

    <rect x="555" y="0" width="265" height="56" rx="14" fill="#0b2948" stroke="#a78bfa" stroke-opacity="0.35"/>
    <text x="577" y="34" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="18" font-weight="700" fill="#c4b5fd">Noillirk + 6 Topic Packs</text>
  </g>

  <!-- Rarity Bar Card -->
  <g transform="translate(90, 445)">
    <rect x="0" y="0" width="1020" height="106" rx="18" fill="#071e36" stroke="#22d3ee" stroke-opacity="0.22"/>
    <text x="28" y="40" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="17" font-weight="700" fill="#94a3b8">6-TIER RARITY SCALE</text>
    <text x="28" y="76" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="800" fill="#f8fafc">Plankton (10)  →  Uncommon (40)  →  Deep Sea (75)  →  <tspan fill="#34d399">One in a Krillion (100)</tspan></text>
  </g>
</svg>
`);

async function generate() {
  const outputPath = path.join(__dirname, "..", "public", "og-image.png");
  await sharp(svgBuffer).png().toFile(outputPath);
  console.log("Generated", outputPath);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
