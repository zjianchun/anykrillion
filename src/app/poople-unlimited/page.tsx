import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Compass, Eye, Flame, Layers } from "lucide-react";
import FaqAccordion from "@/components/FaqAccordion";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import Navbar from "@/components/Navbar";
import PoopleGameEngine from "@/components/PoopleGameEngine";
import TopicPacksGrid from "@/components/TopicPacksGrid";
import poopleDataRaw from "@/data/poople_words.json";

interface PoopleDailyBoard {
  dayNumber: number;
  date: string;
  startWord: string;
  targetWord: string;
  optimalSteps: number;
  optimalPath: string[];
}

const poopleData = poopleDataRaw as {
  target: string;
  dictionary: string[];
  dailyBoards: PoopleDailyBoard[];
};

const TODAY_POOPLE = poopleData.dailyBoards[poopleData.dailyBoards.length - 1];

export const metadata: Metadata = {
  title: "Poople Unlimited — Free Word Ladder Game & Solver | AnyKrillion",
  description:
    "Play Poople Unlimited free online! Turn any 4-letter word into POOP in minimum steps, check today's Poople answer, or use the shortest-path word solver.",
  alternates: {
    canonical: "/poople-unlimited/",
  },
  openGraph: {
    title: "Poople Unlimited — Free Word Ladder Game & Solver | AnyKrillion",
    description:
      "Play Poople Unlimited free online, view Today's Poople answer, or find the shortest 1-letter word ladder to POOP instantly.",
    url: "https://anykrillion.com/poople-unlimited/",
  },
};

const FAQS = [
  {
    question: "How do you play Poople Unlimited?",
    answer:
      "Start with any 4-letter English word and morph it one letter at a time into the destination word POOP. Every intermediate rung must be a valid 4-letter English word, and winning in fewer steps beats the Breadth-First Search (BFS) par.",
  },
  {
    question: "How is Poople Answer Today verified?",
    answer:
      "Each daily challenge on AnyKrillion runs through a deterministic shortest-path graph search over our 1,596-word common English dictionary. Today's Poople board starts at a fixed 4-letter seed and displays the spoiler-protected optimal chain inside an expandable panel.",
  },
  {
    question: "How does the built-in Poople Solver work?",
    answer:
      "Switch to the Word Ladder Solver tab above, enter any 4-letter starting word (and optionally customize the target away from POOP), and our instant BFS engine computes the exact minimum-step transition path in milliseconds right inside your browser.",
  },
  {
    question: "Why do Daily Dles streamers play Poople alongside Krillion and Noillirk?",
    answer:
      "Both Krillion and Poople share the Daily Dles browser game rotation created for rapid-fire 30-to-60 second daily challenges. Moving from rarity trivia on Krillion Unlimited or Noillirk to four-letter word ladders on Poople keeps variety streamers' daily streak sessions tight without switching websites.",
  },
];

const HUB_FAMILIES = [
  {
    family: "_OOP Gateway (1 Step Away)",
    examples: "LOOP, COOP, HOOP, GOOP",
    why: "Any word ending in -OOP wins on the very next turn by changing letter #1 to P. Memorizing LOOP (from food/roof words) and COOP (from cold/work/shop chains) cuts 2+ wasted moves off average runs.",
  },
  {
    family: "POO_ Gateway (1 Step Away)",
    examples: "POOL, POOR, POOH",
    why: "When your vowel positions settle into P-O-O early (e.g., GOAL → COAL → COOL → POOL, or STAR → SOAR → SOUR → POUR → POOR), changing only the final letter drops straight into POOP.",
  },
  {
    family: "2-Step Golden Hubs (_OOT / _OOR / _OPE / _LOP)",
    examples: "BOOT, ROOT, DOOR, MOOR, POPE, PLOP, PROP",
    why: "These four clusters act as universal traffic intersections across all 1,596 connected words. Steer consonants toward P, C, H, or L whenever your starter word begins with sharp letters like S, T, W, or G.",
  },
];

