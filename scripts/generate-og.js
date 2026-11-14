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
      <stop offset="100%" stop-color="#fde68a"/>
    </linearGradient>
    <linearGradient id="crestBody" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#67e8f9"/>
      <stop offset="60%" stop-color="#22d3ee"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
    <linearGradient id="crestStar" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#oceanBg)"/>

  <!-- Bioluminescent depth glows -->
  <circle cx="220" cy="140" r="280" fill="#06b6d4" opacity="0.12"/>
  <circle cx="960" cy="315" r="320" fill="#10b981" opacity="0.12"/>

  <!-- Sonar rings -->
  <circle cx="960" cy="275" r="230" fill="none" stroke="#22d3ee" stroke-opacity="0.14" stroke-width="2" stroke-dasharray="10 8"/>
  <circle cx="960" cy="275" r="155" fill="none" stroke="#34d399" stroke-opacity="0.22" stroke-width="2"/>

  <!-- Signature AnyKrillion Crest Mark on Right -->
  <g transform="translate(864, 179) scale(3.0)">
    <rect x="2" y="2" width="60" height="60" rx="16" fill="#041527" stroke="url(#accentGrad)" stroke-width="2.5"/>
    <circle cx="31" cy="33" r="21" stroke="#22d3ee" stroke-opacity="0.25" stroke-width="1.5" stroke-dasharray="6 4"/>
    <circle cx="31" cy="33" r="14" stroke="#34d399" stroke-opacity="0.35" stroke-width="1.5"/>
    <path d="M15 37C15 27.5 23 20 34 20C39.5 20 43.5 22.5 46 26C42 27 38.5 29 36.5 31.8C40.5 32.8 43.8 35.8 45 40C40 42.2 34.5 43.2 28.5 43C20.5 42.8 15 40.2 15 37Z" fill="url(#crestBody)"/>
    <path d="M11 36.5L17.5 33V40L11 36.5Z" fill="#34d399"/>
    <circle cx="35.5" cy="25.5" r="2.4" fill="#03111f"/>
    <circle cx="35.5" cy="25.5" r="1" fill="#fde68a"/>
    <path d="M23 44.5L21 50M29 44.8L27.8 50.5M35 44.3L34.5 49.5" stroke="#67e8f9" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M49 10L51 15.5L56.5 17.5L51 19.5L49 25L47 19.5L41.5 17.5L47 15.5L49 10Z" fill="url(#crestStar)"/>
  </g>

  <!-- Brand Pill -->
  <rect x="90" y="84" width="250" height="44" rx="22" fill="#0891b2" fill-opacity="0.25" stroke="#22d3ee" stroke-opacity="0.55" stroke-width="1.5"/>
  <text x="215" y="112" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="18" font-weight="800" fill="#67e8f9" text-anchor="middle" letter-spacing="1.5">ANYKRILLION.COM</text>

  <!-- Main Heading -->
  <text x="90" y="218" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="64" font-weight="900" fill="#ffffff">
    Any<tspan fill="url(#accentGrad)">Krillion</tspan>
  </text>
  <text x="90" y="284" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="32" font-weight="700" fill="#cbd5e1">
    Free Endless &amp; Daily Dive Rarity Trivia
  </text>

  <!-- Feature Pills -->
  <g transform="translate(90, 345)">
    <rect x="0" y="0" width="240" height="54" rx="14" fill="#0b2948" stroke="#22d3ee" stroke-opacity="0.35"/>
    <text x="22" y="33" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="18" font-weight="700" fill="#67e8f9">9 Unique Game Modes</text>

    <rect x="256" y="0" width="235" height="54" rx="14" fill="#0b2948" stroke="#34d399" stroke-opacity="0.35"/>
    <text x="278" y="33" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="18" font-weight="700" fill="#6ee7b7">Challenge Friends PK</text>

    <rect x="507" y="0" width="225" height="54" rx="14" fill="#0b2948" stroke="#fbbf24" stroke-opacity="0.35"/>
    <text x="529" y="33" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="18" font-weight="700" fill="#fde68a">Noillirk + Poople</text>
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
