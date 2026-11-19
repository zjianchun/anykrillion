"use client";

import { useMemo, useState } from "react";
import confetti from "canvas-confetti";
import {
  AlertTriangle,
  Check,
  Heart,
  HelpCircle,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { editDistance, normalizeText } from "@/lib/fuzzyMatch";
import {
  playInvalidOrTimeoutSound,
  playLockInSound,
  playRarityRevealSound,
  playSonarPingSound,
} from "@/lib/soundEffects";
import type { DailyOrbsPuzzleEntry, OrbColor } from "@/types/dailyOrbs";

export interface OrbPuzzleProgress {
  solvedIndices: number[];
  heartsUsed: number;
}

export type DailyOrbsProgressMap = Record<OrbColor, OrbPuzzleProgress>;

export const ORB_HEX: Record<OrbColor, string> = {
  orange: "#fb923c",
  purple: "#c084fc",
  green: "#34d399",
  blue: "#38bdf8",
};

export const ORB_THEME: Record<
  OrbColor,
  {
    label: string;
    dot: string;
    filledDot: string;
    ring: string;
    badge: string;
    accentText: string;
    selectedBtn: string;
  }
> = {
  orange: {
    label: "Orange Orb",
    dot: "bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.7)]",
    filledDot: "bg-orange-400 border-orange-300 shadow-[0_0_8px_rgba(251,146,60,0.8)]",
    ring: "border-orange-400/50",
    badge: "border-orange-400/35 bg-orange-500/15 text-orange-200",
    accentText: "text-orange-300",
    selectedBtn: "border-orange-400 bg-orange-500/25 text-white ring-2 ring-orange-400/40",
  },
  purple: {
    label: "Purple Orb",
    dot: "bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.7)]",
    filledDot: "bg-purple-400 border-purple-300 shadow-[0_0_8px_rgba(192,132,252,0.8)]",
    ring: "border-purple-400/50",
    badge: "border-purple-400/35 bg-purple-500/15 text-purple-200",
    accentText: "text-purple-300",
    selectedBtn: "border-purple-400 bg-purple-500/25 text-white ring-2 ring-purple-400/40",
  },
  green: {
    label: "Green Orb",
    dot: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]",
    filledDot: "bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
    ring: "border-emerald-400/50",
    badge: "border-emerald-400/35 bg-emerald-500/15 text-emerald-200",
    accentText: "text-emerald-300",
    selectedBtn: "border-emerald-400 bg-emerald-500/25 text-white ring-2 ring-emerald-400/40",
  },
  blue: {
    label: "Blue Orb",
    dot: "bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.7)]",
    filledDot: "bg-sky-400 border-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.8)]",
    ring: "border-sky-400/50",
    badge: "border-sky-400/35 bg-sky-500/15 text-sky-200",
    accentText: "text-sky-300",
    selectedBtn: "border-sky-400 bg-sky-500/25 text-white ring-2 ring-sky-400/40",
  },
};

export function orbsEarnedForPuzzle(
  puzzle: DailyOrbsPuzzleEntry,
  progress: OrbPuzzleProgress,
): number {
  const count = progress.solvedIndices.length;
  const [t1, t2, t3] = puzzle.starThresholds;
  if (count >= t3) return 3;
  if (count >= t2) return 2;
  if (count >= t1) return 1;
  return 0;
}

/** Deterministic string hash so SSR and hydrated client compute identical card order. */
function stableHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function celebrateMiniOrb(color: OrbColor) {
  try {
    confetti({
      particleCount: 28,
      spread: 55,
      origin: { y: 0.68 },
      colors: [ORB_HEX[color], "#ffffff", "#22d3ee"],
      disableForReducedMotion: true,
    });
  } catch {
    // ignore headless/reduced motion errors
  }
}

interface DailyOrbsSandboxProps {
  dateKey: string;
  puzzle: DailyOrbsPuzzleEntry;
  progress: OrbPuzzleProgress;
  onSolveRow: (rowIndex: number) => void;
  onMissPenalty: () => void;
  onResetPuzzle: () => void;
}

