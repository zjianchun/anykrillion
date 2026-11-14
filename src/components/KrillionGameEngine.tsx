"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import {
  Anchor,
  ArrowRight,
  Award,
  Check,
  Clock,
  Compass,
  Copy,
  Film,
  Flame,
  HelpCircle,
  Infinity as InfinityIcon,
  Radar,
  RotateCcw,
  SkipForward,
  Sparkles,
  Swords,
  TimerOff,
  Trophy,
  Volume2,
  VolumeX,
  Waves,
  Wind,
} from "lucide-react";
import ShareChallengePanel from "@/components/ShareChallengePanel";
import type {
  AnswerEntity,
  DailyBoard,
  GameMode,
  PackId,
  RarityTier,
  TriviaPrompt,
} from "@/types/game";
import { PACK_METAS } from "@/types/game";
import {
  computeRoundPoints,
  getDisplayTier,
  getNonSpoilerSuggestions,
  getTierBadgeClasses,
  matchAnswer,
} from "@/lib/fuzzyMatch";
import {
  decodeKrillionChallenge,
  encodeKrillionChallenge,
} from "@/lib/challengeCodec";
import {
  THEME_CONFIGS,
  getThemeProgressStatus,
  resolveThemeVariant,
  type ThemeVariant,
} from "@/lib/gameThemes";
import {
  isSoundEnabled,
  playInvalidOrTimeoutSound,
  playLockInSound,
  playRarityRevealSound,
  playTickSound,
  playVictorySound,
  setSoundEnabled,
} from "@/lib/soundEffects";

interface RoundOutcome {
  prompt: TriviaPrompt;
  matchedAnswer: AnswerEntity | null;
  points: number;
  tier: RarityTier | "Timed Out" | "Skipped";
  typoAssisted: boolean;
  submittedText: string;
}

interface ActiveFriendChallenge {
  score?: number;
  metric?: string;
}

interface KrillionGameEngineProps {
  prompts: TriviaPrompt[];
  dailyBoards: DailyBoard[];
  defaultMode?: GameMode;
  defaultPack?: PackId;
  allowModeSwitch?: boolean;
  allowPackFilter?: boolean;
  initialDailyDate?: string;
  themeVariant?: ThemeVariant;
}

const QUESTIONS_PER_DIVE = 7;

function shufflePrompts(
  pool: TriviaPrompt[],
  count: number,
  excludeIds: string[] = [],
): TriviaPrompt[] {
  const preferred = pool.filter((p) => !excludeIds.includes(p.id));
  const source = preferred.length >= count ? preferred : pool;
  const arr = [...source];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(count, arr.length));
}

function subscribeBestScore(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("anykrillion-best-score", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("anykrillion-best-score", callback);
  };
}

function getClientBestScore(): number {
  try {
    return Number(window.localStorage.getItem("anykrillion_best_score")) || 0;
  } catch {
    return 0;
  }
}

function subscribeSound(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("anykrillion-sound-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("anykrillion-sound-change", callback);
  };
}

function getClientSound(): boolean {
  return isSoundEnabled();
}

function getZeroServer(): number {
  return 0;
}

function getTrueServer(): boolean {
  return true;
}

function tierToEmoji(tier: RoundOutcome["tier"], isReverse: boolean): string {
  if (tier === "Timed Out" || tier === "Skipped") return "⬛";
  if (tier === "One in a Krillion") return isReverse ? "🟡" : "🟢";
  if (tier === "Deep Sea") return "🔵";
  if (tier === "Rare") return "🟣";
  if (tier === "Uncommon") return "🟡";
  return "🟠";
}

