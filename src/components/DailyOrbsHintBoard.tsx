"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  ExternalLink,
  Eye,
  EyeOff,
  Heart,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type {
  DailyOrbsDataset,
  DailyOrbsFormat,
  DailyOrbsPuzzleEntry,
  OrbColor,
} from "@/types/dailyOrbs";

type ComfortLevel = "strong" | "medium" | "skip";

const ORB_STYLES: Record<
  OrbColor,
  {
    label: string;
    dot: string;
    badge: string;
    border: string;
    pillActive: string;
    accentText: string;
  }
> = {
  orange: {
    label: "Orange Orb",
    dot: "bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.65)]",
    badge: "border-orange-400/35 bg-orange-500/15 text-orange-200",
    border: "border-orange-500/25",
    pillActive: "border-orange-400/45 bg-orange-500/15 text-orange-100 hover:bg-orange-500/25",
    accentText: "text-orange-300",
  },
  purple: {
    label: "Purple Orb",
    dot: "bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.65)]",
    badge: "border-purple-400/35 bg-purple-500/15 text-purple-200",
    border: "border-purple-500/25",
    pillActive: "border-purple-400/45 bg-purple-500/15 text-purple-100 hover:bg-purple-500/25",
    accentText: "text-purple-300",
  },
  green: {
    label: "Green Orb",
    dot: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.65)]",
    badge: "border-emerald-400/35 bg-emerald-500/15 text-emerald-200",
    border: "border-emerald-500/25",
    pillActive: "border-emerald-400/45 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25",
    accentText: "text-emerald-300",
  },
  blue: {
    label: "Blue Orb",
    dot: "bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.65)]",
    badge: "border-sky-400/35 bg-sky-500/15 text-sky-200",
    border: "border-sky-500/25",
    pillActive: "border-sky-400/45 bg-sky-500/15 text-sky-100 hover:bg-sky-500/25",
    accentText: "text-sky-300",
  },
};

