import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Layers, Sparkles, Trophy, Waves, Wind } from "lucide-react";
import DailyOrbsHintBoard from "@/components/DailyOrbsHintBoard";
import FaqAccordion from "@/components/FaqAccordion";
import Footer from "@/components/Footer";
import GameEngagement from "@/components/GameEngagement";
import JsonLd, { type FaqItem } from "@/components/JsonLd";
import Navbar from "@/components/Navbar";
import TopicPacksGrid from "@/components/TopicPacksGrid";
import dailyOrbsRaw from "@/data/daily_orbs_hints.json";
import type { DailyOrbsDataset } from "@/types/dailyOrbs";

const dataset = dailyOrbsRaw as unknown as DailyOrbsDataset;
const puzzleTitles = dataset.today.puzzles.map((p) => p.title).join(", ");

export const metadata: Metadata = {
  title: "Daily Orbs Hint Today — Spoiler-Free Clues, Answers & Guide | AnyKrillion",
  description:
    "Get today's Daily Orbs hints without spoilers, per-row letter clues, verified answers for all 4 puzzles, and a 6-orb win strategy. Updated daily after refresh.",
  alternates: {
    canonical: "/daily-orbs-hint/",
  },
  openGraph: {
    title: "Daily Orbs Hint Today — Spoiler-Free Clues, Answers & Guide | AnyKrillion",
    description:
      "Get today's Daily Orbs hints without spoilers, per-row letter clues, verified answers for all 4 puzzles, and a 6-orb win strategy. Updated daily after refresh.",
    url: "https://anykrillion.com/daily-orbs-hint/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Daily Orbs Hint Today — Spoiler-Free Clues, Answers & Guide | AnyKrillion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Orbs Hint Today — Spoiler-Free Clues, Answers & Guide | AnyKrillion",
    description:
      "Get today's Daily Orbs hints without spoilers, per-row letter clues, verified answers for all 4 puzzles, and a 6-orb win strategy.",
    images: ["/og-image.png"],
  },
};

const FAQS: FaqItem[] = [
  {
    question: "What time does Daily Orbs reset every day?",
    answer:
      "Daily Orbs refreshes all four daily boards at 10:00 UTC (5:00 AM Eastern Standard Time / Toronto schedule, or 6:00 AM EDT during daylight saving time). AnyKrillion automatically syncs the new Orange, Purple, Green, and Blue puzzle clues right after rollover.",
  },
  {
    question: "How many orbs do you need to win Daily Orbs today?",
    answer:
      "Each of the four daily puzzles awards up to 3 Orbs (12 Orbs maximum per day), and you only need 6 Orbs total to win the day. Securing 2 Orbs across three comfortable categories wins even if you skip a difficult board.",
  },
  {
    question: "How do hearts work, and which format has no heart penalty?",
    answer:
      "Standard Daily Orbs boards (matching bijection, categorization buckets, themed clues, and open-ended recall) start with 3 hearts and lock if you spend all three on misses. However, long-list puzzles do not penalize wrong guesses with lost hearts, letting you test recall more freely.",
  },
  {
    question: "How do I use these Daily Orbs hints without getting spoiled?",
    answer:
      "Every tier on this page starts collapsed by default. Expand Hint 1 for rule mechanics and Orb thresholds, open Hint 2 for board structure plus one starter anchor, or open Level 3 and tap Clue on a single row for first-letter patterns before ever revealing an Answer.",
  },
  {
    question: "What are the main puzzle formats used in Daily Orbs?",
    answer:
      "Daily Orbs rotates across five distinct board engines: 1-to-1 Bijection matching pairs, Category Buckets sorting, Themed clue prompts, Open-Ended recall boards, and Long-List recall challenges.",
  },
  {
    question: "What other free daily trivia games are similar to Daily Orbs?",
    answer:
      "If you enjoy Daily Orbs, try Today's 7-question Krillion Daily Dive and endless Krillion Unlimited right here on AnyKrillion, flip the goal in Noillirk reverse mode, or solve a 4-letter word ladder on Poople Unlimited.",
  },
];

