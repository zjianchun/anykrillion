import type { Metadata } from "next";
import Link from "next/link";
import PackPageShell from "@/components/PackPageShell";
import { DAILY_BOARDS, getPromptsByPack } from "@/lib/datasets";

export const metadata: Metadata = {
  title: "Krillion Geography — World Map Trivia Game | AnyKrillion",
  description:
    "Play Krillion Geography online! Guess rare countries, capitals, lakes, and landmarks before time runs out, backed by verified Wikidata geographic rarity scores.",
  alternates: {
    canonical: "/krillion-geography/",
  },
  openGraph: {
    title: "Krillion Geography — World Map Trivia Game | AnyKrillion",
    description: "Play Krillion Geography online! Guess rare sovereign countries, capitals, borders, and world landmarks with open geographic rarity scores.",
    url: "https://anykrillion.com/krillion-geography/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Krillion Geography — World Map Trivia Game | AnyKrillion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Krillion Geography — World Map Trivia Game | AnyKrillion",
    description: "Play Krillion Geography online! Guess rare sovereign countries, capitals, borders, and world landmarks with open geographic rarity scores.",
    images: ["/og-image.png"],
  },
};

const FAQS = [
  {
    question: "Where does Krillion Geography get its country and capital lists?",
    answer:
      "All sovereign countries, ISO territories, capitals, landlocked flags, continent tags, and border adjacency graphs are built from the open mledoze/countries dataset paired with Wikidata geographic translation signals.",
  },
  {
    question: "How is country rarity calculated in Krillion Geography?",
    answer:
      "Each country is scored along a calibrated blend of international Wikipedia/Wikidata localization breadth, land area, and global name familiarity—so super-powers score 10–15 Plankton points while micro-states like Tuvalu, Palau, or Sao Tome and Principe hit 85–100 points.",
  },
  {
    question: "Are alternative country names and abbreviations accepted?",
    answer:
      "Yes. Common variants such as USA, UK, UAE, DRC, Cote d'Ivoire (without accents), Czechia / Czech Republic, and Burma / Myanmar are pre-indexed as accepted aliases.",
  },
  {
    question: "Does geography also appear in Today's Daily Dive?",
    answer:
      "Every single Daily Dive board guarantees at least one geography prompt alongside sports, cinema, and pop culture. Visit /krillion-answers-today/ for today's hints.",
  },
];

export default function KrillionGeographyPage() {
  const geoPrompts = getPromptsByPack("geography");
  const totalAnswers = geoPrompts.reduce((sum, p) => sum + p.answers.length, 0);

  return (
    <PackPageShell
      canonicalUrl="https://anykrillion.com/krillion-geography/"
      pageTitle="Krillion Geography — World Map Trivia Game | AnyKrillion"
      pageDescription="Play Krillion Geography online! Guess rare countries, capitals, lakes, and landmarks before time runs out, backed by verified Wikidata geographic rarity scores."
      h1="Krillion Geography: Countries, Capitals & World Trivia"
      heroSubtitle={`Explore ${geoPrompts.length} world-map challenges and ${totalAnswers.toLocaleString()} precomputed geographic answers—spanning landlocked states, island micro-nations, capital puzzles, and U.S. states.`}
      badgeText={`Geography Pack • ${geoPrompts.length} Prompts • Open Geo DB`}
      quickLinks={[
        { href: "/guides/", label: "Continent Mastery Guide" },
        { href: "/sources/", label: "Geo Data Attribution" },
        { href: "/", label: "Play All Packs Unlimited" },
      ]}
      breadcrumbs={[
        { name: "Krillion Unlimited", url: "https://anykrillion.com/" },
        { name: "Krillion Geography", url: "https://anykrillion.com/krillion-geography/" },
      ]}
      gameSchema={{
        name: "Krillion Geography — World Countries & Map Trivia",
        description:
          "Play Krillion Geography online with precomputed sovereign country, capital, border, and landmark rarity challenges.",
        genre: "Geography Trivia Game",
        keywords: [
          "krillion geography",
          "krillion countries",
          "krillion geo",
          "world capitals trivia",
        ],
      }}
      prompts={geoPrompts}
      dailyBoards={DAILY_BOARDS}
      defaultMode="unlimited"
      defaultPack="geography"
      allowModeSwitch={true}
      allowPackFilter={false}
      excludePackHref="/krillion-geography/"
      engineSectionTitle="Play Krillion Geography Unlimited"
      faqHeading="Krillion Geography FAQ"
      faqs={FAQS}
      sections={[
        {
          id: "continents-borders-prompts",
          heading: "Continents, Borders & Landmark Prompts",
          body: (
            <>
              <p>
                <strong>Krillion Geography</strong> goes far beyond &ldquo;name any country.&rdquo;
                Prompts slice the world atlas by <em>doubly landlocked or Africa landlocked status</em>,{" "}
                <em>island nations with zero land borders</em>, <em>sovereign countries sharing a border with France or China</em>,{" "}
                <em>capital cities that differ from a nation&apos;s biggest metropolis</em>,{" "}
                <em>major world rivers</em>, and <em>mountain summits across all seven continents</em>.
              </p>
              <p>
                Looking to sharpen your streak before Today&apos;s Daily Dive? Check our{" "}
                <Link href="/guides/" className="font-semibold text-cyan-300 hover:underline">
                  continent-by-continent rarity playbook
                </Link>{" "}
                to memorize 85+ point micro-states in Oceania, the Caribbean, and West Africa.
              </p>
            </>
          ),
        },
        {
          id: "wikidata-rarity-methodology",
          heading: "Wikidata Population & Rarity Methodology",
          includeRarityTable: true,
          body: (
            <p>
              Our precomputed geography ETL pipeline processes <strong>250 countries and territories</strong>{" "}
              from the open <code>mledoze/countries</code> registry alongside Wikidata cross-language
              localization density and territorial area. Populous G20 giants automatically occupy the{" "}
              <strong>10–19 Plankton</strong> tier, while tiny sovereign archipelagos and quiet
              enclaves reward eagle-eyed cartographers with <strong>One in a Krillion</strong> scores.
            </p>
          ),
        },
      ]}
    />
  );
}
