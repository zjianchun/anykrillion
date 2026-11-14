export type PackId =
  | "general"
  | "sports"
  | "geography"
  | "pokemon"
  | "football"
  | "nba"
  | "movies";

export type GameMode = "unlimited" | "daily" | "noillirk";

export type RarityTier =
  | "Plankton"
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Deep Sea"
  | "One in a Krillion";

export interface AnswerEntity {
  name: string;
  aliases: string[];
  rarity: number;
  tier: RarityTier;
  fact: string;
}

export interface TriviaPrompt {
  id: string;
  pack: PackId;
  question: string;
  categoryLabel: string;
  timerSeconds: number;
  sourceAttribution: string;
  hints: [string, string, string];
  answers: AnswerEntity[];
}

export interface DailyBoard {
  dayNumber: number;
  date: string;
  themeLabel: string;
  promptIds: string[];
}

export interface PackMeta {
  id: PackId;
  name: string;
  shortName: string;
  href: string;
  description: string;
  defaultTimer: number;
  accentColor: string;
  badgeText: string;
}

export const PACK_METAS: PackMeta[] = [
  {
    id: "general",
    name: "Krillion Unlimited",
    shortName: "All / General",
    href: "/",
    description: "Endless 7-question dives across science, history, pop culture, geography, and sports.",
    defaultTimer: 25,
    accentColor: "#22d3ee",
    badgeText: "Main Hub",
  },
  {
    id: "sports",
    name: "Krillion Sports",
    shortName: "Sports",
    href: "/krillion-sports/",
    description: "Olympics, tennis majors, F1, NFL, MLB, NHL, and legendary multi-sport champions.",
    defaultTimer: 35,
    accentColor: "#38bdf8",
    badgeText: "35s Timer",
  },
  {
    id: "geography",
    name: "Krillion Geography",
    shortName: "Geography",
    href: "/krillion-geography/",
    description: "Countries, capitals, borders, islands, mountain peaks, and Wikidata rarity metrics.",
    defaultTimer: 25,
    accentColor: "#34d399",
    badgeText: "Wikidata",
  },
  {
    id: "pokemon",
    name: "Pokekrillion",
    shortName: "Pokémon",
    href: "/pokekrillion/",
    description: "Gen 1–9 Pokémon rarity trivia covering types, starters, legendaries, and dex classes.",
    defaultTimer: 25,
    accentColor: "#fbbf24",
    badgeText: "PokéAPI",
  },
  {
    id: "football",
    name: "Footbillion",
    shortName: "Football",
    href: "/footbillion/",
    description: "40-second football trivia covering World Cup squads, Premier League clubs, and Ballon d'Or.",
    defaultTimer: 40,
    accentColor: "#4ade80",
    badgeText: "40s Match",
  },
  {
    id: "nba",
    name: "NBA Krillion",
    shortName: "NBA",
    href: "/nba-krillion/",
    description: "NBA champions, MVPs, #1 draft picks, scoring leaders, and franchise icons.",
    defaultTimer: 30,
    accentColor: "#fb923c",
    badgeText: "Basketball",
  },
  {
    id: "movies",
    name: "Krillion Movies",
    shortName: "Movies",
    href: "/krillion-movies/",
    description: "Oscar Best Picture winners, iconic directors, Pixar, Nolan, and blockbuster franchises.",
    defaultTimer: 25,
    accentColor: "#c084fc",
    badgeText: "Cinema",
  },
];
