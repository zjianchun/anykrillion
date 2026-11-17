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
  Check,
  Clock,
  Eye,
  Flame,
  HelpCircle,
  Maximize2,
  Minimize2,
  RotateCcw,
  Settings,
  SkipForward,
  Swords,
  TimerOff,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import OceanDiveScene from "@/components/OceanDiveScene";
import { getStickyExperimentVariant, trackGameEvent } from "@/lib/analytics";
import { getWorldThemeMeta, getZoneNarrative } from "@/lib/worldThemesData";
import { TierCreatureSprite } from "@/components/PixelSprites";
import ShareChallengePanel from "@/components/ShareChallengePanel";
import type {
  AnswerEntity,
  DailyBoard,
  GameMode,
  PackId,
  RarityTier,
  TriviaPrompt,
} from "@/types/game";
import { ALL_PROMPTS, DAILY_BOARDS, getPromptsByPack } from "@/lib/datasets";
import { PACK_METAS } from "@/types/game";
import {
  computeRoundPoints,
  getDisplayTier,
  getNonSpoilerSuggestions,
  matchAnswer,
} from "@/lib/fuzzyMatch";
import {
  decodeKrillionChallenge,
  encodeKrillionChallenge,
} from "@/lib/challengeCodec";
import {
  THEME_CONFIGS,
  resolveThemeVariant,
  type ThemeVariant,
} from "@/lib/gameThemes";
import {
  isSoundEnabled,
  playDiveDescentSound,
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
  prompts?: TriviaPrompt[];
  dailyBoards?: DailyBoard[];
  defaultMode?: GameMode;
  defaultPack?: PackId;
  allowModeSwitch?: boolean;
  allowPackFilter?: boolean;
  initialDailyDate?: string;
  themeVariant?: ThemeVariant;
}

type EnginePhase = "splash" | "countdown" | "playing" | "sinking" | "revealed" | "summary";

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

function getCreatureTitleAndTagline(
  outcome: RoundOutcome,
  isReverse: boolean,
  themeId: ThemeVariant,
): {
  title: string;
  tagline: string;
  titleColorClass: string;
} {
  const { tiers } = getWorldThemeMeta(themeId, isReverse);
  if (!outcome.matchedAnswer || outcome.points <= 0) {
    return {
      title: outcome.tier === "Skipped" ? "SKIPPED ROUTE" : tiers.miss.title,
      tagline: tiers.miss.tagline,
      titleColorClass: "text-rose-300 drop-shadow-[0_0_16px_rgba(244,63,94,0.65)]",
    };
  }
  if (outcome.points >= 85) {
    return {
      title: tiers.rare.title,
      tagline: tiers.rare.tagline,
      titleColorClass: "text-amber-300 drop-shadow-[0_0_18px_rgba(251,191,36,0.8)]",
    };
  }
  if (outcome.points >= 55) {
    return {
      title: tiers.high.title,
      tagline: tiers.high.tagline,
      titleColorClass: "text-cyan-300 drop-shadow-[0_0_16px_rgba(34,211,238,0.75)]",
    };
  }
  if (outcome.points >= 25) {
    return {
      title: tiers.mid.title,
      tagline: tiers.mid.tagline,
      titleColorClass: "text-sky-300 drop-shadow-[0_0_14px_rgba(56,189,248,0.65)]",
    };
  }
  return {
    title: tiers.low.title,
    tagline: tiers.low.tagline,
    titleColorClass: "text-slate-200 drop-shadow-[0_0_12px_rgba(226,232,240,0.5)]",
  };
}

function getWorldDisplayTitle(themeId: ThemeVariant, isReverse: boolean): {
  logoText: string;
  subtitle: string;
} {
  if (isReverse || themeId === "sky") {
    return {
      logoText: "NOILLIRK",
      subtitle: "THE REVERSE ASCENT: 7 prompts · name the MOST OBVIOUS answer",
    };
  }
  switch (themeId) {
    case "pitch":
      return {
        logoText: "FOOTBILLION",
        subtitle: "WORLD CUP & CLUB DIVE: 7 prompts · 40s clock · rarest players sink deeper",
      };
    case "hardwood":
      return {
        logoText: "NBA KRILLION",
        subtitle: "BASKETBALL ARENA DIVE: 7 prompts · 30s clock · deep-cut picks score highest",
      };
    case "pokedex":
      return {
        logoText: "POKEKRILLION",
        subtitle: "GEN 1–9 DEX DIVE: 7 prompts · avoid Pikachu traps · catch rare spawns",
      };
    case "atlas":
      return {
        logoText: "KRILLION GEO",
        subtitle: "WORLD ATLAS DIVE: 7 prompts · chart obscure nations & capitals",
      };
    case "cinema":
      return {
        logoText: "CINE KRILLION",
        subtitle: "ACADEMY ARCHIVE DIVE: 7 prompts · skip blockbusters · pick indie gems",
      };
    case "stadium":
      return {
        logoText: "SPORTS KRILLION",
        subtitle: "ALL-SPORTS DIVE: 7 prompts · 35s clock · rarest champions go deepest",
      };
    default:
      return {
        logoText: "KRILLION",
        subtitle: "THE ENDLESS DIVE: 7 prompts · 25s each · rarer answers sink deeper",
      };
  }
}

