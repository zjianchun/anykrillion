import type { Metadata } from "next";
import Link from "next/link";
import PackPageShell from "@/components/PackPageShell";
import { DAILY_BOARDS, getPromptsByPack } from "@/lib/datasets";

export const metadata: Metadata = {
  title: "Krillion Sports — Play Sports Rarity Trivia Online | AnyKrillion",
  description:
    "Test your sports knowledge in Krillion Sports. Name rare athletes, champions, and records across football, basketball, Olympics, and more with endless rounds.",
  alternates: {
    canonical: "/krillion-sports/",
  },
  openGraph: {
    title: "Krillion Sports — Play Sports Rarity Trivia Online | AnyKrillion",
    description:
      "Play Krillion Sports free online with endless rounds across Olympic hosts, tennis majors, F1 champions, NFL, MLB, and NHL trivia.",
    url: "https://anykrillion.com/krillion-sports/",
  },
};

const FAQS = [
  {
    question: "Which sports leagues and competitions are inside Krillion Sports?",
    answer:
      "Krillion Sports spans multi-sport global competitions including Summer & Winter Olympic hosts, Grand Slam tennis champions, Formula 1 Constructors and Drivers Champions, NFL Super Bowl winners, MLB World Series franchises, NHL Stanley Cup teams, and Masters golf legends.",
  },
  {
    question: "How long is the timer in Krillion Sports?",
    answer:
      "All-around Sports rounds default to 35 seconds so you have enough breathing room to type hyphenated athlete names, Formula 1 legends, or historical Olympic cities—and you can toggle Relaxed untimed mode anytime.",
  },
  {
    question: "Where should I play football-only or NBA-only Krillion packs?",
    answer:
      "For dedicated soccer squads visit /footbillion/ (powered by the Fjelstul World Cup dataset), and for pure basketball draft picks and All-Stars visit /nba-krillion/.",
  },
  {
    question: "Does Krillion Sports support typo tolerance for foreign athlete names?",
    answer:
      "Yes! Accents (like Djokovic, Raikkonen, or Nadal) and minor spelling slips match automatically via Levenshtein distance without spoiling unseen roster answers.",
  },
];

export default function KrillionSportsPage() {
  const sportsPrompts = getPromptsByPack("sports");
  const totalAnswers = sportsPrompts.reduce((sum, p) => sum + p.answers.length, 0);

  return (
    <PackPageShell
      canonicalUrl="https://anykrillion.com/krillion-sports/"
      pageTitle="Krillion Sports — Play Sports Rarity Trivia Online | AnyKrillion"
      pageDescription="Test your sports knowledge in Krillion Sports. Name rare athletes, champions, and records across football, basketball, Olympics, and more with endless rounds."
      h1="Krillion Sports: Endless Sports Rarity Trivia Game"
      heroSubtitle={`Dive into ${sportsPrompts.length} multi-sport rarity prompts and ${totalAnswers.toLocaleString()} verified champions across Olympics, F1, Tennis Grand Slams, NFL, MLB, NHL, and global athletics.`}
      badgeText={`Sports Pack • ${sportsPrompts.length} Prompts • 35s Match Timer`}
      quickLinks={[
        { href: "/footbillion/", label: "Play Footbillion (Soccer)" },
        { href: "/nba-krillion/", label: "Play NBA Krillion" },
        { href: "/", label: "All-Pack Unlimited" },
      ]}
      breadcrumbs={[
        { name: "Krillion Unlimited", url: "https://anykrillion.com/" },
        { name: "Krillion Sports", url: "https://anykrillion.com/krillion-sports/" },
      ]}
      gameSchema={{
        name: "Krillion Sports — Sports Rarity Trivia",
        description:
          "Play Krillion Sports endless trivia across Olympics, Formula 1, tennis, NFL, MLB, NHL, and world sports records.",
        genre: "Sports Trivia Game",
        keywords: [
          "krillion sports",
          "sports krillion",
          "krillion for sports",
          "sports rarity trivia",
        ],
      }}
      prompts={sportsPrompts}
      dailyBoards={DAILY_BOARDS}
      defaultMode="unlimited"
      defaultPack="sports"
      allowModeSwitch={true}
      allowPackFilter={false}
      excludePackHref="/krillion-sports/"
      engineSectionTitle="Play Sports Krillion & Endless Challenges"
      faqHeading="Krillion Sports FAQ"
      faqs={FAQS}
      sections={[
        {
          id: "sports-categories-covered",
          heading: "Sports Categories Covered (Football, Basketball & More)",
          body: (
            <>
              <p>
                <strong>Krillion Sports</strong> tests breadth across the full sporting calendar
                rather than isolating a single league. One round might ask for an{" "}
                <em>Olympic host city prior to 1980</em>; the next tests whether you can name a{" "}
                <em>one-time Formula 1 Drivers Champion</em> or an <em>NHL Original Six</em> or{" "}
                <em>single-ring MLB World Series franchise</em> before your 35-second dive clock hits
                zero.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-cyan-500/20 bg-[#041425] p-4">
                  <h3 className="font-bold text-white">Olympics &amp; Golf</h3>
                  <p className="mt-1 text-xs text-slate-300">
                    Summer &amp; Winter Olympic hosts, multi-gold legends, and Masters Green Jacket
                    champions.
                  </p>
                </div>
                <div className="rounded-xl border border-cyan-500/20 bg-[#041425] p-4">
                  <h3 className="font-bold text-white">Formula 1 &amp; Tennis</h3>
                  <p className="mt-1 text-xs text-slate-300">
                    Grand Slam men&apos;s &amp; women&apos;s titleists plus historic F1 World Champions.
                  </p>
                </div>
                <div className="rounded-xl border border-cyan-500/20 bg-[#041425] p-4">
                  <h3 className="font-bold text-white">NFL, MLB &amp; NHL</h3>
                  <p className="mt-1 text-xs text-slate-300">
                    Super Bowl quarterbacks, Heisman winners, Cy Young icons, and Stanley Cup cities.
                  </p>
                </div>
                <div className="rounded-xl border border-cyan-500/20 bg-[#041425] p-4">
                  <h3 className="font-bold text-white">Dedicated Spin-Offs</h3>
                  <p className="mt-1 text-xs text-slate-300">
                    Want deeper rosters? Jump to{" "}
                    <Link href="/footbillion/" className="text-cyan-300 hover:underline">
                      Footbillion
                    </Link>{" "}
                    or{" "}
                    <Link href="/nba-krillion/" className="text-cyan-300 hover:underline">
                      NBA Krillion
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </>
          ),
        },
        {
          id: "rare-athlete-scoring",
          heading: "How Rare Athlete Scoring Is Calculated",
          includeRarityTable: true,
          body: (
            <p>
              Every sports answer is ranked by cultural prominence, title count, and mainstream search
              familiarity. Naming perennial icons like Tom Brady, Michael Jordan, or Roger Federer
              anchors the <strong>10–19 Plankton</strong> band, whereas deep-cut single-title
              champions or pre-1970 host cities climb cleanly into the{" "}
              <strong>85–100 One in a Krillion</strong> zone.
            </p>
          ),
        },
      ]}
    />
  );
}
