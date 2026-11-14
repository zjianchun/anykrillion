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
  Copy,
  HelpCircle,
  Infinity as InfinityIcon,
  RotateCcw,
  Share2,
  SkipForward,
  Sparkles,
  TimerOff,
  Waves,
  Wind,
} from "lucide-react";
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

interface RoundOutcome {
  prompt: TriviaPrompt;
  matchedAnswer: AnswerEntity | null;
  points: number;
  tier: RarityTier | "Timed Out" | "Skipped";
  typoAssisted: boolean;
  submittedText: string;
}

interface KrillionGameEngineProps {
  prompts: TriviaPrompt[];
  dailyBoards: DailyBoard[];
  defaultMode?: GameMode;
  defaultPack?: PackId;
  allowModeSwitch?: boolean;
  allowPackFilter?: boolean;
  initialDailyDate?: string;
}

const QUESTIONS_PER_DIVE = 7;

function shufflePrompts(pool: TriviaPrompt[], count: number, excludeIds: string[] = []): TriviaPrompt[] {
  const preferred = pool.filter((p) => !excludeIds.includes(p.id));
  const source = preferred.length >= count ? preferred : pool;
  const arr = [...source];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(count, arr.length));
}

function getDepthStatus(totalScore: number, isReverse: boolean): {
  label: string;
  metric: string;
  percent: number;
} {
  const pct = Math.min(100, Math.max(4, Math.round((totalScore / 700) * 100)));
  if (isReverse) {
    const feet = Math.round((totalScore / 700) * 52000);
    if (totalScore >= 560) return { label: "Stratosphere Orbit", metric: `${feet.toLocaleString()} ft`, percent: pct };
    if (totalScore >= 420) return { label: "Jetstream Cruiser", metric: `${feet.toLocaleString()} ft`, percent: pct };
    if (totalScore >= 280) return { label: "Cumulus Climber", metric: `${feet.toLocaleString()} ft`, percent: pct };
    return { label: "Meadow Liftoff", metric: `${feet.toLocaleString()} ft`, percent: pct };
  }
  const meters = Math.round((totalScore / 700) * 10994);
  if (totalScore >= 560) return { label: "Hadal Trench — One in a Krillion", metric: `-${meters.toLocaleString()}m`, percent: pct };
  if (totalScore >= 440) return { label: "Abyssal Zone Diver", metric: `-${meters.toLocaleString()}m`, percent: pct };
  if (totalScore >= 300) return { label: "Midnight Zone Explorer", metric: `-${meters.toLocaleString()}m`, percent: pct };
  if (totalScore >= 160) return { label: "Twilight Zone Swimmer", metric: `-${meters.toLocaleString()}m`, percent: pct };
  return { label: "Sunlit Surface", metric: `-${meters.toLocaleString()}m`, percent: pct };
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

function getServerBestScore(): number {
  return 0;
}

function tierToEmoji(tier: RoundOutcome["tier"], isReverse: boolean): string {
  if (tier === "Timed Out" || tier === "Skipped") return "⬛";
  if (tier === "One in a Krillion") return isReverse ? "🟡" : "🟢";
  if (tier === "Deep Sea") return "🔵";
  if (tier === "Rare") return "🟣";
  if (tier === "Uncommon") return "🟡";
  return "🟠";
}

export default function KrillionGameEngine({
  prompts,
  dailyBoards,
  defaultMode = "unlimited",
  defaultPack = "general",
  allowModeSwitch = true,
  allowPackFilter = true,
  initialDailyDate,
}: KrillionGameEngineProps) {
  const [mode, setMode] = useState<GameMode>(defaultMode);
  const [packFilter, setPackFilter] = useState<PackId | "all">(
    defaultPack === "general" ? "all" : defaultPack,
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDailyDate ?? dailyBoards[0]?.date ?? "2026-11-14",
  );
  const [relaxedTimer, setRelaxedTimer] = useState<boolean>(false);

  const promptById = useMemo(() => {
    const map = new Map<string, TriviaPrompt>();
    for (const p of prompts) map.set(p.id, p);
    return map;
  }, [prompts]);

  const buildDeck = useCallback(
    (targetMode: GameMode, targetPack: PackId | "all", targetDate: string, seenIds: string[] = []): TriviaPrompt[] => {
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
      const effectivePool = packPool.length >= QUESTIONS_PER_DIVE ? packPool : prompts;
      return shufflePrompts(effectivePool, QUESTIONS_PER_DIVE, seenIds);
    },
    [dailyBoards, promptById, prompts],
  );

  // Use deterministic initial slice for SSR hydration safety, then shuffle on client if unlimited
  const initialDeck = useMemo(() => {
    if (defaultMode === "daily") {
      return buildDeck("daily", defaultPack === "general" ? "all" : defaultPack, selectedDate);
    }
    const pool =
      defaultPack === "general"
        ? prompts
        : prompts.filter((p) => p.pack === defaultPack);
    return (pool.length >= QUESTIONS_PER_DIVE ? pool : prompts).slice(0, QUESTIONS_PER_DIVE);
  }, [buildDeck, defaultMode, defaultPack, prompts, selectedDate]);

  const [deck, setDeck] = useState<TriviaPrompt[]>(initialDeck);
  const [qIndex, setQIndex] = useState<number>(0);
  const [outcomes, setOutcomes] = useState<RoundOutcome[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [roundPhase, setRoundPhase] = useState<"playing" | "revealed" | "summary">("playing");
  const [timeLeft, setTimeLeft] = useState<number>(initialDeck[0]?.timerSeconds ?? 25);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const bestScore = useSyncExternalStore(
    subscribeBestScore,
    getClientBestScore,
    getServerBestScore,
  );

  const inputRef = useRef<HTMLInputElement>(null);

  const isReverse = mode === "noillirk";
  const currentPrompt = deck[qIndex];

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
      setCopiedShare(false);
    },
    [buildDeck, deck, mode, packFilter, selectedDate],
  );

  const finishQuestion = useCallback(
    (outcome: RoundOutcome) => {
      const updated = [...outcomes, outcome];
      const total = updated.reduce((acc, r) => acc + r.points, 0);
      setOutcomes(updated);

      if (updated.length >= deck.length && total >= 420) {
        import("canvas-confetti")
          .then((mod) => {
            mod.default({
              particleCount: 70,
              spread: 65,
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
        // ignore
      }

      setRoundPhase("revealed");
      setFeedbackError(null);
    },
    [bestScore, deck.length, outcomes],
  );

  // Countdown tick during active question
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
        setTimeLeft(timeLeft - 1);
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
      setFeedbackError("Not found in verified dataset — check spelling or try a hint.");
      return;
    }

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
    setRevealedHints((prev) => prev + 1);
    if (!relaxedTimer) {
      setTimeLeft((prev) => Math.max(3, prev - 4));
    }
  };

  const depthInfo = getDepthStatus(totalScore, isReverse);
  const currentOutcome = outcomes[qIndex];

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

  const handleCopyShare = async () => {
    const emojis = outcomes.map((o) => tierToEmoji(o.tier, isReverse)).join("");
    const activeBoard = dailyBoards.find((b) => b.date === selectedDate);
    const header =
      mode === "daily" && activeBoard
        ? `AnyKrillion Daily #${activeBoard.dayNumber} (${activeBoard.date})`
        : isReverse
          ? "AnyKrillion — Noillirk Unlimited"
          : "AnyKrillion — Krillion Unlimited";
    const shareText = `${header}\nScore: ${totalScore}/700 (${depthInfo.metric})\n${emojis}\nPlay free: https://anykrillion.com${isReverse ? "/noillirk/" : "/"}`;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      // Ignore clipboard failure
    }
  };

  const surfaceShell = isReverse
    ? "border-amber-400/35 bg-gradient-to-b from-[#1d173b] via-[#131d3a] to-[#0a1326] shadow-[0_24px_80px_rgba(251,191,36,0.12)]"
    : "border-cyan-400/30 bg-gradient-to-b from-[#061d36] via-[#04162b] to-[#020c18] shadow-[0_24px_80px_rgba(6,182,212,0.14)]";

  return (
    <section
      aria-label="Interactive Krillion Game Canvas"
      className={`rounded-3xl border p-4 sm:p-6 ${surfaceShell}`}
    >
      {/* Top Mode & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        {allowModeSwitch ? (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Game modes">
            <button
              type="button"
              onClick={() => startFreshDive("unlimited", packFilter, selectedDate)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition sm:text-sm ${
                mode === "unlimited"
                  ? "bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.35)]"
                  : "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              <InfinityIcon className="h-4 w-4" />
              Unlimited Dive
            </button>

            <button
              type="button"
              onClick={() => startFreshDive("daily", packFilter, selectedDate)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition sm:text-sm ${
                mode === "daily"
                  ? "bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(52,211,153,0.35)]"
                  : "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Today&apos;s Daily (7)
            </button>

            <button
              type="button"
              onClick={() => startFreshDive("noillirk", packFilter, selectedDate)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition sm:text-sm ${
                mode === "noillirk"
                  ? "bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.35)]"
                  : "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              <Wind className="h-4 w-4" />
              Noillirk (Reverse)
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-bold text-white">
            {isReverse ? <Wind className="h-4 w-4 text-amber-300" /> : <Waves className="h-4 w-4 text-cyan-300" />}
            <span>
              {isReverse ? "Noillirk Reverse Mode" : "Endless Practice & Dive"}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {allowPackFilter && mode !== "daily" && (
            <select
              aria-label="Filter topic pack"
              value={packFilter}
              onChange={(e) => {
                const nextPack = e.target.value as PackId | "all";
                startFreshDive(mode, nextPack, selectedDate);
              }}
              className="rounded-xl border border-white/15 bg-[#041425] px-3 py-2 text-xs font-semibold text-slate-100 outline-none focus:border-cyan-400"
            >
              <option value="all">All Categories (Mixed)</option>
              {PACK_METAS.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.shortName} Pack
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setRelaxedTimer((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              relaxedTimer
                ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
                : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
            title="Toggle relaxed practice timer"
          >
            {relaxedTimer ? <TimerOff className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
            {relaxedTimer ? "Relaxed (No Timer)" : "Timed Mode"}
          </button>

          <button
            type="button"
            onClick={() => startFreshDive(mode, packFilter, selectedDate)}
            className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New Run
          </button>
        </div>
      </div>

      {/* Depth / Balloon Ascent Progress HUD */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Progress
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-black text-white">
              {roundPhase === "summary" ? "7 / 7" : `${qIndex + 1} / ${deck.length}`}
            </span>
            <span className="text-xs font-semibold text-cyan-300">
              {currentPrompt?.categoryLabel}
            </span>
          </div>
          <div className="mt-2 flex gap-1.5">
            {deck.map((item, idx) => {
              const out = outcomes[idx];
              const isCurrent = idx === qIndex && roundPhase !== "summary";
              let barColor = "bg-white/15";
              if (out) {
                barColor =
                  out.points >= 85
                    ? isReverse
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                    : out.points > 0
                      ? "bg-cyan-400"
                      : "bg-rose-500/70";
              } else if (isCurrent) {
                barColor = isReverse ? "bg-amber-300 animate-pulse" : "bg-cyan-300 animate-pulse";
              }
              return <span key={item.id} className={`h-2 flex-1 rounded-full ${barColor}`} />;
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {isReverse ? "Balloon Altitude" : "Ocean Dive Depth"}
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`text-xl font-black ${isReverse ? "text-amber-300" : "text-emerald-300"}`}>
              {depthInfo.metric}
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {totalScore} / 700 pts
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isReverse
                  ? "bg-gradient-to-r from-amber-400 to-orange-400"
                  : "bg-gradient-to-r from-cyan-400 to-emerald-400"
              }`}
              style={{ width: `${depthInfo.percent}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {relaxedTimer ? "Practice Mode" : "Round Countdown"}
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span
              className={`font-mono text-2xl font-black ${
                relaxedTimer
                  ? "text-emerald-300"
                  : timeLeft <= 6
                    ? "text-rose-400"
                    : isReverse
                      ? "text-amber-200"
                      : "text-cyan-200"
              }`}
            >
              {relaxedTimer ? "∞ Untimed" : `${timeLeft}s`}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {bestScore > 0 ? `Best: ${bestScore}` : `${currentPrompt?.answers.length ?? 0} valid answers`}
            </span>
          </div>
          <p className="mt-1.5 truncate text-[11px] text-slate-400">
            {depthInfo.label}
          </p>
        </div>
      </div>

      {/* Main Stage: Playing / Revealed / Summary */}
      {roundPhase === "summary" ? (
        <div className="mt-6 rounded-2xl border border-white/15 bg-black/30 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200">
                <Award className="h-4 w-4" />
                {depthInfo.label}
              </span>
              <h3 className="mt-3 text-3xl font-black text-white">
                Final Score: <span className="text-cyan-300">{totalScore}</span> / 700
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                {isReverse
                  ? `Your hot-air balloon climbed to ${depthInfo.metric} by finding mainstream answers.`
                  : `You reached ${depthInfo.metric} below sea level with verified rarity picks.`}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCopyShare}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-500/20 px-4 py-2.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-500/30"
              >
                {copiedShare ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {copiedShare ? "Copied Spoiler-Free Grid!" : "Share Result Grid"}
              </button>

              <button
                type="button"
                onClick={() => startFreshDive(mode === "daily" ? "unlimited" : mode, packFilter, selectedDate)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-2.5 text-sm font-extrabold text-slate-950 transition hover:brightness-110"
              >
                <InfinityIcon className="h-4 w-4" />
                Play New Unlimited Dive
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-2.5">
            {outcomes.map((item, idx) => (
              <div
                key={item.prompt.id}
                className="flex flex-col justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-cyan-300">
                    Q{idx + 1} · {item.prompt.categoryLabel}
                  </p>
                  <p className="truncate text-sm font-bold text-white">
                    {item.prompt.question}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold text-slate-200">
                    {item.matchedAnswer ? item.matchedAnswer.name : item.tier}
                  </span>
                  <span
                    className={`rounded-lg border px-2.5 py-1 font-mono text-xs font-bold ${
                      item.matchedAnswer
                        ? getTierBadgeClasses(item.matchedAnswer.tier, isReverse)
                        : "border-rose-500/40 bg-rose-500/15 text-rose-200"
                    }`}
                  >
                    +{item.points} pts
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Retention links to Today's Answers & Vertical Packs */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs">
            <span className="font-semibold text-slate-400">
              Continue playing specialized rarity trivia:
            </span>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/krillion-answers-today/"
                className="rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-3 py-1.5 font-bold text-emerald-200 hover:bg-emerald-500/20"
              >
                Today&apos;s Answers &amp; Hints
              </Link>
              <Link
                href="/footbillion/"
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-semibold text-slate-200 hover:bg-white/10"
              >
                Footbillion (40s)
              </Link>
              <Link
                href="/pokekrillion/"
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-semibold text-slate-200 hover:bg-white/10"
              >
                Pokekrillion
              </Link>
              <Link
                href="/krillion-geography/"
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-semibold text-slate-200 hover:bg-white/10"
              >
                Krillion Geography
              </Link>
            </div>
          </div>
        </div>
      ) : currentPrompt ? (
        <div className="mt-6 rounded-2xl border border-white/15 bg-black/35 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-200">
              <Anchor className="h-3.5 w-3.5" />
              {currentPrompt.categoryLabel}
            </span>
            <span className="text-xs text-slate-400">
              Goal:{" "}
              <strong className={isReverse ? "text-amber-300" : "text-emerald-300"}>
                {isReverse
                  ? "Name the MOST OBVIOUS answer"
                  : "Name the RAREST valid answer"}
              </strong>
            </span>
          </div>

          <h2 className="mt-4 text-xl font-extrabold leading-snug text-white sm:text-2xl">
            {currentPrompt.question}
          </h2>

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
                      ? "Type the most popular answer you think everyone knows..."
                      : "Type an obscure valid answer (smart typo-check active)..."
                  }
                  autoComplete="off"
                  spellCheck={false}
                  className="flex-1 rounded-2xl border border-cyan-400/35 bg-[#031221] px-4 py-3.5 text-base font-semibold text-white placeholder-slate-500 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/25"
                />
                <button
                  type="submit"
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-extrabold text-slate-950 transition hover:brightness-110 ${
                    isReverse
                      ? "bg-gradient-to-r from-amber-300 to-orange-400"
                      : "bg-gradient-to-r from-cyan-300 to-emerald-400"
                  }`}
                >
                  Lock Answer
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {/* Non-spoiler Typo Recovery Assist Pills */}
              {suggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-300">
                    Spell-check assist:
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

              {/* Progressive Hints + Skip */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={revealedHints >= 3}
                    onClick={handleRevealHint}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-40"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-cyan-300" />
                    {revealedHints >= 3
                      ? "All Hints Shown"
                      : `Hint ${revealedHints + 1}/3${relaxedTimer ? "" : " (-4s)"}`}
                  </button>
                  <span className="text-xs text-slate-400">
                    Pool size: {currentPrompt.answers.length} verified entries
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSkip}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-slate-200"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  Skip Prompt
                </button>
              </div>

              {revealedHints > 0 && (
                <div className="mt-3 space-y-2 rounded-xl border border-cyan-500/25 bg-cyan-950/35 p-3.5">
                  {currentPrompt.hints.slice(0, revealedHints).map((hint, idx) => (
                    <p key={hint} className="text-xs leading-relaxed text-cyan-100">
                      <strong className="text-cyan-300">Hint {idx + 1}:</strong> {hint}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            currentOutcome && (
              <div className="mt-5 space-y-4">
                {/* Scored Reveal Banner */}
                <div
                  className={`rounded-2xl border p-4 ${
                    currentOutcome.matchedAnswer
                      ? "border-emerald-400/40 bg-emerald-950/35"
                      : "border-rose-400/40 bg-rose-950/30"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-black text-white">
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
                            ✓ Typo-Forgiven ({currentOutcome.submittedText})
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm text-slate-300">
                        {currentOutcome.matchedAnswer
                          ? currentOutcome.matchedAnswer.fact
                          : "No answer submitted before time expired. Check the verified picks below!"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="block text-[11px] font-bold uppercase text-slate-400">
                        Points Earned
                      </span>
                      <span
                        className={`font-mono text-2xl font-black ${
                          currentOutcome.points > 0 ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        +{currentOutcome.points}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comparison Gems vs Plankton Trap */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-emerald-400/25 bg-emerald-950/20 p-3.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                      {isReverse
                        ? "Top Crowd-Favorite Picks (85–100 pts)"
                        : "Best Deep-Cut Picks (One in a Krillion)"}
                    </span>
                    <ul className="mt-2 space-y-1.5 text-xs">
                      {sortedAnswersForReveal.gems.map((ans) => (
                        <li key={ans.name} className="flex items-center justify-between gap-2 text-slate-200">
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
                          ? "Overthinking Trap (Deep Cut Penalty)"
                          : "Biggest Plankton Trap"}
                      </span>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-200">
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
                    className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold text-slate-950 transition hover:brightness-110 ${
                      isReverse
                        ? "bg-gradient-to-r from-amber-300 to-orange-400"
                        : "bg-gradient-to-r from-cyan-300 to-emerald-400"
                    }`}
                  >
                    {qIndex + 1 >= deck.length
                      ? "View Final Dive Summary"
                      : `Next Question (${qIndex + 2}/${deck.length})`}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      ) : null}
    </section>
  );
}
