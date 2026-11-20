"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  Check,
  Compass,
  Eye,
  EyeOff,
  Flame,
  Infinity as InfinityIcon,
  Lightbulb,
  RotateCcw,
  Search,
  Sparkles,
  Swords,
  Undo2,
  Volume2,
  VolumeX,
} from "lucide-react";
import ShareChallengePanel from "@/components/ShareChallengePanel";
import PooplePipeScene from "@/components/PooplePipeScene";
import { trackGameEvent } from "@/lib/analytics";
import type { ScoreCardSpec } from "@/lib/scoreCardCanvas";
import poopleDataRaw from "@/data/poople_words.json";
import {
  decodePoopleChallenge,
  encodePoopleChallenge,
} from "@/lib/challengeCodec";
import {
  isSoundEnabled,
  playInvalidOrTimeoutSound,
  playLockInSound,
  playVictorySound,
  setSoundEnabled,
} from "@/lib/soundEffects";

const QWERTY_ROWS: ReadonlyArray<ReadonlyArray<string>> = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

interface PoopleDailyBoard {
  dayNumber: number;
  date: string;
  startWord: string;
  targetWord: string;
  optimalSteps: number;
  optimalPath: string[];
}

interface PoopleDataset {
  target: string;
  dictionary: string[];
  dailyBoards: PoopleDailyBoard[];
}

const poopleData = poopleDataRaw as PoopleDataset;
const WORD_SET = new Set<string>(poopleData.dictionary);

const POOPLE_STREAK_STORAGE_KEY = "anykrillion_poople_streak";

function subscribePoopleStreak(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener("anykrillion-poople-streak", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("anykrillion-poople-streak", handler);
  };
}

