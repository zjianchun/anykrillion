import type { Metadata } from "next";
import Link from "next/link";
import ArchiveExplorer from "@/components/ArchiveExplorer";
import FaqAccordion from "@/components/FaqAccordion";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import Navbar from "@/components/Navbar";
import TopicPacksGrid from "@/components/TopicPacksGrid";
import { DAILY_BOARDS, getDailyPromptCorpus } from "@/lib/datasets";

export const metadata: Metadata = {
  title: "Krillion Archive — Play Past Daily Krillion Games | AnyKrillion",
  description:
    "Missed a Daily Dive? Browse the Krillion Archive to replay past daily boards, practice old prompts in unlimited mode, and compare One in a Krillion answers.",
  alternates: {
    canonical: "/krillion-archive/",
  },
  openGraph: {
    title: "Krillion Archive — Play Past Daily Krillion Games | AnyKrillion",
    description:
      "Browse 30 past Daily Krillion Dive boards, filter by topic pack, replay archived games, and compare rare answers.",
    url: "https://anykrillion.com/krillion-archive/",
  },
};

const FAQS = [
  {
    question: "How many past Daily Krillion boards are in the Krillion Archive?",
    answer:
      "AnyKrillion maintains a rolling 30-day catalog of full 7-question Daily Dive boards (from Dive #1 through Today's Dive #30), each playable interactively with timer controls and reverse Noillirk toggling.",
  },
  {
    question: "Can I see One in a Krillion answers for an archived day?",
    answer:
      "Yes! Click any board in the calendar grid and toggle 'Reveal Board Top Rarity Answers' below the game canvas to inspect the top 85–100 pt picks alongside the Plankton traps for every round.",
  },
  {
    question: "Can I practice endless rounds instead of structured daily archives?",
    answer:
      "Yes—visit Krillion Unlimited (/) for randomized nonstop 7-question runs across all 136 prompts, or jump into dedicated Sports, Geography, Pokekrillion, Footbillion, NBA, or Movies packs.",
  },
];

export default function KrillionArchivePage() {
  const dailyPrompts = getDailyPromptCorpus();

  return (
    <>
      <JsonLd
        canonicalUrl="https://anykrillion.com/krillion-archive/"
        pageTitle="Krillion Archive — Play Past Daily Krillion Games | AnyKrillion"
        pageDescription="Missed a Daily Dive? Browse the Krillion Archive to replay past daily boards, practice old prompts in unlimited mode, and compare One in a Krillion answers."
        pageType="CollectionPage"
        faqs={FAQS}
        breadcrumbs={[
          { name: "Krillion Unlimited", url: "https://anykrillion.com/" },
          { name: "Krillion Archive", url: "https://anykrillion.com/krillion-archive/" },
        ]}
      />

      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:pt-8">
        <header className="mb-8">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
              30 Archived Daily Boards • Full Replay + Answer Keys
            </span>
            <Link
              href="/krillion-answers-today/"
              className="text-xs font-semibold text-cyan-300 underline decoration-cyan-500/40 underline-offset-4 hover:text-white"
            >
              Today&apos;s Answers &amp; Hints →
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
            Krillion Archive: Replay Past Daily Krillion Games
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Missed yesterday&apos;s dive or want to binge past daily sets? Pick any archived board
            below to replay all 7 rounds under official timer rules or test yourself in reverse
            Noillirk mode.
          </p>
        </header>

        <ArchiveExplorer dailyBoards={DAILY_BOARDS} prompts={dailyPrompts} />

        <section aria-labelledby="archive-packs" className="mt-14">
          <h2 id="archive-packs" className="mb-4 text-xl font-extrabold text-white sm:text-2xl">
            Explore Endless Topic Packs
          </h2>
          <TopicPacksGrid />
        </section>

        <section aria-labelledby="archive-faq-heading" className="mt-12">
          <h2
            id="archive-faq-heading"
            className="mb-4 text-xl font-extrabold tracking-tight text-white sm:text-2xl"
          >
            Krillion Archive FAQ
          </h2>
          <FaqAccordion faqs={FAQS} />
        </section>
      </main>

      <Footer />
    </>
  );
}
