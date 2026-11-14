import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Film, Flame, Layers, Sparkles, Trophy, Waves, Wind } from "lucide-react";
import FaqAccordion from "@/components/FaqAccordion";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import Navbar from "@/components/Navbar";
import { getCorpusStats } from "@/lib/datasets";

export const metadata: Metadata = {
  title: "Games Like Krillion — 9 Best Trivia Games | AnyKrillion",
  description:
    "Discover the best games like Krillion! Compare playable rarity trivia alternatives including Noillirk, Footbillion, Pokekrillion, NBA Krillion, and Poople.",
  alternates: {
    canonical: "/games-like-krillion/",
  },
  openGraph: {
    title: "Games Like Krillion — 9 Best Trivia Games | AnyKrillion",
    description: "Play all 9 best games like Krillion right in your browser: Noillirk reverse mode, Footbillion, Pokekrillion, NBA Krillion, Geography, Movies & Poople.",
    url: "https://anykrillion.com/games-like-krillion/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Games Like Krillion — 9 Best Trivia Games | AnyKrillion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Games Like Krillion — 9 Best Trivia Games | AnyKrillion",
    description: "Play all 9 best games like Krillion right in your browser: Noillirk reverse mode, Footbillion, Pokekrillion, NBA Krillion, Geography, Movies & Poople.",
    images: ["/og-image.png"],
  },
};

const GAMES_MATRIX = [
  {
    name: "Krillion Unlimited",
    href: "/",
    mechanic: "Ocean Dive Rarity Trivia",
    timer: "25s (or Relaxed)",
    scoring: "Rarity 10–100 (Lowest Crowd Pick Wins)",
    dataset: "General, Science, History & Culture",
    badge: "Flagship",
    icon: Waves,
  },
  {
    name: "Noillirk Unlimited",
    href: "/noillirk/",
    mechanic: "Hot-Air Balloon Reverse Trivia",
    timer: "25s (or Relaxed)",
    scoring: "110 - Rarity (#1 Obvious Pick Wins)",
    dataset: "136 Shared Verified Prompts",
    badge: "Reverse Mode",
    icon: Wind,
  },
  {
    name: "Krillion Sports",
    href: "/krillion-sports/",
    mechanic: "Multi-Sport Rarity Challenge",
    timer: "35s (or Relaxed)",
    scoring: "Rarity 10–100",
    dataset: "Olympics, NFL, NBA, Tennis, F1, MLB",
    badge: "All Sports",
    icon: Trophy,
  },
  {
    name: "Krillion Geography",
    href: "/krillion-geography/",
    mechanic: "World Countries & Map Rarity",
    timer: "25s (or Relaxed)",
    scoring: "Wikidata & Population Quantiles",
    dataset: "mledoze/countries (250 States)",
    badge: "Open Geo DB",
    icon: Compass,
  },
  {
    name: "Pokekrillion",
    href: "/pokekrillion/",
    mechanic: "Gen 1–9 Creature Rarity",
    timer: "35s (or Relaxed)",
    scoring: "Evolution & Species Prominence",
    dataset: "PokéAPI v2 (All 1,025 Pokémon)",
    badge: "Fandom",
    icon: Flame,
  },
  {
    name: "Footbillion (Goalillion)",
    href: "/footbillion/",
    mechanic: "Global Football & Club Trivia",
    timer: "40s Match Clock",
    scoring: "Squad & Cap Rarity Quantiles",
    dataset: "Fjelstul World Cup & League CSVs",
    badge: "Soccer 40s",
    icon: Trophy,
  },
  {
    name: "NBA Krillion (Hoopillion)",
    href: "/nba-krillion/",
    mechanic: "NBA Draft, MVP & Roster Rarity",
    timer: "35s (or Relaxed)",
    scoring: "All-Star & Career Prominence",
    dataset: "Official NBA Era & Draft Archives",
    badge: "Basketball",
    icon: Flame,
  },
  {
    name: "Krillion Movies",
    href: "/krillion-movies/",
    mechanic: "Oscars, Directors & Film Trivia",
    timer: "30s (or Relaxed)",
    scoring: "Audience Vote-Density Rarity",
    dataset: "Curated Film & Best Picture Archives",
    badge: "Cinema",
    icon: Film,
  },
  {
    name: "Poople Unlimited",
    href: "/poople-unlimited/",
    mechanic: "4-Letter Word Ladder to POOP",
    timer: "Untimed (Step Par)",
    scoring: "Minimum Moves vs. BFS Optimal Par",
    dataset: "1,596 Connected 4-Letter Words",
    badge: "Word Ladder",
    icon: Sparkles,
  },
];