function getClientPoopleStreak(): number {
  try {
    const raw = window.localStorage.getItem(POOPLE_STREAK_STORAGE_KEY);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function getServerPoopleStreak(): number {
  return 0;
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

function getTrueServer(): boolean {
  return true;
}

const PRESET_STARTERS = [
  "STAR",
  "COLD",
  "WARM",
  "GAME",
  "WORD",
  "PLAY",
  "BOOK",
  "SHOP",
  "GOAL",
  "BALL",
  "FILM",
  "GOLD",
  "WORK",
  "HOME",
  "LIFE",
  "RAIN",
  "FIRE",
  "FAST",
  "DEEP",
  "LOVE",
  "COIN",
  "SHIP",
  "BOAT",
  "ROCK",
  "MOON",
  "ROAD",
  "CARD",
  "HAND",
  "MARK",
  "PLAN",
  "TIME",
  "MIND",
  "DIVE",
  "FISH",
  "RARE",
  "HERO",
  "KING",
  "WIND",
  "TREE",
  "BIRD",
];

function diffPositions(a: string, b: string): number[] {
  const diffs: number[] = [];
  for (let i = 0; i < 4; i++) {
    if (a[i] !== b[i]) diffs.push(i);
  }
  return diffs;
}

function findShortestLadder(start: string, target = "POOP"): string[] | null {
  const s = start.trim().toUpperCase();
  const t = target.trim().toUpperCase();
  if (s.length !== 4 || t.length !== 4) return null;
  if (!WORD_SET.has(s) || !WORD_SET.has(t)) return null;
  if (s === t) return [s];

  const queue: string[] = [s];
  const visited = new Set<string>([s]);
  const parent = new Map<string, string>();
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];
    for (let i = 0; i < 4; i++) {
      for (let cIdx = 0; cIdx < alphabet.length; cIdx++) {
        const ch = alphabet[cIdx];
        if (ch === current[i]) continue;
        const candidate = `${current.slice(0, i)}${ch}${current.slice(i + 1)}`;
        if (WORD_SET.has(candidate) && !visited.has(candidate)) {
          visited.add(candidate);
          parent.set(candidate, current);
          if (candidate === t) {
            const path: string[] = [t];
            let step = t;
            while (parent.has(step)) {
              const prev = parent.get(step)!;
              path.push(prev);
              step = prev;
            }
            return path.reverse();
          }
          queue.push(candidate);
        }
      }
    }
  }
  return null;
}

export default function PoopleGameEngine() {
  const latestDaily = poopleData.dailyBoards[poopleData.dailyBoards.length - 1];

  const [tab, setTab] = useState<"unlimited" | "daily" | "solver">("unlimited");
  const [selectedDailyDate, setSelectedDailyDate] = useState<string>(latestDaily.date);

  // Active ladder state (shared for Unlimited and Daily play)
  const [startWord, setStartWord] = useState<string>("COLD");
  const [chain, setChain] = useState<string[]>(["COLD"]);
  const [inputWord, setInputWord] = useState<string>("");
  const [typingPulse, setTypingPulse] = useState(0);
  const [discoveredPipes, setDiscoveredPipes] = useState<string[]>([]);
  const [latestDiscovery, setLatestDiscovery] = useState<string | null>(null);
  const [hasStartedPlay, setHasStartedPlay] = useState<boolean>(false);

  useEffect(() => {
    if (!hasStartedPlay) return;
    const t = window.setTimeout(() => {
      trackGameEvent("play_60s", { game: "poople-unlimited", mode: tab });
    }, 60_000);
    return () => window.clearTimeout(t);
  }, [hasStartedPlay, tab]);

  const handlePipeDiscovery = (label: string) => {
    setLatestDiscovery(label);
    setDiscoveredPipes((prev) => (prev.includes(label) ? prev : [...prev, label]));
  };

  useEffect(() => {
    if (!latestDiscovery) return;
    const t = window.setTimeout(() => setLatestDiscovery(null), 3200);
    return () => window.clearTimeout(t);
  }, [latestDiscovery]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hintMode, setHintMode] = useState<"none" | "letter" | "word">("none");
  const [revealedDailyAnswer, setRevealedDailyAnswer] = useState<boolean>(false);
  const [copiedQuickInvite, setCopiedQuickInvite] = useState<boolean>(false);
  const [friendChallengeSteps, setFriendChallengeSteps] = useState<number | null>(null);

  // Solver state
  const [solverStart, setSolverStart] = useState<string>("PLAN");
  const [solverTarget, setSolverTarget] = useState<string>("POOP");

  const submitWordRef = useRef<(rawWord: string) => void>(() => {});
  const inputWordRef = useRef<string>("");
  useEffect(() => {
    inputWordRef.current = inputWord;
  }, [inputWord]);

  const streak = useSyncExternalStore(
    subscribePoopleStreak,
    getClientPoopleStreak,
    getServerPoopleStreak,
  );
  const soundOn = useSyncExternalStore(
    subscribeSound,
    getClientSound,
    getTrueServer,
  );

  // Decode ?challenge= friend word ladder challenge on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const decoded = decodePoopleChallenge(params.get("challenge"));
    if (!decoded || !WORD_SET.has(decoded.w)) return;
    queueMicrotask(() => {
      setTab("unlimited");
      setStartWord(decoded.w);
      setChain([decoded.w]);
      setInputWord("");
      setErrorMsg(null);
      setHintMode("none");
      setFriendChallengeSteps(typeof decoded.s === "number" ? decoded.s : null);
    });
  }, []);

  const activeDailyBoard = useMemo(
    () =>
      poopleData.dailyBoards.find((b) => b.date === selectedDailyDate) ?? latestDaily,
    [latestDaily, selectedDailyDate],
  );

  const currentWord = chain[chain.length - 1] ?? startWord;
  const solved = currentWord === "POOP";
  const stepsTaken = chain.length - 1;

  const optimalFromStart = useMemo(
    () => findShortestLadder(startWord, "POOP") ?? [startWord, "POOP"],
    [startWord],
  );
  const optimalFromCurrent = useMemo(
    () => (solved ? [currentWord] : findShortestLadder(currentWord, "POOP")),
    [currentWord, solved],
  );

  const parSteps = Math.max(1, optimalFromStart.length - 1);

  const solverResult = useMemo(() => {
    const s = solverStart.trim().toUpperCase();
    const t = (solverTarget.trim() || "POOP").toUpperCase();
    if (s.length !== 4 || t.length !== 4) {
      return { error: "Enter valid 4-letter English words.", path: null as string[] | null };
    }
    if (!WORD_SET.has(s)) {
      return {
        error: `"${s}" is outside the verified 1,596-word Poople bridge dictionary.`,
        path: null,
      };
    }
    if (!WORD_SET.has(t)) {
      return {
        error: `"${t}" is outside the verified 1,596-word Poople bridge dictionary.`,
        path: null,
      };
    }
    const path = findShortestLadder(s, t);
    return { error: path ? null : "No 1-letter ladder found.", path };
  }, [solverStart, solverTarget]);

  const startRound = (word: string, nextTab: "unlimited" | "daily" = tab === "solver" ? "unlimited" : tab) => {
    setTab(nextTab);
    setStartWord(word);
    setChain([word]);
    setInputWord("");
    setErrorMsg(null);
    setHintMode("none");
    setFriendChallengeSteps(null);
  };

  const pickRandomStarter = () => {
    const pool = PRESET_STARTERS.filter((w) => w !== startWord);
    const chosen = pool[Math.floor(Math.random() * pool.length)] ?? "STAR";
    startRound(chosen, "unlimited");
  };

  const switchToTab = (nextTab: "unlimited" | "daily" | "solver") => {
    setTab(nextTab);
    setErrorMsg(null);
    setHintMode("none");
    setFriendChallengeSteps(null);
    if (nextTab === "daily") {
      setStartWord(activeDailyBoard.startWord);
      setChain([activeDailyBoard.startWord]);
      setInputWord("");
      setRevealedDailyAnswer(false);
    } else if (nextTab === "unlimited" && tab === "daily") {
      startRound("COLD", "unlimited");
    }
  };

  const handleSelectDailyDate = (dateStr: string) => {
    setSelectedDailyDate(dateStr);
    const board =
      poopleData.dailyBoards.find((b) => b.date === dateStr) ?? latestDaily;
    setTab("daily");
    setStartWord(board.startWord);
    setChain([board.startWord]);
    setInputWord("");
    setErrorMsg(null);
    setHintMode("none");
    setRevealedDailyAnswer(false);
    setFriendChallengeSteps(null);
  };

  const submitWord = (rawWord: string) => {
    if (solved) return;
    const cand = rawWord.trim().toUpperCase();
    setTypingPulse((n) => n + 1);
    if (cand.length !== 4) {
      playInvalidOrTimeoutSound();
      setErrorMsg("Enter a 4-letter English word.");
      return;
    }
    if (cand === currentWord) {
      playInvalidOrTimeoutSound();
      setErrorMsg("Change exactly 1 letter from the current word.");
      return;
    }
    if (chain.includes(cand)) {
      playInvalidOrTimeoutSound();
      setErrorMsg(`"${cand}" is already in your current ladder.`);
      return;
    }
    const diffs = diffPositions(currentWord, cand);
    if (diffs.length !== 1) {
      playInvalidOrTimeoutSound();
      setErrorMsg(`Must change strictly 1 letter from ${currentWord} (you changed ${diffs.length}).`);
      return;
    }
    if (!WORD_SET.has(cand)) {
      playInvalidOrTimeoutSound();
      setErrorMsg(`"${cand}" was not found in our 1,596-word Poople dictionary.`);
      return;
    }

    const nextChain = [...chain, cand];
    if (chain.length === 1) {
      setHasStartedPlay(true);
      trackGameEvent("game_start", { game: "poople-unlimited", mode: tab });
    }
    trackGameEvent("answer_submit", {
      game: "poople-unlimited",
      mode: tab,
      step: nextChain.length - 1,
      word: cand,
    });
    setChain(nextChain);
    setInputWord("");
    setErrorMsg(null);
    setHintMode("none");

    if (cand === "POOP") {
      playVictorySound();
      trackGameEvent("game_complete", {
        game: "poople-unlimited",
        mode: tab,
        steps: nextChain.length - 1,
        par: parSteps,
      });
      try {
        const nextStreak = streak + 1;
        window.localStorage.setItem(POOPLE_STREAK_STORAGE_KEY, String(nextStreak));
        window.dispatchEvent(new Event("anykrillion-poople-streak"));
      } catch {
        // ignore storage errors
      }
      import("canvas-confetti")
        .then((mod) => {
          mod.default({
            particleCount: 65,
            spread: 60,
            origin: { y: 0.65 },
          });
        })
        .catch(() => {});
    } else {
      playLockInSound();
    }
  };

  useEffect(() => {
    submitWordRef.current = submitWord;
  });

  // Physical keyboard listener (works seamlessly alongside the built-in QWERTY keyboard)
  useEffect(() => {
    if (tab === "solver" || solved) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const activeTag = document.activeElement?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") {
        return;
      }
      if (/^[a-zA-Z]$/.test(e.key)) {
        const upper = e.key.toUpperCase();
        setInputWord((prev) => (prev.length < 4 ? prev + upper : prev));
        setTypingPulse((n) => n + 1);
        setErrorMsg(null);
      } else if (e.key === "Backspace") {
        setInputWord((prev) => prev.slice(0, -1));
        setErrorMsg(null);
      } else if (e.key === "Enter") {
        e.preventDefault();
        submitWordRef.current(inputWordRef.current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [solved, tab]);

  const handleKeyTap = (key: string) => {
    if (solved) return;
    if (key === "ENTER") {
      submitWord(inputWord);
    } else if (key === "⌫") {
      setInputWord((prev) => prev.slice(0, -1));
      setErrorMsg(null);
    } else {
      setInputWord((prev) => (prev.length < 4 ? prev + key : prev));
      setTypingPulse((n) => n + 1);
      setErrorMsg(null);
    }
  };

  const handleUndo = () => {
    if (chain.length <= 1 || solved) return;
    setChain(chain.slice(0, -1));
    setErrorMsg(null);
    setHintMode("none");
  };

  const poopleChallengeUrl = useMemo(() => {
    const token = encodePoopleChallenge({
      w: startWord,
      t: "POOP",
      s: solved ? stepsTaken : undefined,
    });
    const baseUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}`
        : "https://anykrillion.com/poople-unlimited/";
    return `${baseUrl}?challenge=${token}`;
  }, [solved, startWord, stepsTaken]);

  const emojiSteps = chain
    .slice(1)
    .map((word, idx) => {
      const prev = chain[idx];
      return Array.from({ length: 4 }, (_, pos) => {
        if (word[pos] === "POOP"[pos]) return "🟩";
        if (word[pos] !== prev[pos]) return "🟨";
        return "⬛";
      }).join("");
    })
    .join("\n");

  const modeLabel =
    tab === "daily" ? `Daily Poople #${activeDailyBoard.dayNumber}` : `Poople Unlimited`;
  const poopleShareText = solved
    ? `I solved ${modeLabel} (${startWord} → POOP) in ${stepsTaken} steps (Par ${parSteps})! Can you beat me?`
    : `Play this 4-letter Word Ladder with me on AnyKrillion: turn ${startWord} into POOP!`;
  const poopleFullCopyText = `${modeLabel} (${startWord} → POOP) • ${stepsTaken} steps (Par ${parSteps})\n${emojiSteps}\nChallenge link: ${poopleChallengeUrl}`;
  const poopleDiscordText = `🦆 **${modeLabel}** (\`${startWord}\` → \`POOP\`) · **${stepsTaken} steps** (Par ${parSteps})\n${emojiSteps}\n⚔️ Beat my board:\n${poopleChallengeUrl}`;
  const poopleTileRows: Array<Array<"match" | "changed" | "same">> = chain
    .slice(1)
    .map((word, idx) => {
      const prev = chain[idx];
      return Array.from({ length: 4 }, (_, pos) => {
        if (word[pos] === "POOP"[pos]) return "match";
        if (word[pos] !== prev[pos]) return "changed";
        return "same";
      });
    });
  const poopleCardSpec: ScoreCardSpec = {
    kind: "poople",
    gameTitle: "POOPLE UNLIMITED",
    modeBadge: tab === "daily" ? `DAILY #${activeDailyBoard.dayNumber}` : "UNLIMITED",
    startWord,
    targetWord: "POOP",
    stepsTaken,
    parSteps,
    tileRows: poopleTileRows,
  };
  const poopleCardFilename = `poople-${startWord.toLowerCase()}-to-poop.png`;

  const handleQuickInvite = async () => {
    trackGameEvent("share_click", { channel: "quick_invite", game: "poople-unlimited" });
    try {
      await navigator.clipboard.writeText(poopleChallengeUrl);
      setCopiedQuickInvite(true);
      window.setTimeout(() => setCopiedQuickInvite(false), 2000);
    } catch {
      // ignore
    }
  };

  const nextHintWord = optimalFromCurrent && optimalFromCurrent.length > 1 ? optimalFromCurrent[1] : null;
  const nextHintPos = nextHintWord ? diffPositions(currentWord, nextHintWord)[0] : null;

  return (
    <section
      aria-label="Interactive Poople Pipeworks Game World"
      className="relative min-h-[620px] w-full overflow-hidden border-y border-emerald-400/25 sm:rounded-3xl sm:border"
    >
      <PooplePipeScene
        stepsTaken={stepsTaken}
        parSteps={parSteps}
        solved={solved}
        typingPulse={typingPulse}
        onDiscovery={handlePipeDiscovery}
      >
      <div className="flex flex-col gap-2">
      {/* Top Bar: Mode Switcher + Stats */}
      <div className="pointer-events-auto flex flex-col gap-2 border-b border-white/10 pb-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:pb-4">
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
          <button
            type="button"
            onClick={() => switchToTab("unlimited")}
            className={`inline-flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-extrabold transition sm:px-3.5 sm:py-2 sm:text-sm ${
              tab === "unlimited"
                ? "bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                : "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
            }`}
          >
            <InfinityIcon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="truncate sm:hidden">Unlimited</span>
            <span className="hidden sm:inline">Poople Unlimited</span>
          </button>

          <button
            type="button"
            onClick={() => switchToTab("daily")}
            className={`inline-flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-extrabold transition sm:px-3.5 sm:py-2 sm:text-sm ${
              tab === "daily"
                ? "bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                : "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="truncate sm:hidden">Daily #{latestDaily.dayNumber}</span>
            <span className="hidden sm:inline">Today&apos;s Poople (#{latestDaily.dayNumber})</span>
          </button>

          <button
            type="button"
            onClick={() => switchToTab("solver")}
            className={`inline-flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-extrabold transition sm:px-3.5 sm:py-2 sm:text-sm ${
              tab === "solver"
                ? "bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                : "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
            }`}
          >
            <Search className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="truncate sm:hidden">Solver</span>
            <span className="hidden sm:inline">Word Ladder Solver</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px] sm:justify-end sm:text-xs">
          <span className="inline-flex items-center gap-1 rounded-lg border border-amber-400/25 bg-amber-500/10 px-2 py-1 font-bold text-amber-200 sm:px-2.5 sm:py-1.5">
            <Flame className="h-3.5 w-3.5" />
            Streak: {streak}
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundOn)}
              aria-label={soundOn ? "Mute sound" : "Enable sound"}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 font-semibold transition sm:px-2.5 sm:py-1.5 ${
                soundOn
                  ? "border-cyan-400/35 bg-cyan-500/15 text-cyan-200"
                  : "border-white/15 bg-white/5 text-slate-400"
              }`}
            >
              {soundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleQuickInvite}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-500/15 px-2 py-1 font-bold text-amber-200 transition hover:bg-amber-500/25 sm:px-2.5 sm:py-1.5"
              title="Copy Challenge Link for this starting word"
            >
              {copiedQuickInvite ? <Check className="h-3.5 w-3.5" /> : <Swords className="h-3.5 w-3.5" />}
              {copiedQuickInvite ? "Copied!" : "PK Friend"}
            </button>
          </div>
        </div>
      </div>

      {friendChallengeSteps !== null && tab !== "solver" && (
        <div className="pointer-events-auto mt-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-400/50 bg-amber-500/20 backdrop-blur-sm px-4 py-2.5 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-bold text-amber-100">
            <Swords className="h-4 w-4 text-amber-300" />
            <span>
              Friend Challenge Active: Morph{" "}
              <strong className="font-mono text-white">{startWord}</strong> →{" "}
              <strong className="font-mono text-amber-300">POOP</strong> in{" "}
              <strong>{friendChallengeSteps} steps or fewer!</strong>
            </span>
          </div>
          <span className="font-mono text-xs font-extrabold text-amber-300">
            Your Steps: {stepsTaken}
          </span>
        </div>
      )}

      {/* Mode 3: Shortest-Path BFS Solver */}
      </div>

      <div className="my-3 flex w-full max-w-3xl flex-col gap-3 self-center">
      {tab === "solver" ? (
        <div className="mt-6 space-y-5">
          <div data-hud-interactive className="pointer-events-auto rounded-2xl border border-emerald-400/30 bg-[#03191a]/45 p-4 backdrop-blur-[2px] sm:p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Instant Breadth-First Search Solver
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Type any valid 4-letter word to compute the guaranteed minimum-step ladder to{" "}
              <strong className="text-amber-300">POOP</strong> (or customize your destination word).
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="poople-solver-start"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-400"
                >
                  Starting 4-Letter Word
                </label>
                <input
                  id="poople-solver-start"
                  type="text"
                  maxLength={4}
                  value={solverStart}
                  onChange={(e) => setSolverStart(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase())}
                  placeholder="PLAN"
                  className="mt-1.5 w-full rounded-xl border border-emerald-400/35 bg-[#021215]/75 px-4 py-2.5 font-mono text-lg font-black uppercase tracking-widest text-white outline-none focus:border-cyan-300"
                />
              </div>

              <div>
                <label
                  htmlFor="poople-solver-target"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-400"
                >
                  Target Word (Default: POOP)
                </label>
                <input
                  id="poople-solver-target"
                  type="text"
                  maxLength={4}
                  value={solverTarget}
                  onChange={(e) => setSolverTarget(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase())}
                  placeholder="POOP"
                  className="mt-1.5 w-full rounded-xl border border-amber-400/35 bg-[#021215]/75 px-4 py-2.5 font-mono text-lg font-black uppercase tracking-widest text-amber-200 outline-none focus:border-amber-300"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-400">Quick Examples:</span>
              {["STAR", "COLD", "WARM", "GOAL", "GAME", "DIVE", "WORK", "LOVE"].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setSolverStart(ex);
                    setSolverTarget("POOP");
                  }}
                  className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 font-mono font-bold text-slate-200 hover:border-cyan-400/40 hover:text-cyan-200"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {solverResult.error ? (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {solverResult.error}
            </div>
          ) : solverResult.path ? (
            <div className="rounded-2xl border border-emerald-400/35 bg-emerald-950/20 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-emerald-200">
                  Optimal Path Found in {solverResult.path.length - 1}{" "}
                  {solverResult.path.length - 1 === 1 ? "Step" : "Steps"}
                </p>
                <button
                  type="button"
                  onClick={() => startRound(solverResult.path![0], "unlimited")}
                  className="rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-500/25"
                >
                  Play This Start Word Instead
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {solverResult.path.map((w, idx) => (
                  <div key={`${w}-${idx}`} className="flex items-center gap-2">
                    <div className="flex gap-1 rounded-xl border border-emerald-300/25 bg-[#021316]/65 px-2.5 py-2">
                      {w.split("").map((ch, cIdx) => {
                        const prev = idx > 0 ? solverResult.path![idx - 1] : null;
                        const changed = prev && prev[cIdx] !== ch;
                        const matchesTarget = ch === (solverTarget || "POOP")[cIdx];
                        return (
                          <span
                            key={cIdx}
                            className={`flex h-8 w-7 items-center justify-center rounded-md font-mono text-base font-black ${
                              w === (solverTarget || "POOP")
                                ? "bg-emerald-500/30 text-emerald-200 ring-1 ring-emerald-400/50"
                                : changed
                                  ? "bg-amber-400/25 text-amber-200 ring-1 ring-amber-400/50"
                                  : matchesTarget
                                    ? "bg-cyan-500/20 text-cyan-200"
                                    : "bg-white/5 text-slate-200"
                            }`}
                          >
                            {ch}
                          </span>
                        );
                      })}
                    </div>
                    {idx < solverResult.path!.length - 1 && (
                      <span className="font-mono text-sm font-bold text-slate-500">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* Mode 1 & 2: Playable Unlimited & Daily Poople Board */
        <div className="mt-6 space-y-5">
          {tab === "daily" && (
            <div data-hud-interactive className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/30 bg-[#03191a]/45 px-4 py-2.5 backdrop-blur-[2px]">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Daily Poople Challenge #{activeDailyBoard.dayNumber} · {activeDailyBoard.date}
                </p>
                <p className="text-xs text-slate-300">
                  Start word: <strong className="font-mono text-white">{activeDailyBoard.startWord}</strong>{" "}
                  • Target: <strong className="font-mono text-amber-300">POOP</strong> • Par:{" "}
                  <strong className="text-emerald-200">{activeDailyBoard.optimalSteps} steps</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Select daily Poople archive board"
                  value={selectedDailyDate}
                  onChange={(e) => handleSelectDailyDate(e.target.value)}
                  className="rounded-xl border border-emerald-300/25 bg-[#021316]/65 px-3 py-1.5 text-xs font-semibold text-slate-100 outline-none focus:border-emerald-400"
                >
                  {[...poopleData.dailyBoards].reverse().map((b) => (
                    <option key={b.date} value={b.date}>
                      #{b.dayNumber} · {b.date} ({b.startWord} → POOP)
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setRevealedDailyAnswer((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25"
                >
                  {revealedDailyAnswer ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {revealedDailyAnswer ? "Hide Answer" : "Show Daily Answer"}
                </button>
              </div>
            </div>
          )}

          {tab === "daily" && revealedDailyAnswer && (
            <div data-hud-interactive className="pointer-events-auto rounded-2xl border border-amber-400/35 bg-amber-950/40 px-4 py-2.5 text-sm text-amber-100 backdrop-blur-[2px]">
              <span className="font-bold text-amber-300">
                Daily Poople #{activeDailyBoard.dayNumber} Optimal Solution ({activeDailyBoard.optimalSteps} steps):{" "}
              </span>
              <span className="font-mono font-bold tracking-wide">
                {activeDailyBoard.optimalPath.join(" → ")}
              </span>
            </div>
          )}

          {/* Single Unified HUD Bar (flattened for visual clarity) */}
          <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl bg-[#03191a]/40 px-3 py-2 backdrop-blur-[2px] sm:px-4 sm:py-2.5">
            <div className="flex items-center gap-2 font-mono text-base font-black sm:text-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Goal</span>
              <span className="text-white">{currentWord}</span>
              <span className="text-xs text-slate-500">→</span>
              <span className="text-amber-300">POOP</span>
            </div>

            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-base font-black text-cyan-200 sm:text-xl">
                {stepsTaken} <span className="text-xs font-bold">{stepsTaken === 1 ? "step" : "steps"}</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-300">
                Par: {parSteps}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={pickRandomStarter}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-200 hover:bg-amber-500/30"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                New Word
              </button>
              <button
                type="button"
                onClick={() => startRound(startWord, tab === "daily" ? "daily" : "unlimited")}
                className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-white/15"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Vertical Centered 4-Letter Ladder Stack + Tactile QWERTY Keyboard */}
          <div data-hud-interactive className="pointer-events-auto rounded-2xl bg-[#03191a]/40 p-3 backdrop-blur-[2px] sm:p-5">
            <div className="flex flex-col items-center gap-1.5">
              {chain.map((word, idx) => (
                <div key={`${word}-${idx}`} className="flex items-center gap-2">
                  <span className="w-5 text-right font-mono text-[10px] font-bold text-slate-500">
                    {idx === 0 ? "0" : idx}
                  </span>
                  <div className="flex gap-1.5">
                    {word.split("").map((letter, pos) => {
                      const matchesTarget = letter === "POOP"[pos];
                      const isChangedFromPrev = idx > 0 && letter !== chain[idx - 1][pos];
                      return (
                        <span
                          key={pos}
                          className={`flex h-10 w-10 items-center justify-center rounded-lg font-mono text-base font-black transition sm:h-11 sm:w-11 sm:text-lg ${
                            matchesTarget
                              ? "bg-emerald-500/35 text-emerald-100 ring-1 ring-emerald-400/70 shadow-[0_0_10px_rgba(52,211,153,0.2)]"
                              : isChangedFromPrev
                                ? "bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/65"
                                : "border border-white/10 bg-[#021316]/85 text-white"
                          }`}
                        >
                          {letter}
                        </span>
                      );
                    })}
                  </div>
                  <span className="w-5" aria-hidden="true" />
                </div>
              ))}

              {!solved && (
                <div className="flex items-center gap-2">
                  <span className="w-5 text-right font-mono text-[10px] font-bold text-amber-400/80">
                    →
                  </span>
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3].map((pos) => {
                      const ch = inputWord[pos];
                      const isCursor = pos === inputWord.length;
                      return (
                        <span
                          key={pos}
                          className={`flex h-10 w-10 items-center justify-center rounded-lg font-mono text-base font-black transition sm:h-11 sm:w-11 sm:text-lg ${
                            ch
                              ? "border border-amber-300/75 bg-[#042327] text-white"
                              : isCursor
                                ? "border-2 border-amber-400 bg-[#021316]/75 text-amber-300 animate-pulse"
                                : "border border-dashed border-amber-400/35 bg-[#021316]/45 text-amber-300/40"
                          }`}
                        >
                          {ch ?? "?"}
                        </span>
                      );
                    })}
                  </div>
                  <span className="w-5" aria-hidden="true" />
                </div>
              )}
            </div>

            {solved ? (
              <div className="mt-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-400/40 bg-emerald-950/30 p-4">
                  <div>
                    <p className="text-base font-extrabold text-emerald-200">
                      Reached POOP in {stepsTaken} {stepsTaken === 1 ? "step" : "steps"}!
                      {friendChallengeSteps !== null && (
                        <span className="ml-2 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-xs text-amber-200">
                          {stepsTaken < friendChallengeSteps
                            ? `Beat friend's ${friendChallengeSteps} steps!`
                            : stepsTaken === friendChallengeSteps
                              ? `Tied friend (${friendChallengeSteps} steps)!`
                              : `Friend's score: ${friendChallengeSteps} steps`}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-300">
                      Optimal par from {startWord}: {parSteps} steps (
                      <span className="font-mono text-emerald-200">
                        {optimalFromStart.join(" → ")}
                      </span>
                      )
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={pickRandomStarter}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-extrabold text-slate-950 hover:brightness-110"
                  >
                    <InfinityIcon className="h-3.5 w-3.5" />
                    Next Random Word
                  </button>
                </div>

                <div data-hud-interactive className="pointer-events-auto"><ShareChallengePanel
                  variant="summary"
                  accent="amber"
                  challengeUrl={poopleChallengeUrl}
                  shareText={poopleShareText}
                  shareTitle={`${modeLabel}: ${startWord} → POOP in ${stepsTaken} steps`}
                  fullResultCopyText={poopleFullCopyText}
                  discordCopyText={poopleDiscordText}
                  scoreCardSpec={poopleCardSpec}
                  scoreCardFilename={poopleCardFilename}
                /></div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {/* Action Row: Undo, Progressive Hint, Solver */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={chain.length <= 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-40"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                    Undo
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setHintMode((prev) =>
                        prev === "none" ? "letter" : prev === "letter" ? "word" : "none",
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    {hintMode === "none"
                      ? "Hint"
                      : hintMode === "letter"
                        ? "Next Word"
                        : "Hide Hint"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSolverStart(currentWord);
                      setSolverTarget("POOP");
                      setTab("solver");
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    Solve ({currentWord})
                  </button>
                </div>

                {errorMsg && (
                  <p className="mx-auto max-w-md rounded-xl border border-rose-500/35 bg-rose-500/15 px-3 py-1.5 text-center text-xs font-medium text-rose-200">
                    {errorMsg}
                  </p>
                )}

                {hintMode === "letter" && nextHintPos !== null && (
                  <p className="mx-auto max-w-md rounded-lg border border-cyan-400/30 bg-cyan-950/50 px-3 py-1.5 text-center text-xs text-cyan-200">
                    Optimal Hint: Change letter <strong>#{nextHintPos + 1}</strong> (currently{" "}
                    <code>{currentWord[nextHintPos]}</code>)
                  </p>
                )}

                {hintMode === "word" && nextHintWord && (
                  <p className="mx-auto max-w-md rounded-lg border border-amber-400/35 bg-amber-950/50 px-3 py-1.5 text-center text-xs text-amber-200">
                    Optimal Next Rung:{" "}
                    <button
                      type="button"
                      onClick={() => setInputWord(nextHintWord)}
                      className="font-mono font-bold underline"
                    >
                      {nextHintWord}
                    </button>{" "}
                    ({optimalFromCurrent ? optimalFromCurrent.length - 1 : "?"} steps left)
                  </p>
                )}

                {/* Built-In Tactile 3-Row QWERTY Keyboard */}
                <div
                  className="mx-auto flex w-full max-w-lg flex-col gap-1.5 pt-1"
                  role="group"
                  aria-label="On-screen word ladder keyboard"
                >
                  <div className="grid grid-cols-10 gap-1">
                    {QWERTY_ROWS[0].map((key) => {
                      const isGoalKey = key === "P" || key === "O";
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleKeyTap(key)}
                          className={`flex h-10 items-center justify-center rounded-lg border font-mono text-xs font-extrabold transition active:scale-95 sm:h-11 sm:text-sm ${
                            isGoalKey
                              ? "border-emerald-400/45 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                              : "border-white/15 bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          {key}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mx-auto grid w-[92%] grid-cols-9 gap-1">
                    {QWERTY_ROWS[1].map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleKeyTap(key)}
                        className="flex h-10 items-center justify-center rounded-lg border border-white/15 bg-white/10 font-mono text-xs font-extrabold text-white transition hover:bg-white/20 active:scale-95 sm:h-11 sm:text-sm"
                      >
                        {key}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-[1.6fr_repeat(7,1fr)_1.4fr] gap-1">
                    {QWERTY_ROWS[2].map((key) => {
                      const isEnter = key === "ENTER";
                      const isBack = key === "⌫";
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleKeyTap(key)}
                          aria-label={isBack ? "Backspace" : isEnter ? "Submit step" : key}
                          className={`flex h-10 items-center justify-center rounded-lg border font-mono font-extrabold transition active:scale-95 sm:h-11 ${
                            isEnter
                              ? "border-amber-300 bg-amber-400 text-[10px] text-slate-950 hover:brightness-110 sm:text-xs"
                              : isBack
                                ? "border-rose-400/40 bg-rose-500/15 text-sm text-rose-200 hover:bg-rose-500/25"
                                : "border-white/15 bg-white/10 text-xs text-white hover:bg-white/20 sm:text-sm"
                          }`}
                        >
                          {key}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preset Quick-Start Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400">Quick Starters:</span>
            {["STAR", "COLD", "WARM", "GOAL", "PLAY", "FISH", "BOOK", "WORK"].map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => startRound(word, "unlimited")}
                className={`rounded-lg border px-2.5 py-1 font-mono font-bold transition ${
                  startWord === word && tab === "unlimited"
                    ? "border-amber-400 bg-amber-400/20 text-amber-200"
                    : "border-white/15 bg-white/5 text-slate-300 hover:border-amber-400/40"
                }`}
              >
                {word} → POOP
              </button>
            ))}
          </div>

          <div data-hud-interactive className="pointer-events-auto"><ShareChallengePanel
            variant="inline"
            accent="amber"
            challengeUrl={poopleChallengeUrl}
            shareText={poopleShareText}
            shareTitle={`${modeLabel}: ${startWord} → POOP Challenge`}
          /></div>
        </div>
      )}
      </div>

      {/* Bottom Pipeworks Interactive Discovery & Scroll Anchor Ticker */}
      <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-slate-300/85">
        {latestDiscovery ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300/45 bg-amber-500/20 px-2 py-0.5 text-amber-200 backdrop-blur-sm">
            <span>✦</span>
            <span>{latestDiscovery}</span>
          </span>
        ) : (
          <span className="truncate">
            <strong className="text-emerald-300">PIPEWORKS MATRIX</strong>
            <span className="hidden sm:inline text-slate-300/75">
              {" "}· 1 letter per rung toward POOP · Click pipes or golden bubbles to scan
            </span>
            {discoveredPipes.length > 0 && (
              <span className="ml-1.5 text-amber-300">· {discoveredPipes.length} scanned</span>
            )}
          </span>
        )}
        <a href="#poople-guide" className="pointer-events-auto shrink-0 text-emerald-300/90 hover:text-white">
          SOLVER &amp; RULES ↓
        </a>
      </div>
      </PooplePipeScene>
    </section>
  );
}