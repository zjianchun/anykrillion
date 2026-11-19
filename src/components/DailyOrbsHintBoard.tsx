"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import confetti from "canvas-confetti";
import {
  Archive,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Gamepad2,
  Heart,
  HelpCircle,
  Lightbulb,
  Search,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import DailyOrbsSandbox, {
  ORB_HEX,
  ORB_THEME,
  orbsEarnedForPuzzle,
  type DailyOrbsProgressMap,
  type OrbPuzzleProgress,
} from "@/components/DailyOrbsSandbox";
import {
  isSoundEnabled,
  playSonarPingSound,
  playVictorySound,
  setSoundEnabled,
} from "@/lib/soundEffects";
import type {
  DailyOrbsDataset,
  DailyOrbsFormat,
  DailyOrbsHintRow,
  DailyOrbsPuzzleEntry,
  OrbColor,
} from "@/types/dailyOrbs";

type ComfortLevel = "strong" | "medium" | "skip";

const FORMAT_LABELS: Record<DailyOrbsFormat, string> = {
  bijection: "1-to-1 Matching",
  categorization: "Category Buckets",
  themed: "Themed Clues",
  "open-ended": "Open-Ended Recall",
  "long-list": "Long-List (No Heart Loss)",
  other: "Daily Puzzle",
};

const ORB_EMOJI: Record<OrbColor, string> = {
  orange: "🟠",
  purple: "🟣",
  green: "🟢",
  blue: "🔵",
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const EMPTY_PROGRESS: DailyOrbsProgressMap = {
  orange: { solvedIndices: [], heartsUsed: 0 },
  purple: { solvedIndices: [], heartsUsed: 0 },
  green: { solvedIndices: [], heartsUsed: 0 },
  blue: { solvedIndices: [], heartsUsed: 0 },
};

function formatDateHeading(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = Number(parts[0]);
  const monthIdx = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  if (!Number.isFinite(year) || monthIdx < 0 || monthIdx > 11 || !Number.isFinite(day)) {
    return dateStr;
  }
  return `${MONTHS[monthIdx]} ${day}, ${year}`;
}

function formatCountdown(targetIso: string, nowMs: number): string {
  const targetMs = Date.parse(targetIso);
  if (Number.isNaN(targetMs)) return "--h --m --s";
  let diff = targetMs - nowMs;
  while (diff <= 0) {
    diff += 24 * 60 * 60 * 1000;
  }
  const totalSec = Math.floor(diff / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return `${String(hours).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
}

function subscribeSound(callback: () => void) {
  window.addEventListener("anykrillion-sound-change", callback);
  return () => window.removeEventListener("anykrillion-sound-change", callback);
}
const getSoundServer = () => true;

function subscribeProgress(callback: () => void) {
  window.addEventListener("anykrillion-dailyorbs-progress", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("anykrillion-dailyorbs-progress", callback);
    window.removeEventListener("storage", callback);
  };
}
const getProgressServer = () => "";

function parseProgress(raw: string): DailyOrbsProgressMap {
  if (!raw) return EMPTY_PROGRESS;
  try {
    const parsed = JSON.parse(raw) as Partial<Record<OrbColor, Partial<OrbPuzzleProgress>>>;
    const norm = (c: OrbColor): OrbPuzzleProgress => ({
      solvedIndices: Array.isArray(parsed[c]?.solvedIndices)
        ? parsed[c]!.solvedIndices!.filter((n): n is number => Number.isInteger(n) && n >= 0)
        : [],
      heartsUsed:
        typeof parsed[c]?.heartsUsed === "number" && parsed[c]!.heartsUsed! >= 0
          ? Math.min(3, Math.floor(parsed[c]!.heartsUsed!))
          : 0,
    });
    return {
      orange: norm("orange"),
      purple: norm("purple"),
      green: norm("green"),
      blue: norm("blue"),
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

function writeProgress(storageKey: string, next: DailyOrbsProgressMap) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new Event("anykrillion-dailyorbs-progress"));
  } catch {
    // ignore storage quota failures
  }
}

function OrbReferenceCard({
  puzzle,
  defaultOpenHints = false,
}: {
  puzzle: DailyOrbsPuzzleEntry;
  defaultOpenHints?: boolean;
}) {
  const style = ORB_THEME[puzzle.color];
  const [tier3Open, setTier3Open] = useState(defaultOpenHints);
  const [revealedClues, setRevealedClues] = useState<Record<number, boolean>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [allAnswersOpen, setAllAnswersOpen] = useState(false);

  const toggleRowClue = (idx: number) => {
    setRevealedClues((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleRowAnswer = (idx: number) => {
    setRevealedAnswers((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleAllAnswers = () => {
    if (allAnswersOpen) {
      setAllAnswersOpen(false);
      setRevealedAnswers({});
      return;
    }
    const next: Record<number, boolean> = {};
    puzzle.rows.forEach((_, idx) => {
      next[idx] = true;
    });
    setTier3Open(true);
    setRevealedAnswers(next);
    setAllAnswersOpen(true);
  };

  const revealedCount = puzzle.rows.filter((_, idx) => allAnswersOpen || revealedAnswers[idx]).length;

  return (
    <article
      id={`orb-${puzzle.color}`}
      className={`scroll-mt-24 rounded-2xl border ${style.ring} bg-[#06192d]/85 p-5 shadow-lg sm:p-6`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${style.badge}`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
              {style.label}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">
              {FORMAT_LABELS[puzzle.format]}
            </span>
            {puzzle.topics.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-0.5 text-[11px] font-medium capitalize text-cyan-200"
              >
                {topic}
              </span>
            ))}
          </div>

          <h3 className="mt-3 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            {puzzle.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300 sm:text-base">
            {puzzle.prompt}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          <span className="rounded-lg border border-white/10 bg-[#03111f] px-2.5 py-1 text-slate-300">
            1 Orb: <strong className="text-white">{puzzle.starThresholds[0]}</strong>
          </span>
          <span className="rounded-lg border border-white/10 bg-[#03111f] px-2.5 py-1 text-slate-300">
            2 Orbs: <strong className="text-white">{puzzle.starThresholds[1]}</strong>
          </span>
          <span className="rounded-lg border border-cyan-500/25 bg-[#03111f] px-2.5 py-1 text-cyan-200">
            3 Orbs: <strong className="text-cyan-300">{puzzle.starThresholds[2]}</strong>
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {/* Level 1 */}
        <details
          open={defaultOpenHints || undefined}
          className="group rounded-xl border border-white/10 bg-[#041425] open:border-white/25"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03]">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-100">
              <Lightbulb className={`h-4 w-4 shrink-0 ${style.accentText}`} />
              <span>Hint 1: Rule &amp; Strategy Tip (Zero Spoilers)</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
          </summary>
          <div className="border-t border-white/10 px-4 py-3 text-sm leading-relaxed text-slate-300">
            {puzzle.hint1}
          </div>
        </details>

        {/* Level 2 */}
        <details
          open={defaultOpenHints || undefined}
          className="group rounded-xl border border-white/10 bg-[#041425] open:border-white/25"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03]">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-100">
              <Compass className="h-4 w-4 shrink-0 text-cyan-300" />
              <span>Hint 2: Board Breakdown + 1 Starter Anchor</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
          </summary>
          <div className="border-t border-white/10 px-4 py-3 text-sm leading-relaxed text-slate-300">
            <p>{puzzle.hint2}</p>
          </div>
        </details>

        {/* Level 3 */}
        <div className="rounded-xl border border-cyan-500/20 bg-[#041425]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-4 py-2.5">
            <span className="text-xs font-semibold text-slate-300">
              Progressive Row Clues ({revealedCount}/{puzzle.rows.length} revealed)
            </span>
            <button
              type="button"
              onClick={toggleAllAnswers}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-200 transition hover:bg-cyan-500/20"
            >
              {allAnswersOpen ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Hide All
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Reveal All Answers
                </>
              )}
            </button>
          </div>

          <details open={tier3Open} className="group">
            <summary
              onClick={(e) => {
                e.preventDefault();
                setTier3Open((v) => !v);
              }}
              className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-left text-sm font-bold text-white transition hover:bg-white/[0.03]"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 shrink-0 text-emerald-300" />
                <span>Level 3: Per-Row Clue Masks &amp; Answer Reveal</span>
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-400 transition ${tier3Open ? "rotate-180" : ""}`}
              />
            </summary>

            <div className="border-t border-white/10 px-4 pb-4 pt-3">
              {puzzle.format === "categorization" &&
                allAnswersOpen &&
                puzzle.categories &&
                puzzle.categories.length > 0 && (
                  <div className="mb-4 grid gap-3 sm:grid-cols-3">
                    {puzzle.categories.map((cat) => (
                      <div
                        key={cat.name}
                        className="rounded-xl border border-emerald-500/25 bg-[#03111f] p-3"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                          <span>{cat.name}</span>
                          <span className="font-mono">{cat.count} items</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {cat.items.map((item) => (
                            <span
                              key={item}
                              className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-200"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {puzzle.totalCount > puzzle.rows.length && (
                <p className="mb-3 text-xs text-slate-400">
                  Showing the first {puzzle.rows.length} of {puzzle.totalCount} verified targets.
                </p>
              )}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">{puzzle.columnA || "Item / Clue"}</th>
                      <th className="py-2 pr-3">Spoiler-Light Status</th>
                      <th className="py-2 text-right">Reveal Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {puzzle.rows.map((row, idx) => {
                      const showAns = allAnswersOpen || Boolean(revealedAnswers[idx]);
                      const showClue = Boolean(revealedClues[idx]);
                      return (
                        <tr key={`${row.label}-${idx}`}>
                          <td className="py-2.5 pr-3 font-mono text-xs text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 pr-3 font-medium text-slate-100">{row.label}</td>
                          <td className="py-2.5 pr-3">
                            {showAns ? (
                              <span className="inline-block rounded-md border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-200">
                                {row.answer}
                              </span>
                            ) : showClue ? (
                              <div className="space-y-1">
                                <span className="inline-block rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 font-mono text-xs text-cyan-200">
                                  {row.clueMask}
                                </span>
                                {row.patternTip && (
                                  <p className="text-[11px] text-slate-400">{row.patternTip}</p>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleRowAnswer(idx)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-200"
                              >
                                <span className="select-none blur-[3px]" aria-hidden="true">
                                  Hidden Match
                                </span>
                                <span className="text-[11px] font-semibold">Click to Unblur</span>
                              </button>
                            )}
                          </td>
                          <td className="whitespace-nowrap py-2.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => toggleRowClue(idx)}
                                className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                                  showClue && !showAns
                                    ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-100"
                                    : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
                                }`}
                              >
                                Clue
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleRowAnswer(idx)}
                                className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                                  showAns
                                    ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-100"
                                    : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                                }`}
                              >
                                {showAns ? "Hide" : "Answer"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <details className="group/ans mt-4 rounded-xl border border-emerald-500/20 bg-[#03111f] p-3 open:border-emerald-400/45">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                  <span>Spoiler-Protected Full Answer Sheet ({puzzle.title})</span>
                  <ChevronDown className="h-3.5 w-3.5 transition group-open/ans:rotate-180" />
                </summary>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {puzzle.rows.map((row, idx) => (
                    <li
                      key={`${row.label}-full-${idx}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#06192d]/60 px-3 py-1.5 text-xs"
                    >
                      <span className="text-slate-300">{row.label}</span>
                      <span className="font-bold text-emerald-200">{row.answer}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </details>
        </div>
      </div>
    </article>
  );
}

