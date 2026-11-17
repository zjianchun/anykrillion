import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Contact AnyKrillion — Support, Corrections & Feedback | AnyKrillion",
  description:
    "Contact the AnyKrillion team at support@anykrillion.com for trivia dataset corrections, bug reports, privacy inquiries, or partnership questions.",
  alternates: {
    canonical: "/contact/",
  },
  openGraph: {
    title: "Contact AnyKrillion — Support, Corrections & Feedback | AnyKrillion",
    description:
      "Contact the AnyKrillion team at support@anykrillion.com for trivia dataset corrections, bug reports, privacy inquiries, or partnership questions.",
    url: "https://anykrillion.com/contact/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Contact AnyKrillion — Support, Corrections & Feedback",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact AnyKrillion — Support, Corrections & Feedback | AnyKrillion",
    description:
      "Contact the AnyKrillion team at support@anykrillion.com for trivia dataset corrections, bug reports, or privacy inquiries.",
    images: ["/og-image.png"],
  },
};

export default function ContactPage() {
  return (
    <>
      <JsonLd
        canonicalUrl="https://anykrillion.com/contact/"
        pageTitle="Contact AnyKrillion — Support, Corrections & Feedback | AnyKrillion"
        pageDescription="Contact the AnyKrillion team at support@anykrillion.com for trivia dataset corrections, bug reports, privacy inquiries, or partnership questions."
        pageType="WebPage"
        breadcrumbs={[
          { name: "Krillion Unlimited", url: "https://anykrillion.com/" },
          { name: "Contact", url: "https://anykrillion.com/contact/" },
        ]}
      />

      <Navbar />

      <main className="mx-auto max-w-4xl px-4 pb-16 pt-10">
        <article className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/80 p-6 sm:p-10">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
            Get in Touch
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            Contact AnyKrillion
          </h1>

          <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-300 sm:text-base">
            <section className="rounded-xl border border-cyan-400/30 bg-[#041425] p-5">
              <h2 className="text-lg font-bold text-white">Direct Email Support</h2>
              <p className="mt-2">
                We read every message personally. For all questions, data fixes, or feedback, email
                us directly at:
              </p>
              <p className="mt-3">
                <a
                  href="mailto:support@anykrillion.com"
                  className="inline-flex items-center rounded-lg bg-cyan-400 px-4 py-2 font-mono text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                >
                  support@anykrillion.com
                </a>
              </p>
              <p className="mt-3 text-xs text-slate-400">
                Typical response time: within 1–2 business days.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white">What You Can Reach Out About</h2>
              <ul className="mt-2 list-disc space-y-2 pl-5">
                <li>
                  <strong>Dataset &amp; Alias Corrections:</strong> Found a valid answer or common
                  spelling that should be recognized in Krillion, Footbillion, NBA Krillion, or
                  Poople? Send us the prompt and answer name.
                </li>
                <li>
                  <strong>Bug Reports &amp; Mobile UX:</strong> Let us know your device/browser if a
                  screen or timer behaves unexpectedly.
                </li>
                <li>
                  <strong>Privacy, GDPR &amp; Rights Requests:</strong> Questions about cookies,
                  advertising disclosures, or trademark attribution—see also our{" "}
                  <Link href="/privacy-policy/" className="text-cyan-300 hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/terms/" className="text-cyan-300 hover:underline">
                    Terms of Use
                  </Link>
                  .
                </li>
              </ul>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}