const PLAYBOOK_FORMATS = [
  {
    title: "1. Bijection Matching (1-to-1 Pairs)",
    badge: "Most Frequent",
    tips: [
      "Lock every 100%-certain pair first to immediately collapse remaining options on both columns.",
      "Scan for grammatical, era, or visual uniqueness (dates, proper nouns, regional flags) that eliminates distractors cleanly.",
      "Do not coin-flip a 50/50 pair early—solve two easier pairs first to expose a forced match.",
    ],
  },
  {
    title: "2. Categorization Buckets (2–4 Groups)",
    badge: "Protect Hearts",
    tips: [
      "Use our Hint 2 bucket-count breakdown to spot when one category is already nearly full.",
      "Resolve clear outliers first and hold ambiguous edge items until your target Orb count is locked.",
      "Check whether the puzzle defines overlapping items in a shared \"Both\" bucket before guessing.",
    ],
  },
  {
    title: "3. Themed & Wordplay Clues",
    badge: "Exact Constraints",
    tips: [
      "Re-read the subtitle rule word for word—clues often enforce strict constraints like homophones, letter counts, or chronological order.",
      "Watch for multi-answer prompt cards where one clue rewards rare or secondary meanings.",
      "If stuck on one clue, jump to Level 3 on this page and click Clue for initial letters without revealing answers.",
    ],
  },
  {
    title: "4. Open-Ended & Long-List Recall",
    badge: "Zero Heart Penalty on Long-List",
    tips: [
      "Verify spelling and naming conventions carefully on 3-heart Open-Ended rounds; skip risky guesses once you hit your 2-Orb or 3-Orb safety mark.",
      "On Long-List puzzles, rapid-fire brainstorming costs zero hearts—sweep alphabetically using Hint 2's top starting letters.",
      "Prioritize hitting the 1-Orb and 2-Orb thresholds fast, then pivot remaining effort toward stronger boards.",
    ],
  },
];

