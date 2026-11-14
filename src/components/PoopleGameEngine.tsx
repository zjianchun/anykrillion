"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
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
  Share2,
  Sparkles,
  Undo2,
} from "lucide-react";
import poopleDataRaw from "@/data/poople_words.json";

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hintMode, setHintMode] = useState<"none" | "letter" | "word">("none");
  const [revealedDailyAnswer, setRevealedDailyAnswer] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Solver state
  const [solverStart, setSolverStart] = useState<string>("PLAN");
  const [solverTarget, setSolverTarget] = useState<string>("POOP");

  const inputRef = useRef<HTMLInputElement>(null);

  const streak = useSyncExternalStore(
    subscribePoopleStreak,
    getClientPoopleStreak,
    getServerPoopleStreak,
  );

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
    setCopiedShare(false);
    inputRef.current?.focus();
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
    setCopiedShare(false);
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
    setCopiedShare(false);
  };

  const handleSubmitStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (solved) return;
    const cand = inputWord.trim().toUpperCase();
    if (cand.length !== 4) {
      setErrorMsg("Enter a 4-letter English word.");
      return;
    }
    if (cand === currentWord) {
      setErrorMsg("Change exactly 1 letter from the current word.");
      return;
    }
    if (chain.includes(cand)) {
      setErrorMsg(`"${cand}" is already in your current ladder.`);
      return;
    }
    const diffs = diffPositions(currentWord, cand);
    if (diffs.length !== 1) {
      setErrorMsg(`Must change strictly 1 letter from ${currentWord} (you changed ${diffs.length}).`);
      return;
    }
    if (!WORD_SET.has(cand)) {
      setErrorMsg(`"${cand}" was not found in our 1,596-word Poople dictionary.`);
      return;
    }

    const nextChain = [...chain, cand];
    setChain(nextChain);
    setInputWord("");
    setErrorMsg(null);
    setHintMode("none");

    if (cand === "POOP") {
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
    }
  };

  const handleUndo = () => {
    if (chain.length <= 1 || solved) return;
    setChain(chain.slice(0, -1));
    setErrorMsg(null);
    setHintMode("none");
  };

  const handleCopyShare = async () => {
    const modeLabel =
      tab === "daily" ? `Daily Poople #${activeDailyBoard.dayNumber}` : `Poople Unlimited`;
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
    const text = `${modeLabel} (${startWord} → POOP) • ${stepsTaken} steps (Par ${parSteps})\n${emojiSteps}\nPlay at https://anykrillion.com/poople-unlimited/`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedShare(true);
      window.setTimeout(() => setCopiedShare(false), 2200);
    } catch {
      // ignore clipboard errors
    }
  };

  const nextHintWord = optimalFromCurrent && optimalFromCurrent.length > 1 ? optimalFromCurrent[1] : null;
  const nextHintPos = nextHintWord ? diffPositions(currentWord, nextHintWord)[0] : null;

  return (
    <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-b from-[#0b1b32] via-[#061528] to-[#030e1c] p-5 shadow-[0_0_50px_rgba(245,158,11,0.1)] sm:p-7">
      {/* Top Bar: Mode Switcher + Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => switchToTab("unlimited")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition sm:text-sm ${
              tab === "unlimited"
                ? "bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                : "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
            }`}
          >
            <InfinityIcon className="h-4 w-4" />
            Poople Unlimited
          </button>

          <button
            type="button"
            onClick={() => switchToTab("daily")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition sm:text-sm ${
              tab === "daily"
                ? "bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                : "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Today&apos;s Poople (#{latestDaily.dayNumber})
          </button>

          <button
            type="button"
            onClick={() => switchToTab("solver")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition sm:text-sm ${
              tab === "solver"
                ? "bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                : "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
            }`}
          >
            <Search className="h-4 w-4" />
            Word Ladder Solver
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-lg border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 font-bold text-amber-200">
            <Flame className="h-3.5 w-3.5" />
            Streak: {streak}
          </span>
          <span className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-slate-300">
            1,596 words
          </span>
        </div>
      </div>

      {/* Mode 3: Shortest-Path BFS Solver */}
      {tab === "solver" ? (
        <div className="mt-6 space-y-5">
          <div className="rounded-2xl border border-cyan-500/25 bg-black/30 p-5">
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
                  className="mt-1.5 w-full rounded-xl border border-cyan-400/35 bg-[#041222] px-4 py-3 font-mono text-lg font-black uppercase tracking-widest text-white outline-none focus:border-cyan-300"
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
                  className="mt-1.5 w-full rounded-xl border border-amber-400/35 bg-[#041222] px-4 py-3 font-mono text-lg font-black uppercase tracking-widest text-amber-200 outline-none focus:border-amber-300"
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
                    <div className="flex gap-1 rounded-xl border border-white/15 bg-[#041425] px-2.5 py-2">
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
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-950/20 px-4 py-3">
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
                  className="rounded-xl border border-white/15 bg-[#041425] px-3 py-1.5 text-xs font-semibold text-slate-100 outline-none focus:border-emerald-400"
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
            <div className="rounded-2xl border border-amber-400/35 bg-amber-950/25 px-4 py-3 text-sm text-amber-100">
              <span className="font-bold text-amber-300">
                Daily Poople #{activeDailyBoard.dayNumber} Optimal Solution ({activeDailyBoard.optimalSteps} steps):{" "}
              </span>
              <span className="font-mono font-bold tracking-wide">
                {activeDailyBoard.optimalPath.join(" → ")}
              </span>
            </div>
          )}

          {/* HUD Strip */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Current Rung → Goal
              </span>
              <div className="mt-1 flex items-center justify-between font-mono text-2xl font-black">
                <span className="text-white">{currentWord}</span>
                <span className="text-sm text-slate-500">→</span>
                <span className="text-amber-300">POOP</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Steps Taken vs. Par
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-black text-cyan-200">
                  {stepsTaken} {stepsTaken === 1 ? "step" : "steps"}
                </span>
                <span className="text-xs font-semibold text-emerald-300">
                  Optimal Par: {parSteps}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Starter Controls
              </span>
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={pickRandomStarter}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-amber-400/35 bg-amber-500/15 px-2.5 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-500/25"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  New Word
                </button>
                <button
                  type="button"
                  onClick={() => startRound(startWord, tab === "daily" ? "daily" : "unlimited")}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Ladder Chain Visual */}
          <div className="rounded-2xl border border-white/15 bg-black/30 p-5">
            <div className="flex flex-wrap items-center gap-2">
              {chain.map((word, idx) => (
                <div key={`${word}-${idx}`} className="flex items-center gap-2">
                  <div
                    className={`flex gap-1 rounded-xl border px-2.5 py-2 ${
                      word === "POOP"
                        ? "border-emerald-400/60 bg-emerald-500/15"
                        : idx === chain.length - 1
                          ? "border-amber-400/60 bg-amber-500/10"
                          : "border-white/15 bg-[#041425]"
                    }`}
                  >
                    {word.split("").map((letter, pos) => {
                      const matchesTarget = letter === "POOP"[pos];
                      return (
                        <span
                          key={pos}
                          className={`flex h-9 w-8 items-center justify-center rounded-md font-mono text-lg font-black ${
                            matchesTarget
                              ? "bg-emerald-500/30 text-emerald-200 ring-1 ring-emerald-400/50"
                              : "bg-white/5 text-white"
                          }`}
                        >
                          {letter}
                        </span>
                      );
                    })}
                  </div>
                  {idx < chain.length - 1 && (
                    <span className="font-mono text-sm font-bold text-slate-500">→</span>
                  )}
                </div>
              ))}
              {!solved && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-500">→</span>
                  <div className="flex gap-1 rounded-xl border border-dashed border-amber-400/40 bg-amber-500/5 px-2.5 py-2">
                    {["?", "?", "?", "?"].map((q, pos) => (
                      <span
                        key={pos}
                        className="flex h-9 w-8 items-center justify-center rounded-md font-mono text-lg font-bold text-amber-300/60"
                      >
                        {q}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {solved ? (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-400/40 bg-emerald-950/30 p-4">
                <div>
                  <p className="text-base font-extrabold text-emerald-200">
                    Reached POOP in {stepsTaken} {stepsTaken === 1 ? "step" : "steps"}!
                  </p>
                  <p className="mt-0.5 text-xs text-slate-300">
                    Optimal par from {startWord}: {parSteps} steps (
                    <span className="font-mono text-emerald-200">
                      {optimalFromStart.join(" → ")}
                    </span>
                    )
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopyShare}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-500/25"
                  >
                    {copiedShare ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                    {copiedShare ? "Copied Grid!" : "Share Ladder"}
                  </button>
                  <button
                    type="button"
                    onClick={pickRandomStarter}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-extrabold text-slate-950 hover:brightness-110"
                  >
                    <InfinityIcon className="h-3.5 w-3.5" />
                    Next Random Word
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <form onSubmit={handleSubmitStep} className="flex flex-col gap-3 sm:flex-row">
                  <input
                    ref={inputRef}
                    type="text"
                    maxLength={4}
                    value={inputWord}
                    onChange={(e) => {
                      setInputWord(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase());
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder={`Change 1 letter in ${currentWord}...`}
                    aria-label="Enter next 4-letter ladder word"
                    className="flex-1 rounded-xl border border-amber-400/40 bg-[#041426] px-4 py-3 font-mono text-lg font-black uppercase tracking-widest text-white placeholder:text-sm placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-500 focus:border-amber-300 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-3 text-sm font-extrabold text-slate-950 transition hover:brightness-110"
                  >
                    Step Ladder
                  </button>
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={chain.length <= 1}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-40"
                  >
                    <Undo2 className="h-4 w-4" />
                    Undo
                  </button>
                </form>

                {errorMsg && (
                  <p className="mt-2.5 rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-200">
                    {errorMsg}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setHintMode((prev) =>
                          prev === "none" ? "letter" : prev === "letter" ? "word" : "none",
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20"
                    >
                      <Lightbulb className="h-3.5 w-3.5" />
                      {hintMode === "none"
                        ? "Hint: Which Letter Position?"
                        : hintMode === "letter"
                          ? "Hint: Reveal Next Word"
                          : "Hide Hint"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSolverStart(currentWord);
                        setSolverTarget("POOP");
                        setTab("solver");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
                    >
                      <Compass className="h-3.5 w-3.5" />
                      Solve From {currentWord}
                    </button>
                  </div>

                  {hintMode === "letter" && nextHintPos !== null && (
                    <span className="rounded-lg border border-cyan-400/30 bg-cyan-950/40 px-3 py-1 text-xs text-cyan-200">
                      Optimal Hint: Change letter <strong>#{nextHintPos + 1}</strong> (currently{" "}
                      <code>{currentWord[nextHintPos]}</code>)
                    </span>
                  )}

                  {hintMode === "word" && nextHintWord && (
                    <span className="rounded-lg border border-amber-400/35 bg-amber-950/40 px-3 py-1 text-xs text-amber-200">
                      Optimal Next Rung:{" "}
                      <button
                        type="button"
                        onClick={() => setInputWord(nextHintWord)}
                        className="font-mono font-bold underline"
                      >
                        {nextHintWord}
                      </button>{" "}
                      ({optimalFromCurrent ? optimalFromCurrent.length - 1 : "?"} steps left)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preset Quick-Start Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400">Popular 4-Letter Ladders:</span>
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
        </div>
      )}
    </div>
  );
}