export default function KrillionGameEngine({
  prompts: promptsProp,
  dailyBoards: dailyBoardsProp,
  defaultMode = "unlimited",
  defaultPack = "general",
  allowModeSwitch = true,
  allowPackFilter = true,
  initialDailyDate,
  themeVariant,
}: KrillionGameEngineProps) {
  const prompts = useMemo(
    () => promptsProp ?? (allowPackFilter ? ALL_PROMPTS : getPromptsByPack(defaultPack)),
    [promptsProp, allowPackFilter, defaultPack],
  );
  const dailyBoards = dailyBoardsProp ?? DAILY_BOARDS;
  const [mode, setMode] = useState<GameMode>(defaultMode);
  const [packFilter, setPackFilter] = useState<PackId | "all">(
    defaultPack === "general" ? "all" : defaultPack,
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDailyDate ?? dailyBoards[0]?.date ?? "2026-11-14",
  );
  const [relaxedTimer, setRelaxedTimer] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [friendChallenge, setFriendChallenge] = useState<ActiveFriendChallenge | null>(null);
  const [copiedQuickInvite, setCopiedQuickInvite] = useState<boolean>(false);
  const [showCompareDrawer, setShowCompareDrawer] = useState<boolean>(false);
  const [showControlsMenu, setShowControlsMenu] = useState<boolean>(false);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [exitDailyNudge, setExitDailyNudge] = useState<boolean>(false);
  const [dailyNudgeDismissed, setDailyNudgeDismissed] = useState<boolean>(false);
  const [dailyCountdown, setDailyCountdown] = useState<string>("");
  const [hasStartedPlay, setHasStartedPlay] = useState<boolean>(false);
  const [typingPulse, setTypingPulse] = useState<number>(0);
  const [discoveredLogs, setDiscoveredLogs] = useState<string[]>([]);
  const [latestDiscovery, setLatestDiscovery] = useState<string | null>(null);
  const discoveryTimerRef = useRef<number>(0);

  const handleDiscovery = useCallback((label: string) => {
    setDiscoveredLogs((prev) => (prev.includes(label) ? prev : [...prev, label]));
    setLatestDiscovery(label);
    window.clearTimeout(discoveryTimerRef.current);
    discoveryTimerRef.current = window.setTimeout(() => {
      setLatestDiscovery(null);
    }, 4500);
  }, []);

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

  // Deterministic SSR initial deck
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

  // Core game phase & physical camera coordinates (start directly on Q1, timer starts on first keystroke)
  const [phase, setPhase] = useState<EnginePhase>("playing");
  const [countdownNum, setCountdownNum] = useState<number>(2);
  const [timeLeft, setTimeLeft] = useState<number>(initialDeck[0]?.timerSeconds ?? 25);
  const [cameraDepth, setCameraDepth] = useState<number>(72);
  const [displayScore, setDisplayScore] = useState<number>(0);
  const [sinkingText, setSinkingText] = useState<string>("");

  const stageRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const animRafRef = useRef<number>(0);

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

  // On mount: shuffle unlimited deck so returning players don't get the exact same SSR starter board,
  // unless a ?challenge= URL token specifies an exact deck!
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("challenge");
    if (token) {
      const decoded = decodeKrillionChallenge(token);
      if (decoded) {
        const resolved = decoded.p
          .map((id) => promptById.get(id))
          .filter((p): p is TriviaPrompt => Boolean(p));
        if (resolved.length > 0) {
          queueMicrotask(() => {
            setMode(decoded.m);
            setDeck(resolved);
            setQIndex(0);
            setOutcomes([]);
            setPhase("playing");
            setTimerActive(false);
            setCameraDepth(72);
            setDisplayScore(0);
            setTimeLeft(resolved[0]?.timerSeconds ?? 25);
            setFriendChallenge({ score: decoded.s, metric: decoded.d });
          });
          return;
        }
      }
    }

    if (defaultMode !== "daily") {
      const pool =
        defaultPack === "general"
          ? prompts
          : prompts.filter((p) => p.pack === defaultPack);
      const fresh = shufflePrompts(
        pool.length >= QUESTIONS_PER_DIVE ? pool : prompts,
        QUESTIONS_PER_DIVE,
      );
      const entryVariant = getStickyExperimentVariant("entry_v1", ["direct", "cover"]);
      trackGameEvent("exposure", { exp: "entry_v1", variant: entryVariant });
      queueMicrotask(() => {
        setDeck(fresh);
        setTimeLeft(fresh[0]?.timerSeconds ?? 25);
        if (entryVariant === "cover") {
          setPhase("splash");
          setCameraDepth(0);
        }
      });
    }
  }, [defaultMode, defaultPack, promptById, prompts]);

  // Report 60-second active gameplay retention milestone once per session
  useEffect(() => {
    if (!hasStartedPlay) return;
    const t = window.setTimeout(() => {
      trackGameEvent("play_60s", { game: defaultPack, mode: defaultMode });
    }, 60_000);
    return () => window.clearTimeout(t);
  }, [defaultMode, defaultPack, hasStartedPlay]);

  // Listen to browser fullscreen changes
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && stageRef.current) {
        await stageRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // fallback CSS fullscreen state if API restricted
      setIsFullscreen((prev) => !prev);
    }
  };

  const isReverse = mode === "noillirk";
  const currentPrompt = deck[qIndex];
  const activeThemeId = resolveThemeVariant(mode, packFilter, themeVariant);
  const theme = THEME_CONFIGS[activeThemeId];
  const worldTitle = getWorldDisplayTitle(activeThemeId, isReverse);
  const worldMeta = getWorldThemeMeta(activeThemeId, isReverse);

  const totalScore = useMemo(
    () => outcomes.reduce((sum, item) => sum + item.points, 0),
    [outcomes],
  );

  const beginRunFromSplash = useCallback(() => {
    playLockInSound();
    setPhase("countdown");
    setCountdownNum(2);
    // Smooth glide from horizon 0m -> initial underwater view 72m
    const startT = performance.now();
    const startD = cameraDepth;
    const targetD = 72;
    const glide = (now: number) => {
      const p = Math.min(1, (now - startT) / 850);
      const eased = 1 - Math.pow(1 - p, 3);
      setCameraDepth(Math.round(startD + (targetD - startD) * eased));
      if (p < 1) {
        animRafRef.current = window.requestAnimationFrame(glide);
      }
    };
    window.cancelAnimationFrame(animRafRef.current);
    animRafRef.current = window.requestAnimationFrame(glide);
  }, [cameraDepth]);

  const startFreshDive = useCallback(
    (
      nextMode: GameMode = mode,
      nextPack: PackId | "all" = packFilter,
      nextDate: string = selectedDate,
      autoEnterGame = false,
    ) => {
      window.cancelAnimationFrame(animRafRef.current);
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
      setShowCompareDrawer(false);
      setShowControlsMenu(false);
      setDisplayScore(0);
      setTimeLeft(nextDeck[0]?.timerSeconds ?? 25);
      setFriendChallenge(null);
      setCameraDepth(72);

      if (autoEnterGame) {
        setTimerActive(true);
        setPhase("countdown");
        setCountdownNum(2);
      } else {
        setTimerActive(false);
        setPhase("playing");
      }
    },
    [buildDeck, deck, mode, packFilter, selectedDate],
  );

  // Brief countdown before starting clock on each prompt
  useEffect(() => {
    if (phase !== "countdown") return;
    const t = window.setTimeout(() => {
      if (countdownNum <= 1) {
        setPhase("playing");
        setTimeLeft(currentPrompt?.timerSeconds ?? 25);
        setTimeout(() => inputRef.current?.focus(), 40);
      } else {
        setCountdownNum(countdownNum - 1);
      }
    }, 450);
    return () => window.clearTimeout(t);
  }, [countdownNum, currentPrompt?.timerSeconds, phase]);

  // Animate physical camera descent & score climb during "sinking"
  const triggerSinkAndReveal = useCallback(
    (outcome: RoundOutcome) => {
      const updated = [...outcomes, outcome];
      const prevScore = outcomes.reduce((acc, r) => acc + r.points, 0);
      const nextScore = prevScore + outcome.points;
      const prevDepth = Math.max(72, prevScore * 10);
      const targetDepth = Math.max(72, nextScore * 10);

      setOutcomes(updated);
      setFeedbackError(null);
      setShowCompareDrawer(false);

      if (!outcome.matchedAnswer || outcome.points <= 0) {
        // Quick miss settle (no big sink)
        playInvalidOrTimeoutSound();
        setPhase("revealed");
        return;
      }

      setSinkingText(outcome.matchedAnswer.name);
      setPhase("sinking");

      const durationMs = outcome.points >= 80 ? 1850 : outcome.points >= 40 ? 1500 : 1200;
      playDiveDescentSound(durationMs, outcome.points, mode === "noillirk");

      const startTime = performance.now();
      window.cancelAnimationFrame(animRafRef.current);

      const stepFrame = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        // Smooth easeInOutCubic for heavy sinking feel
        const eased =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        setCameraDepth(Math.round(prevDepth + (targetDepth - prevDepth) * eased));
        setDisplayScore(Math.round(prevScore + (nextScore - prevScore) * eased));

        if (progress < 1) {
          animRafRef.current = window.requestAnimationFrame(stepFrame);
        } else {
          setCameraDepth(targetDepth);
          setDisplayScore(nextScore);
          playRarityRevealSound(outcome.points);

          if (updated.length >= deck.length && nextScore >= 420) {
            import("canvas-confetti")
              .then((mod) => {
                mod.default({
                  particleCount: 80,
                  spread: 75,
                  origin: { y: 0.65 },
                });
              })
              .catch(() => {});
          }

          try {
            if (nextScore > bestScore) {
              window.localStorage.setItem("anykrillion_best_score", String(nextScore));
              window.dispatchEvent(new Event("anykrillion-best-score"));
            }
          } catch {
            // ignore storage errors
          }

          setPhase("revealed");
        }
      };

      animRafRef.current = window.requestAnimationFrame(stepFrame);
    },
    [bestScore, deck.length, mode, outcomes],
  );

  // Live countdown to next Daily Dive (UTC midnight) on summary screen
  useEffect(() => {
    if (phase !== "summary") return;
    const updateCountdown = () => {
      const now = new Date();
      const nextUtc = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
      );
      const diffSec = Math.max(0, Math.floor((nextUtc - now.getTime()) / 1000));
      const h = String(Math.floor(diffSec / 3600)).padStart(2, "0");
      const m = String(Math.floor((diffSec % 3600) / 60)).padStart(2, "0");
      const s = String(diffSec % 60).padStart(2, "0");
      setDailyCountdown(`${h}:${m}:${s}`);
    };
    updateCountdown();
    const id = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  // Active round countdown timer (waits for first keystroke on Q1)
  useEffect(() => {
    if (phase !== "playing" || !timerActive || relaxedTimer || !currentPrompt || timeLeft <= 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (timeLeft <= 1) {
        setTimeLeft(0);
        triggerSinkAndReveal({
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
  }, [currentPrompt, phase, relaxedTimer, timeLeft, timerActive, triggerSinkAndReveal]);

  useEffect(() => {
    return () => {
      window.cancelAnimationFrame(animRafRef.current);
      window.clearTimeout(discoveryTimerRef.current);
    };
  }, []);

  const suggestions = useMemo(() => {
    if (!currentPrompt || phase !== "playing") return [];
    return getNonSpoilerSuggestions(inputValue, currentPrompt.answers, 3);
  }, [currentPrompt, inputValue, phase]);

  const submitCandidate = (rawText: string) => {
    if (!currentPrompt || phase !== "playing") return;
    const trimmed = rawText.trim();
    if (!trimmed) return;

    if (outcomes.length === 0 && qIndex === 0) {
      setHasStartedPlay(true);
      trackGameEvent("game_start", { game: activeThemeId, mode });
    }

    const result = matchAnswer(trimmed, currentPrompt.answers);
    if (result.status === "miss") {
      playInvalidOrTimeoutSound();
      trackGameEvent("answer_submit", {
        game: activeThemeId,
        mode,
        round: qIndex + 1,
        status: "miss",
        points: 0,
      });
      setFeedbackError("Not recognized in dataset — try another or check spelling.");
      return;
    }

    playLockInSound();
    const pts = computeRoundPoints(result.answer.rarity, mode);
    const tier = getDisplayTier(pts, mode);
    trackGameEvent("answer_submit", {
      game: activeThemeId,
      mode,
      round: qIndex + 1,
      status: "hit",
      points: pts,
    });
    triggerSinkAndReveal({
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
    if (!currentPrompt || phase !== "playing") return;
    if (!timerActive) setTimerActive(true);
    if (outcomes.length === 0 && qIndex === 0) {
      setHasStartedPlay(true);
      trackGameEvent("game_start", { game: activeThemeId, mode });
    }
    trackGameEvent("answer_submit", {
      game: activeThemeId,
      mode,
      round: qIndex + 1,
      status: "skip",
      points: 0,
    });
    triggerSinkAndReveal({
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
      trackGameEvent("game_complete", {
        game: activeThemeId,
        mode,
        score: totalScore,
        rounds: deck.length,
      });
      setPhase("summary");
      return;
    }
    const nextIdx = qIndex + 1;
    setQIndex(nextIdx);
    setInputValue("");
    setFeedbackError(null);
    setRevealedHints(0);
    setShowCompareDrawer(false);
    setCountdownNum(2);
    setTimerActive(true);
    setPhase("countdown");
    setTimeLeft(deck[nextIdx]?.timerSeconds ?? 25);
  };

  const handleRevealHint = () => {
    if (!currentPrompt || revealedHints >= 3 || phase !== "playing") return;
    if (!timerActive) setTimerActive(true);
    playLockInSound();
    trackGameEvent("hint_used", {
      game: activeThemeId,
      hint_level: revealedHints + 1,
    });
    setRevealedHints((prev) => prev + 1);
    if (!relaxedTimer) {
      setTimeLeft((prev) => Math.max(3, prev - 4));
    }
  };

  const currentOutcome = outcomes[qIndex];
  const maxSeconds = currentPrompt?.timerSeconds ?? 25;
  const ringCircumference = 2 * Math.PI * 19;
  const ringOffset = relaxedTimer
    ? 0
    : ringCircumference * (1 - Math.max(0, Math.min(1, timeLeft / maxSeconds)));

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

  const depthMetricLabel = `${worldMeta.unitPrefix}${cameraDepth.toLocaleString()}${worldMeta.unitSuffix}`;

  const zoneStory = getZoneNarrative(cameraDepth, isReverse, activeThemeId);

  const challengeUrl = useMemo(() => {
    const token = encodeKrillionChallenge({
      p: deck.map((p) => p.id),
      m: mode,
      s: outcomes.length > 0 ? totalScore : undefined,
      d: outcomes.length > 0 ? depthMetricLabel : undefined,
    });
    const basePath =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}`
        : `https://anykrillion.com${isReverse ? "/noillirk/" : "/"}`;
    return `${basePath}?challenge=${token}`;
  }, [deck, depthMetricLabel, isReverse, mode, outcomes.length, totalScore]);

  const emojiGrid = outcomes.map((o) => tierToEmoji(o.tier, isReverse)).join("");
  const summaryShareText = `Can you beat my ${totalScore}/700 (${depthMetricLabel}) dive on this exact 7-question board? ${emojiGrid}`;
  const fullCopyGridText = `${worldTitle.logoText} · ${totalScore}/700 (${depthMetricLabel})\n${emojiGrid}\nPlay my exact board:\n${challengeUrl}`;

  const handleQuickInviteCopy = async () => {
    trackGameEvent("share_click", { channel: "quick_invite", game: activeThemeId });
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
      ref={stageRef}
      aria-label="Interactive Krillion Ocean Dive Canvas"
      onMouseLeave={() => {
        if (mode !== "daily" && !dailyNudgeDismissed && outcomes.length === 0) {
          setExitDailyNudge(true);
        }
      }}
      className={`relative overflow-hidden border-y border-cyan-400/25 sm:rounded-3xl sm:border ${
        isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen rounded-none border-0"
          : "h-[calc(100vh-64px)] min-h-[560px] max-h-[820px] w-full sm:h-[calc(100vh-80px)]"
      }`}
    >
      <OceanDiveScene
        cameraDepth={cameraDepth}
        isReverse={isReverse}
        themeId={activeThemeId}
        phase={phase}
        sinkingPlaqueText={sinkingText}
        typingPulse={typingPulse}
        score={displayScore}
        urgentTimer={phase === "playing" && !relaxedTimer && timeLeft <= 5}
        onDiscovery={handleDiscovery}
      >
        {/* TOP HUD BAR: DEPTH + ROUND PIPS + SCORE + QUICK CONTROLS */}
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            {/* Top Left: Depth / Altitude Plaque */}
            <div className="pointer-events-auto rounded-xl border border-cyan-400/30 bg-[#041425]/45 px-3 py-1.5 backdrop-blur-[2px] sm:px-4 sm:py-2">
              <span className="block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-300/80">
                {worldMeta.hudMetricTitle}
              </span>
              <span
                className={`font-pixel text-base font-bold sm:text-xl ${
                  isReverse ? "text-amber-300" : "text-cyan-300"
                }`}
              >
                {depthMetricLabel}
              </span>
            </div>

            {/* Center: 7 Pixel Progress Blocks + Mode Switch */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-white/15 bg-[#041425]/45 px-2.5 py-1.5 backdrop-blur-[2px]">
                {deck.map((item, idx) => {
                  const out = outcomes[idx];
                  const isCurrent = idx === qIndex && phase !== "splash" && phase !== "summary";
                  let cls = "bg-slate-800/80 border-white/15";
                  if (out) {
                    cls =
                      out.points >= 85
                        ? "bg-amber-300 border-amber-200 shadow-[0_0_8px_rgba(252,211,77,0.8)]"
                        : out.points > 0
                          ? "bg-cyan-400 border-cyan-200"
                          : "bg-rose-500 border-rose-300";
                  } else if (isCurrent) {
                    cls = "bg-rose-400 border-white animate-pulse";
                  }
                  return (
                    <span
                      key={item.id}
                      className={`h-3 w-3 rounded-[2px] border transition sm:h-3.5 sm:w-3.5 ${cls}`}
                    />
                  );
                })}
              </div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-100/85 drop-shadow">
                {phase === "splash"
                  ? "READY TO DIVE"
                  : phase === "summary"
                    ? "EXPEDITION LOG"
                    : `PROMPT ${qIndex + 1} OF ${deck.length}`}
              </span>
            </div>

            {/* Top Right: Score + Mini Utility Controls */}
            <div className="flex items-start gap-1.5">
              <div className="pointer-events-auto rounded-xl border border-rose-400/30 bg-[#041425]/45 px-3 py-1.5 text-right backdrop-blur-[2px] sm:px-4 sm:py-2">
                <span className="block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-300/80">
                  SCORE
                </span>
                <span className="font-pixel text-base font-bold text-rose-400 sm:text-xl">
                  {displayScore}
                </span>
              </div>
            </div>
          </div>

          {/* Floating Mode & Compact Settings Strip */}
          <div className="relative flex flex-wrap items-center justify-between gap-1.5">
            {allowModeSwitch ? (
              <div className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#041425]/45 p-1 backdrop-blur-[2px]">
                {(
                  [
                    { id: "unlimited", label: "Unlimited ∞" },
                    { id: "daily", label: "Daily (7)" },
                    { id: "noillirk", label: "Noillirk ↑" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => startFreshDive(m.id, packFilter, selectedDate, false)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      mode === m.id
                        ? m.id === "noillirk"
                          ? "bg-amber-400 text-slate-950"
                          : "bg-cyan-400 text-slate-950"
                        : "text-slate-200 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            ) : (
              <span className="pointer-events-auto rounded-lg border border-white/15 bg-[#041425]/45 px-2.5 py-1 font-mono text-[11px] font-bold text-cyan-200 backdrop-blur-[2px]">
                {theme.vehicleLabel} Mode
              </span>
            )}

            <div className="pointer-events-auto relative flex items-center gap-1 rounded-xl border border-white/10 bg-[#041425]/45 p-1 backdrop-blur-[2px]">
              <button
                type="button"
                onClick={handleQuickInviteCopy}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-400/20 px-2 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-400/30"
                title="Copy Friend Challenge URL (same 7 questions)"
              >
                {copiedQuickInvite ? <Check className="h-3.5 w-3.5" /> : <Swords className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{copiedQuickInvite ? "Copied!" : "PK Friend"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowControlsMenu((v) => !v)}
                aria-expanded={showControlsMenu}
                aria-label="Game settings"
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                  showControlsMenu
                    ? "bg-cyan-400 text-slate-950"
                    : "text-slate-200 hover:bg-white/10"
                }`}
                title="Packs, Timer, Sound & Reset"
              >
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Options</span>
              </button>

              {showControlsMenu && (
                <div className="absolute right-0 top-full z-40 mt-1.5 flex w-60 flex-col gap-2 rounded-xl border border-cyan-400/35 bg-[#041425]/95 p-3 shadow-2xl backdrop-blur-md">
                  {allowPackFilter && mode !== "daily" && (
                    <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Topic Pack
                      <select
                        aria-label="Filter topic pack"
                        value={packFilter}
                        onChange={(e) =>
                          startFreshDive(mode, e.target.value as PackId | "all", selectedDate, false)
                        }
                        className="rounded-lg border border-white/15 bg-black/50 px-2 py-1.5 text-xs font-semibold text-cyan-200 outline-none"
                      >
                        <option value="all">All Packs</option>
                        {PACK_METAS.map((pm) => (
                          <option key={pm.id} value={pm.id}>
                            {pm.shortName}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setRelaxedTimer((v) => !v)}
                      className={`inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 font-bold transition ${
                        relaxedTimer
                          ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
                          : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      {relaxedTimer ? <TimerOff className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                      {relaxedTimer ? "Relaxed" : "Timed"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSoundEnabled(!soundOn)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 font-bold text-slate-200 hover:bg-white/10"
                    >
                      {soundOn ? <Volume2 className="h-3.5 w-3.5 text-cyan-300" /> : <VolumeX className="h-3.5 w-3.5 text-slate-500" />}
                      {soundOn ? "Sound On" : "Muted"}
                    </button>

                    <button
                      type="button"
                      onClick={() => startFreshDive(mode, packFilter, selectedDate, false)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 font-bold text-slate-200 hover:bg-white/10"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      New Deck
                    </button>

                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 font-bold text-slate-200 hover:bg-white/10"
                    >
                      {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                      {isFullscreen ? "Exit Full" : "Fullscreen"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {friendChallenge && phase !== "summary" && (
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-amber-400/75 bg-amber-500/25 px-4 py-1.5 text-xs font-extrabold text-amber-50 shadow-[0_0_20px_rgba(251,191,36,0.25)] backdrop-blur-sm">
              <Swords className="h-3.5 w-3.5 text-amber-300" />
              <span>
                {typeof friendChallenge.score === "number"
                  ? `Opponent Score: ${friendChallenge.score} pts${friendChallenge.metric ? ` (${friendChallenge.metric})` : ""} — Beat them on the exact same 7 prompts!`
                  : "Friend PK Challenge — Exact same 7 prompts"}
              </span>
            </div>
          )}
        </div>

        {/* CENTER WORLD INTERACTION STAGE */}
        <div className="my-auto flex flex-col items-center justify-center px-2">
          {/* PHASE 1: ICONIC SURFACE SPLASH */}
          {phase === "splash" && (
            <div className="flex max-w-xl flex-col items-center text-center">
              <h2 className="font-pixel text-4xl font-bold tracking-wider text-white drop-shadow-[3px_3px_0_#ff2a6d] sm:text-6xl">
                {worldTitle.logoText}
              </h2>
              <p className="mt-2 font-mono text-xs font-bold tracking-wide text-cyan-200 drop-shadow sm:text-sm">
                {worldTitle.subtitle}
              </p>

              <button
                type="button"
                onClick={beginRunFromSplash}
                autoFocus
                className="pointer-events-auto mt-8 inline-flex items-center gap-3 rounded-lg border-2 border-cyan-300 bg-[#041527]/55 px-8 py-4 font-pixel text-sm font-bold tracking-widest text-white backdrop-blur-sm shadow-[0_0_32px_rgba(34,211,238,0.45)] transition hover:scale-[1.03] hover:bg-cyan-400 hover:text-slate-950 sm:text-base"
              >
                {isReverse ? "▲ BEGIN ASCENT ▲" : "▼ BEGIN DESCENT ▼"}
              </button>

              {bestScore > 0 && (
                <p className="mt-3 font-mono text-xs text-slate-300/80">
                  Personal Best: <strong className="text-amber-300">{bestScore} pts</strong>
                </p>
              )}
            </div>
          )}

          {/* PHASE 2: BRISK COUNTDOWN TRANSITION */}
          {phase === "countdown" && (
            <div className="rounded-xl border border-cyan-400/40 bg-[#041425]/45 px-6 py-3 text-center backdrop-blur-[2px]">
              <p className="font-mono text-sm font-bold tracking-wider text-cyan-200 drop-shadow">
                {isReverse ? "ascending" : "descending"} · the clock starts in{" "}
                <span className="font-pixel text-lg text-amber-300">{countdownNum}</span>
              </p>
            </div>
          )}

          {/* PHASE 3: ACTIVE PROMPT QUESTION + SHEER FLOATING COCKPIT HUD */}
          {phase === "playing" && currentPrompt && (
            <div className="flex w-full max-w-2xl flex-col items-center gap-3.5">
              {/* Ultra-sheer Cockpit HUD Prompt Card (background creatures & beams shine right through!) */}
              <div className="relative w-full rounded-2xl border border-cyan-300/35 bg-[#03101f]/20 px-5 py-4 text-center shadow-[0_6px_28px_rgba(0,0,0,0.16)] backdrop-blur-[2px] sm:px-7 sm:py-5">
                {/* HUD Corner Reticle Brackets */}
                <span className="pointer-events-none absolute -left-[1px] -top-[1px] h-3 w-3 rounded-tl-xl border-l-2 border-t-2 border-cyan-300/85" aria-hidden="true" />
                <span className="pointer-events-none absolute -right-[1px] -top-[1px] h-3 w-3 rounded-tr-xl border-r-2 border-t-2 border-cyan-300/85" aria-hidden="true" />
                <span className="pointer-events-none absolute -bottom-[1px] -left-[1px] h-3 w-3 rounded-bl-xl border-b-2 border-l-2 border-cyan-300/85" aria-hidden="true" />
                <span className="pointer-events-none absolute -bottom-[1px] -right-[1px] h-3 w-3 rounded-br-xl border-b-2 border-r-2 border-cyan-300/85" aria-hidden="true" />

                <div className="flex items-center justify-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
                  <span className="text-rose-300">PROMPT {qIndex + 1} OF {deck.length}</span>
                  <span className="text-slate-300/70">·</span>
                  <span className="text-cyan-200">{currentPrompt.categoryLabel}</span>
                </div>

                <p className="mt-2.5 text-xl font-black leading-snug text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] [text-shadow:0_1px_3px_rgba(0,0,0,0.95)] sm:text-3xl">
                  {currentPrompt.question}
                </p>

                <p className="mt-2 font-mono text-[11px] tracking-wider text-cyan-100/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
                  {isReverse
                    ? "▲ obvious answers fly higher ▲"
                    : "▼ rarer answers sink deeper ▼"}
                </p>

                {revealedHints > 0 && (
                  <div className="mt-3 space-y-1 rounded-lg border border-cyan-500/35 bg-[#020c18]/55 px-3 py-2 text-left backdrop-blur-sm">
                    {currentPrompt.hints.slice(0, revealedHints).map((hint, idx) => (
                      <p key={hint} className="font-mono text-xs text-cyan-100">
                        <strong className="text-amber-300">HINT {idx + 1}:</strong> {hint}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Non-spoiler Typo / Canonical Match Assist Pill */}
              {suggestions.length > 0 && (
                <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-lg border border-emerald-400/45 bg-[#041425]/55 px-3 py-1.5 backdrop-blur-sm">
                  <span className="font-mono text-[11px] font-bold text-emerald-300">
                    Match &rarr;
                  </span>
                  {suggestions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => submitCandidate(name)}
                      className="rounded border border-emerald-400/50 bg-emerald-500/25 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-100 hover:bg-emerald-500/40"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}

              {feedbackError && (
                <p
                  className="pointer-events-auto rounded-lg border border-rose-400/50 bg-rose-950/65 px-3 py-1 font-mono text-xs font-bold text-rose-100 backdrop-blur-sm"
                  role="alert"
                >
                  {feedbackError}
                </p>
              )}

              {/* Bottom Arcade Input Bar with Sheer Glass & Keystroke Sonar Pulse */}
              <form
                onSubmit={handleFormSubmit}
                className="pointer-events-auto flex w-full items-center gap-2.5 rounded-xl border border-cyan-300/50 bg-[#03101d]/35 p-2 shadow-[0_0_24px_rgba(34,211,238,0.18)] backdrop-blur-[3px]"
              >
                {/* Radial SVG Countdown Ring */}
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                  <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44">
                    <circle
                      cx="22"
                      cy="22"
                      r="19"
                      fill="none"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="3.5"
                    />
                    <circle
                      cx="22"
                      cy="22"
                      r="19"
                      fill="none"
                      stroke={
                        relaxedTimer
                          ? "#34d399"
                          : timeLeft <= 5
                            ? "#f43f5e"
                            : isReverse
                              ? "#fbbf24"
                              : "#22d3ee"
                      }
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      className="transition-[stroke-dashoffset] duration-1000 linear"
                    />
                  </svg>
                  <span
                    className={`absolute font-mono text-xs font-black ${
                      relaxedTimer
                        ? "text-emerald-300"
                        : timeLeft <= 5
                          ? "text-rose-400 animate-pulse"
                          : "text-cyan-200"
                    }`}
                  >
                    {relaxedTimer ? "∞" : timeLeft}
                  </span>
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    if (!timerActive) setTimerActive(true);
                    setInputValue(e.target.value);
                    setTypingPulse((n) => n + 1);
                    if (feedbackError) setFeedbackError(null);
                  }}
                  placeholder={
                    !timerActive && qIndex === 0 && outcomes.length === 0
                      ? isReverse
                        ? "start typing most obvious answer (clock waits)..."
                        : "start typing an obscure answer (clock waits)..."
                      : isReverse
                        ? "type the most obvious answer..."
                        : "type one answer..."
                  }
                  autoComplete="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 bg-transparent px-2 py-2 font-mono text-base font-bold text-white placeholder-slate-300/65 outline-none sm:text-lg"
                />

                <button
                  type="submit"
                  className="shrink-0 rounded-lg bg-[#ff2a6d] px-4 py-2.5 font-pixel text-xs font-bold tracking-wider text-white shadow-[0_0_18px_rgba(255,42,109,0.55)] transition hover:brightness-110 active:scale-95 sm:px-5"
                >
                  {isReverse ? "ASCEND" : "DIVE"}
                </button>
              </form>

              {/* Compact Hints + Skip Row */}
              <div className="flex w-full items-center justify-between px-1 font-mono text-[11px] text-slate-200/85 drop-shadow">
                <button
                  type="button"
                  disabled={revealedHints >= 3}
                  onClick={handleRevealHint}
                  className="pointer-events-auto inline-flex items-center gap-1 rounded-md border border-white/20 bg-black/30 px-2.5 py-1 font-bold backdrop-blur-sm hover:bg-black/50 disabled:opacity-40"
                >
                  <HelpCircle className="h-3 w-3 text-cyan-300" />
                  {revealedHints >= 3
                    ? "All 3 Hints Open"
                    : `Hint ${revealedHints + 1}/3${relaxedTimer ? "" : " (-4s)"}`}
                </button>
                <span className="hidden sm:inline text-slate-200/75">
                  {currentPrompt.answers.length} verified entries
                </span>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="pointer-events-auto inline-flex items-center gap-1 rounded-md px-2 py-1 hover:text-white"
                >
                  <SkipForward className="h-3 w-3" />
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* PHASE 5: FLOATING IN-WATER TIER CREATURE REVEAL */}
          {phase === "revealed" && currentOutcome && currentPrompt && (
            <div className="flex w-full max-w-xl flex-col items-center text-center">
              {(() => {
                const { title, tagline, titleColorClass } = getCreatureTitleAndTagline(
                  currentOutcome,
                  isReverse,
                  activeThemeId,
                );
                const sinkDistance = currentOutcome.points * 10;
                return (
                  <>
                    <TierCreatureSprite
                      points={currentOutcome.points}
                      isMiss={!currentOutcome.matchedAnswer || currentOutcome.points <= 0}
                      themeId={activeThemeId}
                    />
                    <h3 className={`mt-2 font-pixel text-2xl font-bold tracking-wider sm:text-4xl ${titleColorClass}`}>
                      {title}
                    </h3>
                    {currentOutcome.matchedAnswer && (
                      <p className="mt-1.5 font-mono text-base font-bold text-white sm:text-lg">
                        &ldquo;{currentOutcome.matchedAnswer.name}&rdquo;
                      </p>
                    )}
                    <p className="mt-1 font-mono text-sm font-bold text-amber-300">
                      +{currentOutcome.points} PTS · {sinkDistance.toLocaleString()}
                      {worldMeta.unitSuffix}
                    </p>
                    <p className="mt-1 max-w-md font-mono text-xs text-slate-300">
                      {currentOutcome.matchedAnswer
                        ? `${tagline} — ${currentOutcome.matchedAnswer.fact}`
                        : tagline}
                    </p>

                    <button
                      type="button"
                      onClick={handleNext}
                      autoFocus
                      className="pointer-events-auto mt-5 inline-flex items-center gap-2 rounded-lg border-2 border-cyan-300 bg-[#041527]/65 px-7 py-3 font-pixel text-xs font-bold tracking-widest text-white backdrop-blur-sm shadow-[0_0_24px_rgba(34,211,238,0.4)] transition hover:bg-cyan-400 hover:text-slate-950 sm:text-sm"
                    >
                      {qIndex + 1 >= deck.length
                        ? "VIEW EXPEDITION SUMMARY"
                        : worldMeta.actionDescendLabel}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCompareDrawer((v) => !v)}
                      className="pointer-events-auto mt-3 inline-flex items-center gap-1 font-mono text-[11px] font-bold text-cyan-200/85 underline decoration-cyan-500/40 underline-offset-4 hover:text-white"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {showCompareDrawer
                        ? "Hide Round Best Answers"
                        : "Peek 100-Pt Gems & Plankton Trap"}
                    </button>

                    {showCompareDrawer && (
                      <div className="pointer-events-auto mt-3 grid w-full gap-2.5 rounded-xl border border-cyan-400/30 bg-[#03101d]/65 p-3.5 text-left backdrop-blur-md sm:grid-cols-2">
                        <div>
                          <span className="font-mono text-[10px] font-bold uppercase text-emerald-300">
                            {isReverse ? "Top Mainstream Picks" : "100-Pt Rare Gems"}
                          </span>
                          <ul className="mt-1 space-y-1 font-mono text-xs text-slate-200">
                            {sortedAnswersForReveal.gems.map((g) => (
                              <li key={g.name} className="flex justify-between gap-2">
                                <span className="truncate">{g.name}</span>
                                <strong className="text-emerald-300">
                                  +{computeRoundPoints(g.rarity, mode)}
                                </strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {sortedAnswersForReveal.plankton && (
                          <div>
                            <span className="font-mono text-[10px] font-bold uppercase text-rose-300">
                              {isReverse ? "Deep Cut Penalty" : "Plankton Trap"}
                            </span>
                            <p className="mt-1 flex justify-between font-mono text-xs text-rose-200">
                              <span className="truncate">{sortedAnswersForReveal.plankton.name}</span>
                              <strong>
                                +{computeRoundPoints(sortedAnswersForReveal.plankton.rarity, mode)}
                              </strong>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* PHASE 6: SCREENSHOT-READY EXPEDITION SCORE CARD */}
          {phase === "summary" && (
            <div className="pointer-events-auto w-full max-w-2xl space-y-3 overflow-y-auto max-h-[74vh] rounded-2xl border-2 border-cyan-400/50 bg-gradient-to-b from-[#04182d]/90 to-[#020c18]/90 p-4 shadow-[0_0_40px_rgba(34,211,238,0.2)] backdrop-blur-md sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-cyan-300">
                      {worldTitle.logoText} · {isReverse ? "FLIGHT COMPLETE" : "DIVE COMPLETE"}
                    </span>
                    {bestScore > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-200">
                        <Flame className="h-3 w-3 text-amber-300" />
                        {totalScore >= bestScore ? "NEW BEST!" : `Best: ${bestScore}`}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 font-pixel text-2xl font-bold text-white sm:text-3xl">
                    <span className="text-amber-300">{totalScore}</span> / 700 ·{" "}
                    <span className="text-cyan-300">{depthMetricLabel}</span>
                  </h3>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-300">
                    Zone Reached: <strong className="text-cyan-200">{zoneStory.zone}</strong> ·{" "}
                    <span className="tracking-widest">{emojiGrid}</span>
                  </p>
                  {friendChallenge && typeof friendChallenge.score === "number" && (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-400/20 px-2.5 py-1 font-mono text-xs font-bold text-amber-200">
                      <Swords className="h-3.5 w-3.5" />
                      {totalScore > friendChallenge.score
                        ? `VICTORY! Beat friend's ${friendChallenge.score} pts!`
                        : totalScore === friendChallenge.score
                          ? `TIE at ${totalScore} pts!`
                          : `Friend scored ${friendChallenge.score} pts — run it back!`}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      startFreshDive(
                        mode === "daily" ? "unlimited" : mode,
                        packFilter,
                        selectedDate,
                        true,
                      )
                    }
                    className="rounded-lg border-2 border-cyan-300 bg-cyan-400 px-4 py-2 font-pixel text-xs font-bold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:brightness-110"
                  >
                    NEXT DIVE →
                  </button>
                  {dailyCountdown && (
                    <span className="font-mono text-[10px] text-slate-400">
                      Next Daily in <strong className="text-cyan-200">{dailyCountdown}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Round Plaques */}
              <div className="grid gap-1.5 sm:grid-cols-2">
                {outcomes.map((item, idx) => (
                  <div
                    key={item.prompt.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs"
                  >
                    <span className="truncate text-slate-200">
                      Q{idx + 1}: {item.matchedAnswer ? item.matchedAnswer.name : item.tier}
                    </span>
                    <span
                      className={`shrink-0 font-bold ${
                        item.points >= 85
                          ? "text-amber-300"
                          : item.points > 0
                            ? "text-cyan-300"
                            : "text-rose-400"
                      }`}
                    >
                      +{item.points}
                    </span>
                  </div>
                ))}
              </div>

              <ShareChallengePanel
                variant="summary"
                accent={isReverse ? "amber" : "cyan"}
                challengeUrl={challengeUrl}
                shareText={summaryShareText}
                shareTitle={`${worldTitle.logoText}: ${totalScore}/700 (${depthMetricLabel})`}
                fullResultCopyText={fullCopyGridText}
                ctaLabel={`Can you beat ${depthMetricLabel}? Challenge Friends`}
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-[11px] text-slate-400">
                <span>Switch Worlds:</span>
                <div className="flex flex-wrap gap-1.5">
                  <Link href="/noillirk/" className="text-amber-300 hover:underline">
                    Noillirk
                  </Link>
                  <Link href="/footbillion/" className="text-emerald-300 hover:underline">
                    Footbillion
                  </Link>
                  <Link href="/nba-krillion/" className="text-orange-300 hover:underline">
                    NBA Krillion
                  </Link>
                  <Link href="/pokekrillion/" className="text-rose-300 hover:underline">
                    Pokekrillion
                  </Link>
                  <Link href="/poople-unlimited/" className="text-cyan-300 hover:underline">
                    Poople
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* NON-INTRUSIVE EXIT-INTENT DAILY NUDGE */}
        {exitDailyNudge && !dailyNudgeDismissed && mode !== "daily" && (
          <div className="pointer-events-auto mx-auto mb-1 flex items-center gap-3 rounded-full border border-emerald-400/45 bg-[#041a2b]/90 px-3.5 py-1.5 font-mono text-[11px] text-emerald-100 shadow-lg backdrop-blur-md">
            <span>Today&apos;s 7-question Daily Dive is ready</span>
            <button
              type="button"
              onClick={() => {
                setDailyNudgeDismissed(true);
                setExitDailyNudge(false);
                startFreshDive("daily", packFilter, selectedDate, false);
              }}
              className="rounded-full bg-emerald-400 px-2.5 py-0.5 font-bold text-slate-950 hover:brightness-110"
            >
              Play Daily →
            </button>
            <button
              type="button"
              aria-label="Dismiss daily nudge"
              onClick={() => {
                setDailyNudgeDismissed(true);
                setExitDailyNudge(false);
              }}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* BOTTOM WORLD FOOTER: SONAR NARRATIVE TICKER + DISCOVERY LOG */}
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] font-semibold tracking-wider text-slate-200/80 drop-shadow">
          {latestDiscovery ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300/45 bg-amber-500/15 px-2 py-0.5 text-amber-200 backdrop-blur-sm">
              <span>✦</span>
              <span>{latestDiscovery}</span>
            </span>
          ) : (
            <span className="truncate">
              <strong className="text-cyan-300">{zoneStory.zone.toUpperCase()}</strong>
              <span className="hidden sm:inline text-slate-300/75">
                {" "}
                · {zoneStory.hint} · {worldMeta.scanPromptLabel}
              </span>
              {discoveredLogs.length > 0 && (
                <span className="ml-1.5 text-amber-300">
                  · {discoveredLogs.length} scanned
                </span>
              )}
            </span>
          )}
          <a href="#game-guide" className="pointer-events-auto shrink-0 text-cyan-300/90 hover:text-white">
            RULES &amp; RARITY GUIDE ↓
          </a>
        </div>
      </OceanDiveScene>
    </section>
  );
}
