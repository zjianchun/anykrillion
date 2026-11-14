export interface FaqItem {
  question: string;
  answer: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

interface JsonLdProps {
  canonicalUrl: string;
  pageTitle: string;
  pageDescription: string;
  pageType?: "WebPage" | "CollectionPage";
  isRoot?: boolean;
  webAppSchema?: {
    name: string;
    description: string;
    applicationCategory?: string;
  };
  gameSchema?: {
    name: string;
    description: string;
    genre: string;
    keywords: string[];
  };
  faqs?: FaqItem[];
  breadcrumbs: BreadcrumbItem[];
}

export default function JsonLd({
  canonicalUrl,
  pageTitle,
  pageDescription,
  pageType = "WebPage",
  isRoot = false,
  webAppSchema,
  gameSchema,
  faqs = [],
  breadcrumbs,
}: JsonLdProps) {
  const nodes: Record<string, unknown>[] = [];

  if (isRoot) {
    nodes.push({
      "@type": "Organization",
      "@id": "https://anykrillion.com/#organization",
      name: "AnyKrillion",
      url: "https://anykrillion.com/",
      logo: {
        "@type": "ImageObject",
        url: "https://anykrillion.com/og-image.png",
      },
    });
    nodes.push({
      "@type": "WebSite",
      "@id": "https://anykrillion.com/#website",
      name: "AnyKrillion",
      url: "https://anykrillion.com/",
      publisher: { "@id": "https://anykrillion.com/#organization" },
      description:
        "Free Krillion Unlimited, Noillirk reverse mode, daily answers & hints, and topic packs for sports, geography, Pokemon, football, NBA, and movies.",
    });
    nodes.push({
      "@type": "WebApplication",
      "@id": "https://anykrillion.com/#webapp",
      name: "Krillion Unlimited — AnyKrillion",
      url: "https://anykrillion.com/",
      applicationCategory: "GameApplication",
      operatingSystem: "Any modern web browser",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    });
  } else if (webAppSchema) {
    nodes.push({
      "@type": "WebApplication",
      "@id": `${canonicalUrl}#webapp`,
      name: webAppSchema.name,
      url: canonicalUrl,
      description: webAppSchema.description,
      applicationCategory: webAppSchema.applicationCategory || "GameApplication",
      operatingSystem: "Any modern web browser",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    });
  }

  nodes.push({
    "@type": pageType,
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: pageTitle,
    description: pageDescription,
    isPartOf: { "@id": "https://anykrillion.com/#website" },
  });

  if (gameSchema) {
    nodes.push({
      "@type": "VideoGame",
      "@id": `${canonicalUrl}#game`,
      name: gameSchema.name,
      url: canonicalUrl,
      description: gameSchema.description,
      genre: gameSchema.genre,
      gamePlatform: ["Web browser", "Mobile browser"],
      playMode: "SinglePlayer",
      keywords: gameSchema.keywords.join(", "),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    });
  }

  nodes.push({
    "@type": "BreadcrumbList",
    "@id": `${canonicalUrl}#breadcrumb`,
    itemListElement: breadcrumbs.map((b, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: b.name,
      item: b.url,
    })),
  });

  if (faqs.length > 0) {
    nodes.push({
      "@type": "FAQPage",
      "@id": `${canonicalUrl}#faq`,
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.answer,
        },
      })),
    });
  }

  const graph = {
    "@context": "https://schema.org",
    "@graph": nodes,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
