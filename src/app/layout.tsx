import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Silkscreen } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pixelFont = Silkscreen({
  weight: ["400", "700"],
  variable: "--font-pixel",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#03111f",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://anykrillion.com"),
  title: {
    default: "Krillion Unlimited — Play Free Krillion Game Online | AnyKrillion",
    template: "%s",
  },
  description:
    "Play Krillion Unlimited free online with endless trivia rounds, smart typo tolerance, and Today's 7-question Daily Dive. Chase One in a Krillion answers now.",
  authors: [{ name: "AnyKrillion" }],
  creator: "AnyKrillion",
  publisher: "AnyKrillion",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Krillion Unlimited — Play Free Krillion Game Online | AnyKrillion",
    description:
      "Play Krillion Unlimited, Today's Daily Dive, Noillirk reverse mode, and topic packs with verified open datasets and smart typo tolerance.",
    url: "https://anykrillion.com/",
    siteName: "AnyKrillion",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AnyKrillion — Krillion Unlimited & Rarity Trivia Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Krillion Unlimited — Play Free Krillion Game Online | AnyKrillion",
    description:
      "Play Krillion Unlimited, Daily Dive, Noillirk reverse mode, Sports, Geography, Pokekrillion, Footbillion, NBA, and Movies free online.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "rvihPVOtRPefqNPGIquRdu6RWs4BtFes0TgkzXmpmVM",
    other: {
      "msvalidate.01": "0126D8DD85969164FE2067F5B8A34881",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-MHSMNS5658"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-MHSMNS5658');
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pixelFont.variable} min-h-screen antialiased bg-[#03111f] text-slate-100 selection:bg-cyan-400 selection:text-slate-950`}
      >
        {children}
      </body>
    </html>
  );
}
