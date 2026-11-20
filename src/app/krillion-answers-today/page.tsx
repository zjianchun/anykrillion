import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Eye, ShieldAlert, Sparkles, Trophy } from "lucide-react";
import FaqAccordion from "@/components/FaqAccordion";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import Navbar from "@/components/Navbar";
import TopicPacksGrid from "@/components/TopicPacksGrid";
import { DAILY_BOARDS, TODAY_BOARD, getBoardPrompts } from "@/lib/datasets";
import type { AnswerEntity, TriviaPrompt } from "@/types/game";

export const metadata: Metadata = {
  title: "Krillion Answers Today & Daily Hints (Live) | AnyKrillion",
  description:
    "Check Krillion answers today, spoiler-free hints, and One in a Krillion top picks for all 7 daily prompts. Avoid common Plankton answers and boost your score.",
  alternates: {
    canonical: "/krillion-answers-today/",
  },
  openGraph: {
    title: "Krillion Answers Today & Daily Hints (Live) | AnyKrillion",
    description: "Spoiler-free Krillion hints, One in a Krillion 85–100 pt picks, and Plankton traps to avoid for Today's 7 Daily Dive prompts.",
    url: "https://anykrillion.com/krillion-answers-today/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Krillion Answers Today & Daily Hints (Live) | AnyKrillion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Krillion Answers Today & Daily Hints (Live) | AnyKrillion",
    description: "Spoiler-free Krillion hints, One in a Krillion 85–100 pt picks, and Plankton traps to avoid for Today's 7 Daily Dive prompts.",
    images: ["/og-image.png"],
  },
};

const FAQS = [
  {
    question: "How can I check Krillion hints today without spoiling the top answers?",
    answer:
      "Every one of Today's 7 Krillion prompts below hides its clues inside progressive collapsible panels: Step 1 (category direction), Step 2 (entity narrowing clue), Step 3 (initials or letter pattern), and an optional Answer Reveal tab so you never see spoilers by accident.",
  },
  {
    question: "What makes a One in a Krillion answer worth 85 to 100 points?",
    answer:
      "Answers in the 85–100 point band sit in the deepest rarity quantile of verified entities for that category—valid facts that average trivia players forget under a 25-second clock.",
  },
  {
    question: "Why should I avoid Plankton answers on Today's Daily Dive?",
    answer:
      "Plankton answers (10–19 points) are the ultra-famous first things everyone types. Even if all 7 of your answers are factually right, picking 7 Plankton answers strands your score near 100 points instead of 600+.",
  },
  {
    question: "Where can I find yesterday's Krillion answers or replay past days?",
    answer:
      "Head to our Krillion Archive (/krillion-archive/) to browse all 30 past Daily Dive boards, replay any board live in interactive mode, and inspect past high-score rarity sheets.",
  },
];

function getTopRarityPicks(prompt: TriviaPrompt, count = 4): AnswerEntity[] {
  return [...prompt.answers]
    .filter((a) => a.rarity >= 80)
    .sort((a, b) => b.rarity - a.rarity)
    .slice(0, count);
}

function getPlanktonTraps(prompt: TriviaPrompt, count = 3): AnswerEntity[] {
  return [...prompt.answers]
    .sort((a, b) => a.rarity - b.rarity)
    .slice(0, count);
}

