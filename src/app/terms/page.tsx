import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Terms of Use & Open Dataset Disclaimer | AnyKrillion",
  description:
    "Review the Terms of Use, fair play guidelines, and independent open-dataset non-affiliation notice for AnyKrillion.com and all rarity trivia game modes.",
  alternates: {
    canonical: "/terms/",
  },
  openGraph: {
    title: "Terms of Use & Open Dataset Disclaimer | AnyKrillion",
    description: "Review the Terms of Use, fair play guidelines, and independent open-dataset non-affiliation notice for AnyKrillion.com and all rarity trivia game modes.",
    url: "https://anykrillion.com/terms/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Terms of Use & Open Dataset Disclaimer | AnyKrillion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Use & Open Dataset Disclaimer | AnyKrillion",
    description: "Review the Terms of Use, fair play guidelines, and independent open-dataset non-affiliation notice for AnyKrillion.com and all rarity trivia game modes.",
    images: ["/og-image.png"],
  },
};

export default function TermsPage() {
  return (
    <>
      <JsonLd
        canonicalUrl="https://anykrillion.com/terms/"
        pageTitle="Terms of Use & Open Dataset Disclaimer | AnyKrillion"
        pageDescription="Review the Terms of Use, fair play guidelines, and independent open-dataset non-affiliation notice for AnyKrillion.com and all rarity trivia game modes."
        pageType="WebPage"
        breadcrumbs={[
          { name: "Krillion Unlimited", url: "https://anykrillion.com/" },
          { name: "Terms of Use", url: "https://anykrillion.com/terms/" },
        ]}
      />

      <Navbar />

      <main className="mx-auto max-w-4xl px-4 pb-16 pt-10">
        <article className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/80 p-6 sm:p-10">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
            Last Updated: November 14, 2026
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            Terms of Use
          </h1>

          <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-300 sm:text-base">
            <section>
              <h2 className="text-lg font-bold text-white">1. Entertainment &amp; Trivia Purpose</h2>
              <p className="mt-2">
                AnyKrillion is provided free of charge for casual trivia gameplay, learning, and
                friendly score comparison. While we precompute and validate prompts from open
                reference datasets, we cannot guarantee 100% real-time coverage of breaking sports
                transactions or newly released media.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white">2. Independent Fan Hub Disclaimer</h2>
              <p className="mt-2">
                AnyKrillion.com is an independent trivia project and is{" "}
                <strong>not affiliated with, endorsed by, or connected to</strong> krillion.io,
                Pokémon / Nintendo / Creatures / Game Freak, FIFA, the NBA, or any film studio. All
                trademarks referenced inside factual trivia prompts remain the property of their
                respective owners.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white">3. Fair Usage</h2>
              <p className="mt-2">
                Do not scrape, overload, or impersonate AnyKrillion endpoints. For open data
                attributions, read our{" "}
                <Link href="/sources/" className="text-cyan-300 hover:underline">
                  Sources &amp; Methodology
                </Link>{" "}
                page and{" "}
                <Link href="/privacy-policy/" className="text-cyan-300 hover:underline">
                  Privacy Policy
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
