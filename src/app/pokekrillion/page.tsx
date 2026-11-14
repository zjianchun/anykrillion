import type { Metadata } from "next";
import Link from "next/link";
import PackPageShell from "@/components/PackPageShell";
import { DAILY_BOARDS, getPromptsByPack } from "@/lib/datasets";

export const metadata: Metadata = {
  title: "Pokekrillion — Free Pokemon Krillion Trivia | AnyKrillion",
  description:
    "Play Pokekrillion free online with all 1,025 Pokemon across every generation, type, ability, and move. Find obscure dex picks and test Pokemillion mastery.",
  alternates: {
    canonical: "/pokekrillion/",
  },
  openGraph: {
    title: "Pokekrillion — Free Pokemon Krillion Trivia | AnyKrillion",
    description: "Play Pokekrillion endless rarity trivia spanning Gen 1–9 Pokemon types, base stat totals, starters, legendaries, and hidden gems.",
    url: "https://anykrillion.com/pokekrillion/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pokekrillion — Free Pokemon Krillion Trivia | AnyKrillion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pokekrillion — Free Pokemon Krillion Trivia | AnyKrillion",
    description: "Play Pokekrillion endless rarity trivia spanning Gen 1–9 Pokemon types, base stat totals, starters, legendaries, and hidden gems.",
    images: ["/og-image.png"],
  },
};

const FAQS = [
  {
    question: "How many Pokemon generations are supported in Pokekrillion?",
    answer:
      "Our Pokekrillion catalog ingests all 1,025 Pokemon from Generation 1 (Kanto) through Generation 9 (Paldea) using official PokéAPI v2 species, base stat, typing, and dual-type matrices.",
  },
  {
    question: "How do I score One in a Krillion points in Pokemon Krillion?",
    answer:
      "Skip mascots like Pikachu, Charizard, Mewtwo, and Lucario (which land in the 10–19 Plankton zone). Reach for overlooked mid-stage evolutions, single-generation Johto/Unova regional bugs or fossils, and niche dual-types like Dragon/Poison or Ice/Ghost.",
  },
  {
    question: "Does Pokekrillion accept tricky Pokemon names with hyphens or accents?",
    answer:
      "Yes! Names like Ho-Oh, Porygon-Z, Mr. Mime, Type: Null, and Flabébé work both with and without punctuation, spaces, or accents thanks to alias expansion and typo tolerance.",
  },
  {
    question: "Is Pokekrillion free and unlimited?",
    answer:
      "Yes—every round on Pokekrillion gives you endless 7-question dives with instant Noillirk reverse switching if you want to test which Gen 1 classics top the popularity charts.",
  },
];

export default function PokekrillionPage() {
  const pokePrompts = getPromptsByPack("pokemon");
  const totalAnswers = pokePrompts.reduce((sum, p) => sum + p.answers.length, 0);

  return (
    <PackPageShell
      canonicalUrl="https://anykrillion.com/pokekrillion/"
      pageTitle="Pokekrillion — Free Pokemon Krillion Trivia | AnyKrillion"
      pageDescription="Play Pokekrillion free online with all 1,025 Pokemon across every generation, type, ability, and move. Find obscure dex picks and test Pokemillion mastery."
      h1="Pokekrillion: Play Pokemon Krillion Rarity Trivia"
      heroSubtitle={`Dive through ${pokePrompts.length} Pokédex rarity prompts and ${totalAnswers.toLocaleString()} precomputed entries spanning Gen 1 Kanto through Gen 9 Paldea—built from open PokéAPI CSV tables.`}
      badgeText={`Pokekrillion • ${pokePrompts.length} Prompts • 1,025 Dex Species Indexed`}
      quickLinks={[
        { href: "/sources/", label: "PokéAPI Dataset Specs" },
        { href: "/noillirk/", label: "Reverse Noillirk Mode" },
        { href: "/", label: "All-Pack Krillion Unlimited" },
      ]}
      breadcrumbs={[
        { name: "Krillion Unlimited", url: "https://anykrillion.com/" },
        { name: "Pokekrillion", url: "https://anykrillion.com/pokekrillion/" },
      ]}
      gameSchema={{
        name: "Pokekrillion — Pokemon Rarity Trivia",
        description:
          "Play Pokekrillion free online across Generation 1–9 Pokemon types, abilities, base stats, and evolution lines.",
        genre: "Trivia Game",
        keywords: [
          "pokekrillion",
          "pokemon krillion",
          "pokemillion",
          "one in a krillion pokemon",
        ],
      }}
      prompts={pokePrompts}
      dailyBoards={DAILY_BOARDS}
      defaultMode="unlimited"
      defaultPack="pokemon"
      allowModeSwitch={true}
      allowPackFilter={false}
      excludePackHref="/pokekrillion/"
      engineSectionTitle="Play Pokekrillion Unlimited (Gen 1–9)"
      faqHeading="Pokekrillion FAQ"
      faqs={FAQS}
      sections={[
        {
          id: "pokemon-types-abilities-prompts",
          heading: "Pokemon Types, Abilities & Generation Prompts",
          body: (
            <>
              <p>
                Whether you grew up memorizing Red &amp; Blue box art or grinding Scarlet &amp; Violet
                tera raids, <strong>Pokekrillion</strong> (also known as <em>Pokemon Krillion</em> or{" "}
                <em>Pokemillion</em>) slices the 1,025-species National Pokédex by regional debut,
                mono- and dual-type combinations, 600+ Base Stat Total pseudo-legendaries, starter
                families, fossil Pokémon, and signature signature abilities.
              </p>
              <p>
                Stuck memorizing forgotten middle-evolution species? Practice endless unlimited dives
                here, then test yourself in{" "}
                <Link href="/" className="font-semibold text-cyan-300 hover:underline">
                  Krillion Unlimited
                </Link>{" "}
                where a Pokémon prompt frequently appears inside Today&apos;s 7-round Daily Dive.
              </p>
            </>
          ),
        },
        {
          id: "pokeapi-rarity-scoring",
          heading: "How Pokekrillion Rarity Is Scored via PokeAPI",
          includeRarityTable: true,
          body: (
            <p>
              Using verified species generation, evolutionary tier, and competitive/mascot fame
              signals derived from open <strong>PokéAPI v2</strong> tables, iconic mascots,
              legendaries, and starters calibrate naturally into the{" "}
              <strong>10–19 Plankton</strong> band, while forgotten Johto, Hoenn, Unova, or Kalos
              deep cuts award <strong>85–100 One in a Krillion</strong> points.
            </p>
          ),
        },
      ]}
    />
  );
}
