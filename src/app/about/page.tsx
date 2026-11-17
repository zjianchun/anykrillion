import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "About AnyKrillion — Our Mission & Trivia Craft | AnyKrillion",
  description:
    "Learn how AnyKrillion builds free browser-first rarity trivia and word ladder games backed by reproducible open datasets from Wikidata and PokéAPI.",
  alternates: {
    canonical: "/about/",
  },
  openGraph: {
    title: "About AnyKrillion — Our Mission & Trivia Craft | AnyKrillion",
    description:
      "Learn how AnyKrillion builds free browser-first rarity trivia and word ladder games backed by reproducible open datasets from Wikidata and PokéAPI.",
    url: "https://anykrillion.com/about/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "About AnyKrillion — Our Mission & Trivia Craft",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About AnyKrillion — Our Mission & Trivia Craft | AnyKrillion",
    description:
      "Learn how AnyKrillion builds free, browser-first rarity trivia and word ladder games backed by reproducible open datasets.",
    images: ["/og-image.png"],
  },
};

export default function AboutPage() {
  return (
    <>
      <JsonLd
        canonicalUrl="https://anykrillion.com/about/"
        pageTitle="About AnyKrillion — Our Mission & Trivia Craft | AnyKrillion"
        pageDescription="Learn how AnyKrillion builds free, browser-first rarity trivia and word ladder games backed by reproducible open datasets."
        pageType="WebPage"
        breadcrumbs={[
          { name: "Krillion Unlimited", url: "https://anykrillion.com/" },
          { name: "About", url: "https://anykrillion.com/about/" },
        ]}
      />

      <Navbar />

      <main className="mx-auto max-w-4xl px-4 pb-16 pt-10">
        <article className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/80 p-6 sm:p-10">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
            Independent Trivia Studio
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            About AnyKrillion
          </h1>

          <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-300 sm:text-base">
            <section>
              <h2 className="text-lg font-bold text-white">Why We Built AnyKrillion</h2>
              <p className="mt-2">
                Daily trivia games are fun, but waiting 24 hours for one seven-question board can
                cut a great session short. <strong>AnyKrillion.com</strong> was created by trivia and
                word-puzzle enthusiasts to give players an instant, unlimited browser arcade where
                deep knowledge is rewarded—without logins, paywalls, or downloads.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white">
                Reproducible Open-Data Rarity Scoring
              </h2>
              <p className="mt-2">
                Every Krillion, Noillirk, Sports, Geography, Pokémon, Football, NBA, and Cinema
                prompt on AnyKrillion runs against curated, precomputed rarity tables derived from
                verifiable public datasets including{" "}
                <Link href="/sources/" className="text-cyan-300 hover:underline">
                  Wikidata, PokéAPI, Fjelstul World Cup archives, and public basketball catalogs
                </Link>
                . Instead of arbitrary difficulty labels, scores reflect real-world recognition
                bands—from mainstream <em>Plankton</em> answers (10 pts) down to{" "}
                <em>One in a Krillion</em> deep cuts (85–100 pts).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white">
                Fast, Typo-Tolerant &amp; Built for Friends
              </h2>
              <p className="mt-2">
                Under a 25-second timer, a missing accent or small spelling slip shouldn&apos;t ruin
                a brilliant recall. Our matching engine normalizes diacritics and absorbs minor
                typos locally in your browser, while shareable challenge links let you send your
                exact 7-question board or 4-letter Poople word ladder to friends for head-to-head
                comparison.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white">Editorial Independence &amp; Contact</h2>
              <p className="mt-2">
                AnyKrillion.com is an independent fan-made trivia platform and is not affiliated with
                krillion.io, Nintendo, FIFA, the NBA, or any film studio. Spot a missing alias or
                factual update? Reach out anytime at{" "}
                <a
                  href="mailto:support@anykrillion.com"
                  className="font-semibold text-cyan-300 hover:underline"
                >
                  support@anykrillion.com
                </a>{" "}
                or visit our{" "}
                <Link href="/contact/" className="text-cyan-300 hover:underline">
                  Contact page
                </Link>
                .
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}
