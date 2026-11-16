"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  Compass,
  Menu,
  Sparkles,
  Trophy,
  Waves,
  Wind,
  X,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const PRIMARY_LINKS = [
  { href: "/", label: "Unlimited", icon: Waves },
  { href: "/krillion-answers-today/", label: "Today's Answers", icon: Sparkles },
  { href: "/noillirk/", label: "Noillirk", icon: Wind },
  { href: "/krillion-sports/", label: "Sports", icon: Trophy },
  { href: "/krillion-geography/", label: "Geography", icon: Compass },
  { href: "/krillion-archive/", label: "Archive", icon: null },
];

const PACK_LINKS = [
  { href: "/pokekrillion/", label: "Pokekrillion", badge: "Gen 1–9" },
  { href: "/footbillion/", label: "Footbillion", badge: "40s Match" },
  { href: "/nba-krillion/", label: "NBA Krillion", badge: "Basketball" },
  { href: "/krillion-movies/", label: "Krillion Movies", badge: "Cinema" },
  { href: "/poople-unlimited/", label: "Poople Unlimited", badge: "Word Ladder" },
  { href: "/games-like-krillion/", label: "Games Like Krillion", badge: "All 9 Modes" },
  { href: "/guides/", label: "Strategy Guides", badge: "Wiki" },
  { href: "/sources/", label: "Data Sources", badge: "Open DB" },
];

export default function Navbar() {
  const pathname = usePathname() || "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [packsOpen, setPacksOpen] = useState(false);

  const normalizeHref = (h: string) => (h === "/" ? "/" : h.replace(/\/$/, ""));
  const currentNorm = normalizeHref(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-cyan-500/20 bg-[#03111f]/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-1.5 sm:px-4 sm:py-2.5">
        <Link
          href="/"
          className="group flex items-center text-white transition hover:opacity-90"
        >
          <BrandLogo size="md" subtitle="Endless & Daily Packs" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {PRIMARY_LINKS.map((item) => {
            const active = currentNorm === normalizeHref(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  active
                    ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5 text-cyan-300/80" />}
                {item.label}
              </Link>
            );
          })}

          <div
            className="relative"
            onMouseEnter={() => setPacksOpen(true)}
            onMouseLeave={() => setPacksOpen(false)}
          >
            <button
              type="button"
              onClick={() => setPacksOpen((v) => !v)}
              aria-expanded={packsOpen}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Topic Packs
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {packsOpen && (
              <div className="absolute right-0 top-full w-60 pt-2">
                <div className="rounded-xl border border-cyan-500/25 bg-[#061b30] p-2 shadow-2xl">
                  {PACK_LINKS.map((pack) => (
                    <Link
                      key={pack.href}
                      href={pack.href}
                      onClick={() => setPacksOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-cyan-500/15 hover:text-cyan-200"
                    >
                      <span className="font-medium">{pack.label}</span>
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                        {pack.badge}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile menu trigger */}
        <button
          type="button"
          aria-label="Toggle navigation menu"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 p-2 text-slate-200 lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-cyan-500/20 bg-[#041527] px-4 py-4 lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            {PRIMARY_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <p className="mt-4 mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300/80">
            Topic Packs &amp; Resources
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PACK_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
