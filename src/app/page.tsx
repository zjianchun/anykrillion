import type { Metadata } from "next";
import Link from "next/link";
import PackPageShell from "@/components/PackPageShell";
import { ALL_PROMPTS, DAILY_BOARDS, getCorpusStats } from "@/lib/datasets";

export const metadata: Metadata = {
  title: "Krillion Unlimited — Play Free Trivia Game | AnyKrillion",
  description:
    "Play Krillion Unlimited free online with endless trivia rounds, smart typo tolerance, and Today's 7-question Daily Dive. Chase One in a Krillion answers now.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Krillion Unlimited — Play Free Trivia Game | AnyKrillion",
    description: "Play Krillion Unlimited free online with endless trivia rounds, smart typo tolerance, and Today's 7-question Daily Dive.",
    url: "https://anykrillion.com/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Krillion Unlimited — Play Free Trivia Game | AnyKrillion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Krillion Unlimited — Play Free Trivia Game | AnyKrillion",
    description: "Play Krillion Unlimited free online with endless trivia rounds, smart typo tolerance, and Today's 7-question Daily Dive.",
    images: ["/og-image.png"],
  },
};

const FAQS = [
  {
    question: "How is Krillion Unlimited different from the daily Krillion game?",
    answer:
      "The standard daily Krillion format caps you at one 7-question board every 24 hours. Krillion Unlimited on AnyKrillion lets you dive through endless 7-prompt rounds non-stop across General Trivia, Geography, Sports, Football, NBA, Movies, and Pokemon, with instant mode switching to Today's Daily Dive whenever you want.",
  },
  {
    question: "What does One in a Krillion mean?",
    answer:
      "One in a Krillion is the highest score tier (85 to 100 points per round), awarded when you name a verified valid answer in the deepest obscurity band of our precomputed dataset rather than picking a crowded Plankton answer.",
  },
  {
    question: "What happens if I misspell a rare answer under the 25-second timer?",
    answer:
      "AnyKrillion includes smart accent-insensitive normalization and Levenshtein typo tolerance, plus a non-spoiler spell-check assist chip when a typed guess closely matches an accepted entity without revealing unseen answers.",
  },
  {
    question: "What are the Krillion rules for endless and relaxed mode?",
    answer:
      "Every dive consists of 7 prompts. Standard mode gives 25 seconds per prompt (or 35–40s on deep sports/football rounds). Toggle Relaxed Mode if you prefer untimed casual brainstorming while learning obscure trivia.",
  },
  {
    question: "Can I also play Noillirk or check today's Krillion answers?",
    answer:
      "Yes! Use the Noillirk tab directly inside the game canvas or visit /noillirk/ to play Krillion in reverse, and check /krillion-answers-today/ for spoiler-free hints and Plankton traps.",
  },
];

