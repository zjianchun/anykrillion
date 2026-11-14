import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Compass, Flame, Lightbulb, ShieldCheck, Wind } from "lucide-react";
import FaqAccordion from "@/components/FaqAccordion";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import Navbar from "@/components/Navbar";
import RarityScaleTable from "@/components/RarityScaleTable";
import { getCorpusStats } from "@/lib/datasets";

export const metadata: Metadata = {
  title: "Krillion Strategy Guides & Rules Playbook | AnyKrillion",
  description:
    "Master Krillion rules, rarity quantile scoring, Noillirk reverse tactics, geography micro-states, and One in a Krillion picks with our step-by-step guides.",
  alternates: {
    canonical: "/guides/",
  },
  openGraph: {
    title: "Krillion Strategy Guides & Rules Playbook | AnyKrillion",
    description:
      "Complete Krillion & Noillirk strategy manual: dodge Plankton traps, conquer geography borders, and boost your 7-round Dive score.",
    url: "https://anykrillion.com/guides/",
  },
};

const FAQS = [
  {
    question: "What is a good total score across a 7-prompt Krillion Dive?",
    answer:
      "Each round caps at 100 points, giving a theoretical maximum of 700. Crossing 350+ (Midnight Zone) shows solid all-around trivia skill, 450+ puts you in the Abyssal Zone, and 560+ earns the prestigious Hadal Trench — One in a Krillion rank.",
  },
  {
    question: "Should I guess fast or wait for the 25-second timer to run down?",
    answer:
      "Always lock a high-confidence Deep Sea (70+) or Rare (55+) pick instead of chasing a risky guess until time expires—a timed-out round scores 0 points, whereas even a Common 30-point save protects a 600-point pace.",
  },
  {
    question: "How does progressive typo tolerance work without spoiling answers?",
    answer:
      "When your partial input lands close (small Levenshtein edit distance) to an accepted answer without crossing exact threshold, our assist chip lets you know a close spelling match exists inside the database without printing the hidden word.",
  },
];