const FAQS = [
  {
    question: "What are the best free games like Krillion to play right now?",
    answer:
      "If you love Krillion's rarity mechanic where lesser-known valid answers score higher, the closest alternatives are Noillirk (reverse scoring where mainstream consensus wins), Footbillion/Goalillion (40-second football trivia), NBA Krillion (basketball), Pokekrillion (all 1,025 Pokémon), Krillion Geography, Krillion Movies, and Daily Dles companion game Poople.",
  },
  {
    question: "Are there any Krillion alternatives without a 1-game-per-day limit?",
    answer:
      "Yes. Every single game listed in our Games Like Krillion hub runs in Unlimited Endless mode with an optional Relaxed untimed toggle—so you can run back-to-back 7-round dives, replay all 30 past Daily Dive boards in the Krillion Archive, or drill infinite Poople word ladders.",
  },
  {
    question: "What is the difference between Krillion and Noillirk?",
    answer:
      "In standard Krillion, you chase obscure One in a Krillion gems worth 85–100 points and avoid obvious Plankton picks. Noillirk spells Krillion backwards and flips the goal completely: picking the #1 most famous answer everyone else thinks of launches your hot-air balloon highest.",
  },
  {
    question: "Why are Poople and Footbillion grouped with games similar to Krillion?",
    answer:
      "Variety trivia streamers and Daily Dles communities pair Krillion, Noillirk, Footbillion, Pokekrillion, and Poople in the same daily rotation because each round finishes in under two minutes and exports spoiler-free emoji progress grids for Discord and Twitter.",
  },
];

