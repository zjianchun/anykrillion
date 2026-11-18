import Image from "next/image";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { BookOpen } from "lucide-react";
import {
  BottomNativeSlot,
  GuideWithSkyscraper,
  MidContentBannerSlot,
  MobilePostGameNativeSlot,
  PrimaryLeaderboardSlot,
} from "@/components/AdPlacements";
import FaqAccordion from "@/components/FaqAccordion";
import Footer from "@/components/Footer";
import GameEngagement from "@/components/GameEngagement";
import JsonLd, { type BreadcrumbItem, type FaqItem } from "@/components/JsonLd";
import KrillionGameEngine from "@/components/KrillionGameEngine";
import Navbar from "@/components/Navbar";
import RarityScaleTable from "@/components/RarityScaleTable";
import TopicPacksGrid from "@/components/TopicPacksGrid";
import type { ThemeVariant } from "@/lib/gameThemes";
import type { DailyBoard, GameMode, PackId, TriviaPrompt } from "@/types/game";

export interface EditorialSection {
  id: string;
  heading: string;
  body: ReactNode;
  includeRarityTable?: boolean;
}

interface PackPageShellProps {
  canonicalUrl: string;
  pageTitle: string;
  pageDescription: string;
  pageType?: "WebPage" | "CollectionPage";
  isRoot?: boolean;
  h1: string;
  heroSubtitle: string;
  badgeText: string;
  breadcrumbs: BreadcrumbItem[];
  gameSchema: {
    name: string;
    description: string;
    genre: string;
    keywords: string[];
  };
  prompts?: TriviaPrompt[];
  dailyBoards?: DailyBoard[];
  defaultMode?: GameMode;
  defaultPack?: PackId;
  allowModeSwitch?: boolean;
  allowPackFilter?: boolean;
  reverseScoring?: boolean;
  excludePackHref?: string;
  engineSectionTitle: string;
  sections: EditorialSection[];
  topicPacksHeading?: string;
  faqHeading: string;
  faqs: FaqItem[];
  quickLinks?: Array<{ href: string; label: string }>;
  themeVariant?: ThemeVariant;
}

export default function PackPageShell({
  canonicalUrl,
  pageTitle,
  pageDescription,
  pageType = "WebPage",
  isRoot = false,
  h1,
  heroSubtitle,
  badgeText,
  breadcrumbs,
  gameSchema,
  defaultMode = "unlimited",
  defaultPack = "general",
  allowModeSwitch = true,
  allowPackFilter = true,
  reverseScoring = false,
  excludePackHref,
  engineSectionTitle,
  sections,
  topicPacksHeading = "Explore Any Krillion Topic Packs",
  faqHeading,
  faqs,
  quickLinks = [],
  themeVariant,
}: PackPageShellProps) {
  return (
    <>
      <JsonLd
        canonicalUrl={canonicalUrl}
        pageTitle={pageTitle}
        pageDescription={pageDescription}
        pageType={pageType}
        isRoot={isRoot}
        gameSchema={gameSchema}
        faqs={faqs}
        breadcrumbs={breadcrumbs}
      />

      <Navbar />

      <main className="mx-auto max-w-6xl pb-16 sm:px-4 sm:pt-3">
        {/* Semantic Page Heading (kept out of human player's visual path above the game canvas) */}
        <h1 className="sr-only">{h1}</h1>

        {/* Full-Viewport Interactive Ocean / Arena Dive World */}
        <section aria-labelledby="engine-heading" className="mb-6">
          <h2 id="engine-heading" className="sr-only">
            {engineSectionTitle}
          </h2>
          <KrillionGameEngine
            defaultMode={defaultMode}
            defaultPack={defaultPack}
            allowModeSwitch={allowModeSwitch}
            allowPackFilter={allowPackFilter}
            themeVariant={themeVariant}
          />
        </section>

        <PrimaryLeaderboardSlot className="mb-6 px-4 sm:px-0" />

        <GameEngagement gameLabel={h1.split(":")[0]} />

        <MobilePostGameNativeSlot className="mb-8 px-4 sm:px-0" />

        {/* Below-the-Fold Game Guide & Reference Knowledge (for players who scroll down & search crawlers) */}
        <div
          id="game-guide"
          className="border-t border-white/10 px-4 pt-10 sm:px-0"
        >
          <GuideWithSkyscraper mode="game">
          <div className="grid gap-5 rounded-2xl border border-white/10 bg-[#051629]/65 p-5 sm:grid-cols-[1fr_210px] sm:items-center sm:p-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                    <BookOpen className="h-4 w-4" />
                    {h1}
                  </span>
                  <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-bold text-cyan-200">
                    {badgeText}
                  </span>
                </div>
                {quickLinks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-cyan-300">
                    {quickLinks.map((ql) => (
                      <Link
                        key={ql.href}
                        href={ql.href}
                        className="underline decoration-cyan-500/40 underline-offset-4 hover:text-white"
                      >
                        {ql.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-2.5 max-w-4xl text-sm leading-relaxed text-slate-300 sm:text-base">
                {heroSubtitle}
              </p>
            </div>
            <Image
              src="/og-image.png"
              alt={`${h1} interactive rarity trivia preview`}
              width={1200}
              height={630}
              className="hidden h-auto w-full rounded-xl border border-cyan-400/25 object-cover shadow-lg sm:block"
            />
          </div>

          {sections.map((section, idx) => (
            <Fragment key={section.id}>
              <section
                aria-labelledby={section.id}
                className="rounded-2xl border border-cyan-500/15 bg-[#05182b]/65 p-6 sm:p-8"
              >
                <h2
                  id={section.id}
                  className="text-xl font-extrabold tracking-tight text-white sm:text-2xl"
                >
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300 sm:text-base">
                  {section.body}
                </div>
                {section.includeRarityTable && (
                  <div className="mt-6">
                    <RarityScaleTable reverse={reverseScoring} />
                  </div>
                )}
              </section>
              {idx === 0 && <MidContentBannerSlot />}
            </Fragment>
          ))}

          <BottomNativeSlot />

          <section aria-labelledby="topic-packs-heading">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <h2
                id="topic-packs-heading"
                className="text-xl font-extrabold tracking-tight text-white sm:text-2xl"
              >
                {topicPacksHeading}
              </h2>
              <Link
                href="/krillion-archive/"
                className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"
              >
                Browse Past Daily Boards →
              </Link>
            </div>
            <TopicPacksGrid excludeHref={excludePackHref} />
          </section>

          <section aria-labelledby="faq-heading">
            <h2
              id="faq-heading"
              className="mb-4 text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              {faqHeading}
            </h2>
            <FaqAccordion faqs={faqs} />
          </section>
          </GuideWithSkyscraper>
        </div>
      </main>

      <Footer />
    </>
  );
}
