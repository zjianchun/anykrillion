import Link from "next/link";
import { Waves } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-cyan-500/20 bg-[#020c17] text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-white">
              <Waves className="h-5 w-5 text-cyan-300" />
              <span className="text-lg font-extrabold tracking-tight">
                Any<span className="text-cyan-300">Krillion</span>
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Play Krillion Unlimited, Today&apos;s Daily Dive, reverse Noillirk,
              and specialized rarity trivia packs free in your browser with
              smart typo tolerance.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Core Modes
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-cyan-200">
                  Krillion Unlimited (Home)
                </Link>
              </li>
              <li>
                <Link href="/krillion-answers-today/" className="hover:text-cyan-200">
                  Krillion Answers Today &amp; Hints
                </Link>
              </li>
              <li>
                <Link href="/noillirk/" className="hover:text-cyan-200">
                  Noillirk (Reverse Krillion)
                </Link>
              </li>
              <li>
                <Link href="/krillion-archive/" className="hover:text-cyan-200">
                  Krillion Archive (Past Days)
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Topic Packs
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/krillion-sports/" className="hover:text-cyan-200">
                  Krillion Sports
                </Link>
              </li>
              <li>
                <Link href="/krillion-geography/" className="hover:text-cyan-200">
                  Krillion Geography
                </Link>
              </li>
              <li>
                <Link href="/pokekrillion/" className="hover:text-cyan-200">
                  Pokekrillion (Gen 1–9)
                </Link>
              </li>
              <li>
                <Link href="/footbillion/" className="hover:text-cyan-200">
                  Footbillion / Goalillion
                </Link>
              </li>
              <li>
                <Link href="/nba-krillion/" className="hover:text-cyan-200">
                  NBA Krillion
                </Link>
              </li>
              <li>
                <Link href="/krillion-movies/" className="hover:text-cyan-200">
                  Krillion Movies
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Guides &amp; Transparency
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/guides/" className="hover:text-cyan-200">
                  Strategy Guides &amp; Scoring Math
                </Link>
              </li>
              <li>
                <Link href="/sources/" className="hover:text-cyan-200">
                  Open Data Sources &amp; Methodology
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy/" className="hover:text-cyan-200">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms/" className="hover:text-cyan-200">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs leading-relaxed text-slate-400 sm:flex sm:items-center sm:justify-between">
          <p>
            AnyKrillion.com is an independent fan-made trivia platform powered by
            verified open datasets and is not affiliated with krillion.io.
          </p>
          <p className="mt-2 sm:mt-0 text-slate-500">
            © {new Date().getFullYear()} AnyKrillion.com
          </p>
        </div>
      </div>
    </footer>
  );
}