function ThemeBackdrop({ themeId }: { themeId: ThemeVariant }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
      aria-hidden="true"
    >
      {themeId === "abyss" && (
        <>
          <div className="animate-ak-radar absolute -right-24 -top-24 h-72 w-72 rounded-full border border-dashed border-cyan-400/15" />
          <div className="animate-ak-bubble-1 absolute bottom-6 left-[12%] h-3 w-3 rounded-full bg-cyan-300/25" />
          <div className="animate-ak-bubble-2 absolute bottom-4 left-[48%] h-2 w-2 rounded-full bg-emerald-300/30" />
          <div className="animate-ak-bubble-3 absolute bottom-8 right-[18%] h-4 w-4 rounded-full border border-cyan-300/25" />
        </>
      )}

      {themeId === "sky" && (
        <>
          <div className="animate-ak-float absolute -right-12 -top-12 h-56 w-56 rounded-full bg-amber-400/10 blur-2xl" />
          <div className="animate-ak-float absolute bottom-8 left-[8%] h-10 w-32 rounded-full bg-white/[0.04] blur-md" />
          <div className="animate-ak-float absolute right-[12%] top-16 h-8 w-24 rounded-full bg-amber-200/[0.05] blur-md" />
        </>
      )}

      {themeId === "pitch" && (
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.07]"
          viewBox="0 0 800 400"
          preserveAspectRatio="none"
        >
          <line x1="400" y1="0" x2="400" y2="400" stroke="#34d399" strokeWidth="2" />
          <circle cx="400" cy="200" r="70" stroke="#34d399" strokeWidth="2" fill="none" />
          <rect x="0" y="95" width="90" height="210" stroke="#34d399" strokeWidth="2" fill="none" />
          <rect x="710" y="95" width="90" height="210" stroke="#34d399" strokeWidth="2" fill="none" />
        </svg>
      )}

      {themeId === "hardwood" && (
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.08]"
          viewBox="0 0 800 400"
          preserveAspectRatio="none"
        >
          <circle cx="400" cy="200" r="65" stroke="#fb923c" strokeWidth="2" fill="none" />
          <path d="M 0 60 A 180 180 0 0 1 0 340" stroke="#fb923c" strokeWidth="2" fill="none" />
          <path d="M 800 60 A 180 180 0 0 0 800 340" stroke="#fb923c" strokeWidth="2" fill="none" />
        </svg>
      )}

      {themeId === "pokedex" && (
        <div className="flex items-center gap-2 px-5 pt-3.5 opacity-80">
          <span className="h-3.5 w-3.5 rounded-full border-2 border-white/70 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          <span className="h-2 w-2 rounded-full bg-rose-400" />
          <span className="h-2 w-2 rounded-full bg-amber-300" />
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>
      )}

      {themeId === "atlas" && (
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #2dd4bf 1px, transparent 1px), linear-gradient(to bottom, #2dd4bf 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      )}

      {themeId === "cinema" && (
        <>
          <div className="absolute inset-x-0 top-0 h-3 bg-[radial-gradient(circle,#ffffff18_2px,transparent_2px)] [background-size:18px_12px]" />
          <div className="absolute inset-x-0 bottom-0 h-3 bg-[radial-gradient(circle,#ffffff18_2px,transparent_2px)] [background-size:18px_12px]" />
        </>
      )}

      {themeId === "stadium" && (
        <div className="absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-sky-400/10 blur-3xl" />
      )}
    </div>
  );
}

function ThemeVehicleIcon({ themeId }: { themeId: ThemeVariant }) {
  switch (themeId) {
    case "sky":
      return <Wind className="h-4 w-4 text-amber-300" />;
    case "pitch":
    case "stadium":
      return <Trophy className="h-4 w-4 text-emerald-300" />;
    case "hardwood":
      return <Flame className="h-4 w-4 text-orange-300" />;
    case "pokedex":
      return <Radar className="h-4 w-4 text-amber-300" />;
    case "atlas":
      return <Compass className="h-4 w-4 text-teal-300" />;
    case "cinema":
      return <Film className="h-4 w-4 text-purple-300" />;
    default:
      return <Waves className="h-4 w-4 text-cyan-300" />;
  }
}