export default function GamesLikeKrillionPage() {
  const stats = getCorpusStats();

  return (
    <>
      <JsonLd
        canonicalUrl="https://anykrillion.com/games-like-krillion/"
        pageTitle="Games Like Krillion — 9 Best Trivia Games | AnyKrillion"
        pageDescription="Discover the best games like Krillion! Compare playable rarity trivia alternatives including Noillirk, Footbillion, Pokekrillion, NBA Krillion, and Poople."
        pageType="CollectionPage"
        faqs={FAQS}
        breadcrumbs={[
          { name: "Krillion Unlimited", url: "https://anykrillion.com/" },
          { name: "Games Like Krillion", url: "https://anykrillion.com/games-like-krillion/" },
        ]}
      />

      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:pt-8">
        <header className="mb-8 rounded-2xl border border-cyan-500/25 bg-[#06192d]/85 p-6 sm:p-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
              <Layers className="h-3.5 w-3.5" />
              9 Instant-Play Alternatives • {stats.totalPrompts} Trivia Prompts + Word Ladders
            </span>
            <div className="flex flex-wrap gap-3 text-xs font-semibold text-cyan-300">
              <Link href="/" className="underline decoration-cyan-500/40 underline-offset-4 hover:text-white">
                Play Krillion Unlimited
              </Link>
              <Link
                href="/krillion-answers-today/"
                className="underline decoration-cyan-500/40 underline-offset-4 hover:text-white"
              >
                Today&apos;s Answers
              </Link>
              <Link
                href="/krillion-archive/"
                className="underline decoration-cyan-500/40 underline-offset-4 hover:text-white"
              >
                30-Day Archive
              </Link>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
            Games Like Krillion: Best Free Rarity Trivia &amp; Daily Dles Alternatives
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Finished Today&apos;s 7-question Daily Dive in under two minutes and looking for{" "}
            <strong>games like Krillion</strong> without waiting 24 hours? Launch any of these 9
            verified browser-based <strong>Krillion alternatives</strong> right here—spanning reverse
            popularity duels, 40-second football spin-offs, Pokémon, NBA, cinema, and Poople word
            ladders.
          </p>
        </header>

        <div className="space-y-10">
          <section aria-labelledby="all-alternatives-grid">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <h2
                id="all-alternatives-grid"
                className="text-xl font-extrabold tracking-tight text-white sm:text-2xl"
              >
                Play All -illion &amp; Daily Trivia Alternatives Online
              </h2>
              <span className="text-xs font-semibold text-cyan-300">
                100% Free • Typo Tolerant • No Sign-Up
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {GAMES_MATRIX.map((game) => {
                const Icon = game.icon;
                return (
                  <Link
                    key={game.href}
                    href={game.href}
                    className="group flex flex-col justify-between rounded-2xl border border-cyan-500/20 bg-[#06192d]/80 p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/50 hover:bg-[#08223d]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-200">
                          {game.badge}
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-extrabold text-white group-hover:text-cyan-200">
                        {game.name}
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-emerald-300">
                        {game.mechanic} • {game.timer}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400">
                        <strong className="text-slate-200">Scoring:</strong> {game.scoring}. Dataset:{" "}
                        {game.dataset}.
                      </p>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-cyan-300">
                      Play {game.name} Now
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section
            aria-labelledby="comparison-matrix"
            className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/80 p-6 sm:p-8"
          >
            <h2
              id="comparison-matrix"
              className="text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              Side-by-Side Comparison of Games Like Krillion
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Compare round timers, rarity math, and underlying open datasets across every{" "}
              <strong>Krillion similar game</strong> hosted on AnyKrillion:
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-cyan-500/25 text-xs uppercase tracking-wider text-cyan-300">
                    <th className="py-2.5 pr-4">Game Title</th>
                    <th className="py-2.5 pr-4">Core Mechanic</th>
                    <th className="py-2.5 pr-4">Timer / Par</th>
                    <th className="py-2.5 pr-4">Data Source</th>
                    <th className="py-2.5">Launch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {GAMES_MATRIX.map((row) => (
                    <tr key={row.href}>
                      <td className="py-3 pr-4 font-bold text-white">{row.name}</td>
                      <td className="py-3 pr-4 text-slate-300">{row.mechanic}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-amber-200">{row.timer}</td>
                      <td className="py-3 pr-4 text-xs text-slate-400">{row.dataset}</td>
                      <td className="py-3">
                        <Link
                          href={row.href}
                          className="font-semibold text-cyan-300 hover:underline"
                        >
                          Play →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section
            aria-labelledby="reverse-general-alternatives"
            className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/75 p-6 sm:p-8"
          >
            <h2
              id="reverse-general-alternatives"
              className="text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              Reverse &amp; General Trivia Alternatives (Krillion Unlimited &amp; Noillirk)
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              <p>
                What separates true <strong>games similar to Krillion</strong> from ordinary Pub Quiz
                or Sporcle lists is <em>open-ended rarity calibration</em>. Rather than asking for one
                pre-fixed right answer, every prompt accepts dozens to hundreds of valid entities and
                scores you strictly on how uncommon your recall is under a shrinking countdown.
              </p>
              <p>
                Our flagship{" "}
                <Link href="/" className="font-semibold text-cyan-300 hover:underline">
                  Krillion Unlimited
                </Link>{" "}
                removes the daily 7-question cap completely, adding smart typo tolerance and an
                optional Relaxed mode for stress-free practice. When your brain gets tired of hunting
                hyper-obscure facts, flip to{" "}
                <Link href="/noillirk/" className="font-semibold text-amber-300 hover:underline">
                  Noillirk
                </Link>
                —the official mirror edition where naming the #1 crowd favorite raises your hot-air
                balloon to 52,000 ft.
              </p>
            </div>
          </section>

          <section
            aria-labelledby="sports-alternatives"
            className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/75 p-6 sm:p-8"
          >
            <h2
              id="sports-alternatives"
              className="text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              Sports, Football &amp; Basketball Alternatives (Footbillion &amp; NBA Krillion)
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              <p>
                Sports fans drive the fastest-growing branch of the <code>-illion</code> trivia
                ecosystem.{" "}
                <Link href="/footbillion/" className="font-semibold text-cyan-300 hover:underline">
                  Footbillion
                </Link>{" "}
                (also searched as <strong>Goalillion</strong>) expands the timer to 40 seconds so you
                can dig deep into FIFA World Cup rosters, Premier League legends, and European club
                alumni backed by Fjelstul open match datasets.
              </p>
              <p>
                North American hoop heads get the same statistical rigor on{" "}
                <Link href="/nba-krillion/" className="font-semibold text-cyan-300 hover:underline">
                  NBA Krillion
                </Link>
                , filtering out obvious modern superstars in favor of vintage #1 draft picks and
                conference finals MVPs—while{" "}
                <Link href="/krillion-sports/" className="font-semibold text-cyan-300 hover:underline">
                  Krillion Sports
                </Link>{" "}
                mixes Olympic hosts, Formula 1, tennis majors, NFL, MLB, and NHL into one endless
                sports deck.
              </p>
            </div>
          </section>

          <section
            aria-labelledby="fandom-word-alternatives"
            className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/75 p-6 sm:p-8"
          >
            <h2
              id="fandom-word-alternatives"
              className="text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              Fandom, Geography, Cinema &amp; Word Ladder Alternatives
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              <p>
                Beyond traditional sports and general knowledge, three specialty spin-offs dominate
                streamer playlists:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-white">Fandom &amp; Cinema:</strong>{" "}
                  <Link href="/pokekrillion/" className="font-semibold text-cyan-300 hover:underline">
                    Pokekrillion
                  </Link>{" "}
                  tests Gen 1–9 dex recall across 1,025 Pokémon, while{" "}
                  <Link
                    href="/krillion-movies/"
                    className="font-semibold text-cyan-300 hover:underline"
                  >
                    Krillion Movies
                  </Link>{" "}
                  mines Oscar Best Pictures, cult directors, and animation catalogs.
                </li>
                <li>
                  <strong className="text-white">World Atlas Rarity:</strong>{" "}
                  <Link
                    href="/krillion-geography/"
                    className="font-semibold text-cyan-300 hover:underline"
                  >
                    Krillion Geography
                  </Link>{" "}
                  uses sovereign country populations, borders, and capital cities to reward micro-state
                  mastery over obvious superpowers.
                </li>
                <li>
                  <strong className="text-white">Daily Dles Word Ladders:</strong>{" "}
                  <Link
                    href="/poople-unlimited/"
                    className="font-semibold text-amber-300 hover:underline"
                  >
                    Poople Unlimited
                  </Link>{" "}
                  replaces trivia rarity with rapid 4-letter English word transformations into{" "}
                  <code>POOP</code>, complete with Today&apos;s Daily Answer and an instant BFS solver.
                </li>
              </ul>
            </div>
          </section>

          <section aria-labelledby="games-like-faq-heading">
            <h2
              id="games-like-faq-heading"
              className="mb-4 text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              Games Like Krillion FAQ
            </h2>
            <FaqAccordion faqs={FAQS} />
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
