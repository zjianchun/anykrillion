import Link from "next/link";
import {
  ArrowRight,
  Award,
  CircleDot,
  Compass,
  Film,
  Flame,
  Grid3x3,
  Layers,
  Sparkles,
  Trophy,
  Wind,
  Zap,
} from "lucide-react";

interface TopicCard {
  href: string;
  title: string;
  desc: string;
  tag: string;
  ctaLabel?: string;
  icon: typeof Sparkles;
  cardCls: string;
  iconCls: string;
  tagCls: string;
  ctaCls: string;
}

const CARDS: TopicCard[] = [
  {
    href: "/krillion-answers-today/",
    title: "Krillion Answers Today",
    desc: "Progressive spoiler-free hints, Plankton warnings & One in a Krillion picks.",
    tag: "Daily Hints",
    icon: Sparkles,
    cardCls: "border-cyan-500/25 hover:border-cyan-400/60",
    iconCls: "bg-cyan-500/15 text-cyan-300",
    tagCls: "border-cyan-400/25 bg-cyan-500/10 text-cyan-200",
    ctaCls: "text-cyan-300",
  },
  {
    href: "/daily-orbs-hint/",
    title: "Daily Orbs Hints & Sandbox",
    desc: "Interactive 4-Orb practice board, zero-spoiler nudges, and today's verified solutions.",
    tag: "Live Daily · 4 Orbs",
    ctaLabel: "Open Sandbox & Hints",
    icon: CircleDot,
    cardCls:
      "border-purple-500/30 bg-gradient-to-br from-[#081d34] via-[#06192d] to-[#14132a] hover:border-orange-400/60",
    iconCls: "bg-gradient-to-br from-orange-500/25 to-purple-500/25 text-orange-200",
    tagCls: "border-orange-400/35 bg-orange-500/15 text-orange-200",
    ctaCls: "text-orange-300",
  },
  {
    href: "/noillirk/",
    title: "Noillirk Unlimited",
    desc: "Flip the rules! Ascend in a hot-air balloon by naming the most obvious crowd answers.",
    tag: "Reverse Mode",
    icon: Wind,
    cardCls: "border-amber-500/25 hover:border-amber-400/60",
    iconCls: "bg-amber-500/15 text-amber-300",
    tagCls: "border-amber-400/25 bg-amber-500/10 text-amber-200",
    ctaCls: "text-amber-300",
  },
  {
    href: "/krillion-sports/",
    title: "Krillion Sports",
    desc: "Olympic hosts, tennis majors, F1 champions, NFL, MLB, NHL & global sports icons.",
    tag: "35s · All Sports",
    icon: Trophy,
    cardCls: "border-emerald-500/25 hover:border-emerald-400/60",
    iconCls: "bg-emerald-500/15 text-emerald-300",
    tagCls: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
    ctaCls: "text-emerald-300",
  },
  {
    href: "/krillion-geography/",
    title: "Krillion Geography",
    desc: "Countries, capitals, landlocked nations, island states & border puzzles.",
    tag: "195+ Nations",
    icon: Compass,
    cardCls: "border-sky-500/25 hover:border-sky-400/60",
    iconCls: "bg-sky-500/15 text-sky-300",
    tagCls: "border-sky-400/25 bg-sky-500/10 text-sky-200",
    ctaCls: "text-sky-300",
  },
  {
    href: "/pokekrillion/",
    title: "Pokekrillion",
    desc: "Generation 1–9 Pokémon rarity trivia covering types, starters, mythicals & dex gems.",
    tag: "Gen 1–9",
    icon: Zap,
    cardCls: "border-yellow-500/25 hover:border-yellow-400/60",
    iconCls: "bg-yellow-500/15 text-yellow-300",
    tagCls: "border-yellow-400/25 bg-yellow-500/10 text-yellow-200",
    ctaCls: "text-yellow-300",
  },
  {
    href: "/footbillion/",
    title: "Footbillion",
    desc: "40-second World Cup squads, Premier League clubs & Ballon d'Or rarity challenges.",
    tag: "40s · World Cup",
    icon: Award,
    cardCls: "border-lime-500/25 hover:border-lime-400/60",
    iconCls: "bg-lime-500/15 text-lime-300",
    tagCls: "border-lime-400/25 bg-lime-500/10 text-lime-200",
    ctaCls: "text-lime-300",
  },
  {
    href: "/nba-krillion/",
    title: "NBA Krillion",
    desc: "NBA champions, MVPs, #1 draft picks, scoring leaders & franchise legends.",
    tag: "NBA & MVPs",
    icon: Flame,
    cardCls: "border-orange-500/25 hover:border-orange-400/60",
    iconCls: "bg-orange-500/15 text-orange-300",
    tagCls: "border-orange-400/25 bg-orange-500/10 text-orange-200",
    ctaCls: "text-orange-300",
  },
  {
    href: "/krillion-movies/",
    title: "Krillion Movies",
    desc: "Best Picture Oscars, acclaimed directors, Pixar classics & cinema franchises.",
    tag: "Oscars & Pixar",
    icon: Film,
    cardCls: "border-rose-500/25 hover:border-rose-400/60",
    iconCls: "bg-rose-500/15 text-rose-300",
    tagCls: "border-rose-400/25 bg-rose-500/10 text-rose-200",
    ctaCls: "text-rose-300",
  },
  {
    href: "/poople-unlimited/",
    title: "Poople Unlimited",
    desc: "4-letter word ladder puzzle turning words into POOP + Daily Answer & BFS solver.",
    tag: "Word Ladder",
    icon: Grid3x3,
    cardCls: "border-teal-500/25 hover:border-teal-400/60",
    iconCls: "bg-teal-500/15 text-teal-300",
    tagCls: "border-teal-400/25 bg-teal-500/10 text-teal-200",
    ctaCls: "text-teal-300",
  },
  {
    href: "/games-like-krillion/",
    title: "Games Like Krillion",
    desc: "Side-by-side matrix comparing all 9 rarity trivia modes and Daily Dles variants.",
    tag: "All 9 Modes",
    icon: Layers,
    cardCls: "border-indigo-500/25 hover:border-indigo-400/60",
    iconCls: "bg-indigo-500/15 text-indigo-300",
    tagCls: "border-indigo-400/25 bg-indigo-500/10 text-indigo-200",
    ctaCls: "text-indigo-300",
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
            className={`group flex flex-col justify-between rounded-2xl border bg-[#06192d]/80 p-5 transition hover:-translate-y-0.5 hover:bg-[#08223d] ${card.cardCls}`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.iconCls}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${card.tagCls}`}>
                  {card.tag}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-white group-hover:text-cyan-100">
                {card.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                {card.desc}
              </p>
            </div>
            <span className={`mt-4 inline-flex items-center gap-1 text-xs font-bold ${card.ctaCls}`}>
              {card.ctaLabel ?? "Play Now"}
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