export default function KrillionGameEngine({
  prompts,
  dailyBoards,
  defaultMode = "unlimited",
  defaultPack = "general",
  allowModeSwitch = true,
  allowPackFilter = true,
  initialDailyDate,
  themeVariant,
}: KrillionGameEngineProps) {
  const [mode, setMode] = useState<GameMode>(defaultMode);
  const [packFilter, setPackFilter] = useState<PackId | "all">(
    defaultPack === "general" ? "all" : defaultPack,
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDailyDate ?? dailyBoards[0]?.date ?? "2026-11-14",
  );
  const [relaxedTimer, setRelaxedTimer] = useState<boolean>(false);
  const [friendChallenge, setFriendChallenge] = useState<ActiveFriendChallenge | null>(null);
  const [copiedQuickInvite, setCopiedQuickInvite] = useState<boolean>(false);

  const promptById = useMemo(() => {
    const map = new Map<string, TriviaPrompt>();
    for (const p of prompts) map.set(p.id, p);
    return map;
  }, [prompts]);

  const buildDeck = useCallback(
    (
      targetMode: GameMode,
      targetPack: PackId | "all",
      targetDate: string,
      seenIds: string[] = [],
    ): TriviaPrompt[] => {
      if (targetMode === "daily") {
        const board =
          dailyBoards.find((b) => b.date === targetDate) ?? dailyBoards[0];
        if (board) {
          const resolved = board.promptIds
            .map((id) => promptById.get(id))
            .filter((p): p is TriviaPrompt => Boolean(p));
          if (resolved.length >= 7) return resolved.slice(0, 7);
        }
      }

      const packPool =
        targetPack === "all"
          ? prompts
          : prompts.filter((p) => p.pack === targetPack);
      const effectivePool =
        packPool.length >= QUESTIONS_PER_DIVE ? packPool : prompts;
      return shufflePrompts(effectivePool, QUESTIONS_PER_DIVE, seenIds);
    },
    [dailyBoards, promptById, prompts],
  );

  // Deterministic initial slice for SSR hydration safety
  const initialDeck = useMemo(() => {
    if (defaultMode === "daily") {
      return buildDeck(
        "daily",
        defaultPack === "general" ? "all" : defaultPack,
        selectedDate,
      );
    }
    const pool =
      defaultPack === "general"
        ? prompts
        : prompts.filter((p) => p.pack === defaultPack);
    return (pool.length >= QUESTIONS_PER_DIVE ? pool : prompts).slice(
      0,
      QUESTIONS_PER_DIVE,
    );
  }, [buildDeck, defaultMode, defaultPack, prompts, selectedDate]);

  const [deck, setDeck] = useState<TriviaPrompt[]>(initialDeck);
  const [qIndex, setQIndex] = useState<number>(0);
  const [outcomes, setOutcomes] = useState<RoundOutcome[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [roundPhase, setRoundPhase] = useState<"playing" | "revealed" | "summary">("playing");
  const [timeLeft, setTimeLeft] = useState<number>(initialDeck[0]?.timerSeconds ?? 25);

  const bestScore = useSyncExternalStore(
    subscribeBestScore,
    getClientBestScore,
    getZeroServer,
  );
  const soundOn = useSyncExternalStore(
    subscribeSound,
    getClientSound,
    getTrueServer,
  );

  const inputRef = useRef<HTMLInputElement>(null);

  // On client mount, decode ?challenge=... friend PK token without useSearchParams
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("challenge");
    if (!token) return;
    const decoded = decodeKrillionChallenge(token);
    if (!decoded) return;
    const resolvedDeck = decoded.p
      .map((id) => promptById.get(id))
      .filter((p): p is TriviaPrompt => Boolean(p));
    if (resolvedDeck.length === 0) return;

    queueMicrotask(() => {
      setMode(decoded.m);
      setDeck(resolvedDeck);
      setQIndex(0);
      setOutcomes([]);
      setInputValue("");
      setFeedbackError(null);
      setRevealedHints(0);
      setRoundPhase("playing");
      setTimeLeft(resolvedDeck[0]?.timerSeconds ?? 25);
      setFriendChallenge({
        score: decoded.s,
        metric: decoded.d,
      });
    });
  }, [promptById]);

  const isReverse = mode === "noillirk";
  const currentPrompt = deck[qIndex];
  const activeThemeId = resolveThemeVariant(mode, packFilter, themeVariant);
  const theme = THEME_CONFIGS[activeThemeId];

  const startFreshDive = useCallback(
    (
      nextMode: GameMode = mode,
      nextPack: PackId | "all" = packFilter,
      nextDate: string = selectedDate,
    ) => {
      const currentIds = deck.map((p) => p.id);
      const nextDeck = buildDeck(nextMode, nextPack, nextDate, currentIds);
      setMode(nextMode);
      setPackFilter(nextPack);
      setSelectedDate(nextDate);
      setDeck(nextDeck);
      setQIndex(0);
      setOutcomes([]);
      setInputValue("");
      setFeedbackError(null);
      setRevealedHints(0);
      setRoundPhase("playing");
      setTimeLeft(nextDeck[0]?.timerSeconds ?? 25);
      setFriendChallenge(null);
      setTimeout(() => inputRef.current?.focus(), 40);
    },
    [buildDeck, deck, mode, packFilter, selectedDate],
  );

  const finishQuestion = useCallback(
    (outcome: RoundOutcome) => {
      const updated = [...outcomes, outcome];
      const total = updated.reduce((acc, r) => acc + r.points, 0);
      setOutcomes(updated);

      if (outcome.matchedAnswer) {
        playRarityRevealSound(outcome.points);
      } else {
        playInvalidOrTimeoutSound();
      }

      if (updated.length >= deck.length && total >= 420) {
        import("canvas-confetti")
          .then((mod) => {
            mod.default({
              particleCount: 75,
              spread: 70,
              origin: { y: 0.65 },
            });
          })
          .catch(() => {});
      }

      try {
        if (total > bestScore) {
          window.localStorage.setItem("anykrillion_best_score", String(total));
          window.dispatchEvent(new Event("anykrillion-best-score"));
        }
      } catch {
        // ignore storage failure
      }

      setRoundPhase("revealed");
      setFeedbackError(null);
    },
    [bestScore, deck.length, outcomes],
  );

  // Countdown timer with last-5-second subtle audio pulse
  useEffect(() => {
    if (roundPhase !== "playing" || relaxedTimer || !currentPrompt || timeLeft <= 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (timeLeft <= 1) {
        setTimeLeft(0);
        finishQuestion({
          prompt: currentPrompt,
          matchedAnswer: null,
          points: 0,
          tier: "Timed Out",
          typoAssisted: false,
          submittedText: "",
        });
      } else {
        const nextLeft = timeLeft - 1;
        if (nextLeft <= 5) {
          playTickSound(nextLeft <= 2);
        }
        setTimeLeft(nextLeft);
      }
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [currentPrompt, finishQuestion, relaxedTimer, roundPhase, timeLeft]);

  const totalScore = useMemo(
    () => outcomes.reduce((sum, item) => sum + item.points, 0),
    [outcomes],
  );

  const suggestions = useMemo(() => {
    if (!currentPrompt || roundPhase !== "playing") return [];
    return getNonSpoilerSuggestions(inputValue, currentPrompt.answers, 3);
  }, [currentPrompt, inputValue, roundPhase]);

  const submitCandidate = (rawText: string) => {
    if (!currentPrompt || roundPhase !== "playing") return;
    const trimmed = rawText.trim();
    if (!trimmed) return;

    const result = matchAnswer(trimmed, currentPrompt.answers);
    if (result.status === "miss") {
      playInvalidOrTimeoutSound();
      setFeedbackError("Not in our verified list — check spelling or tap a Hint.");
      return;
    }

    playLockInSound();
    const pts = computeRoundPoints(result.answer.rarity, mode);
    const tier = getDisplayTier(pts, mode);
    finishQuestion({
      prompt: currentPrompt,
      matchedAnswer: result.answer,
      points: pts,
      tier,
      typoAssisted: result.status === "typo_accepted",
      submittedText: trimmed,
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitCandidate(inputValue);
  };

  const handleSkip = () => {
    if (!currentPrompt || roundPhase !== "playing") return;
    finishQuestion({
      prompt: currentPrompt,
      matchedAnswer: null,
      points: 0,
      tier: "Skipped",
      typoAssisted: false,
      submittedText: "",
    });
  };

  const handleNext = () => {
    if (qIndex + 1 >= deck.length) {
      playVictorySound();
      setRoundPhase("summary");
      return;
    }
    const nextIdx = qIndex + 1;
    setQIndex(nextIdx);
    setInputValue("");
    setFeedbackError(null);
    setRevealedHints(0);
    setRoundPhase("playing");
    setTimeLeft(deck[nextIdx]?.timerSeconds ?? 25);
    setTimeout(() => inputRef.current?.focus(), 40);
  };

  const handleRevealHint = () => {
    if (!currentPrompt || revealedHints >= 3 || roundPhase !== "playing") return;
    playLockInSound();
    setRevealedHints((prev) => prev + 1);
    if (!relaxedTimer) {
      setTimeLeft((prev) => Math.max(3, prev - 4));
    }
  };

  const progressStatus = getThemeProgressStatus(theme, totalScore);
  const currentOutcome = outcomes[qIndex];
  const maxSeconds = currentPrompt?.timerSeconds ?? 25;
  const timerPercent = relaxedTimer
    ? 100
    : Math.max(0, Math.min(100, Math.round((timeLeft / maxSeconds) * 100)));

  const sortedAnswersForReveal = useMemo(() => {
    if (!currentPrompt) return { gems: [], plankton: null as AnswerEntity | null };
    const sorted = [...currentPrompt.answers].sort((a, b) =>
      isReverse ? a.rarity - b.rarity : b.rarity - a.rarity,
    );
    return {
      gems: sorted.slice(0, 3),
      plankton: sorted[sorted.length - 1] ?? null,
    };
  }, [currentPrompt, isReverse]);

  const challengeUrl = useMemo(() => {
    const token = encodeKrillionChallenge({
      p: deck.map((p) => p.id),
      m: mode,
      s: outcomes.length > 0 ? totalScore : undefined,
      d: outcomes.length > 0 ? progressStatus.metric : undefined,
    });
    const basePath =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}`
        : `https://anykrillion.com${isReverse ? "/noillirk/" : "/"}`;
    return `${basePath}?challenge=${token}`;
  }, [deck, isReverse, mode, outcomes.length, progressStatus.metric, totalScore]);

  const emojiGrid = outcomes.map((o) => tierToEmoji(o.tier, isReverse)).join("");
  const activeBoard = dailyBoards.find((b) => b.date === selectedDate);
  const shareHeader =
    mode === "daily" && activeBoard
      ? `AnyKrillion Daily #${activeBoard.dayNumber}`
      : isReverse
        ? "AnyKrillion — Noillirk"
        : `AnyKrillion — ${theme.vehicleLabel}`;

  const summaryShareText = `Can you beat my ${totalScore}/700 (${progressStatus.metric}) on this exact 7-question board? ${emojiGrid}`;
  const midGameShareText = `Play these exact 7 trivia questions with me on AnyKrillion!`;
  const fullCopyGridText = `${shareHeader} · ${totalScore}/700 (${progressStatus.metric})\n${emojiGrid}\nChallenge my exact 7 questions:\n${challengeUrl}`;

  const handleQuickInviteCopy = async () => {
    try {
      await navigator.clipboard.writeText(challengeUrl);
      setCopiedQuickInvite(true);
      window.setTimeout(() => setCopiedQuickInvite(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <section
      aria-label="Interactive Krillion Game Canvas"
      className={`relative overflow-hidden rounded-3xl border p-4 sm:p-6 transition-colors duration-300 ${theme.shellClass}`}
    >
      <ThemeBackdrop themeId={theme.id} />

      <div className="relative z-10">
        {/* Compact Arcade Header Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-white/10 pb-3.5">
          {allowModeSwitch ? (
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Game modes">
              <button
                type="button"
                onClick={() => startFreshDive("unlimited", packFilter, selectedDate)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition sm:text-sm ${
                  mode === "unlimited"
                    ? `${theme.accentBgClass} shadow-lg`
                    : "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                <InfinityIcon className="h-3.5 w-3.5" />
                Unlimited
              </button>

              <button
                type="button"
                onClick={() => startFreshDive("daily", packFilter, selectedDate)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition sm:text-sm ${
                  mode === "daily"
                    ? "bg-emerald-400 text-slate-950 shadow-lg"
                    : "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Daily (7)
              </button>

              <button
                type="button"
                onClick={() => startFreshDive("noillirk", packFilter, selectedDate)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition sm:text-sm ${
                  mode === "noillirk"
                    ? "bg-amber-400 text-slate-950 shadow-lg"
                    : "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                <Wind className="h-3.5 w-3.5" />
                Noillirk
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-white sm:text-sm">
              <ThemeVehicleIcon themeId={theme.id} />
              <span>{theme.hudTitle}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            {allowPackFilter && mode !== "daily" && (
              <select
                aria-label="Filter topic pack"
                value={packFilter}
                onChange={(e) => {
                  const nextPack = e.target.value as PackId | "all";
                  startFreshDive(mode, nextPack, selectedDate);
                }}
                className="rounded-xl border border-white/15 bg-black/40 px-2.5 py-1.5 text-xs font-semibold text-slate-100 outline-none focus:border-cyan-400"
              >
                <option value="all">All Packs</option>
                {PACK_METAS.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.shortName}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setRelaxedTimer((v) => !v)}
              className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                relaxedTimer
                  ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
                  : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
              title="Toggle timed vs relaxed practice"
            >
              {relaxedTimer ? <TimerOff className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{relaxedTimer ? "Relaxed" : "Timed"}</span>
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundOn)}
              aria-label={soundOn ? "Mute sound effects" : "Enable sound effects"}
              className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                soundOn
                  ? "border-cyan-400/35 bg-cyan-500/15 text-cyan-200"
                  : "border-white/15 bg-white/5 text-slate-400"
              }`}
              title={soundOn ? "Sound On" : "Sound Muted"}
            >
              {soundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleQuickInviteCopy}
              className="inline-flex items-center gap-1 rounded-xl border border-amber-400/40 bg-amber-500/15 px-2.5 py-1.5 text-xs font-bold text-amber-200 transition hover:bg-amber-500/25"
              title="Copy Challenge Link so a friend plays these exact 7 questions"
            >
              {copiedQuickInvite ? <Check className="h-3.5 w-3.5" /> : <Swords className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copiedQuickInvite ? "Copied!" : "PK Friend"}</span>
            </button>

            <button
              type="button"
              onClick={() => startFreshDive(mode, packFilter, selectedDate)}
              className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
              title="Start New 7-Question Run"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </div>

        {/* Friend Challenge Banner when opened via ?challenge=... */}
        {friendChallenge && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-400/50 bg-amber-500/15 px-4 py-2.5 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-bold text-amber-100">
              <Swords className="h-4 w-4 text-amber-300" />
              <span>
                Friend Challenge Active! Playing the exact same 7 questions
                {typeof friendChallenge.score === "number"
                  ? ` — Target to beat: ${friendChallenge.score}/700 (${friendChallenge.metric ?? ""})`
                  : "."}
              </span>
            </div>
            <span className="font-mono text-xs font-extrabold text-amber-300">
              Your Score: {totalScore}
            </span>
          </div>
        )}

        {/* Unified Interactive Progress + Vehicle Track + Countdown Strip */}
        <div className="mt-3.5 rounded-2xl border border-white/10 bg-black/30 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <ThemeVehicleIcon themeId={theme.id} />
              <span className="font-extrabold text-white">
                {progressStatus.label}
              </span>
              <span className={`font-mono font-black ${theme.accentTextClass}`}>
                {progressStatus.metric}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-slate-200">
                {totalScore} <span className="text-slate-400">/ 700 pts</span>
              </span>
              {roundPhase === "playing" && (
                <span
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 font-mono text-sm font-black ${
                    relaxedTimer
                      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                      : timeLeft <= 5
                        ? "animate-pulse border-rose-400 bg-rose-500/25 text-rose-200"
                        : "border-white/15 bg-white/5 text-white"
                  }`}
                >
                  {relaxedTimer ? "∞" : `${timeLeft}s`}
                </span>
              )}
            </div>
          </div>

          {/* Track Bar + Moving Vessel Marker */}
          <div className="relative mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${theme.progressBarClass}`}
              style={{ width: `${progressStatus.percent}%` }}
            />
          </div>

          {/* 7-Question Rarity Pips */}
          <div className="mt-2.5 flex items-center justify-between gap-1.5">
            {deck.map((item, idx) => {
              const out = outcomes[idx];
              const isCurrent = idx === qIndex && roundPhase !== "summary";
              let pipClass = "border-white/10 bg-white/5 text-slate-400";
              if (out) {
                pipClass =
                  out.points >= 85
                    ? "border-emerald-300/70 bg-emerald-400/25 text-emerald-100"
                    : out.points > 0
                      ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-100"
                      : "border-rose-400/50 bg-rose-500/20 text-rose-200";
              } else if (isCurrent) {
                pipClass = `border-white/50 bg-white/15 text-white ring-1 ring-white/30`;
              }
              return (
                <div
                  key={item.id}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-lg border py-1 font-mono text-[11px] font-bold transition ${pipClass}`}
                >
                  <span>Q{idx + 1}</span>
                  {out && <span className="hidden sm:inline">·{out.points}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Centerpiece Play / Reveal / Summary Stage */}
        {roundPhase === "summary" ? (
          <div className="mt-4 space-y-4">
            <div className={`rounded-2xl border p-5 sm:p-6 ${theme.cardClass}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200">
                    <Award className="h-4 w-4" />
                    {progressStatus.label}
                  </span>
                  <h3 className="mt-2.5 text-3xl font-black text-white">
                    Final Score:{" "}
                    <span className={theme.accentTextClass}>{totalScore}</span> / 700
                  </h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Rank Reached: <strong className="text-white">{progressStatus.metric}</strong>{" "}
                    {bestScore > 0 && `· Personal Best: ${Math.max(bestScore, totalScore)}`}
                  </p>

                  {friendChallenge && typeof friendChallenge.score === "number" && (
                    <div
                      className={`mt-2.5 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-extrabold ${
                        totalScore > friendChallenge.score
                          ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-200"
                          : totalScore === friendChallenge.score
                            ? "border-amber-400/50 bg-amber-500/20 text-amber-200"
                            : "border-rose-400/50 bg-rose-500/20 text-rose-200"
                      }`}
                    >
                      <Swords className="h-4 w-4" />
                      {totalScore > friendChallenge.score
                        ? `Victory! You beat your friend's ${friendChallenge.score} pts by +${totalScore - friendChallenge.score}!`
                        : totalScore === friendChallenge.score
                          ? `Deadlocked Tie at ${totalScore} pts! Play a rematch!`
                          : `Your friend won (${friendChallenge.score} vs ${totalScore}). Send back a new deck!`}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    startFreshDive(
                      mode === "daily" ? "unlimited" : mode,
                      packFilter,
                      selectedDate,
                    )
                  }
                  className={`inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r px-5 py-3 text-sm font-extrabold transition hover:brightness-110 ${theme.ctaClass}`}
                >
                  <InfinityIcon className="h-4 w-4" />
                  Play New 7-Round Run
                </button>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {outcomes.map((item, idx) => (
                  <div
                    key={item.prompt.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className={`text-[11px] font-bold ${theme.accentTextClass}`}>
                        Q{idx + 1} · {item.prompt.categoryLabel}
                      </p>
                      <p className="truncate text-xs font-semibold text-white">
                        {item.matchedAnswer ? item.matchedAnswer.name : item.tier}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-lg border px-2 py-0.5 font-mono text-xs font-bold ${
                        item.matchedAnswer
                          ? getTierBadgeClasses(item.matchedAnswer.tier, isReverse)
                          : "border-rose-500/40 bg-rose-500/15 text-rose-200"
                      }`}
                    >
                      +{item.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <ShareChallengePanel
              variant="summary"
              accent={theme.shareAccent}
              challengeUrl={challengeUrl}
              shareText={summaryShareText}
              shareTitle={`${shareHeader}: I scored ${totalScore}/700! Beat me on this exact board`}
              fullResultCopyText={fullCopyGridText}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <span>Try another distinct arena:</span>
              <div className="flex flex-wrap gap-1.5">
                <Link
                  href="/noillirk/"
                  className="rounded-lg border border-amber-400/35 bg-amber-500/10 px-2.5 py-1 font-bold text-amber-200 hover:bg-amber-500/20"
                >
                  Noillirk (Balloon)
                </Link>
                <Link
                  href="/footbillion/"
                  className="rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1 font-bold text-emerald-200 hover:bg-emerald-500/20"
                >
                  Footbillion (Pitch)
                </Link>
                <Link
                  href="/nba-krillion/"
                  className="rounded-lg border border-orange-400/35 bg-orange-500/10 px-2.5 py-1 font-bold text-orange-200 hover:bg-orange-500/20"
                >
                  NBA Krillion (Court)
                </Link>
                <Link
                  href="/pokekrillion/"
                  className="rounded-lg border border-rose-400/35 bg-rose-500/10 px-2.5 py-1 font-bold text-rose-200 hover:bg-rose-500/20"
                >
                  Pokekrillion (Dex)
                </Link>
                <Link
                  href="/poople-unlimited/"
                  className="rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-2.5 py-1 font-bold text-cyan-200 hover:bg-cyan-500/20"
                >
                  Poople Word Ladder
                </Link>
              </div>
            </div>
          </div>
        ) : currentPrompt ? (
          <div className="mt-4 space-y-3">
            <div className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 ${theme.cardClass}`}>
              {/* Countdown Drain Line at Top of Question Card */}
              {roundPhase === "playing" && !relaxedTimer && (
                <div className="absolute inset-x-0 top-0 h-1 bg-white/10">
                  <div
                    className={`h-full transition-all duration-1000 ease-linear ${
                      timeLeft <= 5 ? "bg-rose-400" : `bg-gradient-to-r ${theme.progressBarClass}`
                    }`}
                    style={{ width: `${timerPercent}%` }}
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold ${theme.accentTextClass}`}>
                  <Anchor className="h-3.5 w-3.5" />
                  Q{qIndex + 1}/7 · {currentPrompt.categoryLabel}
                </span>

                <span className="text-xs font-semibold text-slate-300">
                  Goal:{" "}
                  <strong className={theme.accentTextClass}>
                    {theme.goalInstruction}
                  </strong>
                </span>
              </div>

              {/* Active Prompt Question */}
              <p className="mt-4 text-xl font-black leading-snug text-white sm:text-3xl">
                {currentPrompt.question}
              </p>

              {/* Super-concise 3-step visual cue for first-time players on Q1 */}
              {qIndex === 0 && roundPhase === "playing" && !inputValue && revealedHints === 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-300">
                  <span className="rounded-full bg-white/5 px-2.5 py-0.5">
                    1. {theme.ruleSteps[0]}
                  </span>
                  <span className="text-slate-500">→</span>
                  <span className="rounded-full bg-white/5 px-2.5 py-0.5">
                    2. {theme.ruleSteps[1]}
                  </span>
                  <span className="text-slate-500">→</span>
                  <span className={`rounded-full bg-white/5 px-2.5 py-0.5 ${theme.accentTextClass}`}>
                    3. {theme.ruleSteps[2]}
                  </span>
                </div>
              )}

              {roundPhase === "playing" ? (
                <div className="mt-5">
                  <form onSubmit={handleFormSubmit} className="flex flex-col gap-3 sm:flex-row">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        if (feedbackError) setFeedbackError(null);
                      }}
                      placeholder={
                        isReverse
                          ? "Type the #1 most obvious mainstream answer..."
                          : "Type your answer here (typo-check active)..."
                      }
                      autoComplete="off"
                      spellCheck={false}
                      className={`flex-1 rounded-2xl border px-4 py-3.5 text-base font-bold text-white placeholder-slate-500 outline-none transition sm:text-lg ${theme.inputClass}`}
                    />
                    <button
                      type="submit"
                      className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 py-3.5 text-sm font-black shadow-lg transition hover:brightness-110 active:scale-[0.98] ${theme.ctaClass}`}
                    >
                      {theme.ctaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>

                  {/* Non-spoiler Spell Assist Pills */}
                  {suggestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-300">
                        Quick match:
                      </span>
                      {suggestions.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => submitCandidate(name)}
                          className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-100 transition hover:bg-emerald-500/25"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}

                  {feedbackError && (
                    <p className="mt-2.5 text-xs font-semibold text-rose-300" role="alert">
                      {feedbackError}
                    </p>
                  )}

                  {/* Hints + Skip Bar */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={revealedHints >= 3}
                        onClick={handleRevealHint}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/10 disabled:opacity-40"
                      >
                        <HelpCircle className={`h-3.5 w-3.5 ${theme.accentTextClass}`} />
                        {revealedHints >= 3
                          ? "All 3 Hints Open"
                          : `Hint ${revealedHints + 1}/3${relaxedTimer ? "" : " (-4s)"}`}
                      </button>
                      <span className="text-xs text-slate-400">
                        {currentPrompt.answers.length} valid answers in DB
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSkip}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-white"
                    >
                      <SkipForward className="h-3.5 w-3.5" />
                      Skip
                    </button>
                  </div>

                  {revealedHints > 0 && (
                    <div className="mt-3 space-y-1.5 rounded-xl border border-cyan-500/25 bg-black/35 p-3">
                      {currentPrompt.hints.slice(0, revealedHints).map((hint, idx) => (
                        <p key={hint} className="text-xs leading-relaxed text-cyan-100">
                          <strong className={theme.accentTextClass}>Hint {idx + 1}:</strong> {hint}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                currentOutcome && (
                  <div className="mt-5 space-y-4">
                    {/* Animated Rarity Meter Reveal Card */}
                    <div
                      className={`rounded-2xl border p-4 ${
                        currentOutcome.matchedAnswer
                          ? "border-emerald-400/45 bg-emerald-950/35"
                          : "border-rose-400/45 bg-rose-950/30"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xl font-black text-white">
                              {currentOutcome.matchedAnswer
                                ? currentOutcome.matchedAnswer.name
                                : currentOutcome.tier}
                            </span>
                            {currentOutcome.matchedAnswer && (
                              <span
                                className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${getTierBadgeClasses(
                                  currentOutcome.tier as RarityTier,
                                  isReverse,
                                )}`}
                              >
                                {currentOutcome.tier}
                              </span>
                            )}
                            {currentOutcome.typoAssisted && (
                              <span className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-200">
                                ✓ Typo-Matched ({currentOutcome.submittedText})
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 text-sm text-slate-200">
                            {currentOutcome.matchedAnswer
                              ? currentOutcome.matchedAnswer.fact
                              : "Time ran out or prompt was skipped — inspect the best rare answers below!"}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Round Score
                          </span>
                          <span
                            className={`font-mono text-3xl font-black ${
                              currentOutcome.points >= 70
                                ? "text-emerald-300"
                                : currentOutcome.points > 0
                                  ? theme.accentTextClass
                                  : "text-rose-300"
                            }`}
                          >
                            +{currentOutcome.points}
                          </span>
                        </div>
                      </div>

                      {/* Rarity Gauge Bar */}
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/40">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${theme.progressBarClass}`}
                          style={{ width: `${Math.max(4, currentOutcome.points)}%` }}
                        />
                      </div>
                    </div>

                    {/* Top Gems vs Plankton Trap Comparison */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-emerald-400/25 bg-emerald-950/20 p-3.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                          {isReverse
                            ? "Top Mainstream Crowd Picks (85–100 pts)"
                            : "Best Rare Picks (One in a Krillion)"}
                        </span>
                        <ul className="mt-2 space-y-1.5 text-xs">
                          {sortedAnswersForReveal.gems.map((ans) => (
                            <li
                              key={ans.name}
                              className="flex items-center justify-between gap-2 text-slate-100"
                            >
                              <span className="font-semibold">{ans.name}</span>
                              <span className="font-mono font-bold text-emerald-300">
                                {computeRoundPoints(ans.rarity, mode)} pts
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {sortedAnswersForReveal.plankton && (
                        <div className="rounded-xl border border-rose-400/25 bg-rose-950/20 p-3.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
                            {isReverse
                              ? "Overthinking Penalty Trap"
                              : "Biggest Plankton Trap"}
                          </span>
                          <div className="mt-2 flex items-center justify-between text-xs text-slate-100">
                            <span className="font-semibold">
                              {sortedAnswersForReveal.plankton.name}
                            </span>
                            <span className="font-mono font-bold text-rose-300">
                              {computeRoundPoints(sortedAnswersForReveal.plankton.rarity, mode)} pts
                            </span>
                          </div>
                          <p className="mt-1.5 text-[11px] text-slate-400">
                            {sortedAnswersForReveal.plankton.fact}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Copy className="h-3.5 w-3.5" />
                        Source: {currentPrompt.sourceAttribution}
                      </span>
                      <button
                        type="button"
                        onClick={handleNext}
                        autoFocus
                        className={`inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r px-6 py-3 text-sm font-black shadow-lg transition hover:brightness-110 ${theme.ctaClass}`}
                      >
                        {qIndex + 1 >= deck.length
                          ? "View Final Results & Share"
                          : `Next Question (${qIndex + 2}/${deck.length})`}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Compact Mid-Game Friend Challenge Strip */}
            <ShareChallengePanel
              variant="inline"
              accent={theme.shareAccent}
              challengeUrl={challengeUrl}
              shareText={midGameShareText}
              shareTitle={`${shareHeader} — Friend Challenge`}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