export default function HomePage() {
  const stats = getCorpusStats();

  return (
    <PackPageShell
      canonicalUrl="https://anykrillion.com/"
      pageTitle="Krillion Unlimited — Play Free Trivia Game | AnyKrillion"
      pageDescription="Play Krillion Unlimited free online with endless trivia rounds, smart typo tolerance, and Today's 7-question Daily Dive. Chase One in a Krillion answers now."
      isRoot={true}
      h1="Krillion Unlimited: Free Endless & Daily Dive Trivia Game"
      heroSubtitle={`Play endless 7-prompt rarity dives or tackle Today's Daily Dive across ${stats.totalPrompts} curated prompts and ${stats.totalAnswers.toLocaleString()} verified answers — no waiting 24 hours.`}
      badgeText={`Endless Mode • ${stats.totalPrompts} Prompts • ${stats.totalAnswers.toLocaleString()} Entities`}
      quickLinks={[
        { href: "/krillion-answers-today/", label: "Today's Answers & Hints" },
        { href: "/daily-orbs-hint/", label: "Daily Orbs Hints & Sandbox" },
        { href: "/noillirk/", label: "Play Noillirk Reverse" },
        { href: "/krillion-archive/", label: "30-Day Archive" },
      ]}
      breadcrumbs={[{ name: "Krillion Unlimited", url: "https://anykrillion.com/" }]}
      gameSchema={{
        name: "Krillion Unlimited — AnyKrillion",
        description:
          "Play Krillion Unlimited, Today's Daily Dive, and Noillirk reverse rarity trivia free online with smart typo tolerance.",
        genre: "Trivia Game",
        keywords: [
          "krillion unlimited",
          "krillion game",
          "krillion endless",
          "krillion daily dive",
          "krillion rules",
          "noillirk",
        ],
      }}
      prompts={ALL_PROMPTS}
      dailyBoards={DAILY_BOARDS}
      defaultMode="unlimited"
      defaultPack="general"
      allowModeSwitch={true}
      allowPackFilter={true}
      engineSectionTitle="Play Endless Krillion Game Online"
      faqHeading="Krillion Unlimited FAQ"
      faqs={FAQS}
      topicPacksHeading="Explore Any Krillion Topic Packs"
      sections={[
        {
          id: "krillion-rules-scoring",
          heading: "How Krillion Rules & Rarity Scoring Work",
          includeRarityTable: true,
          body: (
            <>
              <p>
                Every round of the <strong>Krillion game</strong> drops your submarine deeper into the
                ocean across 7 themed trivia prompts. Unlike traditional quizzes that only ask whether
                an answer is right or wrong, <strong>Krillion Unlimited</strong> rewards{" "}
                <em>how obscure</em> your valid answer is. Under a brisk default{" "}
                <strong>25-second timer</strong>, surface-level crowd favorites earn 10–19{" "}
                <strong>Plankton</strong> points, while deep-cut knowledge scores{" "}
                <strong>85–100 One in a Krillion</strong> points—pushing your dive toward a 700-point
                perfect run down to the Hadal Trench (-10,994m).
              </p>
              <p>
                All rarity scores on AnyKrillion are precomputed from reproducible open datasets—covering
                geographic translation breadth, PokéAPI generation baselines, Fjelstul FIFA World Cup
                squads, NBA championship rosters, and verified cinema recognition metrics—so an obscure
                pick genuinely reflects real-world rarity rather than guesswork. See our{" "}
                <Link href="/sources/" className="font-semibold text-cyan-300 hover:underline">
                  open dataset methodology
                </Link>{" "}
                or read the{" "}
                <Link href="/guides/" className="font-semibold text-cyan-300 hover:underline">
                  rarity scoring strategy guide
                </Link>
                .
              </p>
            </>
          ),
        },
        {
          id: "unlimited-vs-daily-dive",
          heading: "Switch Between Unlimited & Daily Dive Mode",
          body: (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-cyan-500/20 bg-[#041425] p-4">
                  <h3 className="font-bold text-white">Krillion Unlimited (Endless)</h3>
                  <p className="mt-1.5 text-sm text-slate-300">
                    Replay nonstop 7-question runs across any category pack—perfect for solo practice,
                    live stream streaks, and testing obscure One in a Krillion picks without daily locks.
                  </p>
                </div>
                <div className="rounded-xl border border-cyan-500/20 bg-[#041425] p-4">
                  <h3 className="font-bold text-white">Today&apos;s Daily Dive</h3>
                  <p className="mt-1.5 text-sm text-slate-300">
                    Compete on the shared daily 7-prompt board and generate an emoji depth grid to share
                    with friends. Need a nudge? Check{" "}
                    <Link
                      href="/krillion-answers-today/"
                      className="font-semibold text-cyan-300 hover:underline"
                    >
                      Krillion Answers Today
                    </Link>
                    .
                  </p>
                </div>
                <div className="rounded-xl border border-cyan-500/20 bg-[#041425] p-4">
                  <h3 className="font-bold text-white">Smart Typo Tolerance + Hints</h3>
                  <p className="mt-1.5 text-sm text-slate-300">
                    Accents, punctuation, and small keyboard slips are absorbed automatically, while 3
                    progressive spoiler-free hints help crack unfamiliar categories before time expires.
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-400">
                Looking to play with the scoreboard flipped upside down? Switch the canvas mode tab to{" "}
                <Link href="/noillirk/" className="font-semibold text-amber-300 hover:underline">
                  Noillirk Reverse Mode
                </Link>{" "}
                where naming the #1 most obvious Plankton pick scores 100 points and launches your
                hot-air balloon into the stratosphere.
              </p>
            </>
          ),
        },
        {
          id: "krillion-strategy-open-data",
          heading: "Krillion Strategy & Open Dataset Transparency",
          body: (
            <>
              <p>
                Winning consistently in <strong>Krillion Unlimited</strong> comes down to mental
                branching: instead of blurting out the capital city, starter Pokémon, or household
                MVP that 80% of players type first, scan one era deeper—think pre-1990 tournament
                rosters, middle-stage evolutions, island microstates, or character-actor Oscar
                nominees. Each valid pick locks in your dive depth before the countdown reaches
                zero, rewarding breadth of memory rather than lucky guessing.
              </p>
              <p>
                Every prompt on AnyKrillion runs 100% locally in your browser against precomputed
                rarity tiers verified from open, auditable knowledge bases including{" "}
                <a
                  href="https://www.wikidata.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-cyan-300 hover:underline"
                >
                  Wikidata
                </a>{" "}
                and{" "}
                <a
                  href="https://pokeapi.co/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-cyan-300 hover:underline"
                >
                  PokéAPI
                </a>
                , as well as public sports and geography catalogs. Want full methodology notes or
                deep category playbooks? Read our{" "}
                <Link href="/sources/" className="font-semibold text-cyan-300 hover:underline">
                  Open Data Sources
                </Link>{" "}
                and{" "}
                <Link href="/guides/" className="font-semibold text-cyan-300 hover:underline">
                  Krillion Strategy Guides
                </Link>{" "}
                to push past 600+ points per 7-round dive and challenge friends with your exact
                board seed. Every round records your depth curve, tier badges, and personal best
                locally without logins or paywalls—so whether you are chasing a top-100 rarity
                streak or practicing for Daily Dles streams, you can launch a fresh 7-prompt dive
                in one click from desktop or mobile.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