export default function DailyOrbsHintPage() {
  return (
    <>
      <JsonLd
        canonicalUrl="https://anykrillion.com/daily-orbs-hint/"
        pageTitle="Daily Orbs Hint Today — Spoiler-Free Clues, Answers & Guide | AnyKrillion"
        pageDescription="Get today's Daily Orbs hints without spoilers, per-row letter clues, verified answers for all 4 puzzles, and a 6-orb win strategy. Updated daily after refresh."
        pageType="WebPage"
        webAppSchema={{
          name: "Daily Orbs Hint & Interactive Practice Sandbox — AnyKrillion",
          description:
            "Interactive 4-Orb Daily Orbs practice sandbox, zero-spoiler per-item clues, and daily verified answers.",
          applicationCategory: "GameApplication",
        }}
        faqs={FAQS}
        breadcrumbs={[
          { name: "Krillion Unlimited", url: "https://anykrillion.com/" },
          {
            name: "Daily Orbs Hint Today",
            url: "https://anykrillion.com/daily-orbs-hint/",
          },
        ]}
      />

      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:pt-8">
        <header className="mb-8 rounded-2xl border border-cyan-500/25 bg-[#06192d]/85 p-6 sm:p-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              Updated Daily • {dataset.today.date}
            </span>
            <div className="flex flex-wrap gap-3 text-xs font-semibold text-cyan-300">
              <Link
                href="/"
                className="underline decoration-cyan-500/40 underline-offset-4 hover:text-white"
              >
                Play Krillion Unlimited
              </Link>
              <Link
                href="/krillion-answers-today/"
                className="underline decoration-cyan-500/40 underline-offset-4 hover:text-white"
              >
                Krillion Answers Today
              </Link>
              <Link
                href="/games-like-krillion/"
                className="underline decoration-cyan-500/40 underline-offset-4 hover:text-white"
              >
                Games Like Krillion
              </Link>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
            Daily Orbs Hint Today — Spoiler-Free Clues &amp; Step-by-Step Guide
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Stuck on today&apos;s {dataset.today.date} puzzles ({puzzleTitles})? Play the{" "}
            <strong>interactive 4-Orb practice sandbox</strong>, search a single item without
            spoiling the rest of the board, plan a <strong>6-orb win</strong>, or expand verified
            answers across Orange, Purple, Green, and Blue.
          </p>
        </header>

        <div className="space-y-8">
          <DailyOrbsHintBoard dataset={dataset} />

          <GameEngagement gameLabel="Daily Orbs Hints & Sandbox" />

          {/* Evergreen 4-Format Daily Orbs Playbook */}
          <section
            aria-labelledby="daily-orbs-playbook-heading"
            className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/80 p-6 sm:p-8"
          >
            <div className="flex items-center gap-2 text-cyan-300">
              <Compass className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Evergreen Strategy Manual
              </span>
            </div>
            <h2
              id="daily-orbs-playbook-heading"
              className="mt-2 text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              4-Format Daily Orbs Playbook: How to Win Consistently
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300 sm:text-base">
              Even before touching today&apos;s hints, mastering how Daily Orbs structures its
              puzzles lets you bank 6+ orbs quickly without losing all three hearts on surprise
              categories.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {PLAYBOOK_FORMATS.map((fmt) => (
                <article
                  key={fmt.title}
                  className="rounded-xl border border-cyan-500/20 bg-[#03111f] p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-extrabold text-white">{fmt.title}</h3>
                    <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-200">
                      {fmt.badge}
                    </span>
                  </div>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-relaxed text-slate-300 sm:text-sm">
                    {fmt.tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          {/* Conversion Bridge to AnyKrillion Core Games */}
          <section
            aria-labelledby="play-next-krillion-heading"
            className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-[#061c33] to-[#041425] p-6 sm:p-8"
          >
            <div className="flex items-center gap-2 text-emerald-300">
              <Trophy className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Keep Your Daily Streak Going
              </span>
            </div>
            <h2
              id="play-next-krillion-heading"
              className="mt-2 text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              Finished Today&apos;s Daily Orbs? Play Krillion Daily Dive &amp; Unlimited Next
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Love trivia, geography, words, and science challenges? Keep rolling without a 24-hour
              lockout on AnyKrillion&apos;s instant-play browser modes:
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Link
                href="/"
                className="group rounded-xl border border-cyan-500/25 bg-[#03111f] p-4 transition hover:border-cyan-400/60"
              >
                <div className="flex items-center gap-2 text-sm font-extrabold text-cyan-300">
                  <Waves className="h-4 w-4" />
                  Krillion Unlimited &amp; Daily Dive
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  Dive deeper by naming obscure facts on Today&apos;s 7-prompt Daily Dive or endless
                  rounds.
                </p>
              </Link>

              <Link
                href="/noillirk/"
                className="group rounded-xl border border-amber-500/25 bg-[#03111f] p-4 transition hover:border-amber-400/60"
              >
                <div className="flex items-center gap-2 text-sm font-extrabold text-amber-300">
                  <Wind className="h-4 w-4" />
                  Noillirk (Reverse Mode)
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  Flip the trivia goal—pick the #1 mainstream crowd answer to soar highest.
                </p>
              </Link>

              <Link
                href="/poople-unlimited/"
                className="group rounded-xl border border-teal-500/25 bg-[#03111f] p-4 transition hover:border-teal-400/60"
              >
                <div className="flex items-center gap-2 text-sm font-extrabold text-teal-300">
                  <Layers className="h-4 w-4" />
                  Poople Unlimited &amp; Solver
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  Play endless 4-letter English word ladders into POOP with an instant BFS solver.
                </p>
              </Link>
            </div>
          </section>

          <section aria-labelledby="more-packs-heading">
            <h2
              id="more-packs-heading"
              className="mb-4 text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              Explore All AnyKrillion Topic Packs
            </h2>
            <TopicPacksGrid excludeHref="/daily-orbs-hint/" />
          </section>

          <section aria-labelledby="daily-orbs-faq-heading">
            <h2
              id="daily-orbs-faq-heading"
              className="mb-4 text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              Daily Orbs Hint &amp; Gameplay FAQ
            </h2>
            <FaqAccordion faqs={FAQS} />
          </section>

          <aside className="rounded-xl border border-white/10 bg-[#041425] p-4 text-xs leading-relaxed text-slate-400">
            <strong className="text-slate-200">Independent Fan Guide Notice:</strong>{" "}
            AnyKrillion.com is an independent trivia hub and fan-made hint resource. It is not
            affiliated with, endorsed by, or sponsored by Daily Orbs (dailyorbs.com) or Listdle.
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}
