import type { Metadata } from "next";
import Link from "next/link";
import PackPageShell from "@/components/PackPageShell";
import { DAILY_BOARDS, getPromptsByPack } from "@/lib/datasets";

export const metadata: Metadata = {
  title: "Krillion Movies — Film, Oscars & Cinema Trivia Game | AnyKrillion",
  description:
    "Play Krillion Movies free online! Discover rare films, directors, Oscar winners, and cast connections powered by verified TMDB vote-count rarity data.",
  alternates: {
    canonical: "/krillion-movies/",
  },
  openGraph: {
    title: "Krillion Movies — Film, Oscars & Cinema Trivia Game | AnyKrillion",
    description:
      "Play Krillion Movies endless rarity trivia: Oscars Best Picture, Pixar features, acclaimed directors, and blockbuster cinema franchises.",
    url: "https://anykrillion.com/krillion-movies/",
  },
};

const FAQS = [
  {
    question: "What categories are included in Krillion Movies?",
    answer:
      "Krillion Movies covers Academy Award Best Picture winners, iconic film directors, Pixar & Studio Ghibli animated classics, James Bond entries, Marvel/Star Wars cinema releases, Best Actor/Actress winners, and $1B+ box-office hits.",
  },
  {
    question: "Do I have to type leading 'The' or exact subtitles for movie titles?",
    answer:
      "No! Our alias generator automatically indexes movie titles without leading 'The', 'A', or 'An' and strips punctuation/colons on popular sequels, backed by Levenshtein typo tolerance.",
  },
  {
    question: "How does Krillion Movies calibrate film rarity?",
    answer:
      "Titles and filmmakers are ranked along crowd-recognition signals—worldwide box office footprint, review/vote count density, and awards-era visibility—so Titanic or Avengers score low Plankton points while classic pre-1970 Best Picture winners pay out 85–100 points.",
  },
];

export default function KrillionMoviesPage() {
  const moviePrompts = getPromptsByPack("movies");
  const totalAnswers = moviePrompts.reduce((sum, p) => sum + p.answers.length, 0);

  return (
    <PackPageShell
      canonicalUrl="https://anykrillion.com/krillion-movies/"
      pageTitle="Krillion Movies — Film, Oscars & Cinema Trivia Game | AnyKrillion"
      pageDescription="Play Krillion Movies free online! Discover rare films, directors, Oscar winners, and cast connections powered by verified TMDB vote-count rarity data."
      h1="Krillion Movies: Play Cinema & Oscar Rarity Trivia"
      heroSubtitle={`Put your filmography memory to the test across ${moviePrompts.length} cinema prompts and ${totalAnswers.toLocaleString()} precomputed films, Oscar winners, directors, and franchise entries.`}
      badgeText={`Movies Pack • ${moviePrompts.length} Prompts • Cinema & Oscars`}
      quickLinks={[
        { href: "/noillirk/", label: "Reverse Noillirk Mode" },
        { href: "/krillion-answers-today/", label: "Today's Answers" },
        { href: "/", label: "All-Pack Unlimited" },
      ]}
      breadcrumbs={[
        { name: "Krillion Unlimited", url: "https://anykrillion.com/" },
        { name: "Krillion Movies", url: "https://anykrillion.com/krillion-movies/" },
      ]}
      gameSchema={{
        name: "Krillion Movies — Cinema & Oscar Trivia",
        description:
          "Play Krillion Movies online free: test Oscar winners, directors, Pixar animations, and cinema franchises for rarity scores.",
        genre: "Trivia Game",
        keywords: [
          "krillion movies",
          "krillion at the movies",
          "krillion film",
          "cinemillion",
        ],
      }}
      prompts={moviePrompts}
      dailyBoards={DAILY_BOARDS}
      defaultMode="unlimited"
      defaultPack="movies"
      allowModeSwitch={true}
      allowPackFilter={false}
      excludePackHref="/krillion-movies/"
      engineSectionTitle="Play Krillion at the Movies Unlimited"
      faqHeading="Krillion Movies FAQ"
      faqs={FAQS}
      sections={[
        {
          id: "oscars-directors-prompts",
          heading: "Oscars, Directors, Franchises & Box Office Prompts",
          body: (
            <>
              <p>
                Whether it is called <strong>Krillion Movies</strong>,{" "}
                <em>Krillion at the Movies</em>, or <em>Cinemillion</em>, our cinema pack rewards
                cinephiles who look beyond opening-weekend blockbusters. Prompts test your recall across{" "}
                <em>Best Picture Academy Award history</em>, <em>classic animated studio releases</em>,{" "}
                <em>iconic thriller/sci-fi directors</em>, and <em>James Bond installments</em>.
              </p>
              <p>
                Want to test whether mainstream box-office hits top the popularity charts? Switch the
                mode toggle directly to{" "}
                <Link href="/noillirk/" className="font-semibold text-amber-300 hover:underline">
                  Noillirk Reverse Mode
                </Link>{" "}
                where naming Avatar or Oppenheimer turns into a top-scoring strategy.
              </p>
            </>
          ),
        },
        {
          id: "tmdb-vote-rarity-methodology",
          heading: "TMDB Vote-Count Rarity Methodology",
          includeRarityTable: true,
          body: (
            <p>
              Film and filmmaker rarity tiers calibrate modern streaming ubiquity, worldwide box
              office, and audience vote-count density into a consistent 10–100 scale. Mega-franchises
              and recent Best Picture sweeps cluster in the <strong>10–19 Plankton</strong> band, while
              mid-century Oscar winners, under-seen studio gems, and forgotten sequels unlock{" "}
              <strong>85–100 One in a Krillion</strong> points.
            </p>
          ),
        },
      ]}
    />
  );
}
