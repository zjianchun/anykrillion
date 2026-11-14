import type { GameMode, PackId } from "@/types/game";

export type ThemeVariant =
  | "abyss"
  | "sky"
  | "pitch"
  | "hardwood"
  | "pokedex"
  | "atlas"
  | "cinema"
  | "stadium";

export interface ThemeZone {
  minScore: number;
  label: string;
}

export interface GameThemeConfig {
  id: ThemeVariant;
  hudTitle: string;
  vehicleLabel: string;
  shellClass: string;
  cardClass: string;
  inputClass: string;
  ctaClass: string;
  ctaLabel: string;
  accentTextClass: string;
  accentBgClass: string;
  progressBarClass: string;
  shareAccent: "cyan" | "amber" | "emerald" | "purple";
  goalInstruction: string;
  ruleSteps: [string, string, string];
  zones: [ThemeZone, ThemeZone, ThemeZone, ThemeZone, ThemeZone];
  formatMetric: (totalScore: number) => string;
}

export const THEME_CONFIGS: Record<ThemeVariant, GameThemeConfig> = {
  abyss: {
    id: "abyss",
    hudTitle: "Ocean Dive Depth",
    vehicleLabel: "Submarine",
    shellClass:
      "border-cyan-400/35 bg-gradient-to-b from-[#06213d] via-[#04162b] to-[#020a14] shadow-[0_24px_80px_rgba(6,182,212,0.16)]",
    cardClass: "border-cyan-400/20 bg-[#031222]/85",
    inputClass:
      "border-cyan-400/40 bg-[#020e1c] focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/25",
    ctaClass: "from-cyan-300 to-emerald-400 text-slate-950",
    ctaLabel: "Dive & Lock",
    accentTextClass: "text-cyan-300",
    accentBgClass: "bg-cyan-400 text-slate-950",
    progressBarClass: "from-cyan-400 via-teal-400 to-emerald-400",
    shareAccent: "cyan",
    goalInstruction: "Name the RAREST valid answer",
    ruleSteps: [
      "Read the prompt",
      "Skip famous choices",
      "Name an obscure valid pick for 100 pts",
    ],
    zones: [
      { minScore: 0, label: "Sunlit Reef" },
      { minScore: 160, label: "Twilight Zone" },
      { minScore: 300, label: "Midnight Zone" },
      { minScore: 440, label: "Abyssal Plain" },
      { minScore: 560, label: "Hadal Trench" },
    ],
    formatMetric: (score) => `-${Math.round((score / 700) * 10994).toLocaleString()}m`,
  },

  sky: {
    id: "sky",
    hudTitle: "Balloon Altitude",
    vehicleLabel: "Hot-Air Balloon",
    shellClass:
      "border-amber-400/40 bg-gradient-to-b from-[#2b1a3d] via-[#1b1c3d] to-[#0d162c] shadow-[0_24px_80px_rgba(251,191,36,0.16)]",
    cardClass: "border-amber-400/25 bg-[#12132b]/85",
    inputClass:
      "border-amber-400/40 bg-[#0d1024] focus:border-amber-300 focus:ring-2 focus:ring-amber-400/25",
    ctaClass: "from-amber-300 to-orange-400 text-slate-950",
    ctaLabel: "Ascend & Lock",
    accentTextClass: "text-amber-300",
    accentBgClass: "bg-amber-400 text-slate-950",
    progressBarClass: "from-amber-300 via-orange-400 to-rose-400",
    shareAccent: "amber",
    goalInstruction: "Name the MOST OBVIOUS answer",
    ruleSteps: [
      "Think fast & mainstream",
      "Pick the #1 household name",
      "Climb to 52,000 ft Stratosphere",
    ],
    zones: [
      { minScore: 0, label: "Meadow Liftoff" },
      { minScore: 160, label: "Cumulus Clouds" },
      { minScore: 300, label: "Cirrus Layer" },
      { minScore: 440, label: "Jet Stream" },
      { minScore: 560, label: "Stratosphere Orbit" },
    ],
    formatMetric: (score) => `${Math.round((score / 700) * 52000).toLocaleString()} ft`,
  },

  pitch: {
    id: "pitch",
    hudTitle: "Match Attack Zone",
    vehicleLabel: "Match Ball",
    shellClass:
      "border-emerald-400/40 bg-gradient-to-b from-[#062e1e] via-[#041f16] to-[#02120d] shadow-[0_24px_80px_rgba(16,185,129,0.18)]",
    cardClass: "border-emerald-400/25 bg-[#031910]/90",
    inputClass:
      "border-emerald-400/40 bg-[#02120b] focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/25",
    ctaClass: "from-emerald-300 to-lime-400 text-slate-950",
    ctaLabel: "Strike Shot",
    accentTextClass: "text-emerald-300",
    accentBgClass: "bg-emerald-400 text-slate-950",
    progressBarClass: "from-lime-400 via-emerald-400 to-teal-300",
    shareAccent: "emerald",
    goalInstruction: "Find deep-cut World Cup & club gems (40s clock)",
    ruleSteps: [
      "40s match clock per round",
      "Avoid Messi/Ronaldo Plankton traps",
      "Name squad veterans for Top Bins 100 pts",
    ],
    zones: [
      { minScore: 0, label: "Kickoff Circle" },
      { minScore: 160, label: "Midfield Control" },
      { minScore: 300, label: "Final Third" },
      { minScore: 440, label: "Penalty Box" },
      { minScore: 560, label: "World Cup Trophy" },
    ],
    formatMetric: (score) => `${score} xG Rating`,
  },

  hardwood: {
    id: "hardwood",
    hudTitle: "Arena Scoreboard",
    vehicleLabel: "Basketball",
    shellClass:
      "border-orange-400/40 bg-gradient-to-b from-[#2f1608] via-[#1c0f09] to-[#0f0908] shadow-[0_24px_80px_rgba(251,146,60,0.18)]",
    cardClass: "border-orange-400/25 bg-[#160c07]/90",
    inputClass:
      "border-orange-400/40 bg-[#100804] focus:border-orange-300 focus:ring-2 focus:ring-orange-400/25",
    ctaClass: "from-orange-300 to-amber-400 text-slate-950",
    ctaLabel: "Drain Shot",
    accentTextClass: "text-orange-300",
    accentBgClass: "bg-orange-400 text-slate-950",
    progressBarClass: "from-amber-400 via-orange-400 to-rose-400",
    shareAccent: "amber",
    goalInstruction: "Sink deep-cut NBA draft & role-player gems",
    ruleSteps: [
      "30s arena shot clock",
      "Skip LeBron/Jordan crowd traps",
      "Drain obscure NBA picks for 100 pts",
    ],
    zones: [
      { minScore: 0, label: "Tip-Off" },
      { minScore: 160, label: "Sixth Man" },
      { minScore: 300, label: "All-Star Starter" },
      { minScore: 440, label: "Finals MVP" },
      { minScore: 560, label: "Hall of Fame" },
    ],
    formatMetric: (score) => `${Math.round((score / 700) * 99)} OVR`,
  },

  pokedex: {
    id: "pokedex",
    hudTitle: "Dex Scanner Tier",
    vehicleLabel: "Dex Scanner",
    shellClass:
      "border-rose-400/40 bg-gradient-to-b from-[#330d19] via-[#1b0c1c] to-[#0a0b17] shadow-[0_24px_80px_rgba(244,63,94,0.18)]",
    cardClass: "border-rose-400/25 bg-[#120918]/90",
    inputClass:
      "border-amber-300/40 bg-[#0d0814] focus:border-amber-300 focus:ring-2 focus:ring-amber-300/25",
    ctaClass: "from-amber-300 via-yellow-300 to-rose-300 text-slate-950",
    ctaLabel: "Scan & Catch",
    accentTextClass: "text-amber-300",
    accentBgClass: "bg-amber-300 text-slate-950",
    progressBarClass: "from-rose-400 via-amber-400 to-cyan-300",
    shareAccent: "amber",
    goalInstruction: "Catch obscure Gen 1–9 species instead of Pikachu",
    ruleSteps: [
      "Read type or generation clue",
      "Avoid Pikachu/Charizard traps",
      "Catch rare Dex species for 100 pts",
    ],
    zones: [
      { minScore: 0, label: "Route 1 Grass" },
      { minScore: 160, label: "Gym Challenger" },
      { minScore: 300, label: "Victory Road" },
      { minScore: 440, label: "Elite Four" },
      { minScore: 560, label: "Mythical Dex Master" },
    ],
    formatMetric: (score) => `Dex Lv.${Math.max(5, Math.round((score / 700) * 100))}`,
  },

  atlas: {
    id: "atlas",
    hudTitle: "Expedition Range",
    vehicleLabel: "Compass",
    shellClass:
      "border-teal-400/35 bg-gradient-to-b from-[#05292b] via-[#041d24] to-[#020f17] shadow-[0_24px_80px_rgba(20,184,166,0.16)]",
    cardClass: "border-teal-400/25 bg-[#03161c]/88",
    inputClass:
      "border-teal-400/40 bg-[#021016] focus:border-teal-300 focus:ring-2 focus:ring-teal-400/25",
    ctaClass: "from-teal-300 to-emerald-400 text-slate-950",
    ctaLabel: "Chart Pick",
    accentTextClass: "text-teal-300",
    accentBgClass: "bg-teal-400 text-slate-950",
    progressBarClass: "from-teal-400 via-emerald-400 to-cyan-300",
    shareAccent: "emerald",
    goalInstruction: "Name low-recognition countries, micro-states & capitals",
    ruleSteps: [
      "Check border/continent filter",
      "Skip tourist superpowers",
      "Chart micro-states for 100 pts",
    ],
    zones: [
      { minScore: 0, label: "Home Port" },
      { minScore: 160, label: "Continental Shelf" },
      { minScore: 300, label: "Archipelago Trail" },
      { minScore: 440, label: "Uncharted Waters" },
      { minScore: 560, label: "Terra Incognita" },
    ],
    formatMetric: (score) => `${Math.round((score / 700) * 195)} / 195 Nations`,
  },

  cinema: {
    id: "cinema",
    hudTitle: "Festival Prestige",
    vehicleLabel: "Film Reel",
    shellClass:
      "border-purple-400/40 bg-gradient-to-b from-[#23103a] via-[#150c2b] to-[#0a0819] shadow-[0_24px_80px_rgba(192,132,252,0.18)]",
    cardClass: "border-purple-400/25 bg-[#110a24]/90",
    inputClass:
      "border-purple-400/40 bg-[#0b071a] focus:border-fuchsia-300 focus:ring-2 focus:ring-purple-400/25",
    ctaClass: "from-fuchsia-300 via-purple-300 to-amber-300 text-slate-950",
    ctaLabel: "Roll Scene",
    accentTextClass: "text-purple-300",
    accentBgClass: "bg-purple-400 text-slate-950",
    progressBarClass: "from-purple-400 via-fuchsia-400 to-amber-300",
    shareAccent: "purple",
    goalInstruction: "Name underrated cinema & early-career festival gems",
    ruleSteps: [
      "Read Oscar/franchise prompt",
      "Skip mega-blockbusters",
      "Pick cult classics for 100 pts",
    ],
    zones: [
      { minScore: 0, label: "Matinee Opening" },
      { minScore: 160, label: "Indie Showcase" },
      { minScore: 300, label: "Sundance Jury" },
      { minScore: 440, label: "Best Director Cut" },
      { minScore: 560, label: "Palme d'Or Legend" },
    ],
    formatMetric: (score) => `${((score / 700) * 10).toFixed(1)} ★ Indie Index`,
  },

  stadium: {
    id: "stadium",
    hudTitle: "Podium Standing",
    vehicleLabel: "Trophy",
    shellClass:
      "border-sky-400/40 bg-gradient-to-b from-[#072146] via-[#051833] to-[#020d1f] shadow-[0_24px_80px_rgba(56,189,248,0.18)]",
    cardClass: "border-sky-400/25 bg-[#04142b]/90",
    inputClass:
      "border-sky-400/40 bg-[#030e20] focus:border-sky-300 focus:ring-2 focus:ring-sky-400/25",
    ctaClass: "from-sky-300 to-cyan-300 text-slate-950",
    ctaLabel: "Score Pick",
    accentTextClass: "text-sky-300",
    accentBgClass: "bg-sky-400 text-slate-950",
    progressBarClass: "from-sky-400 via-cyan-300 to-amber-300",
    shareAccent: "cyan",
    goalInstruction: "Name deep-cut Olympians, F1, Tennis & Pro Stars",
    ruleSteps: [
      "35s broadcast clock",
      "Avoid cover-athlete traps",
      "Name deep-cut champions for 100 pts",
    ],
    zones: [
      { minScore: 0, label: "Heat Qualifier" },
      { minScore: 160, label: "Quarterfinalist" },
      { minScore: 300, label: "Bronze Final" },
      { minScore: 440, label: "Olympic Gold" },
      { minScore: 560, label: "All-Time GOAT" },
    ],
    formatMetric: (score) => `Rank #${Math.max(1, 100 - Math.round((score / 700) * 99))}`,
  },
};

export function resolveThemeVariant(
  mode: GameMode,
  pack: PackId | "all",
  explicit?: ThemeVariant,
): ThemeVariant {
  if (mode === "noillirk") return "sky";
  if (explicit) return explicit;
  switch (pack) {
    case "football":
      return "pitch";
    case "nba":
      return "hardwood";
    case "pokemon":
      return "pokedex";
    case "geography":
      return "atlas";
    case "movies":
      return "cinema";
    case "sports":
      return "stadium";
    default:
      return "abyss";
  }
}

export function getThemeProgressStatus(theme: GameThemeConfig, totalScore: number): {
  label: string;
  metric: string;
  percent: number;
} {
  const percent = Math.min(100, Math.max(4, Math.round((totalScore / 700) * 100)));
  let activeLabel = theme.zones[0].label;
  for (const z of theme.zones) {
    if (totalScore >= z.minScore) activeLabel = z.label;
  }
  return {
    label: activeLabel,
    metric: theme.formatMetric(totalScore),
    percent,
  };
}
