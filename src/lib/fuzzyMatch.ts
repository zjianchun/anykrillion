import type { AnswerEntity, GameMode, RarityTier } from "@/types/game";

/**
 * Normalizes a trivia submission or candidate label for accent-insensitive,
 * punctuation-tolerant matching.
 */
export function normalizeText(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bst\.\s*/g, "saint ")
    .replace(/['’`".,!?():;/\\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripLeadingArticle(normalized: string): string {
  return normalized.replace(/^(the|a|an)\s+/i, "").trim();
}

/**
 * Computes Levenshtein edit distance between two normalized strings.
 */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  const prev = new Array<number>(lb + 1);
  const curr = new Array<number>(lb + 1);
  for (let j = 0; j <= lb; j++) prev[j] = j;

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= lb; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      );
    }
    for (let j = 0; j <= lb; j++) prev[j] = curr[j];
  }
  return prev[lb];
}

export type MatchResult =
  | {
      status: "exact";
      answer: AnswerEntity;
    }
  | {
      status: "typo_accepted";
      answer: AnswerEntity;
      distance: number;
    }
  | {
      status: "miss";
    };

/**
 * Matches player input against valid answer names and aliases with
 * strict exact precedence followed by bounded typo tolerance.
 */
export function matchAnswer(
  rawInput: string,
  answers: AnswerEntity[],
): MatchResult {
  const norm = normalizeText(rawInput);
  if (!norm) return { status: "miss" };
  const normNoArticle = stripLeadingArticle(norm);

  const candidatesOf = (entity: AnswerEntity): string[] => {
    const rawList = [entity.name, ...entity.aliases];
    const set = new Set<string>();
    for (const item of rawList) {
      const n = normalizeText(item);
      if (n) {
        set.add(n);
        const noArt = stripLeadingArticle(n);
        if (noArt) set.add(noArt);
      }
    }
    return Array.from(set);
  };

  // Pass 1: exact normalized match
  for (const entity of answers) {
    const keys = candidatesOf(entity);
    if (keys.includes(norm) || (normNoArticle && keys.includes(normNoArticle))) {
      return { status: "exact", answer: entity };
    }
  }

  // Pass 2: bounded Levenshtein typo recovery (guards against short accidental hits)
  if (norm.length < 4) return { status: "miss" };

  let bestEntity: AnswerEntity | null = null;
  let bestDist = Infinity;

  for (const entity of answers) {
    const keys = candidatesOf(entity);
    for (const key of keys) {
      if (key.length < 4) continue;
      const maxAllowed = key.length >= 8 ? 2 : 1;
      if (Math.abs(key.length - norm.length) > maxAllowed) continue;

      const dist = editDistance(norm, key);
      if (dist <= maxAllowed && dist / Math.max(key.length, norm.length) <= 0.25) {
        if (dist < bestDist) {
          bestDist = dist;
          bestEntity = entity;
        }
      }
    }
  }

  if (bestEntity && bestDist < Infinity) {
    return { status: "typo_accepted", answer: bestEntity, distance: bestDist };
  }

  return { status: "miss" };
}

/**
 * Returns non-spoiler spell-check suggestions ONLY when the user's input
 * already closely resembles a valid answer (near-exact spelling / >=55% typed
 * or within 1-2 edits of the target name). Prevents leaking unknown answers.
 */
export function getNonSpoilerSuggestions(
  rawInput: string,
  answers: AnswerEntity[],
  limit = 3,
): string[] {
  const norm = normalizeText(rawInput);
  if (norm.length < 4) return [];

  const matches: Array<{ name: string; score: number }> = [];

  for (const entity of answers) {
    const candidates = [entity.name, ...entity.aliases];
    let bestScore = Infinity;

    for (const c of candidates) {
      const key = normalizeText(c);
      if (!key || key.length < 4) continue;

      // Exact prefix only once the player has typed at least 60% of the answer (and >= 5 chars)
      if (
        norm.length >= 5 &&
        key.startsWith(norm) &&
        norm.length / key.length >= 0.55
      ) {
        bestScore = Math.min(bestScore, 0.2);
      }

      // Or within 1-2 edits of a full word/name of comparable length
      if (Math.abs(key.length - norm.length) <= 2) {
        const d = editDistance(norm, key);
        const maxD = key.length >= 8 ? 2 : 1;
        if (d <= maxD) {
          bestScore = Math.min(bestScore, d);
        }
      }
    }

    if (bestScore < Infinity) {
      matches.push({ name: entity.name, score: bestScore });
    }
  }

  matches.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name));
  return matches.slice(0, limit).map((m) => m.name);
}

/**
 * Computes round points for standard Krillion vs reverse Noillirk mode.
 */
export function computeRoundPoints(rarity: number, mode: GameMode): number {
  if (mode === "noillirk") {
    return Math.max(10, Math.min(100, 110 - rarity));
  }
  return rarity;
}

export function getDisplayTier(points: number, mode: GameMode): RarityTier {
  if (mode === "noillirk") {
    if (points >= 90) return "One in a Krillion";
    if (points >= 75) return "Deep Sea";
    if (points >= 55) return "Rare";
    if (points >= 35) return "Uncommon";
    if (points >= 20) return "Common";
    return "Plankton";
  }
  if (points >= 85) return "One in a Krillion";
  if (points >= 70) return "Deep Sea";
  if (points >= 55) return "Rare";
  if (points >= 35) return "Uncommon";
  if (points >= 20) return "Common";
  return "Plankton";
}

export function getTierBadgeClasses(tier: RarityTier, isReverse = false): string {
  if (isReverse) {
    switch (tier) {
      case "One in a Krillion":
        return "bg-amber-500/20 text-amber-200 border-amber-400/50";
      case "Deep Sea":
        return "bg-orange-500/20 text-orange-200 border-orange-400/40";
      case "Rare":
        return "bg-sky-500/20 text-sky-200 border-sky-400/40";
      case "Uncommon":
        return "bg-indigo-500/20 text-indigo-200 border-indigo-400/40";
      default:
        return "bg-slate-700/60 text-slate-300 border-slate-600";
    }
  }
  switch (tier) {
    case "One in a Krillion":
      return "bg-emerald-500/20 text-emerald-200 border-emerald-400/60";
    case "Deep Sea":
      return "bg-cyan-500/20 text-cyan-200 border-cyan-400/50";
    case "Rare":
      return "bg-sky-500/20 text-sky-200 border-sky-400/40";
    case "Uncommon":
      return "bg-blue-500/20 text-blue-200 border-blue-400/40";
    case "Common":
      return "bg-slate-600/40 text-slate-200 border-slate-500/40";
    default:
      return "bg-rose-500/20 text-rose-200 border-rose-400/40";
  }
}