export default function PoopleUnlimitedPage() {
  return (
    <>
      <JsonLd
        canonicalUrl="https://anykrillion.com/poople-unlimited/"
        pageTitle="Poople Unlimited — Free Word Ladder Game & Solver | AnyKrillion"
        pageDescription="Play Poople Unlimited free online! Turn any 4-letter word into POOP in minimum steps, check today's Poople answer, or use the shortest-path word solver."
        pageType="WebPage"
        webAppSchema={{
          name: "Poople Unlimited & Shortest-Path Word Ladder Solver",
          description:
            "Browser-based 4-letter Poople Unlimited game, daily answer reference, and instant BFS word ladder solver.",
          applicationCategory: "GameApplication",
        }}
        gameSchema={{
          name: "Poople Unlimited — 4-Letter Word Ladder Game",
          description:
            "Transform 4-letter starting words into POOP one letter at a time with unlimited rounds, daily streaks, and BFS optimal solver hints.",
          genre: "Word Puzzle Game",
          keywords: [
            "poople unlimited",
            "poople",
            "poople game",
            "poople answer today",
            "poople solver",
          ],
        }}
        faqs={FAQS}
        breadcrumbs={[
          { name: "Krillion Unlimited", url: "https://anykrillion.com/" },
          { name: "Poople Unlimited", url: "https://anykrillion.com/poople-unlimited/" },
        ]}
      />

      <Navbar />

      <main className="mx-auto max-w-6xl pb-16 sm:px-4 sm:pt-3">
        <h1 className="sr-only">
          Poople Unlimited: Free 4-Letter Word Ladder Game, Daily Answer &amp; Solver
        </h1>

        <section aria-labelledby="poople-engine-heading" className="mb-14">
          <h2 id="poople-engine-heading" className="sr-only">
            Play Poople Unlimited &amp; Daily Word Ladder
          </h2>
          <PoopleGameEngine />
        </section>

        <div id="poople-guide" className="space-y-8 border-t border-white/10 px-4 pt-10 sm:px-0">
          <div className="rounded-2xl border border-white/10 bg-[#051629]/65 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-cyan-300">
              <span className="inline-flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-amber-300">
                <BookOpen className="h-4 w-4" />
                Poople Unlimited: Free 4-Letter Word Ladder Game &amp; Daily #{TODAY_POOPLE.dayNumber} Solver
              </span>
              <div className="flex flex-wrap gap-3">
                <Link href="/" className="underline decoration-cyan-500/40 underline-offset-4 hover:text-white">
                  Krillion Unlimited
                </Link>
                <Link href="/games-like-krillion/" className="underline decoration-cyan-500/40 underline-offset-4 hover:text-white">
                  All Games Like Krillion
                </Link>
                <Link href="/krillion-answers-today/" className="underline decoration-cyan-500/40 underline-offset-4 hover:text-white">
                  Krillion Answers Today
                </Link>
              </div>
            </div>
            <p className="mt-2.5 max-w-4xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Play unlimited rounds of the viral Daily Dles word-ladder puzzle, verify{" "}
              <strong>Poople answer today</strong> without accidental spoilers, or solve any 4-letter
              starting word into <strong>POOP</strong> in the fewest guaranteed moves.
            </p>
          </div>
          <section
            aria-labelledby="poople-today-heading"
            className="rounded-2xl border border-emerald-400/25 bg-[#05182b]/80 p-6 sm:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="poople-today-heading"
                className="text-xl font-extrabold tracking-tight text-white sm:text-2xl"
              >
                Poople Answer Today &amp; Optimal Step-by-Step Hints
              </h2>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-bold text-emerald-200">
                Daily #{TODAY_POOPLE.dayNumber} · {TODAY_POOPLE.date}
              </span>
            </div>

            <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300 sm:text-base">
              <p>
                Looking for a gentle nudge before locking in Today&apos;s Poople streak? Challenge #
                {TODAY_POOPLE.dayNumber} starts from the four-letter anchor{" "}
                <strong className="font-mono text-white">{TODAY_POOPLE.startWord}</strong> and reaches{" "}
                <strong className="font-mono text-amber-300">{TODAY_POOPLE.targetWord}</strong> in an
                optimal par of <strong>{TODAY_POOPLE.optimalSteps} steps</strong> across our{" "}
                {poopleData.dictionary.length.toLocaleString()}-word English graph.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <details className="group rounded-xl border border-cyan-500/20 bg-[#03111f] p-4">
                  <summary className="flex cursor-pointer items-center justify-between font-bold text-cyan-200">
                    <span>Hint 1: Best First Move Direction (Spoiler-Safe)</span>
                    <Eye className="h-4 w-4 text-cyan-300" />
                  </summary>
                  <p className="mt-2.5 text-sm text-slate-300">
                    Keep the starting consonant cluster intact at the front (`{TODAY_POOPLE.startWord.slice(0, 2)}__`)
                    and aim to swap out the final vowel/consonant pair into a classic{" "}
                    <code>_O_P</code> or <code>_L_T</code> pivot word on turn 1.
                  </p>
                </details>

                <details className="group rounded-xl border border-amber-400/25 bg-[#03111f] p-4">
                  <summary className="flex cursor-pointer items-center justify-between font-bold text-amber-200">
                    <span>Reveal Today&apos;s Optimal Poople Answer Chain</span>
                    <Eye className="h-4 w-4 text-amber-300" />
                  </summary>
                  <p className="mt-2.5 font-mono text-sm font-bold text-emerald-300">
                    {TODAY_POOPLE.optimalPath.join(" → ")} ({TODAY_POOPLE.optimalSteps} steps)
                  </p>
                </details>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="how-poople-works"
            className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/75 p-6 sm:p-8"
          >
            <h2
              id="how-poople-works"
              className="text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              How the Poople Game &amp; Shortest-Path Solver Work
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300 sm:text-base">
              <p>
                Inspired by Lewis Carroll&apos;s classic word-ladder puzzle and popularized alongside
                Krillion and{" "}
                <Link href="/noillirk/" className="font-semibold text-amber-300 hover:underline">
                  Noillirk
                </Link>{" "}
                in Daily Dles browser streams, the <strong>Poople game</strong> gives you a random or
                daily four-letter word and challenges you to reach <strong>POOP</strong> in the
                smallest possible number of single-letter substitutions.
              </p>
              <p>
                Every move must obey three strict rules: change <strong>exactly one letter</strong>{" "}
                per step, preserve word length at four characters (no anagrams or insertions), and
                form a recognized standard English word. Unlike bare-bones single-round clones that
                kick you out after one puzzle per 24 hours, <strong>Poople Unlimited</strong> lets you
                drill random starts indefinitely, undo missteps, inspect letter-position nudges, or
                benchmark your intuition against an unweighted{" "}
                <strong>Breadth-First Search (BFS)</strong> shortest-path graph solver.
              </p>
              <div className="grid gap-4 pt-2 md:grid-cols-3">
                <div className="rounded-xl border border-cyan-500/15 bg-[#041425] p-4">
                  <Compass className="h-5 w-5 text-cyan-300" />
                  <h3 className="mt-2 font-bold text-white">100% Connected Corpus</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    Every one of the {poopleData.dictionary.length.toLocaleString()} words in our graph
                    is pre-verified to connect back to POOP without dead ends or archaic Scrabble filler.
                  </p>
                </div>
                <div className="rounded-xl border border-cyan-500/15 bg-[#041425] p-4">
                  <Flame className="h-5 w-5 text-amber-300" />
                  <h3 className="mt-2 font-bold text-white">Sub-Millisecond BFS Par</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    Live progressive hints recompute from wherever you currently stand—not just the
                    original start—so recovering from a detour still finds the fastest exit.
                  </p>
                </div>
                <div className="rounded-xl border border-cyan-500/15 bg-[#041425] p-4">
                  <Layers className="h-5 w-5 text-emerald-300" />
                  <h3 className="mt-2 font-bold text-white">Shareable Emoji Ladders</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    Every completed ladder generates a spoiler-safe green/yellow letter lock grid
                    comparing your step count against mathematical BFS par.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="best-bridge-words"
            className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/75 p-6 sm:p-8"
          >
            <h2
              id="best-bridge-words"
              className="text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              Best Bridge Words to Reach POOP in 3–4 Steps
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              Mastering Poople boils down to routing toward high-degree double-<code>O</code> bridges
              rather than chasing low-frequency letter swaps near position #1:
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {HUB_FAMILIES.map((item) => (
                <div
                  key={item.family}
                  className="rounded-xl border border-amber-400/20 bg-[#03111f] p-4"
                >
                  <h3 className="font-bold text-amber-200">{item.family}</h3>
                  <p className="mt-1 font-mono text-xs font-bold text-cyan-300">{item.examples}</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">{item.why}</p>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="poople-packs-heading">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <h2
                id="poople-packs-heading"
                className="text-xl font-extrabold tracking-tight text-white sm:text-2xl"
              >
                Explore Any Krillion Topic Packs
              </h2>
              <Link
                href="/games-like-krillion/"
                className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"
              >
                Compare All 9 Daily Dles Games →
              </Link>
            </div>
            <TopicPacksGrid excludeHref="/poople-unlimited/" />
          </section>

          <section aria-labelledby="poople-faq-heading">
            <h2
              id="poople-faq-heading"
              className="mb-4 text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              Poople Unlimited FAQ
            </h2>
            <FaqAccordion faqs={FAQS} />
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