export default function GuidesPage() {
  const stats = getCorpusStats();

  return (
    <>
      <JsonLd
        canonicalUrl="https://anykrillion.com/guides/"
        pageTitle="Krillion Strategy Guides & Rules Playbook | AnyKrillion"
        pageDescription="Master Krillion rules, rarity quantile scoring, Noillirk reverse tactics, geography micro-states, and One in a Krillion picks with our step-by-step guides."
        pageType="CollectionPage"
        faqs={FAQS}
        breadcrumbs={[
          { name: "Krillion Unlimited", url: "https://anykrillion.com/" },
          { name: "Strategy Guides", url: "https://anykrillion.com/guides/" },
        ]}
      />

      <Navbar />

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8">
        <header className="mb-10 rounded-2xl border border-cyan-500/25 bg-[#06192d]/85 p-6 sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
            <BookOpen className="h-3.5 w-3.5" />
            Player Manual • {stats.totalPrompts} Curated Prompts
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
            Krillion Rules, Rarity Scoring &amp; High-Score Strategy Guides
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Every trick you need to stop bleeding points on Plankton crowd traps, survive 25-second
            clocks, and consistently break 560+ in Krillion Unlimited and 52,000 ft in Noillirk.
          </p>
        </header>

        <div className="space-y-8">
          <section className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/75 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-cyan-300">
              <Lightbulb className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Guide 01 • Core Math</span>
            </div>
            <h2 className="mt-2 text-xl font-extrabold text-white sm:text-2xl">
              How Rarity Tiers Convert Facts Into 10–100 Points
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              Standard quizzes reward recall alone; Krillion rewards{" "}
              <strong>non-obviousness</strong>. During our ETL build, every valid entity inside a
              prompt is ranked along measurable familiarity signals—such as global encyclopedia
              localization counts, tournament squad prominence, or box-office vote density—and
              mapped linearly between <strong>10 (most famous Plankton pick)</strong> and{" "}
              <strong>100 (deepest One in a Krillion gem)</strong>.
            </p>
            <div className="mt-5">
              <RarityScaleTable />
            </div>
          </section>

          <section className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/75 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-emerald-300">
              <Compass className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Guide 02 • Geography Cheat-Sheet
              </span>
            </div>
            <h2 className="mt-2 text-xl font-extrabold text-white sm:text-2xl">
              Geography &amp; World Capitals: Memorize These 85+ Point Anchors
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              Geography prompts appear in every Daily Dive board and inside{" "}
              <Link
                href="/krillion-geography/"
                className="font-semibold text-cyan-300 hover:underline"
              >
                Krillion Geography
              </Link>
              . Most casual players blurt out Brazil, France, Japan, or Egypt (all 10–18 Plankton).
              Instead, build muscle memory around geographic buckets:
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-cyan-500/20 bg-[#03111f] p-4">
                <h3 className="font-bold text-white">Island Micro-States (Oceania &amp; Caribbean)</h3>
                <p className="mt-1.5 text-sm text-slate-300">
                  Keep <strong>Palau, Nauru, Tuvalu, Vanuatu, Saint Vincent</strong>, and{" "}
                  <strong>Dominica</strong> ready for &ldquo;Island Nation&rdquo; or
                  &ldquo;Commonwealth / Ocean-bordering&rdquo; questions—none are ever guessed first
                  by casual crowds.
                </p>
              </div>
              <div className="rounded-xl border border-cyan-500/20 bg-[#03111f] p-4">
                <h3 className="font-bold text-white">Landlocked Enclaves &amp; Double-Landlocked</h3>
                <p className="mt-1.5 text-sm text-slate-300">
                  For landlocked rounds, skip Switzerland and Austria; swing toward{" "}
                  <strong>Liechtenstein, Uzbekistan</strong> (doubly landlocked!),{" "}
                  <strong>Eswatini, Lesotho</strong>, or <strong>Kyrgyzstan</strong>.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/75 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-amber-300">
              <Wind className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Guide 03 • Reverse Mode
              </span>
            </div>
            <h2 className="mt-2 text-xl font-extrabold text-white sm:text-2xl">
              Noillirk Inversion Playbook: Winning by Naming the #1 Crowd Favorite
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              In{" "}
              <Link href="/noillirk/" className="font-semibold text-amber-300 hover:underline">
                Noillirk Unlimited
              </Link>
              , scoring flips cleanly (<code>110 - rarity</code>). Your subconscious trivia
              flex becomes your worst enemy: naming <em>Burkina Faso</em> on an Africa prompt loses
              to someone naming <em>Egypt</em> or <em>South Africa</em> by 75+ points. Train your
              first-second reflex around global box-office hits, G7 nations, Gen 1 starters, and
              perennial MVP superstars.
            </p>
          </section>

          <section className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/75 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-sky-300">
              <Flame className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Guide 04 • Vertical Packs
              </span>
            </div>
            <h2 className="mt-2 text-xl font-extrabold text-white sm:text-2xl">
              Quick Edge Tactics for Pokekrillion, Footbillion, NBA &amp; Movies
            </h2>
            <ul className="mt-3 space-y-2.5 text-sm text-slate-300 sm:text-base">
              <li>
                <strong className="text-white">Pokekrillion:</strong> Skip mascots and final starter
                evolutions. Middle evolutions from Johto (<em>Bayleef, Quilava</em>) and Unova (
                <em>Eelektrik, Lampent</em>) reliably beat 85 points on{" "}
                <Link href="/pokekrillion/" className="text-cyan-300 hover:underline">
                  /pokekrillion/
                </Link>
                .
              </li>
              <li>
                <strong className="text-white">Footbillion:</strong> Remember #2/#3 squad goalkeepers
                or rotational midfielders from World Cup squads on{" "}
                <Link href="/footbillion/" className="text-cyan-300 hover:underline">
                  /footbillion/
                </Link>{" "}
                before defaulting to attackers.
              </li>
              <li>
                <strong className="text-white">NBA Krillion:</strong> 1970s/1980s Finals MVPs and
                1990s multi-time All-Star forwards outscore modern household superstars on{" "}
                <Link href="/nba-krillion/" className="text-cyan-300 hover:underline">
                  /nba-krillion/
                </Link>
                .
              </li>
              <li>
                <strong className="text-white">Krillion Movies:</strong> On Best Picture or Oscar
                questions, think back prior to 1985 rather than recent streaming sweeps on{" "}
                <Link href="/krillion-movies/" className="text-cyan-300 hover:underline">
                  /krillion-movies/
                </Link>
                .
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/75 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-cyan-300">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Guide 05 • Speed &amp; Spelling
              </span>
            </div>
            <h2 className="mt-2 text-xl font-extrabold text-white sm:text-2xl">
              Typing Fast Without Getting Burned on Accents or Subtitles
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              Do not waste precious timer seconds hunting accent keys like <code>é</code>,{" "}
              <code>ö</code>, or <code>ç</code>, nor leading articles like <em>&ldquo;The&rdquo;</em>.
              AnyKrillion strips diacritics, ignores punctuation hyphens, checks curated aliases, and
              applies bounded Levenshtein typo tolerance automatically—keeping your hands fast while
              preserving fair trivia integrity.
            </p>
          </section>

          <section aria-labelledby="guides-faq-heading">
            <h2
              id="guides-faq-heading"
              className="mb-4 text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              Krillion Strategy FAQ
            </h2>
            <FaqAccordion faqs={FAQS} />
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
