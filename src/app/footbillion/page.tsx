import type { Metadata } from "next";
import Link from "next/link";
import PackPageShell from "@/components/PackPageShell";
import { DAILY_BOARDS, getPromptsByPack } from "@/lib/datasets";

export const metadata: Metadata = {
  title: "Footbillion — Play Football Krillion & Goalillion Trivia | AnyKrillion",
  description:
    "Play Footbillion free online! Guess rare World Cup, Premier League, and Champions League players within 40 seconds using verified open football records.",
  alternates: {
    canonical: "/footbillion/",
  },
  openGraph: {
    title: "Footbillion — Play Football Krillion & Goalillion Trivia | AnyKrillion",
    description:
      "Play Footbillion & Goalillion soccer rarity trivia free online with World Cup squads, Premier League clubs, and Champions League icons.",
    url: "https://anykrillion.com/footbillion/",
  },
};

const FAQS = [
  {
    question: "How is Footbillion different from standard Krillion?",
    answer:
      "Footbillion (closely related to Goalillion and Football Krillion) focuses 100% on world football / soccer. Prompts give you a generous 40-second match clock so you have time to type multi-word player surnames from classic World Cup squads and Premier League clubs.",
  },
  {
    question: "Where do Footbillion player rosters come from?",
    answer:
      "All World Cup national squad appearances, tournament appearances, goalscorers, and goalkeeper records are extracted from Joshua Fjelstul's open-source FIFA World Cup Database (1930–2022) paired with verified club and continental honors.",
  },
  {
    question: "Can I type just a famous footballer's surname or without accents?",
    answer:
      "Yes! Last names and accent-stripped spellings (such as Muller, Ozil, Zidane, Pele, or Modric) match smoothly whenever indexed as aliases, alongside gentle spell-check assistance.",
  },
  {
    question: "Looking for NBA, Olympics, or F1 sports rarity trivia too?",
    answer:
      "Try Krillion Sports (/krillion-sports/) for multi-sport Olympics, F1, Tennis, NFL, and MLB trivia, or NBA Krillion (/nba-krillion/) for pure basketball prompts.",
  },
];

export default function FootbillionPage() {
  const footballPrompts = getPromptsByPack("football");
  const totalAnswers = footballPrompts.reduce((sum, p) => sum + p.answers.length, 0);

  return (
    <PackPageShell
      canonicalUrl="https://anykrillion.com/footbillion/"
      pageTitle="Footbillion — Play Football Krillion & Goalillion Trivia | AnyKrillion"
      pageDescription="Play Footbillion free online! Guess rare World Cup, Premier League, and Champions League players within 40 seconds using verified open football records."
      h1="Footbillion: Football Krillion & Goalillion Trivia Game"
      heroSubtitle={`Test your pitch memory across ${footballPrompts.length} football prompts and ${totalAnswers.toLocaleString()} verified players & clubs—powered by Fjelstul FIFA World Cup CSV records and a 40-second match clock.`}
      badgeText={`Footbillion • ${footballPrompts.length} Prompts • ${totalAnswers.toLocaleString()} Players & Clubs • 40s Timer`}
      quickLinks={[
        { href: "/krillion-sports/", label: "Krillion Sports" },
        { href: "/nba-krillion/", label: "NBA Krillion" },
        { href: "/sources/", label: "Fjelstul CSV Attribution" },
      ]}
      breadcrumbs={[
        { name: "Krillion Unlimited", url: "https://anykrillion.com/" },
        { name: "Footbillion", url: "https://anykrillion.com/footbillion/" },
      ]}
      gameSchema={{
        name: "Footbillion — Football Krillion & Goalillion Trivia",
        description:
          "Play Footbillion & Goalillion soccer rarity trivia online with World Cup squads, UEFA Champions League winners, and club records.",
        genre: "Sports Trivia Game",
        keywords: [
          "footbillion",
          "goalillion",
          "football krillion",
          "krillion soccer",
        ],
      }}
      prompts={footballPrompts}
      dailyBoards={DAILY_BOARDS}
      defaultMode="unlimited"
      defaultPack="football"
      allowModeSwitch={true}
      allowPackFilter={false}
      excludePackHref="/footbillion/"
      engineSectionTitle="Play Footbillion & Goalillion Unlimited"
      faqHeading="Footbillion FAQ"
      faqs={FAQS}
      sections={[
        {
          id: "world-cup-club-datasets",
          heading: "World Cup, Premier League & Club Squad Datasets",
          body: (
            <>
              <p>
                <strong>Footbillion</strong> (built for fans of <em>Goalillion</em> and{" "}
                <em>Football Krillion</em>) challenges you to think past the front page of world
                soccer. Our precomputed open football ETL ingests{" "}
                <strong>10,401 World Cup players across 30 men&apos;s and women&apos;s tournaments</strong>{" "}
                from the Fjelstul World Cup Database—covering everything from Brazil, Argentina,
                France, England, Germany, and Spain national squads to Champions League title clubs
                and Ballon d&apos;Or nominees.
              </p>
              <p>
                Every valid backup fullback or third-string goalkeeper who featured in an official
                World Cup squad roster gives you a shot at a genuine{" "}
                <strong>85–100 One in a Krillion</strong> pick!
              </p>
            </>
          ),
        },
        {
          id: "scoring-40s-match-rules",
          heading: "Scoring & 40-Second Match Timer Rules",
          includeRarityTable: true,
          body: (
            <p>
              Unlike 25-second general rounds, Footbillion awards <strong>40 seconds per prompt</strong>{" "}
              (with Relaxed mode always one click away). Superstar icons like Messi, Cristiano Ronaldo,
              Mbappé, and Pelé score <strong>10–19 Plankton points</strong> because they appear across
              every highlight reel—whereas multi-tournament squad veterans and deep-cut Premier League
              scorers propel you into the Hadal Trench. Want more American pro leagues? Head to{" "}
              <Link href="/nba-krillion/" className="font-semibold text-cyan-300 hover:underline">
                NBA Krillion
              </Link>{" "}
              or{" "}
              <Link href="/krillion-sports/" className="font-semibold text-cyan-300 hover:underline">
                Krillion Sports
              </Link>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
