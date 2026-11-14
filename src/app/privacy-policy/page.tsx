import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Privacy Policy | AnyKrillion",
  description:
    "AnyKrillion privacy policy: browser-only gameplay storage via localStorage, zero mandatory accounts, and transparent site policies.",
  alternates: {
    canonical: "/privacy-policy/",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <JsonLd
        canonicalUrl="https://anykrillion.com/privacy-policy/"
        pageTitle="Privacy Policy | AnyKrillion"
        pageDescription="AnyKrillion privacy policy explaining browser-only gameplay storage and user privacy."
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
            Last Updated: November 14, 2026
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            Privacy Policy
          </h1>

          <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-300 sm:text-base">
            <section>
              <h2 className="text-lg font-bold text-white">1. Zero Account Requirement</h2>
              <p className="mt-2">
                You can play <strong>AnyKrillion</strong> (including Krillion Unlimited, Noillirk,
                and all topic packs) without creating an account, entering an email address, or
                submitting personal profile information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white">
                2. Local Browser Storage (<code>localStorage</code>)
              </h2>
              <p className="mt-2">
                Game high scores, streaks, and user interface preferences are saved directly inside
                your browser&apos;s <code>localStorage</code> on your own device and are never
                uploaded to an external user database. You can clear those scores anytime using your
                browser&apos;s site data settings.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white">3. Static Hosting &amp; Standard Logs</h2>
              <p className="mt-2">
                AnyKrillion operates as a fast static web application. Basic aggregated edge
                delivery metrics (such as browser HTTP error codes and security rate limiting) may
                be processed transiently by standard CDN/hosting infrastructure strictly to keep
                the site online and responsive.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white">4. Questions or Requests</h2>
              <p className="mt-2">
                Please also review our{" "}
                <Link href="/terms/" className="text-cyan-300 hover:underline">
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link href="/sources/" className="text-cyan-300 hover:underline">
                  Open Data Sources
                </Link>{" "}
                for full details about datasets and independent project status.
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}
