import type { GameMode } from "@/types/game";

export interface KrillionChallengePayload {
  p: string[]; // 7 prompt IDs
  m: GameMode;
  s?: number; // challenger score
  d?: string; // challenger depth/altitude label
}

export interface PoopleChallengePayload {
  w: string; // start word
  t: string; // target word
  s?: number; // challenger step count
}

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(token: string): string {
  const padded = token.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((token.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function encodeKrillionChallenge(payload: KrillionChallengePayload): string {
  try {
    return toBase64Url(JSON.stringify(payload));
  } catch {
    return "";
  }
}

export function decodeKrillionChallenge(token: string | null): KrillionChallengePayload | null {
  if (!token) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(token)) as Partial<KrillionChallengePayload>;
    if (!Array.isArray(parsed.p) || parsed.p.length === 0) return null;
    const validIds = parsed.p.filter((id): id is string => typeof id === "string" && id.length > 0);
    if (validIds.length === 0) return null;
    const mode: GameMode =
      parsed.m === "noillirk" || parsed.m === "daily" ? parsed.m : "unlimited";
    return {
      p: validIds,
      m: mode,
      s: typeof parsed.s === "number" ? parsed.s : undefined,
      d: typeof parsed.d === "string" ? parsed.d.slice(0, 48) : undefined,
    };
  } catch {
    return null;
  }
}

export function encodePoopleChallenge(payload: PoopleChallengePayload): string {
  try {
    return toBase64Url(JSON.stringify(payload));
  } catch {
    return "";
  }
}

export function decodePoopleChallenge(token: string | null): PoopleChallengePayload | null {
  if (!token) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(token)) as Partial<PoopleChallengePayload>;
    if (typeof parsed.w !== "string" || parsed.w.length !== 4) return null;
    const t = typeof parsed.t === "string" && parsed.t.length === 4 ? parsed.t.toUpperCase() : "POOP";
    return {
      w: parsed.w.toUpperCase(),
      t,
      s: typeof parsed.s === "number" ? parsed.s : undefined,
    };
  } catch {
    return null;
  }
}

export function buildSocialShareLinks(opts: {
  text: string;
  url: string;
  title: string;
}): {
  twitterUrl: string;
  whatsappUrl: string;
  redditUrl: string;
} {
  const encodedUrl = encodeURIComponent(opts.url);
  const encodedText = encodeURIComponent(opts.text);
  const encodedTitle = encodeURIComponent(opts.title);

  return {
    twitterUrl: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    whatsappUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${opts.text} ${opts.url}`)}`,
    redditUrl: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
  };
}