export default function DailyOrbsSandbox({
  dateKey,
  puzzle,
  progress,
  onSolveRow,
  onMissPenalty,
  onResetPuzzle,
}: DailyOrbsSandboxProps) {
  const theme = ORB_THEME[puzzle.color];
  const [safePractice, setSafePractice] = useState<boolean>(true);
  const [selectedA, setSelectedA] = useState<number | null>(null);
  const [selectedB, setSelectedB] = useState<number | null>(null);
  const [activeCatIdx, setActiveCatIdx] = useState<number | null>(null);
  const [eliminatedBuckets, setEliminatedBuckets] = useState<Record<number, string[]>>({});
  const [guessInput, setGuessInput] = useState<string>("");
  const [nudgedIdx, setNudgedIdx] = useState<number | null>(null);
  const [shaking, setShaking] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    tone: "ok" | "hint" | "err";
    text: string;
  } | null>(null);

  const solvedSet = useMemo(() => new Set(progress.solvedIndices), [progress.solvedIndices]);
  const orbs = orbsEarnedForPuzzle(puzzle, progress);
  const heartsRemaining = Math.max(0, 3 - progress.heartsUsed);
  const isNoHeartFormat = Boolean(puzzle.noHeartPenalty || puzzle.format === "long-list");
  const isLocked =
    !safePractice && !isNoHeartFormat && heartsRemaining <= 0 && solvedSet.size < puzzle.rows.length;

  const shuffledBIndices = useMemo(() => {
    const indices = puzzle.rows.map((_, idx) => idx);
    return [...indices].sort((a, b) => {
      const ha = stableHash(`${dateKey}:${puzzle.id}:B:${a}:${puzzle.rows[a].answer}`);
      const hb = stableHash(`${dateKey}:${puzzle.id}:B:${b}:${puzzle.rows[b].answer}`);
      return ha - hb;
    });
  }, [dateKey, puzzle.id, puzzle.rows]);

  const categoryRemaining = useMemo(() => {
    if (!puzzle.categories) return [];
    return puzzle.categories.map((cat) => {
      const remaining = puzzle.rows.filter(
        (r, idx) => r.answer === cat.name && !solvedSet.has(idx),
      ).length;
      return { name: cat.name, total: cat.count, remaining };
    });
  }, [puzzle.categories, puzzle.rows, solvedSet]);

  const triggerShake = () => {
    setShaking(true);
    window.setTimeout(() => setShaking(false), 360);
  };

  const awardMatch = (idx: number, successMsg: string) => {
    const prevOrbs = orbsEarnedForPuzzle(puzzle, progress);
    const nextSize = solvedSet.has(idx) ? solvedSet.size : solvedSet.size + 1;
    const [t1, t2, t3] = puzzle.starThresholds;
    const nextOrbs = nextSize >= t3 ? 3 : nextSize >= t2 ? 2 : nextSize >= t1 ? 1 : 0;

    onSolveRow(idx);
    setNudgedIdx(null);
    setFeedback({ tone: "ok", text: successMsg });

    if (nextOrbs > prevOrbs) {
      playRarityRevealSound(nextOrbs === 3 ? 95 : nextOrbs === 2 ? 70 : 45);
      celebrateMiniOrb(puzzle.color);
    } else {
      playLockInSound();
    }
  };

  const resolveBijectionAttempt = (idxA: number, idxB: number) => {
    const rowA = puzzle.rows[idxA];
    const rowB = puzzle.rows[idxB];
    if (!rowA || !rowB) return;

    const isMatch = idxA === idxB || normalizeText(rowA.answer) === normalizeText(rowB.answer);
    if (isMatch) {
      setSelectedA(null);
      setSelectedB(null);
      awardMatch(idxA, `Locked: ${rowA.label} ${puzzle.separator || "↔"} ${rowA.answer}`);
      return;
    }

    playInvalidOrTimeoutSound();
    triggerShake();
    if (!safePractice && !isNoHeartFormat) {
      onMissPenalty();
    }
    const hintNote = rowA.patternTip || rowA.clueMask;
    setSelectedB(null);
    setFeedback({
      tone: "err",
      text: `Not a match for "${rowA.label}". Smart clue: ${hintNote}`,
    });
  };

  const handleSelectA = (idxA: number) => {
    if (solvedSet.has(idxA) || isLocked) return;
    if (selectedA === idxA) {
      setSelectedA(null);
      return;
    }
    setSelectedA(idxA);
    if (selectedB !== null) {
      resolveBijectionAttempt(idxA, selectedB);
    }
  };

  const handleSelectB = (idxB: number) => {
    if (solvedSet.has(idxB) || isLocked) return;
    if (selectedB === idxB) {
      setSelectedB(null);
      return;
    }
    setSelectedB(idxB);
    if (selectedA !== null) {
      resolveBijectionAttempt(selectedA, idxB);
    }
  };

  const handleCategorizeChoice = (rowIdx: number, chosenCategory: string) => {
    if (solvedSet.has(rowIdx) || isLocked) return;
    const row = puzzle.rows[rowIdx];
    if (!row) return;

    if (row.answer === chosenCategory) {
      setActiveCatIdx(null);
      awardMatch(rowIdx, `Sorted "${row.label}" into ${chosenCategory}!`);
      return;
    }

    playInvalidOrTimeoutSound();
    triggerShake();
    if (!safePractice && !isNoHeartFormat) {
      onMissPenalty();
    }
    setEliminatedBuckets((prev) => ({
      ...prev,
      [rowIdx]: [...new Set([...(prev[rowIdx] ?? []), chosenCategory])],
    }));
    setFeedback({
      tone: "err",
      text: `"${row.label}" is not in ${chosenCategory}. ${row.patternTip || `Clue: ${row.clueMask}`}`,
    });
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    const raw = guessInput.trim();
    const norm = normalizeText(raw);
    if (!norm) return;

    // Check unsolved rows first, then all rows
    let exactMatchIdx = -1;
    let typoMatchIdx = -1;
    let closestDistance = 999;

    puzzle.rows.forEach((row, idx) => {
      if (exactMatchIdx !== -1) return;
      const options = row.answer.split(/\s+\/\s+/).map((o) => normalizeText(o)).filter(Boolean);
      for (const opt of options) {
        if (opt === norm) {
          if (!solvedSet.has(idx)) {
            exactMatchIdx = idx;
            return;
          }
        } else {
          const dist = editDistance(norm, opt);
          if (dist < closestDistance) closestDistance = dist;
          if (!solvedSet.has(idx) && opt.length >= 5 && dist <= 1 && typoMatchIdx === -1) {
            typoMatchIdx = idx;
          }
        }
      }
    });

    const hitIdx = exactMatchIdx !== -1 ? exactMatchIdx : typoMatchIdx;
    if (hitIdx !== -1) {
      const matched = puzzle.rows[hitIdx];
      setGuessInput("");
      awardMatch(
        hitIdx,
        exactMatchIdx !== -1
          ? `Exact hit: ${matched.answer}!`
          : `Close typo accepted: ${matched.answer}!`,
      );
      return;
    }

    playInvalidOrTimeoutSound();
    triggerShake();
    if (!safePractice && !isNoHeartFormat) {
      onMissPenalty();
    }
    const nextTargetIdx = puzzle.rows.findIndex((_, i) => !solvedSet.has(i));
    const nextTarget = nextTargetIdx >= 0 ? puzzle.rows[nextTargetIdx] : null;
    if (closestDistance <= 2) {
      playSonarPingSound(true);
      setFeedback({
        tone: "hint",
        text: `Very close spelling to one of the targets! Double-check a letter${nextTarget ? ` — sample clue: ${nextTarget.clueMask}` : ""}.`,
      });
    } else {
      setFeedback({
        tone: "err",
        text: nextTarget
          ? `No match for "${raw}". Try Clue #${nextTargetIdx + 1}: ${nextTarget.clueMask}`
          : `No match for "${raw}". Check spelling or click Nudge Me.`,
      });
    }
  };

  const handleNudgeMe = () => {
    const firstUnsolved = puzzle.rows.findIndex((_, idx) => !solvedSet.has(idx));
    if (firstUnsolved === -1) {
      setFeedback({ tone: "ok", text: "Board cleared! Every pair/target is already solved." });
      return;
    }

    // Second tap while already nudging solves that item directly as a helpful rescue
    if (nudgedIdx === firstUnsolved && !solvedSet.has(nudgedIdx)) {
      const row = puzzle.rows[nudgedIdx];
      setSelectedA(null);
      setSelectedB(null);
      setActiveCatIdx(null);
      awardMatch(nudgedIdx, `Solved with Nudge: ${row.label} -> ${row.answer}`);
      return;
    }

    const row = puzzle.rows[firstUnsolved];
    playSonarPingSound(true);
    setNudgedIdx(firstUnsolved);

    if (puzzle.format === "bijection") {
      setSelectedA(firstUnsolved);
      setSelectedB(null);
      setFeedback({
        tone: "hint",
        text: `Nudge for "${row.label}": ${row.patternTip || ""} Blueprint: ${row.clueMask}. (Tap Nudge Me once more to auto-solve this pair.)`,
      });
      return;
    }

    if (puzzle.format === "categorization") {
      setActiveCatIdx(firstUnsolved);
      const wrongCats = (puzzle.categories || [])
        .map((c) => c.name)
        .filter((name) => name !== row.answer);
      const currentElim = eliminatedBuckets[firstUnsolved] ?? [];
      const toCross = wrongCats.find((c) => !currentElim.includes(c));
      if (toCross) {
        setEliminatedBuckets((prev) => ({
          ...prev,
          [firstUnsolved]: [...currentElim, toCross],
        }));
      }
      setFeedback({
        tone: "hint",
        text: `Nudge for "${row.label}": Not in "${toCross || "wrong bucket"}". ${row.patternTip || ""} (Tap Nudge Me again to auto-sort.)`,
      });
      return;
    }

    setFeedback({
      tone: "hint",
      text: `Nudge for Target #${firstUnsolved + 1} (${row.label}): ${row.patternTip || ""} ${row.clueMask} (Tap Nudge Me again to reveal & bank.)`,
    });
  };

  const resetLocalAndParent = () => {
    setSelectedA(null);
    setSelectedB(null);
    setActiveCatIdx(null);
    setEliminatedBuckets({});
    setGuessInput("");
    setNudgedIdx(null);
    setFeedback(null);
    onResetPuzzle();
  };

  return (
    <div
      className={`rounded-2xl border ${theme.ring} bg-[#041425]/95 p-4 shadow-xl transition sm:p-6 ${shaking ? "animate-ak-shake" : ""}`}
    >
      {/* Sandbox Top Header: Orb Dots, Rule Mode Switcher, Hearts, Nudge, Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${theme.badge}`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
              {theme.label}
            </span>
            {puzzle.seriesEdition && (
              <span className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-xs font-bold text-slate-200">
                Edition #{puzzle.seriesEdition}
              </span>
            )}
            <span className="font-mono text-xs text-slate-400">
              {solvedSet.size}/{puzzle.rows.length} solved
            </span>
          </div>
          <h3 className="mt-2 text-lg font-extrabold text-white sm:text-xl">{puzzle.title}</h3>
          <p className="mt-1 text-xs text-slate-300 sm:text-sm">{puzzle.prompt}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Iconic 3 Orbs + 3 Hearts HUD */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5" aria-label={`${orbs} of 3 orbs earned`}>
              {[1, 2, 3].map((slot) => {
                const earned = orbs >= slot;
                return (
                  <span
                    key={slot}
                    title={`${slot} Orb milestone: ${puzzle.starThresholds[slot - 1]} solved`}
                    className={`h-4 w-4 rounded-full border transition ${
                      earned
                        ? `${theme.filledDot} animate-ak-pop`
                        : "border-white/25 bg-[#020c17]"
                    }`}
                  />
                );
              })}
            </div>

            {safePractice || isNoHeartFormat ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                {isNoHeartFormat ? "∞ Safe Long-List" : "∞ Safe Warm-Up"}
              </span>
            ) : (
              <div className="flex items-center gap-1" aria-label={`${heartsRemaining} of 3 hearts left`}>
                {[1, 2, 3].map((h) => {
                  const alive = heartsRemaining >= h;
                  const lastHeart = alive && heartsRemaining === 1 && h === 1;
                  return (
                    <Heart
                      key={h}
                      className={`h-4 w-4 transition ${
                        alive
                          ? `fill-rose-500 text-rose-400 ${lastHeart ? "animate-ak-heart-blink" : ""}`
                          : "text-slate-600"
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Controls: Mode Toggle, Nudge Me, Reset */}
          <div className="flex flex-wrap items-center gap-1.5">
            {!isNoHeartFormat && (
              <div className="inline-flex rounded-lg border border-white/15 bg-[#020c17] p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setSafePractice(true)}
                  className={`rounded-md px-2 py-1 transition ${
                    safePractice ? "bg-emerald-500/25 text-emerald-200" : "text-slate-400 hover:text-white"
                  }`}
                >
                  ∞ Safe Practice
                </button>
                <button
                  type="button"
                  onClick={() => setSafePractice(false)}
                  className={`rounded-md px-2 py-1 transition ${
                    !safePractice ? "bg-rose-500/25 text-rose-200" : "text-slate-400 hover:text-white"
                  }`}
                >
                  3-Heart Rules
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleNudgeMe}
              className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-1.5 text-xs font-bold text-cyan-100 transition hover:bg-cyan-500/25"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              {nudgedIdx !== null && !solvedSet.has(nudgedIdx) ? "Auto-Solve Nudged" : "Nudge Me"}
            </button>

            <button
              type="button"
              onClick={resetLocalAndParent}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Feedback / Smart Clue Strip */}
      {feedback && (
        <div
          className={`mt-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed sm:text-sm ${
            feedback.tone === "ok"
              ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-200"
              : feedback.tone === "hint"
                ? "border-cyan-400/35 bg-cyan-500/10 text-cyan-100"
                : "border-rose-400/35 bg-rose-500/10 text-rose-200"
          }`}
        >
          {feedback.tone === "ok" ? (
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          ) : feedback.tone === "hint" ? (
            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Out of Hearts Lock Overlay in Real Rules Mode */}
      {isLocked && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/35 bg-rose-950/35 p-4 text-sm text-rose-100">
          <div className="flex items-center gap-2.5">
            <Lock className="h-4 w-4 shrink-0 text-rose-300" />
            <span>
              <strong>Out of hearts</strong> under 3-Heart Rules ({orbs} Orb{orbs === 1 ? "" : "s"}{" "}
              banked stays yours).
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSafePractice(true)}
              className="rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-bold text-[#03111f] hover:bg-emerald-300"
            >
              Switch to ∞ Safe Mode
            </button>
            <button
              type="button"
              onClick={resetLocalAndParent}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10"
            >
              Restart Board
            </button>
          </div>
        </div>
      )}

      {/* FORMAT 1: BIJECTION TAP-TO-MATCH ARENA */}
      {puzzle.format === "bijection" && (
        <div className="mt-5 space-y-5">
          {/* Live Match Strip */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-xl border border-dashed border-cyan-500/35 bg-[#020c17]/90 p-3 text-center text-xs sm:gap-3 sm:p-4 sm:text-sm">
            <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {puzzle.columnA || "Column A"}
              </div>
              <div className="mt-0.5 truncate font-bold text-white">
                {selectedA !== null ? puzzle.rows[selectedA]?.label : "Tap a card below"}
              </div>
            </div>
            <span className={`font-mono text-base font-bold ${theme.accentText}`}>
              {puzzle.separator || "↔"}
            </span>
            <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {puzzle.columnB || "Column B"}
              </div>
              <div className="mt-0.5 truncate font-bold text-white">
                {selectedB !== null ? puzzle.rows[selectedB]?.answer : "Tap a match"}
              </div>
            </div>
          </div>

          {/* Unmatched Pill Clouds */}
          {solvedSet.size < puzzle.rows.length && (
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
                  1. Pick {puzzle.columnA || "Item"} ({puzzle.rows.length - solvedSet.size} left)
                </div>
                <div className="flex flex-wrap gap-2">
                  {puzzle.rows.map((row, idx) => {
                    if (solvedSet.has(idx)) return null;
                    const isSel = selectedA === idx;
                    const isNudged = nudgedIdx === idx;
                    return (
                      <button
                        key={`a-${idx}-${row.label}`}
                        type="button"
                        disabled={isLocked}
                        onClick={() => handleSelectA(idx)}
                        className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition sm:text-sm ${
                          isSel
                            ? theme.selectedBtn
                            : isNudged
                              ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
                              : "border-white/15 bg-[#06192d] text-slate-100 hover:border-cyan-400/50 hover:bg-[#092442]"
                        } disabled:opacity-50`}
                      >
                        {row.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
                  2. Pair With {puzzle.columnB || "Match"}
                </div>
                <div className="flex flex-wrap gap-2">
                  {shuffledBIndices.map((idx) => {
                    if (solvedSet.has(idx)) return null;
                    const row = puzzle.rows[idx];
                    const isSel = selectedB === idx;
                    return (
                      <button
                        key={`b-${idx}-${row.answer}`}
                        type="button"
                        disabled={isLocked}
                        onClick={() => handleSelectB(idx)}
                        className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition sm:text-sm ${
                          isSel
                            ? theme.selectedBtn
                            : "border-white/15 bg-[#06192d] text-slate-100 hover:border-cyan-400/50 hover:bg-[#092442]"
                        } disabled:opacity-50`}
                      >
                        {row.answer}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Matched Pairs Tray */}
          {progress.solvedIndices.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                Matched Pairs ({progress.solvedIndices.length}/{puzzle.rows.length})
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {progress.solvedIndices.map((idx) => {
                  const row = puzzle.rows[idx];
                  if (!row) return null;
                  return (
                    <div
                      key={`matched-${idx}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/25 px-3 py-2 text-xs sm:text-sm"
                    >
                      <span className="font-semibold text-white">{row.label}</span>
                      <span className="font-mono text-emerald-300">{puzzle.separator || "↔"}</span>
                      <span className="font-bold text-emerald-200">{row.answer}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FORMAT 2: CATEGORIZATION BUCKETS ARENA */}
      {puzzle.format === "categorization" && (
        <div className="mt-5 space-y-4">
          {/* Dynamic Remaining Bucket Counters */}
          <div className="flex flex-wrap gap-2">
            {categoryRemaining.map((bucket) => (
              <span
                key={bucket.name}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${
                  bucket.remaining === 0
                    ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                    : "border-cyan-500/25 bg-[#06192d] text-slate-200"
                }`}
              >
                <span>{bucket.name}</span>
                <span className="font-mono text-cyan-300">
                  {bucket.remaining} left / {bucket.total}
                </span>
              </span>
            ))}
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {puzzle.rows.map((row, idx) => {
              const isSolved = solvedSet.has(idx);
              const isActive = activeCatIdx === idx || nudgedIdx === idx;
              const crossed = new Set(eliminatedBuckets[idx] ?? []);
              return (
                <div
                  key={`cat-${idx}-${row.label}`}
                  className={`rounded-xl border p-3 transition ${
                    isSolved
                      ? "border-emerald-500/30 bg-emerald-950/25"
                      : isActive
                        ? "border-cyan-400/60 bg-[#072038]"
                        : "border-white/10 bg-[#06192d]/80 hover:border-white/25"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={isSolved || isLocked}
                      onClick={() => setActiveCatIdx(isActive ? null : idx)}
                      className="flex-1 text-left text-sm font-bold text-white disabled:cursor-default"
                    >
                      {row.label}
                    </button>
                    {isSolved ? (
                      <span className="rounded-md border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-200">
                        {row.answer}
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => setActiveCatIdx(isActive ? null : idx)}
                        className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-cyan-200 hover:bg-white/10 disabled:opacity-50"
                      >
                        {isActive ? "Pick Bucket ↑" : "Sort"}
                      </button>
                    )}
                  </div>

                  {!isSolved && isActive && !isLocked && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-white/10 pt-2.5">
                      {(puzzle.categories || []).map((cat) => {
                        const disabled = crossed.has(cat.name);
                        return (
                          <button
                            key={cat.name}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleCategorizeChoice(idx, cat.name)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                              disabled
                                ? "border-white/10 bg-white/[0.02] text-slate-600 line-through"
                                : "border-cyan-400/40 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/30"
                            }`}
                          >
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FORMATS 3/4/5: THEMED / OPEN-ENDED / LONG-LIST GUESS ARENA */}
      {puzzle.format !== "bijection" && puzzle.format !== "categorization" && (
        <div className="mt-5 space-y-4">
          <form onSubmit={handleGuessSubmit} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={guessInput}
              disabled={isLocked}
              onChange={(e) => setGuessInput(e.target.value)}
              placeholder={`Test an answer for ${puzzle.title} (typo tolerant, accent-free)...`}
              className="min-w-0 flex-1 rounded-xl border border-cyan-500/30 bg-[#020c17] px-3.5 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:border-cyan-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLocked}
              className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-extrabold text-[#03111f] transition hover:bg-cyan-300 disabled:opacity-50"
            >
              Check Guess
            </button>
          </form>

          <div className="grid gap-2 sm:grid-cols-2">
            {puzzle.rows.map((row, idx) => {
              const solved = solvedSet.has(idx);
              const nudged = nudgedIdx === idx;
              return (
                <div
                  key={`slot-${idx}-${row.label}`}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs sm:text-sm ${
                    solved
                      ? "border-emerald-500/30 bg-emerald-950/25"
                      : nudged
                        ? "border-cyan-400/45 bg-cyan-500/10"
                        : "border-white/10 bg-[#06192d]/65"
                  }`}
                >
                  <span className="truncate font-medium text-slate-200">{row.label}</span>
                  {solved ? (
                    <span className="shrink-0 font-bold text-emerald-200">{row.answer}</span>
                  ) : nudged ? (
                    <span className="shrink-0 font-mono text-xs text-cyan-200">{row.clueMask}</span>
                  ) : (
                    <span className="shrink-0 text-xs italic text-slate-500">Unsolved</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