const FORMAT_LABELS: Record<DailyOrbsFormat, string> = {
  bijection: "1-to-1 Matching",
  categorization: "Category Buckets",
  themed: "Themed Clues",
  "open-ended": "Open-Ended Recall",
  "long-list": "Long-List (No Heart Loss)",
  other: "Daily Puzzle",
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

function OrbPuzzleCard({ puzzle }: { puzzle: DailyOrbsPuzzleEntry }) {
  const style = ORB_STYLES[puzzle.color];
  const [tier3Open, setTier3Open] = useState(false);
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
      className={`scroll-mt-24 rounded-2xl border ${style.border} bg-[#06192d]/85 p-5 shadow-lg sm:p-6`}
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

        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
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
        {/* Level 1: Strategy & Milestone Tip (native details for SSR crawlability) */}
        <details className="group rounded-xl border border-white/10 bg-[#041425] open:border-white/25">
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

        {/* Level 2: Structure + 1 Starter Anchor (native details for SSR crawlability) */}
        <details className="group rounded-xl border border-white/10 bg-[#041425] open:border-white/25">
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

        {/* Level 3: Per-Row Masked Clues & Answers (SSR-present native details + interactive controls) */}
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
                              <span className="inline-block rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 font-mono text-xs text-cyan-200">
                                {row.clueMask}
                              </span>
                            ) : (
                              <span className="text-xs italic text-slate-500">
                                Hidden — tap Clue or Answer
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-right whitespace-nowrap">
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

export default function DailyOrbsHintBoard({ dataset }: { dataset: DailyOrbsDataset }) {
  const { today, archive } = dataset;
  const [countdown, setCountdown] = useState<string>("--h --m --s");
  const [comfort, setComfort] = useState<Record<OrbColor, ComfortLevel>>({
    orange: "medium",
    purple: "medium",
    green: "strong",
    blue: "medium",
  });
  const [currentOrbs, setCurrentOrbs] = useState<number>(0);

  useEffect(() => {
    const tick = () => setCountdown(formatCountdown(today.nextRolloverUtc, Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [today.nextRolloverUtc]);

  const plan = useMemo(() => {
    const scoreOf = (lvl: ComfortLevel) => (lvl === "strong" ? 3 : lvl === "medium" ? 2 : 0);
    const weightOf = (p: DailyOrbsPuzzleEntry) => {
      const base = scoreOf(comfort[p.color]);
      // Long-list puzzles do not risk hearts, making them safer early banks when tied
      const safetyBonus = p.format === "long-list" ? 0.4 : 0;
      return base + safetyBonus;
    };
    const ordered = [...today.puzzles].sort((a, b) => weightOf(b) - weightOf(a));
    const projectedTotal = today.puzzles.reduce((acc, p) => acc + scoreOf(comfort[p.color]), 0);
    const remainingToWin = Math.max(0, 6 - currentOrbs);
    return { ordered, projectedTotal, remainingToWin };
  }, [today.puzzles, comfort, currentOrbs]);

  return (
    <div className="space-y-8">
      {/* Top Status & Quick Jump Bar */}
      <section
        aria-label="Daily Orbs Status Bar"
        className="rounded-2xl border border-cyan-500/25 bg-[#06192d]/85 p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200">
              <Calendar className="h-3.5 w-3.5" />
              Today&apos;s Daily Orbs • {formatDateHeading(today.date)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 font-mono text-xs font-semibold text-cyan-200">
              <Clock className="h-3.5 w-3.5 text-cyan-300" />
              Next Reset: {countdown}
            </span>
          </div>

          <a
            href="https://dailyorbs.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3.5 py-2 text-xs font-bold text-[#03111f] transition hover:bg-cyan-300"
          >
            Play Today&apos;s Daily Orbs
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {today.puzzles.map((p) => {
            const st = ORB_STYLES[p.color];
            return (
              <a
                key={p.color}
                href={`#orb-${p.color}`}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${st.pillActive}`}
              >
                <span className={`h-3 w-3 shrink-0 rounded-full ${st.dot}`} />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase opacity-80">{st.label}</div>
                  <div className="truncate text-sm font-extrabold text-white">{p.title}</div>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* Four Interactive Puzzle Hint Cards */}
      <section aria-labelledby="today-puzzles-heading" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="today-puzzles-heading"
              className="text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              Today&apos;s 4 Daily Orbs Hints &amp; Progressive Answers
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              All spoilers start hidden. Open Hint 1 for rules, Hint 2 for board structure + a
              single starter anchor, or unlock individual rows inside Level 3.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            Synced {today.date}
          </span>
        </div>

        <div className="space-y-5">
          {today.puzzles.map((puzzle) => (
            <OrbPuzzleCard key={`${today.date}-${puzzle.color}`} puzzle={puzzle} />
          ))}
        </div>
      </section>

      {/* 6-Orb / 3-Heart Win Planner */}
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
            <div className="text-xs text-slate-400">Current Orbs Banked</div>
            <div className="mt-1 flex items-center justify-end gap-2">
              <button
                type="button"
                aria-label="Decrease collected orbs"
                onClick={() => setCurrentOrbs((v) => Math.max(0, v - 1))}
                className="h-7 w-7 rounded-md border border-white/15 bg-white/5 text-sm font-bold text-white hover:bg-white/15"
              >
                -
              </button>
              <span className="w-14 text-center font-mono text-lg font-extrabold text-cyan-300">
                {currentOrbs}/12
              </span>
              <button
                type="button"
                aria-label="Increase collected orbs"
                onClick={() => setCurrentOrbs((v) => Math.min(12, v + 1))}
                className="h-7 w-7 rounded-md border border-white/15 bg-white/5 text-sm font-bold text-white hover:bg-white/15"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {today.puzzles.map((p) => {
            const st = ORB_STYLES[p.color];
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
                <span>Daily Win Locked In ({currentOrbs}/12 Orbs Collected)!</span>
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
              const st = ORB_STYLES[p.color];
              const lvl = comfort[p.color];
              const goal = lvl === "strong" ? "Push for 3 Orbs" : lvl === "medium" ? "Bank 2 Orbs" : "Play last / Skip";
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

      {/* Rolling Archive */}
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
          <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-400">
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
                    const st = ORB_STYLES[p.color];
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