export default function KrillionAnswersTodayPage() {
  const todayPrompts = getBoardPrompts(TODAY_BOARD);
  const recentBoards = DAILY_BOARDS.slice(0, 7);

  return (
    <>
      <JsonLd
        canonicalUrl="https://anykrillion.com/krillion-answers-today/"
        pageTitle="Krillion Answers Today & Daily Hints (Live) | AnyKrillion"
        pageDescription="Check Krillion answers today, spoiler-free hints, and One in a Krillion top picks for all 7 daily prompts. Avoid common Plankton answers and boost your score."
        pageType="WebPage"
        faqs={FAQS}
        breadcrumbs={[
          { name: "Krillion Unlimited", url: "https://anykrillion.com/" },
          {
            name: "Krillion Answers Today",
            url: "https://anykrillion.com/krillion-answers-today/",
          },
        ]}
      />

      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:pt-8">
        <header className="mb-8 rounded-2xl border border-cyan-500/25 bg-[#06192d]/85 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Daily Dive #{TODAY_BOARD.dayNumber} • {TODAY_BOARD.date}
            </span>
            <div className="flex flex-wrap gap-3 text-xs font-semibold">
              <Link
                href="/"
                className="rounded-lg bg-cyan-400 px-3 py-1.5 font-bold text-[#03111f] hover:bg-cyan-300"
              >
                Play Today&apos;s Dive Live →
              </Link>
              <Link
                href="/krillion-archive/"
                className="rounded-lg border border-cyan-500/30 px-3 py-1.5 text-cyan-200 hover:bg-cyan-500/10"
              >
                Past 30 Days Archive
              </Link>
            </div>
          </div>

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
            Krillion Answers Today, Spoiler-Free Hints &amp; Top Picks
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Stuck on today&apos;s <strong>{TODAY_BOARD.themeLabel}</strong> board? Expand hints step
            by step without spoiling the solution—or jump straight down to verified{" "}
            <strong>One in a Krillion (85–100 pt)</strong> rare picks and{" "}
            <strong>Plankton trap</strong> warnings for all 7 daily questions.
          </p>
        </header>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-500/25 bg-gradient-to-r from-[#071c31] via-[#0a1830] to-[#13152c] px-4 py-3 text-xs sm:px-5 sm:text-sm">
          <div className="flex flex-wrap items-center gap-2.5 text-slate-200">
            <span className="inline-flex items-center gap-1" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              <span className="h-2 w-2 rounded-full bg-purple-400" />
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="h-2 w-2 rounded-full bg-sky-400" />
            </span>
            <span>
              Also solving today&apos;s <strong className="text-white">Daily Orbs</strong> quartet?
              Try our interactive zero-spoiler practice sandbox &amp; progressive clues.
            </span>
          </div>
          <Link
            href="/daily-orbs-hint/"
            className="shrink-0 rounded-lg border border-orange-400/40 bg-orange-500/15 px-3 py-1.5 text-xs font-bold text-orange-200 transition hover:bg-orange-500/25"
          >
            Open Daily Orbs Hints →
          </Link>
        </div>

        <div className="space-y-8">
        <section aria-labelledby="today-prompts-heading">
          <h2
            id="today-prompts-heading"
            className="mb-4 text-xl font-extrabold tracking-tight text-white sm:text-2xl"
          >
            Today&apos;s 7 Krillion Questions &amp; Progressive Hints
          </h2>
          <div className="space-y-4">
            {todayPrompts.map((prompt, idx) => {
              const topPicks = getTopRarityPicks(prompt, 5);
              const traps = getPlanktonTraps(prompt, 3);
              return (
                <article
                  key={prompt.id}
                  className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/80 p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-cyan-500/20 px-2.5 py-0.5 font-mono text-xs font-bold text-cyan-300">
                        Round {idx + 1}/7
                      </span>
                      <span className="rounded-md border border-slate-700 bg-slate-800/70 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                        {prompt.categoryLabel}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-slate-400">
                      {prompt.answers.length} valid answers • {prompt.timerSeconds}s timer
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-white sm:text-xl">
                    {prompt.question}
                  </h3>

                  <div className="mt-4 grid gap-2.5 md:grid-cols-3">
                    {prompt.hints.map((hintText, hIdx) => (
                      <details
                        key={`${prompt.id}-hint-${hIdx}`}
                        className="group rounded-xl border border-cyan-500/20 bg-[#03111f]/75 p-3 open:border-cyan-400/45"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold uppercase tracking-wider text-cyan-300">
                          <span>Spoiler-Free Hint {hIdx + 1}</span>
                          <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
                        </summary>
                        <p className="mt-2 text-sm text-slate-200">{hintText}</p>
                      </details>
                    ))}
                  </div>

                  <details className="group mt-3 rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-3.5 open:border-emerald-400/50">
                    <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-emerald-300">
                      <span className="inline-flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Reveal Top One in a Krillion Answers &amp; Plankton Traps (#{idx + 1})
                      </span>
                      <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                    </summary>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                          Best Rare Picks (85–100 pts)
                        </p>
                        <ul className="space-y-1.5 text-sm">
                          {topPicks.map((ans) => (
                            <li
                              key={ans.name}
                              className="flex items-start justify-between gap-3 rounded-lg border border-emerald-500/20 bg-[#03111f]/70 px-3 py-2"
                            >
                              <div>
                                <span className="font-bold text-white">{ans.name}</span>
                                <p className="text-xs text-slate-400">{ans.fact}</p>
                              </div>
                              <span className="shrink-0 rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-xs font-bold text-emerald-300">
                                {ans.rarity} pts
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-rose-300">
                          Plankton Traps to Avoid (10–25 pts)
                        </p>
                        <ul className="space-y-1.5 text-sm">
                          {traps.map((ans) => (
                            <li
                              key={ans.name}
                              className="flex items-start justify-between gap-3 rounded-lg border border-rose-500/20 bg-[#03111f]/70 px-3 py-2"
                            >
                              <div>
                                <span className="font-semibold text-rose-100">{ans.name}</span>
                                <p className="text-xs text-slate-400">{ans.fact}</p>
                              </div>
                              <span className="shrink-0 rounded bg-rose-500/20 px-2 py-0.5 font-mono text-xs font-bold text-rose-300">
                                {ans.rarity} pts
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="best-picks-heading"
          className="rounded-2xl border border-emerald-500/25 bg-[#05182b]/80 p-6 sm:p-8"
        >
          <div className="flex items-center gap-2 text-emerald-300">
            <Trophy className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">High-Score Cheat Sheet</span>
          </div>
          <h2
            id="best-picks-heading"
            className="mt-2 text-xl font-extrabold tracking-tight text-white sm:text-2xl"
          >
            One in a Krillion Best Answers (85–100 Pts)
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Quick comparison of the top-scoring obscure answer for every round in Daily Dive #
            {TODAY_BOARD.dayNumber} ({TODAY_BOARD.date}).
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-cyan-500/25 text-xs uppercase tracking-wider text-cyan-300">
                  <th className="py-2.5 pr-4">Round</th>
                  <th className="py-2.5 pr-4">Daily Prompt</th>
                  <th className="py-2.5 pr-4">Top #1 Rare Answer</th>
                  <th className="py-2.5">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {todayPrompts.map((prompt, idx) => {
                  const best = getTopRarityPicks(prompt, 1)[0];
                  return (
                    <tr key={prompt.id}>
                      <td className="py-3 pr-4 font-mono text-xs text-slate-400">#{idx + 1}</td>
                      <td className="py-3 pr-4 font-medium text-slate-200">{prompt.question}</td>
                      <td className="py-3 pr-4 font-bold text-emerald-300">{best?.name}</td>
                      <td className="py-3 font-mono text-xs font-bold text-emerald-200">
                        {best?.rarity} / 100
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section
          aria-labelledby="plankton-traps-heading"
          className="rounded-2xl border border-rose-500/25 bg-[#05182b]/80 p-6 sm:p-8"
        >
          <div className="flex items-center gap-2 text-rose-300">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Avoid Low Multipliers</span>
          </div>
          <h2
            id="plankton-traps-heading"
            className="mt-2 text-xl font-extrabold tracking-tight text-white sm:text-2xl"
          >
            Common Plankton Traps to Avoid Today
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Unless you are playing{" "}
            <Link href="/noillirk/" className="font-semibold text-amber-300 hover:underline">
              Noillirk reverse mode
            </Link>{" "}
            (where these #1 crowd answers turn into golden balloons!), steer clear of these obvious
            surface picks:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todayPrompts.map((prompt, idx) => {
              const trap = getPlanktonTraps(prompt, 1)[0];
              return (
                <div
                  key={prompt.id}
                  className="rounded-xl border border-rose-500/20 bg-[#041425] p-4"
                >
                  <span className="font-mono text-xs text-slate-400">
                    Round #{idx + 1} • {prompt.categoryLabel}
                  </span>
                  <p className="mt-1 font-bold text-rose-200">
                    Trap: {trap?.name} ({trap?.rarity} pts)
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{trap?.fact}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="recent-boards-strip">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2
              id="recent-boards-strip"
              className="text-lg font-extrabold text-white sm:text-xl"
            >
              Recent Daily Dive Boards
            </h2>
            <Link
              href="/krillion-archive/"
              className="text-sm font-semibold text-cyan-300 hover:underline"
            >
              Open Full 30-Day Archive →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentBoards.map((board) => (
              <Link
                key={board.date}
                href={`/krillion-archive/#board-${board.dayNumber}`}
                className="rounded-xl border border-cyan-500/20 bg-[#06192d]/75 p-4 hover:border-cyan-400/50"
              >
                <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
                  <span>Dive #{board.dayNumber}</span>
                  <span>{board.date}</span>
                </div>
                <p className="mt-1.5 text-sm font-bold text-white">{board.themeLabel}</p>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="other-packs">
          <h2 id="other-packs" className="mb-4 text-xl font-extrabold text-white sm:text-2xl">
            Practice Unlimited Topic Packs
          </h2>
          <TopicPacksGrid excludeHref="/krillion-answers-today/" />
        </section>

        <section aria-labelledby="answers-faq-heading">
          <h2
            id="answers-faq-heading"
            className="mb-4 text-xl font-extrabold tracking-tight text-white sm:text-2xl"
          >
            Krillion Answers &amp; Hints FAQ
          </h2>
          <FaqAccordion faqs={FAQS} />
        </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