interface SearchableRowItem {
  key: string;
  color: OrbColor;
  puzzleTitle: string;
  row: DailyOrbsHintRow;
}

export default function DailyOrbsHintBoard({ dataset }: { dataset: DailyOrbsDataset }) {
  const { today, archive } = dataset;
  const storageKey = `anykrillion_dailyorbs_v2_${today.date}`;

  const [countdown, setCountdown] = useState<string>("--h --m --s");
  const [activeColor, setActiveColor] = useState<OrbColor>(today.puzzles[0]?.color || "orange");
  const [arenaTab, setArenaTab] = useState<"sandbox" | "hints">("sandbox");
  const [rescueQuery, setRescueQuery] = useState<string>("");
  const [selectedRescueKey, setSelectedRescueKey] = useState<string | null>(null);
  const [rescueStep2Open, setRescueStep2Open] = useState<boolean>(false);
  const [rescueUnblurred, setRescueUnblurred] = useState<boolean>(false);
  const [copiedGrid, setCopiedGrid] = useState<boolean>(false);

  const [comfort, setComfort] = useState<Record<OrbColor, ComfortLevel>>({
    orange: "medium",
    purple: "medium",
    green: "strong",
    blue: "medium",
  });
  const [manualPlannerOrbs, setManualPlannerOrbs] = useState<number | null>(null);

  const soundOn = useSyncExternalStore(subscribeSound, isSoundEnabled, getSoundServer);
  const rawProgress = useSyncExternalStore(
    subscribeProgress,
    () => (typeof window === "undefined" ? "" : window.localStorage.getItem(storageKey) || ""),
    getProgressServer,
  );
  const progressMap = useMemo(() => parseProgress(rawProgress), [rawProgress]);

  useEffect(() => {
    const tick = () => setCountdown(formatCountdown(today.nextRolloverUtc, Date.now()));
    const initId = window.setTimeout(tick, 0);
    const intervalId = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(initId);
      window.clearInterval(intervalId);
    };
  }, [today.nextRolloverUtc]);

  const orbCountsByColor = useMemo(() => {
    const counts: Record<OrbColor, number> = { orange: 0, purple: 0, green: 0, blue: 0 };
    today.puzzles.forEach((p) => {
      counts[p.color] = orbsEarnedForPuzzle(p, progressMap[p.color]);
    });
    return counts;
  }, [today.puzzles, progressMap]);

  const totalOrbs = useMemo(
    () =>
      today.puzzles.reduce((sum, p) => sum + orbCountsByColor[p.color], 0),
    [today.puzzles, orbCountsByColor],
  );

  const activePuzzle =
    today.puzzles.find((p) => p.color === activeColor) ?? today.puzzles[0];

  const searchableItems = useMemo<SearchableRowItem[]>(() => {
    const list: SearchableRowItem[] = [];
    today.puzzles.forEach((p) => {
      p.rows.slice(0, 20).forEach((row, idx) => {
        list.push({
          key: `${p.color}:${idx}`,
          color: p.color,
          puzzleTitle: p.title,
          row,
        });
      });
    });
    return list;
  }, [today.puzzles]);

  const filteredRescueItems = useMemo(() => {
    const q = rescueQuery.trim().toLowerCase();
    if (!q) return searchableItems.slice(0, 8);
    return searchableItems
      .filter(
        (item) =>
          item.row.label.toLowerCase().includes(q) ||
          item.row.answer.toLowerCase().includes(q) ||
          item.puzzleTitle.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [rescueQuery, searchableItems]);

  const selectedRescue = useMemo(
    () => searchableItems.find((item) => item.key === selectedRescueKey) ?? null,
    [searchableItems, selectedRescueKey],
  );

  const handleSolveRow = (color: OrbColor, rowIndex: number) => {
    const curr = progressMap[color];
    if (curr.solvedIndices.includes(rowIndex)) return;
    const prevTotal = totalOrbs;

    const updatedPuzzle: OrbPuzzleProgress = {
      ...curr,
      solvedIndices: [...curr.solvedIndices, rowIndex],
    };
    const nextMap: DailyOrbsProgressMap = {
      ...progressMap,
      [color]: updatedPuzzle,
    };
    writeProgress(storageKey, nextMap);

    const nextTotal = today.puzzles.reduce(
      (sum, p) => sum + orbsEarnedForPuzzle(p, nextMap[p.color]),
      0,
    );
    if (prevTotal < 6 && nextTotal >= 6) {
      playVictorySound();
      try {
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { y: 0.6 },
          colors: [ORB_HEX.orange, ORB_HEX.purple, ORB_HEX.green, ORB_HEX.blue],
          disableForReducedMotion: true,
        });
      } catch {
        // ignore headless error
      }
    }
  };

  const handleMissPenalty = (color: OrbColor) => {
    const curr = progressMap[color];
    const nextMap: DailyOrbsProgressMap = {
      ...progressMap,
      [color]: {
        ...curr,
        heartsUsed: Math.min(3, curr.heartsUsed + 1),
      },
    };
    writeProgress(storageKey, nextMap);
  };

  const handleResetPuzzle = (color: OrbColor) => {
    const nextMap: DailyOrbsProgressMap = {
      ...progressMap,
      [color]: { solvedIndices: [], heartsUsed: 0 },
    };
    writeProgress(storageKey, nextMap);
  };

  const handleCopyEmojiGrid = () => {
    const segments = today.puzzles.map((p) => {
      const earned = orbCountsByColor[p.color];
      const dots = "●".repeat(earned) + "○".repeat(3 - earned);
      return `${ORB_EMOJI[p.color]}${dots}`;
    });
    const text = `Daily Orbs Practice (${today.date}) ${segments.join(" ")} — ${totalOrbs}/12 Orbs | https://anykrillion.com/daily-orbs-hint/`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedGrid(true);
    window.setTimeout(() => setCopiedGrid(false), 2200);
  };

  const plannerOrbs = manualPlannerOrbs ?? totalOrbs;

  const plan = useMemo(() => {
    const scoreOf = (lvl: ComfortLevel) => (lvl === "strong" ? 3 : lvl === "medium" ? 2 : 0);
    const weightOf = (p: DailyOrbsPuzzleEntry) => {
      const base = scoreOf(comfort[p.color]);
      const safetyBonus = p.format === "long-list" ? 0.4 : 0;
      return base + safetyBonus;
    };
    const ordered = [...today.puzzles].sort((a, b) => weightOf(b) - weightOf(a));
    const projectedTotal = today.puzzles.reduce((acc, p) => acc + scoreOf(comfort[p.color]), 0);
    const remainingToWin = Math.max(0, 6 - plannerOrbs);
    return { ordered, projectedTotal, remainingToWin };
  }, [today.puzzles, comfort, plannerOrbs]);

  return (
    <div className="space-y-8">
      {/* 1. Above-the-Fold 4-Orb Constellation HUD */}
      <section
        aria-label="Daily Orbs Constellation HUD"
        className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-[#061c33] via-[#05182b] to-[#0b1630] p-4 shadow-2xl sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200">
              <Calendar className="h-3.5 w-3.5" />
              Today&apos;s Daily Orbs • {formatDateHeading(today.date)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 font-mono text-xs font-semibold text-cyan-200">
              <Clock className="h-3.5 w-3.5 text-cyan-300" />
              Next Reset: {countdown}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundOn)}
              aria-label={soundOn ? "Mute sandbox sound effects" : "Enable sandbox sound effects"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
            >
              {soundOn ? (
                <Volume2 className="h-3.5 w-3.5 text-cyan-300" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 text-slate-400" />
              )}
              <span>{soundOn ? "SFX On" : "Muted"}</span>
            </button>

            <a
              href="https://dailyorbs.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3.5 py-1.5 text-xs font-bold text-[#03111f] transition hover:bg-cyan-300"
            >
              Play Official Daily Orbs
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Global 12-Orb Segmented Daily Win Progress Bar */}
        <div className="mt-4 rounded-xl border border-white/10 bg-[#03111f]/85 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="font-mono text-sm text-cyan-300">{totalOrbs} / 12 Orbs</span>
              <span className="text-slate-400">· 6 needed for Daily Win</span>
              {totalOrbs >= 6 && (
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-200">
                  Daily Win Unlocked!
                </span>
              )}
            </div>

            {totalOrbs >= 1 && (
              <button
                type="button"
                onClick={handleCopyEmojiGrid}
                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-200 transition hover:bg-cyan-500/20"
              >
                {copiedGrid ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    Copied Emoji Grid!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Spoiler-Free Grid
                  </>
                )}
              </button>
            )}
          </div>

          <div className="mt-2.5 grid grid-cols-12 gap-1">
            {today.puzzles.map((p) => {
              const earned = orbCountsByColor[p.color];
              const theme = ORB_THEME[p.color];
              return [1, 2, 3].map((slot) => (
                <div
                  key={`${p.color}-seg-${slot}`}
                  title={`${theme.label} (${p.title}): Orb ${slot}`}
                  className={`h-2 rounded-full transition ${
                    earned >= slot ? theme.dot : "bg-white/10"
                  }`}
                />
              ));
            })}
          </div>
        </div>

        {/* 4 Interactive Glowing Orb Tiles */}
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {today.puzzles.map((p) => {
            const st = ORB_THEME[p.color];
            const isSelected = activePuzzle.color === p.color;
            const prog = progressMap[p.color];
            const earned = orbCountsByColor[p.color];
            const heartsLeft = Math.max(0, 3 - prog.heartsUsed);
            const isNoHeart = Boolean(p.noHeartPenalty || p.format === "long-list");
            return (
              <button
                key={p.color}
                type="button"
                onClick={() => setActiveColor(p.color)}
                className={`flex flex-col justify-between rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? st.selectedBtn
                    : "border-white/15 bg-[#03111f]/75 hover:border-white/30 hover:bg-[#061c33]"
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
                    <span className={`h-2.5 w-2.5 rounded-full ${st.dot}`} />
                    <span className={st.accentText}>{st.label}</span>
                  </span>
                  {p.seriesEdition && (
                    <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-200">
                      #{p.seriesEdition}
                    </span>
                  )}
                </div>

                <div className="mt-2 truncate text-sm font-extrabold text-white">{p.title}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  {FORMAT_LABELS[p.format]} · {prog.solvedIndices.length}/{p.rows.length}
                </div>

                <div className="mt-2.5 flex w-full items-center justify-between border-t border-white/10 pt-2">
                  <span className="inline-flex items-center gap-1">
                    {[1, 2, 3].map((slot) => (
                      <span
                        key={slot}
                        className={`h-2.5 w-2.5 rounded-full border ${
                          earned >= slot ? st.filledDot : "border-white/25 bg-[#020c17]"
                        }`}
                      />
                    ))}
                  </span>
                  {isNoHeart ? (
                    <span className="text-[10px] font-bold text-emerald-300">∞ Safe</span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5">
                      {[1, 2, 3].map((h) => (
                        <Heart
                          key={h}
                          className={`h-3 w-3 ${
                            heartsLeft >= h ? "fill-rose-500 text-rose-400" : "text-slate-600"
                          }`}
                        />
                      ))}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Instant "Stuck on Just 1 Item?" Single-Item Anti-Spoiler Rescue Bar */}
      <section
        aria-label="Single-Item Zero-Spoiler Rescue Lookup"
        className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/85 p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Instant Anti-Spoiler Lookup
            </span>
            <p className="text-sm font-bold text-white sm:text-base">
              Stuck on just 1 card or clue? Rescue a single item without spoiling the rest:
            </p>
          </div>
          {selectedRescue && (
            <button
              type="button"
              onClick={() => {
                setSelectedRescueKey(null);
                setRescueStep2Open(false);
                setRescueUnblurred(false);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" />
              Close Rescue Card
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={rescueQuery}
              onChange={(e) => setRescueQuery(e.target.value)}
              placeholder="Search 1 item (e.g. Xenism, Mirrors, Curaçao, Wonderwall)..."
              className="w-full rounded-xl border border-cyan-500/25 bg-[#03111f] py-2 pl-9 pr-3 text-sm text-white placeholder-slate-400 outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {filteredRescueItems.map((item) => {
              const st = ORB_THEME[item.color];
              const isChosen = selectedRescueKey === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setSelectedRescueKey(item.key);
                    setRescueStep2Open(false);
                    setRescueUnblurred(false);
                    playSonarPingSound(false);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                    isChosen
                      ? st.selectedBtn
                      : "border-white/15 bg-[#03111f] text-slate-200 hover:border-cyan-400/50"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                  <span className="max-w-[140px] truncate">{item.row.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedRescue && (
          <div className="mt-4 rounded-xl border border-cyan-400/35 bg-[#03111f] p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-full border px-2.5 py-0.5 font-bold ${ORB_THEME[selectedRescue.color].badge}`}
              >
                {ORB_THEME[selectedRescue.color].label} · {selectedRescue.puzzleTitle}
              </span>
              <span className="font-bold text-white">Target: {selectedRescue.row.label}</span>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-[#06192d]/70 p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                  Step 1 · Structural Clue
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-200">
                  {selectedRescue.row.patternTip || "Look for exact meaning & length fit."}
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#06192d]/70 p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                  Step 2 · Letter Blueprint
                </div>
                {rescueStep2Open ? (
                  <p className="mt-1 font-mono text-xs text-cyan-200">
                    {selectedRescue.row.clueMask}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRescueStep2Open(true)}
                    className="mt-1.5 rounded-md border border-cyan-400/35 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20"
                  >
                    Show Letter Pattern
                  </button>
                )}
              </div>

              <div className="rounded-lg border border-emerald-500/25 bg-[#06192d]/70 p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  Step 3 · Tactile Reveal
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!rescueUnblurred) playSonarPingSound(true);
                    setRescueUnblurred((v) => !v);
                  }}
                  className={`mt-1.5 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                    rescueUnblurred
                      ? "border-emerald-400/45 bg-emerald-500/20 text-emerald-100"
                      : "border-white/20 bg-white/5 text-slate-200 hover:border-emerald-400/40"
                  }`}
                >
                  <span className={rescueUnblurred ? "" : "select-none blur-sm"}>
                    {selectedRescue.row.answer}
                  </span>
                  {!rescueUnblurred && (
                    <span className="text-[10px] uppercase tracking-wider text-emerald-300">
                      Tap to Unblur
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. Active Orb Interactive Arena */}
      <section aria-labelledby="active-arena-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="active-arena-heading"
              className="text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              Interactive Practice Sandbox &amp; Live Clues
            </h2>
            <p className="mt-0.5 text-sm text-slate-300">
              Warm up risk-free on today&apos;s matching &amp; sorting boards before spending real
              hearts on dailyorbs.com.
            </p>
          </div>

          <div className="inline-flex rounded-xl border border-cyan-500/25 bg-[#03111f] p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setArenaTab("sandbox")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                arenaTab === "sandbox"
                  ? "bg-cyan-400 text-[#03111f]"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Gamepad2 className="h-3.5 w-3.5" />
              Play Practice Sandbox
            </button>
            <button
              type="button"
              onClick={() => setArenaTab("hints")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                arenaTab === "hints"
                  ? "bg-cyan-400 text-[#03111f]"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Lightbulb className="h-3.5 w-3.5" />
              Quick Spoiler-Free Hints
            </button>
          </div>
        </div>

        {arenaTab === "sandbox" ? (
          <DailyOrbsSandbox
            key={activePuzzle.id}
            dateKey={today.date}
            puzzle={activePuzzle}
            progress={progressMap[activePuzzle.color]}
            onSolveRow={(rowIdx) => handleSolveRow(activePuzzle.color, rowIdx)}
            onMissPenalty={() => handleMissPenalty(activePuzzle.color)}
            onResetPuzzle={() => handleResetPuzzle(activePuzzle.color)}
          />
        ) : (
          <OrbReferenceCard
            key={`quick-${activePuzzle.id}`}
            puzzle={activePuzzle}
            defaultOpenHints={true}
          />
        )}
      </section>

      {/* 4. Full 4-Orb Reference & Crawlability Section */}
      <section id="all-orbs-reference" aria-labelledby="today-puzzles-heading" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="today-puzzles-heading"
              className="text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              Today&apos;s 4 Daily Orbs Spoiler-Free Hints &amp; Solutions
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              All spoilers stay collapsed or blurred until clicked. Expand Hint 1 for rules, Hint 2
              for board structure + a starter anchor, or unblur individual rows in Level 3.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            Synced {today.date}
          </span>
        </div>

        <div className="space-y-5">
          {today.puzzles.map((puzzle) => (
            <OrbReferenceCard key={`${today.date}-${puzzle.color}`} puzzle={puzzle} />
          ))}
        </div>
      </section>

      {/* 5. 6-Orb / 3-Heart Win Planner */}
      <section
        aria-labelledby="win-planner-heading"
        className="rounded-2xl border border-cyan-500/25 bg-[#05182b]/85 p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-300">
              <Heart className="h-3.5 w-3.5 text-rose-400" />
              Interactive Strategy Tool
            </span>
            <h2
              id="win-planner-heading"
              className="mt-1 text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              6-Orb / 3-Heart Daily Win Planner
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-300">
              You only need <strong>6 out of 12 Orbs</strong> to win Daily Orbs. Rate today&apos;s
              four puzzles by comfort level to map the safest order without burning hearts early.
            </p>
          </div>

          <div className="rounded-xl border border-cyan-400/30 bg-[#03111f] px-4 py-3 text-right">
            <div className="text-xs text-slate-400">Orbs Counted</div>
            <div className="mt-1 flex items-center justify-end gap-2">
              <button
                type="button"
                aria-label="Decrease collected orbs"
                onClick={() => setManualPlannerOrbs(Math.max(0, plannerOrbs - 1))}
                className="h-7 w-7 rounded-md border border-white/15 bg-white/5 text-sm font-bold text-white hover:bg-white/15"
              >
                -
              </button>
              <span className="w-14 text-center font-mono text-lg font-extrabold text-cyan-300">
                {plannerOrbs}/12
              </span>
              <button
                type="button"
                aria-label="Increase collected orbs"
                onClick={() => setManualPlannerOrbs(Math.min(12, plannerOrbs + 1))}
                className="h-7 w-7 rounded-md border border-white/15 bg-white/5 text-sm font-bold text-white hover:bg-white/15"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {today.puzzles.map((p) => {
            const st = ORB_THEME[p.color];
            const val = comfort[p.color];
            return (
              <div
                key={p.color}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#03111f] p-3.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${st.dot}`} />
                    <span className="truncate text-sm font-bold text-white">{p.title}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {FORMAT_LABELS[p.format]} • 3-Orb target: {p.starThresholds[2]}
                  </p>
                </div>

                <div className="inline-flex rounded-lg border border-white/10 bg-[#06192d] p-0.5 text-xs font-semibold">
                  {(["strong", "medium", "skip"] as ComfortLevel[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setComfort((prev) => ({ ...prev, [p.color]: opt }))}
                      className={`rounded-md px-2.5 py-1 capitalize transition ${
                        val === opt
                          ? opt === "strong"
                            ? "bg-emerald-500/25 text-emerald-200"
                            : opt === "medium"
                              ? "bg-cyan-500/25 text-cyan-100"
                              : "bg-rose-500/25 text-rose-200"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl border border-cyan-500/25 bg-[#03111f] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <CheckCircle2
                className={`h-4 w-4 ${plan.remainingToWin === 0 || plan.projectedTotal >= 6 ? "text-emerald-400" : "text-amber-400"}`}
              />
              {plan.remainingToWin === 0 ? (
                <span>Daily Win Locked In ({plannerOrbs}/12 Orbs Collected)!</span>
              ) : (
                <span>
                  Need {plan.remainingToWin} more Orb{plan.remainingToWin > 1 ? "s" : ""} for
                  today&apos;s win • Projected path:{" "}
                  <strong className="text-cyan-300">{plan.projectedTotal}/12 Orbs</strong>
                </span>
              )}
            </div>
            {plan.projectedTotal < 6 && plan.remainingToWin > 0 && (
              <span className="text-xs font-semibold text-amber-300">
                Open Hint 1 on a Medium board to secure 2 Orbs instead of skipping.
              </span>
            )}
          </div>

          <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {plan.ordered.map((p, idx) => {
              const st = ORB_THEME[p.color];
              const lvl = comfort[p.color];
              const goal =
                lvl === "strong"
                  ? "Push for 3 Orbs"
                  : lvl === "medium"
                    ? "Bank 2 Orbs"
                    : "Play last / Skip";
              return (
                <li
                  key={p.color}
                  className="rounded-lg border border-white/10 bg-[#06192d]/70 px-3 py-2.5 text-xs"
                >
                  <div className="flex items-center justify-between font-mono text-slate-400">
                    <span>Step {idx + 1}</span>
                    <span className={st.accentText}>{st.label}</span>
                  </div>
                  <div className="mt-1 truncate text-sm font-bold text-white">{p.title}</div>
                  <div className="mt-0.5 text-emerald-300">{goal}</div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* 6. Rolling 30-Day Archive */}
      <section
        aria-labelledby="daily-orbs-archive-heading"
        className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/75 p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-300">
              <Archive className="h-3.5 w-3.5" />
              Rolling 30-Day History
            </span>
            <h2
              id="daily-orbs-archive-heading"
              className="mt-1 text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              Recent Daily Orbs Hint Archive
            </h2>
          </div>
          <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            {archive.length} archived day{archive.length === 1 ? "" : "s"}
          </span>
        </div>

        {archive.length === 0 ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-[#03111f] p-4 text-sm text-slate-300">
            Daily Orbs boards archive automatically right here every day at{" "}
            <strong className="text-white">10:15 UTC</strong> (15 minutes after the 10:00 UTC daily
            rollover) so yesterday&apos;s hints and answers stay searchable whenever you return.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {archive.map((board) => (
              <details
                key={board.date}
                className="group rounded-xl border border-cyan-500/20 bg-[#03111f] p-4 open:border-cyan-400/40"
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-sm font-bold text-white">
                  <span>
                    {formatDateHeading(board.date)} ({board.date})
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs font-normal text-cyan-300">
                    {board.puzzles.map((p) => p.title).join(" · ")}
                    <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                  </span>
                </summary>
                <div className="mt-3 grid gap-3 border-t border-white/10 pt-3 sm:grid-cols-2">
                  {board.puzzles.map((p) => {
                    const st = ORB_THEME[p.color];
                    return (
                      <div
                        key={p.color}
                        className="rounded-lg border border-white/10 bg-[#06192d]/60 p-3 text-xs"
                      >
                        <div className={`font-bold uppercase ${st.accentText}`}>
                          {st.label} — {p.title}
                        </div>
                        <p className="mt-1 text-slate-300">{p.prompt}</p>
                        <p className="mt-1.5 text-emerald-300">
                          <strong>Starter:</strong> {p.starterAnchor}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
