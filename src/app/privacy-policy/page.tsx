import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Privacy Policy, Cookies & AdSense Disclosure | AnyKrillion",
  description:
    "Read the AnyKrillion.com privacy policy covering Google AdSense advertising cookies, analytics, local browser storage, and personalized ad opt-out options.",
  alternates: {
    canonical: "/privacy-policy/",
  },
  openGraph: {
    title: "Privacy Policy, Cookies & AdSense Disclosure | AnyKrillion",
    description:
      "Read the AnyKrillion.com privacy policy covering Google AdSense advertising cookies, analytics, local browser storage, and personalized ad opt-out options.",
    url: "https://anykrillion.com/privacy-policy/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Privacy Policy, Cookies & AdSense Disclosure | AnyKrillion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy, Cookies & AdSense Disclosure | AnyKrillion",
    description:
      "Read the AnyKrillion.com privacy policy covering Google AdSense advertising cookies, analytics, local browser storage, and personalized ad opt-out options.",
    images: ["/og-image.png"],
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <JsonLd
        canonicalUrl="https://anykrillion.com/privacy-policy/"
        pageTitle="Privacy Policy, Cookies & AdSense Disclosure | AnyKrillion"
        pageDescription="Read the AnyKrillion.com privacy policy covering Google AdSense advertising cookies, analytics, local browser storage, and personalized ad opt-out options."
        pageType="WebPage"
        breadcrumbs={[
          { name: "Krillion Unlimited", url: "https://anykrillion.com/" },
          { name: "Privacy Policy", url: "https://anykrillion.com/privacy-policy/" },
        ]}
      />

      <Navbar />

      <main className="mx-auto max-w-4xl px-4 pb-16 pt-10">
        <article className="rounded-2xl border border-cyan-500/20 bg-[#05182b]/80 p-6 sm:p-10">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
            Last Updated: November 17, 2026
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            Privacy Policy
          </h1>

          <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-300 sm:text-base">
            <section>
              <h2 className="text-lg font-bold text-white">1. Zero Account Requirement</h2>
              <p className="mt-2">
                You can play <strong>AnyKrillion</strong> (including Krillion Unlimited, Noillirk,
                Poople Unlimited, and all topic packs) without creating an account, entering an
                email address, or submitting personal profile information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white">
                2. Local Browser Storage (<code>localStorage</code>)
              </h2>
              <p className="mt-2">
                Game high scores, streaks, sound toggles, and user interface preferences are saved
                directly inside your browser&apos;s <code>localStorage</code> on your own device and
                are never uploaded to an external user database. You can clear those scores anytime
                using your browser&apos;s site data settings.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white">
                3. Third-Party Advertising &amp; Google AdSense Cookies
              </h2>
              <p className="mt-2">
                We use <strong>Google AdSense</strong> to display advertisements and keep
                AnyKrillion free to play. Third-party vendors, including Google, use cookies, web
                beacons, and IP addresses to serve ads based on a user&apos;s prior visits to this
                website or other websites on the internet.
              </p>
              <p className="mt-2">
                Google&apos;s use of advertising cookies enables it and its partners to serve ads to
                visitors based on their visit to AnyKrillion.com and/or other sites on the internet.
                To learn more about how Google uses data when you use our site, visit{" "}
                <a
                  href="https://policies.google.com/technologies/partner-sites"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 underline hover:text-cyan-200"
                >
                  How Google uses information from sites or apps that use our services
                </a>
                .
              </p>
              <p className="mt-2">
                You may opt out of personalized advertising at any time by visiting{" "}
                <a
                  href="https://adssettings.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 underline hover:text-cyan-200"
                >
                  Google Ads Settings
                </a>
                . Alternatively, you can opt out of a third-party vendor&apos;s use of cookies for
                personalized advertising by visiting{" "}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 underline hover:text-cyan-200"
                >
                  www.aboutads.info/choices
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white">4. Analytics &amp; Edge Hosting</h2>
              <p className="mt-2">
                AnyKrillion uses <strong>Google Analytics 4</strong> and privacy-focused{" "}
                <strong>PVUV.ai</strong> to measure aggregate pageviews, gameplay completion rates,
                and site performance. Basic edge delivery logs (such as HTTP status codes and
                security rate limiting) are processed transiently by Cloudflare to keep the site fast
                and protected against automated abuse.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white">5. Contact &amp; Related Policies</h2>
              <p className="mt-2">
                If you have privacy questions, data correction requests, or GDPR inquiries, please
                email{" "}
                <a
                  href="mailto:support@anykrillion.com"
                  className="font-semibold text-cyan-300 hover:underline"
                >
                  support@anykrillion.com
                </a>{" "}
                or visit our{" "}
                <Link href="/contact/" className="text-cyan-300 hover:underline">
                  Contact Page
                </Link>
                . You can also review our{" "}
                <Link href="/about/" className="text-cyan-300 hover:underline">
                  About Page
                </Link>
                ,{" "}
                <Link href="/terms/" className="text-cyan-300 hover:underline">
                  Terms of Use
                </Link>
                , and{" "}
                <Link href="/sources/" className="text-cyan-300 hover:underline">
                  Open Data Sources
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
