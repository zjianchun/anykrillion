import type { Metadata } from "next";
import Link from "next/link";
import { Database, Layers, Shield } from "lucide-react";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import Navbar from "@/components/Navbar";
import { getCorpusStats } from "@/lib/datasets";
import { PACK_METAS } from "@/types/game";

export const metadata: Metadata = {
  title: "Open Data Sources & Rarity Methodology | AnyKrillion",
  description:
    "Explore how AnyKrillion precomputes verified trivia rarity scores using mledoze/countries, Fjelstul World Cup CSVs, PokéAPI v2 tables, and curated open archives.",
  alternates: {
    canonical: "/sources/",
  },
  openGraph: {
    title: "Open Data Sources & Rarity Methodology | AnyKrillion",
    description:
      "Transparent dataset provenance and quantile rarity scoring methodology behind AnyKrillion's 136 trivia prompts and 7,092+ entities.",
    url: "https://anykrillion.com/sources/",
  },
};

export default function SourcesPage() {
  const stats = getCorpusStats();

  return (
    <>
      <JsonLd
        canonicalUrl="https://anykrillion.com/sources/"
        pageTitle="Open Data Sources & Rarity Methodology | AnyKrillion"
        pageDescription="Explore how AnyKrillion precomputes verified trivia rarity scores using mledoze/countries, Fjelstul World Cup CSVs, PokéAPI v2 tables, and curated open archives."
        pageType="WebPage"
        breadcrumbs={[
          { name: "Krillion Unlimited", url: "https://anykrillion.com/" },
          { name: "Data Sources", url: "https://anykrillion.com/sources/" },
        ]}
      />

      <Navbar />

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8">
        <header className="mb-8 rounded-2xl border border-cyan-500/25 bg-[#06192d]/85 p-6 sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
            <Database className="h-3.5 w-3.5" />
            Verified Precomputed ETL • Zero Live API Latency
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
            Open Data Sources &amp; Rarity Methodology
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Every round on AnyKrillion runs instantaneously offline-ready in your browser against{" "}
            <strong>{stats.totalPrompts} validated trivia prompts</strong>,{" "}
            <strong>{stats.totalAnswers.toLocaleString()} indexed answers</strong>, and{" "}
            <strong>{stats.totalDailyBoards} deterministic Daily Dive boards</strong> precomputed
            from transparent public-interest data sources.
          </p>
        </header>

        <div className="space-y-8">
          <section className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/75 p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-white sm:text-2xl">
              Live Corpus Inventory by Topic Pack
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-cyan-500/25 text-xs uppercase tracking-wider text-cyan-300">
                    <th className="py-2.5 pr-4">Topic Pack</th>
                    <th className="py-2.5 pr-4">Prompts</th>
                    <th className="py-2.5 pr-4">Verified Answers</th>
                    <th className="py-2.5">Play Route</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {PACK_METAS.map((meta) => (
                    <tr key={meta.id}>
                      <td className="py-3 pr-4 font-bold text-white">{meta.name}</td>
                      <td className="py-3 pr-4 font-mono text-cyan-200">
                        {stats.byPack[meta.id].prompts}
                      </td>
                      <td className="py-3 pr-4 font-mono text-emerald-200">
                        {stats.byPack[meta.id].answers.toLocaleString()}
                      </td>
                      <td className="py-3">
                        <Link href={meta.href} className="text-cyan-300 hover:underline">
                          {meta.href}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/75 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-cyan-300">
              <Layers className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Dataset Provenance</span>
            </div>
            <h2 className="mt-2 text-xl font-extrabold text-white sm:text-2xl">
              Primary Datasets Used Across Packs
            </h2>
            <ul className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300 sm:text-base">
              <li className="rounded-xl border border-cyan-500/15 bg-[#03111f] p-4">
                <h3 className="font-bold text-white">
                  1. World Geography &amp; Sovereign States (<code>mledoze/countries</code>)
                </h3>
                <p className="mt-1">
                  Supplies 250 countries and territories, UN sovereignty flags, official languages,
                  curated capitals, region/subregion taxonomies, landlocked flags, border-neighbor
                  ISO codes, and multilingual translation counts used as a prominence proxy.
                </p>
              </li>
              <li className="rounded-xl border border-cyan-500/15 bg-[#03111f] p-4">
                <h3 className="font-bold text-white">
                  2. International Football (Joshua Fjelstul World Cup Database)
                </h3>
                <p className="mt-1">
                  Ingests 30 FIFA World Cup tournaments, 10,401 capped World Cup players, and
                  13,843 tournament squad appearances from open CSV tables, measuring multi-tournament
                  prominence vs. deeper squad depth for{" "}
                  <Link href="/footbillion/" className="text-cyan-300 hover:underline">
                    Footbillion
                  </Link>
                  .
                </p>
              </li>
              <li className="rounded-xl border border-cyan-500/15 bg-[#03111f] p-4">
                <h3 className="font-bold text-white">
                  3. National Pokédex Species &amp; Stats (PokéAPI v2 Open CSVs)
                </h3>
                <p className="mt-1">
                  Reads all 1,025 English species names, dual-typings, generations (Gen 1–9),
                  evolution chain depths, base stat totals, and flavor-text taxonomy tables powering{" "}
                  <Link href="/pokekrillion/" className="text-cyan-300 hover:underline">
                    Pokekrillion
                  </Link>
                  .
                </p>
              </li>
              <li className="rounded-xl border border-cyan-500/15 bg-[#03111f] p-4">
                <h3 className="font-bold text-white">
                  4. NBA, Multi-Sport Champions &amp; Cinema Archives
                </h3>
                <p className="mt-1">
                  Combines historical NBA Draft #1 picks, MVP/Finals MVP records, Olympic host
                  ledgers, Grand Slam tennis, Formula 1 titles, Academy Award winners, and film
                  franchise box-office/audience visibility metrics into normalized 10–100 tiers.
                </p>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/75 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-emerald-300">
              <Shield className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Scoring Normalization</span>
            </div>
            <h2 className="mt-2 text-xl font-extrabold text-white sm:text-2xl">
              Percentile Calibration &amp; Independence Notice
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              Within each question, candidate entities are ordered by familiarity signal and
              quantized linearly between <code>10</code> (Plankton, highest crowd visibility) and{" "}
              <code>100</code> (One in a Krillion, deepest obscurity). In{" "}
              <Link href="/noillirk/" className="text-amber-300 hover:underline">
                Noillirk reverse mode
              </Link>
              , scoring flips via <code>clamp(110 - rarity, 10, 100)</code>.
            </p>
            <p className="mt-3 text-xs text-slate-400">
              AnyKrillion.com is an independent trivia project powered by open reference datasets.
              We are not affiliated with, endorsed by, or sponsored by krillion.io, The Pokémon
              Company, FIFA, NBA, or the Academy of Motion Picture Arts and Sciences.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
