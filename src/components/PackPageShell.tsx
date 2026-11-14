import Link from "next/link";
import type { ReactNode } from "react";
import FaqAccordion from "@/components/FaqAccordion";
import Footer from "@/components/Footer";
import JsonLd, { type BreadcrumbItem, type FaqItem } from "@/components/JsonLd";
import KrillionGameEngine from "@/components/KrillionGameEngine";
import Navbar from "@/components/Navbar";
import RarityScaleTable from "@/components/RarityScaleTable";
import TopicPacksGrid from "@/components/TopicPacksGrid";
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
  prompts: TriviaPrompt[];
  dailyBoards: DailyBoard[];
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
  prompts,
  dailyBoards,
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

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:pt-8">
        <header className="mb-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
              {badgeText}
            </span>
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
            {h1}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
            {heroSubtitle}
          </p>
        </header>

        <section aria-labelledby="engine-heading" className="mb-12">
          <h2
            id="engine-heading"
            className="mb-3 text-xs font-bold uppercase tracking-wider text-cyan-300"
          >
            {engineSectionTitle}
          </h2>
          <KrillionGameEngine
            prompts={prompts}
            dailyBoards={dailyBoards}
            defaultMode={defaultMode}
            defaultPack={defaultPack}
            allowModeSwitch={allowModeSwitch}
            allowPackFilter={allowPackFilter}
          />
        </section>

        <div className="space-y-10">
          {sections.map((section) => (
            <section
              key={section.id}
              aria-labelledby={section.id}
              className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/75 p-6 sm:p-8"
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
          ))}

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
        </div>
      </main>

      <Footer />
    </>
  );
}
