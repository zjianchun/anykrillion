import Link from "next/link";
import { Waves } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex min-h-[65vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
          <Waves className="h-8 w-8" />
        </div>
        <p className="mt-5 font-mono text-xs font-bold uppercase tracking-widest text-cyan-300">
          Depth Error 404
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          This Submarine Route Surfaced Elsewhere
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300 sm:text-base">
          The page you looked for could not be found in our trench chart. Jump straight back into
          Krillion Unlimited or check Today&apos;s Daily Dive answers.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-[#03111f] hover:bg-cyan-300"
          >
            Play Krillion Unlimited
          </Link>
          <Link
            href="/krillion-answers-today/"
            className="rounded-xl border border-cyan-500/35 px-5 py-2.5 text-sm font-bold text-cyan-200 hover:bg-cyan-500/10"
          >
            Krillion Answers Today
          </Link>
          <Link
            href="/noillirk/"
            className="rounded-xl border border-amber-400/35 px-5 py-2.5 text-sm font-bold text-amber-200 hover:bg-amber-500/10"
          >
            Play Noillirk Reverse
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
