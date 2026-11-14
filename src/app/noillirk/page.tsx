import type { Metadata } from "next";
import Link from "next/link";
import PackPageShell from "@/components/PackPageShell";
import { ALL_PROMPTS, DAILY_BOARDS, getCorpusStats } from "@/lib/datasets";

export const metadata: Metadata = {
  title: "Noillirk Unlimited — Play Reverse Krillion Game Free | AnyKrillion",
  description:
    "Play Noillirk online for free! Flip the Krillion rules, guess the most obvious popular answers, and climb the hot-air balloon leaderboard in endless mode.",
  alternates: {
    canonical: "/noillirk/",
  },
  openGraph: {
    title: "Noillirk Unlimited — Play Reverse Krillion Game Free | AnyKrillion",
    description:
      "Play Noillirk online for free! Flip Krillion upside down, pick the most obvious consensus answers, and ascend in endless mode.",
    url: "https://anykrillion.com/noillirk/",
  },
};

const FAQS = [
  {
    question: "What is Noillirk and how does it relate to Krillion?",
    answer:
      "Noillirk is simply 'Krillion' spelled backwards—the official reverse game mode where you ascend into the sky in a hot-air balloon instead of diving underwater. Instead of hunting obscure facts, you win by guessing the single most obvious mainstream answer.",
  },
  {
    question: "How does Noillirk Unlimited calculate points?",
    answer:
      "Our Noillirk scoring formula flips standard Krillion rarity using inverted score weights: 110 minus standard rarity (clamped to 10–100). A Plankton answer like France or Pikachu that earns only 10–15 points in Krillion rockets to 85–100 points in Noillirk.",
  },
  {
    question: "Can I play Noillirk with specific topic packs like Sports or Pokemon?",
    answer:
      "Yes! On this page you can keep General Trivia selected or filter the Noillirk endless canvas to Geography, Sports, Football, NBA, Movies, or Pokemon while keeping reverse hot-air balloon scoring active.",
  },
  {
    question: "Why did an obscure answer lose altitude in Noillirk mode?",
    answer:
      "Overthinking hurts your score in Noillirk! Deep-cut answers that average players rarely recall only score 10–19 penalty points here because they miss the mainstream consensus.",
  },
];

export default function NoillirkPage() {
  const stats = getCorpusStats();

  return (
    <PackPageShell
      canonicalUrl="https://anykrillion.com/noillirk/"
      pageTitle="Noillirk Unlimited — Play Reverse Krillion Game Free | AnyKrillion"
      pageDescription="Play Noillirk online for free! Flip the Krillion rules, guess the most obvious popular answers, and climb the hot-air balloon leaderboard in endless mode."
      h1="Noillirk: Play Reverse Krillion Game & Endless Mode"
      heroSubtitle={`Flip the ocean abyss upside down: Noillirk is the Krillion in reverse trivia game where the most famous crowd-favorite answer earns top points across ${stats.totalPrompts} endless prompts.`}
      badgeText="Reverse Mode • Hot-Air Balloon Ascent • Endless Play"
      quickLinks={[
        { href: "/", label: "Standard Krillion Unlimited" },
        { href: "/krillion-answers-today/", label: "Today's Answers & Traps" },
        { href: "/guides/", label: "Noillirk Playbook" },
      ]}
      breadcrumbs={[
        { name: "Krillion Unlimited", url: "https://anykrillion.com/" },
        { name: "Noillirk", url: "https://anykrillion.com/noillirk/" },
      ]}
      gameSchema={{
        name: "Noillirk Unlimited — Reverse Krillion Game",
        description:
          "Play Noillirk free online: reverse Krillion trivia where obvious mainstream consensus picks earn maximum altitude points.",
        genre: "Trivia Game",
        keywords: [
          "noillirk",
          "noillirk game",
          "noillirk unlimited",
          "noillirk daily game",
          "krillion in reverse",
        ],
      }}
      prompts={ALL_PROMPTS}
      dailyBoards={DAILY_BOARDS}
      defaultMode="noillirk"
      defaultPack="general"
      allowModeSwitch={true}
      allowPackFilter={true}
      reverseScoring={true}
      excludePackHref="/noillirk/"
      engineSectionTitle="Play Noillirk Unlimited Online"
      faqHeading="Noillirk Daily Game FAQ"
      faqs={FAQS}
      sections={[
        {
          id: "how-noillirk-works",
          heading: "How Noillirk (Krillion in Reverse) Scoring Works",
          includeRarityTable: true,
          body: (
            <>
              <p>
                In standard Krillion, naming United States, Lionel Messi, or Mario traps you in
                low-scoring <strong>Plankton</strong> territory. In the{" "}
                <strong>Noillirk game</strong>, those exact mainstream icons become{" "}
                <strong>85–100 point golden balloons</strong>. Instead of sinking toward the sea
                floor, every consensus answer inflates your hot-air balloon higher toward the{" "}
                <strong>52,000 ft Stratosphere Orbit</strong>.
              </p>
              <p>
                Under the hood, AnyKrillion reuses the same{" "}
                {stats.totalAnswers.toLocaleString()}-entity verified matrix and flips the weight on
                the fly (<code>reverseScore = clamp(110 - rarity, 10, 100)</code>). That makes{" "}
                <strong>Noillirk unlimited</strong> fast, intuitive, and surprisingly competitive:
                trying to think like 95% of human trivia players in 25 seconds is harder than it
                looks when multiple famous candidates compete for #1.
              </p>
            </>
          ),
        },
        {
          id: "top-plankton-strategies",
          heading: "Top Plankton Strategies for High Scores",
          body: (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-amber-400/20 bg-[#041425] p-4">
                <h3 className="font-bold text-amber-200">1. Trust Your First Instinct</h3>
                <p className="mt-1.5 text-sm text-slate-300">
                  Whatever example pops into your head in the first 1.5 seconds is usually top of the
                  Wikipedia and crowd-awareness curve. Do not talk yourself into a clever second pick.
                </p>
              </div>
              <div className="rounded-xl border border-amber-400/20 bg-[#041425] p-4">
                <h3 className="font-bold text-amber-200">2. Avoid Niche Technicalities</h3>
                <p className="mt-1.5 text-sm text-slate-300">
                  Micro-states, alternate spellings of secondary characters, and single-season
                  role players are score-killers in Noillirk—go for household names every fan knows.
                </p>
              </div>
              <div className="rounded-xl border border-amber-400/20 bg-[#041425] p-4">
                <h3 className="font-bold text-amber-200">3. Study Plankton Traps Daily</h3>
                <p className="mt-1.5 text-sm text-slate-300">
                  Players dodging traps in{" "}
                  <Link
                    href="/krillion-answers-today/"
                    className="font-semibold text-cyan-300 hover:underline"
                  >
                    Krillion Answers Today
                  </Link>{" "}
                  share the exact top Plankton list you want to aim <em>toward</em> in Noillirk runs.
                </p>
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
