import type { Metadata } from "next";
import Link from "next/link";
import PackPageShell from "@/components/PackPageShell";
import { DAILY_BOARDS, getPromptsByPack } from "@/lib/datasets";

export const metadata: Metadata = {
  title: "NBA Krillion — Basketball Rarity Trivia Game Free | AnyKrillion",
  description:
    "Challenge yourself with NBA Krillion online. Name obscure NBA players, draft picks, All-Stars, and championship rosters to hit One in a Krillion scores.",
  alternates: {
    canonical: "/nba-krillion/",
  },
  openGraph: {
    title: "NBA Krillion — Basketball Rarity Trivia Game Free | AnyKrillion",
    description:
      "Play NBA Krillion & Hoopillion basketball rarity trivia free online across NBA champions, MVPs, draft classes, and All-Star rosters.",
    url: "https://anykrillion.com/nba-krillion/",
  },
};

const FAQS = [
  {
    question: "What NBA categories appear in NBA Krillion?",
    answer:
      "Our 20 basketball prompts span NBA Finals champions, Finals MVPs, regular-season MVPs, #1 overall NBA Draft picks, 10x All-Stars, 50-point scorers, Hall of Fame big men, Sixth Man of the Year winners, and franchise icons.",
  },
  {
    question: "Is NBA Krillion the same as Krillion Basketball or Hoopillion?",
    answer:
      "Yes! Players search for this vertical under NBA Krillion, Krillion Basketball, Ballium, and Hoopillion. Every round runs on the same rarity engine where forgotten starters and historic draft picks outscore modern superstars.",
  },
  {
    question: "Do player nicknames or hyphenated NBA names work?",
    answer:
      "Yes—common spellings like Shaq, Kareem, Giannis, Jokic (without diacritics), and Amare Stoudemire are accepted cleanly via alias tables and typo matching.",
  },
];

export default function NbaKrillionPage() {
  const nbaPrompts = getPromptsByPack("nba");
  const totalAnswers = nbaPrompts.reduce((sum, p) => sum + p.answers.length, 0);

  return (
    <PackPageShell
      canonicalUrl="https://anykrillion.com/nba-krillion/"
      pageTitle="NBA Krillion — Basketball Rarity Trivia Game Free | AnyKrillion"
      pageDescription="Challenge yourself with NBA Krillion online. Name obscure NBA players, draft picks, All-Stars, and championship rosters to hit One in a Krillion scores."
      h1="NBA Krillion: Play Basketball Rarity Trivia Online"
      heroSubtitle={`Drain deep-cut buzzer beaters across ${nbaPrompts.length} NBA trivia prompts and ${totalAnswers.toLocaleString()} verified players, champions, and draft legends.`}
      badgeText={`NBA Pack • ${nbaPrompts.length} Prompts • Basketball Rarity`}
      quickLinks={[
        { href: "/krillion-sports/", label: "Krillion Sports" },
        { href: "/footbillion/", label: "Footbillion" },
        { href: "/", label: "All-Pack Unlimited" },
      ]}
      breadcrumbs={[
        { name: "Krillion Unlimited", url: "https://anykrillion.com/" },
        { name: "NBA Krillion", url: "https://anykrillion.com/nba-krillion/" },
      ]}
      gameSchema={{
        name: "NBA Krillion — Basketball Rarity Trivia",
        description:
          "Play NBA Krillion free online: test your basketball knowledge on draft picks, MVPs, Finals champions, and Hall of Fame rosters.",
        genre: "Sports Trivia Game",
        keywords: [
          "nba krillion",
          "krillion basketball",
          "hoopillion",
          "ballium",
        ],
      }}
      prompts={nbaPrompts}
      dailyBoards={DAILY_BOARDS}
      defaultMode="unlimited"
      defaultPack="nba"
      allowModeSwitch={true}
      allowPackFilter={false}
      excludePackHref="/nba-krillion/"
      engineSectionTitle="Play NBA Krillion & Hoopillion Unlimited"
      faqHeading="NBA Krillion FAQ"
      faqs={FAQS}
      sections={[
        {
          id: "draft-championship-prompts",
          heading: "Draft Classes, Championships & Career Stat Prompts",
          body: (
            <>
              <p>
                True basketball heads shine when a prompt asks for a{" "}
                <em>#1 overall NBA Draft pick since 1980</em>, an <em>NBA Defensive Player of the Year</em>,
                or a <em>player with 1+ NBA championship and 10+ All-Star nods</em>. Reaching immediately
                for LeBron James, Michael Jordan, or Stephen Curry keeps your streak alive, but costs
                massive points in the <strong>Plankton</strong> shallow end.
              </p>
              <p>
                Dig deeper into 1970s/1980s Finals MVPs, overlooked 1990s All-NBA centers, or early-2000s
                scoring champions to cash in <strong>85–100 One in a Krillion</strong> points. Want
                more pro sports? Check{" "}
                <Link href="/krillion-sports/" className="font-semibold text-cyan-300 hover:underline">
                  Krillion Sports
                </Link>{" "}
                and{" "}
                <Link href="/footbillion/" className="font-semibold text-cyan-300 hover:underline">
                  Footbillion
                </Link>
                .
              </p>
            </>
          ),
        },
        {
          id: "nba-player-rarity-weighted",
          heading: "How NBA Player Rarity Is Weighted",
          includeRarityTable: true,
          body: (
            <p>
              Player and franchise rarity scores reflect cultural visibility, modern highlight
              dominance, All-Star/MVP hardware frequency, and historical distance. Modern faces of the
              league score near 10–19 points, while ABA-era icons, pre-1985 champions, and less-heralded
              draft top picks claim the deepest trench multiplier.
            </p>
          ),
        },
      ]}
    />
  );
}
