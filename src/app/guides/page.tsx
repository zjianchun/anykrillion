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
    description: "Complete Krillion & Noillirk strategy manual: dodge Plankton traps, conquer geography borders, and boost your 7-round Dive score.",
    url: "https://anykrillion.com/guides/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Krillion Strategy Guides & Rules Playbook | AnyKrillion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Krillion Strategy Guides & Rules Playbook | AnyKrillion",
    description: "Complete Krillion & Noillirk strategy manual: dodge Plankton traps, conquer geography borders, and boost your 7-round Dive score.",
    images: ["/og-image.png"],
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

const PLAYBOOK_MODULES = [
  {
    num: "01",
    title: "General Knowledge & Science Vault",
    route: "/",
    summary:
      "When tackling chemical elements, US states, or world languages, skip marquee anchors like Oxygen, California, or Spanish. Pre-load middle-band noble gases (Krypton, Xenon), compact states (Delaware, Vermont), and constitutional languages (Luxembourgish, Maltese) that consistently clear 75–92 points while remaining easy to spell inside 25 seconds.",
  },
  {
    num: "02",
    title: "Geography & Sovereign Island Anchors",
    route: "/krillion-geography/",
    summary:
      "Africa, Asia, and UN coastline questions punish lazy crowd picks like Egypt, Japan, and France (all 10–16 Plankton). Instead build a mental compass around tiny Pacific republics (Tuvalu, Kiribati, Nauru, Palau), Lesser Antilles islands (Dominica, Grenada), and Central Asian capitals (Bishkek, Dushanbe, Ashgabat).",
  },
  {
    num: "03",
    title: "Today's Daily Dive Anti-Plankton Routine",
    route: "/krillion-answers-today/",
    summary:
      "Open-ended daily prompts trigger instant System-1 availability bias: whatever 90% of players type in the first 2 seconds gets penalized under 20 points. Force a 1.5-second pause on Q1–Q7 to move one category tier away from the headliner—for example, picking the second-largest country or an unexpected era.",
  },
  {
    num: "04",
    title: "Noillirk Reverse Consensus Psychology",
    route: "/noillirk/",
    summary:
      "Noillirk flips everything upside down (110 - rarity). Never flex trivia depth here. Ask yourself: if 100 random commuters had 3 seconds to shout an example, what word wins 60% of the room? Pikachu, Pele, United States, Titanic, and Lion top almost every reverse ballot.",
  },
  {
    num: "05",
    title: "Pokekrillion Generation & Mid-Evo Traps",
    route: "/pokekrillion/",
    summary:
      "Charizard, Pikachu, Gengar, and Lucario tank your score into single-digit Plankton territory. Sweep Gen 5 (Unova), Gen 6 (Kalos), and Gen 7 (Alola) mid-stage evolutions (Servine, Dewott, Floette, Charjabug, Steenee) or dual-type fossils to hit 85–100 One in a Krillion gems.",
  },
  {
    num: "06",
    title: "Footbillion & Goalillion 40-Second Pacing",
    route: "/footbillion/",
    summary:
      "Because Footbillion expands your clock to 40 seconds, spend the first 10 seconds bypassing Ballon d'Or winners and striker superstars. World Cup host nations from single-tournament squads, defensive fullbacks, and backup cup winners consistently unlock 85+ rarity brackets.",
  },
  {
    num: "07",
    title: "NBA Krillion Era & Draft Class Separation",
    route: "/nba-krillion/",
    summary:
      "Modern box-score kings like LeBron, Steph Curry, and Michael Jordan lock around 10–15 points. Dig into pre-2000 NBA #1 draft picks (Joe Smith, Glenn Robinson, Danny Manning), ABA merger teams, and 1970s Finals MVPs (Wes Unseld, Dennis Johnson, Jo Jo White) for guaranteed Hadal Trench depth.",
  },
  {
    num: "08",
    title: "Krillion Movies & Pre-1985 Academy Gems",
    route: "/krillion-movies/",
    summary:
      "Modern Best Picture winners (Oppenheimer, Parasite, Everything Everywhere) drown under heavy crowd vote density. Reach back into 1930s–1970s Academy classics (All About Eve, In the Heat of the Night, Kramer vs. Kramer, Patton) or early Pixar shorts to claim 90+ scores.",
  },
  {
    num: "09",
    title: "Krillion Sports Multi-League Crossovers",
    route: "/krillion-sports/",
    summary:
      "Across Olympic host cities, tennis Grand Slam winners, and Formula 1 champions, separate single-title heroes (Jenson Button, Dominic Thiem, Antwerp 1920) from multi-decade dynasties (Hamilton, Federer, London, Paris). One-time winners deliver reliable 80–95 point lifts.",
  },
  {
    num: "10",
    title: "Poople Unlimited 4-Letter Gateway Bridges",
    route: "/poople-unlimited/",
    summary:
      "When morphing any 4-letter English word toward POOP, steer vowels toward double-O bridges (LOOP, COOP, HOOP, POOL, POOR) as early as move #2. Solving via common -OOP or POO- gateways shaves two full moves off blind trial-and-error guessing.",
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

          <section className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/75 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-cyan-300">
              <BookOpen className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Complete Directory • 10 Playbooks
              </span>
            </div>
            <h2 className="mt-2 text-xl font-extrabold text-white sm:text-2xl">
              10-Part Rarity Playbook Directory Across All AnyKrillion Modes
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300 sm:text-base">
              Jump directly into the specialized playbook matching whichever trivia pack or word
              ladder you are drilling today—backed by our{" "}
              <Link href="/sources/" className="text-cyan-300 hover:underline">
                verified open data methodology
              </Link>{" "}
              and{" "}
              <Link href="/games-like-krillion/" className="text-cyan-300 hover:underline">
                9 playable -illion game modes
              </Link>
              :
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {PLAYBOOK_MODULES.map((mod) => (
                <article
                  key={mod.num}
                  className="rounded-xl border border-cyan-500/15 bg-[#03111f] p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold uppercase text-cyan-300">
                      Module {mod.num}
                    </span>
                    <Link
                      href={mod.route}
                      className="text-xs font-bold text-emerald-300 hover:underline"
                    >
                      Play {mod.route} →
                    </Link>
                  </div>
                  <h3 className="mt-1.5 text-base font-extrabold text-white">{mod.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-300 sm:text-sm">
                    {mod.summary}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/75 p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-white sm:text-2xl">
              600-Point Daily Dive Routine: 5-Second Triage Under Pressure
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              Breaking the Hadal Trench threshold (560+ out of 700 total points) requires managing
              your 25-second mental budget across all seven prompts rather than stalling for a
              mythical 100-point answer until zero. Follow this disciplined three-step cadence on
              every round:
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-300 sm:text-base">
              <li>
                <strong className="text-white">Seconds 25 → 20 (Reject the Plankton Reflex):</strong>{" "}
                Identify the single most obvious crowd answer in your head and deliberately discard it.
                If the prompt asks for a European capital or G1 Pokémon, skip Paris, London, Pikachu,
                and Charizard immediately.
              </li>
              <li>
                <strong className="text-white">Seconds 20 → 10 (Pivot to a Secondary Anchor):</strong>{" "}
                Scan by geography subregion, earlier tournament decade, or middle-stage evolution to
                retrieve a candidate sitting comfortably in the Deep Sea (70–84) or One in a Krillion
                (85–100) quantile bands.
              </li>
              <li>
                <strong className="text-white">Seconds 10 → 0 (Type Early &amp; Use Hint Safety):</strong>{" "}
                Submit your typed candidate by second 6 so any typo-assist chip still leaves time to
                confirm, or lock any safe 35+ point answer rather than absorbing a 0-point timeout.
              </li>
            </ol>
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
