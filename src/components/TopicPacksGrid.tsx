import Link from "next/link";
import { ArrowRight, Compass, Film, Flame, Layers, Sparkles, Trophy, Wind } from "lucide-react";

const CARDS = [
  {
    href: "/krillion-answers-today/",
    title: "Krillion Answers Today",
    desc: "Progressive spoiler-free hints, Plankton warnings & One in a Krillion picks.",
    tag: "Updated Daily",
    icon: Sparkles,
  },
  {
    href: "/noillirk/",
    title: "Noillirk Unlimited",
    desc: "Flip the rules! Ascend in a hot-air balloon by naming the most obvious crowd answers.",
    tag: "Reverse Mode",
    icon: Wind,
  },
  {
    href: "/krillion-sports/",
    title: "Krillion Sports",
    desc: "Olympic hosts, tennis majors, F1 champions, NFL, MLB, NHL & global sports icons.",
    tag: "35s Timer",
    icon: Trophy,
  },
  {
    href: "/krillion-geography/",
    title: "Krillion Geography",
    desc: "Countries, capitals, landlocked nations, island states & border puzzles via Wikidata.",
    tag: "Open Geo DB",
    icon: Compass,
  },
  {
    href: "/pokekrillion/",
    title: "Pokekrillion",
    desc: "Generation 1–9 Pokémon rarity trivia covering types, starters, mythicals & dex gems.",
    tag: "PokéAPI v2",
    icon: Flame,
  },
  {
    href: "/footbillion/",
    title: "Footbillion",
    desc: "40-second World Cup squads, Premier League clubs & Ballon d'Or rarity challenges.",
    tag: "Fjelstul CSV",
    icon: Trophy,
  },
  {
    href: "/nba-krillion/",
    title: "NBA Krillion",
    desc: "NBA champions, MVPs, #1 draft picks, scoring leaders & franchise legends.",
    tag: "Basketball",
    icon: Flame,
  },
  {
    href: "/krillion-movies/",
    title: "Krillion Movies",
    desc: "Best Picture Oscars, acclaimed directors, Pixar classics & cinema franchises.",
    tag: "Cinema DB",
    icon: Film,
  },
  {
    href: "/poople-unlimited/",
    title: "Poople Unlimited",
    desc: "4-letter word ladder puzzle turning words into POOP + Daily Answer & BFS solver.",
    tag: "Word Ladder",
    icon: Sparkles,
  },
  {
    href: "/games-like-krillion/",
    title: "Games Like Krillion",
    desc: "Side-by-side matrix comparing all 9 rarity trivia modes and Daily Dles variants.",
    tag: "All 9 Modes",
    icon: Layers,
  },
];

export default function TopicPacksGrid({
  excludeHref,
}: {
  excludeHref?: string;
}) {
  const visibleCards = CARDS.filter((c) => c.href !== excludeHref);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {visibleCards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.href}
            href={card.href}
            className="group flex flex-col justify-between rounded-2xl border border-cyan-500/20 bg-[#06192d]/80 p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/50 hover:bg-[#08223d]"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-200">
                  {card.tag}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-white group-hover:text-cyan-200">
                {card.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                {card.desc}
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-cyan-300">
              Play Now
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
