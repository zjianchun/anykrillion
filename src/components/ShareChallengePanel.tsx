"use client";

import { useState } from "react";
import { Check, Copy, Link2, MessageCircle, Share2, Swords } from "lucide-react";
import { buildSocialShareLinks } from "@/lib/challengeCodec";

interface ShareChallengePanelProps {
  /** Direct URL that loads the exact same questions/word for a friend */
  challengeUrl: string;
  /** Spoiler-free text for social share or clipboard */
  shareText: string;
  /** Title used for Reddit / Web Share API */
  shareTitle: string;
  /** Full text including emojis + URL for "Copy Result Grid" */
  fullResultCopyText?: string;
  /** Compact inline strip during gameplay vs full card on summary */
  variant?: "inline" | "summary";
  /** Accent hint */
  accent?: "cyan" | "amber" | "emerald" | "purple";
}

export default function ShareChallengePanel({
  challengeUrl,
  shareText,
  shareTitle,
  fullResultCopyText,
  variant = "summary",
  accent = "cyan",
}: ShareChallengePanelProps) {
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [copiedGrid, setCopiedGrid] = useState(false);

  const { twitterUrl, whatsappUrl, redditUrl } = buildSocialShareLinks({
    text: shareText,
    url: challengeUrl,
    title: shareTitle,
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(challengeUrl);
      setCopiedChallenge(true);
      window.setTimeout(() => setCopiedChallenge(false), 2200);
    } catch {
      // ignore
    }
  };

  const handleCopyGrid = async () => {
    const payload = fullResultCopyText ?? `${shareText}\n${challengeUrl}`;
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedGrid(true);
      window.setTimeout(() => setCopiedGrid(false), 2200);
    } catch {
      // ignore
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: challengeUrl,
        });
        return;
      } catch {
        // fallback to copy link
      }
    }
    await handleCopyLink();
  };

  const accentBtn =
    accent === "amber"
      ? "from-amber-400 to-orange-400 text-slate-950"
      : accent === "emerald"
        ? "from-emerald-400 to-teal-300 text-slate-950"
        : accent === "purple"
          ? "from-fuchsia-400 to-amber-300 text-slate-950"
          : "from-cyan-400 to-emerald-400 text-slate-950";

  if (variant === "inline") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Swords className="h-4 w-4 text-amber-300" />
          <span className="font-semibold">
            Play with friends on this exact board
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyLink}
            className={`inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r px-3 py-1.5 font-extrabold transition hover:brightness-110 ${accentBtn}`}
          >
            {copiedChallenge ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
            {copiedChallenge ? "Invite Link Copied!" : "Challenge a Friend"}
          </button>

          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share challenge on X"
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 font-bold text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
          >
            𝕏 Post
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Send challenge via WhatsApp"
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1.5 font-bold text-emerald-200 transition hover:bg-emerald-500/20"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/15 bg-black/35 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-300">
            <Swords className="h-4 w-4" />
            Share Result &amp; Challenge Friends (Same Exact Board)
          </p>
          <p className="mt-1 text-xs text-slate-300">
            Anyone who opens your Challenge Link plays these exact same questions and compares scores head-to-head.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className={`inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r px-4 py-2 text-xs font-extrabold shadow-lg transition hover:brightness-110 sm:text-sm ${accentBtn}`}
          >
            {copiedChallenge ? <Check className="h-4 w-4" /> : <Swords className="h-4 w-4" />}
            {copiedChallenge ? "Challenge Link Copied!" : "Copy Friend Challenge Link"}
          </button>

          {fullResultCopyText && (
            <button
              type="button"
              onClick={handleCopyGrid}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-bold text-cyan-100 transition hover:bg-cyan-500/25 sm:text-sm"
            >
              {copiedGrid ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedGrid ? "Result Grid Copied!" : "Copy Emoji Grid"}
            </button>
          )}
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3.5 text-xs">
        <span className="font-semibold text-slate-400">Share directly:</span>
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-bold text-slate-100 transition hover:border-white/40 hover:bg-white/10"
        >
          𝕏 / Twitter
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-3 py-1.5 font-bold text-emerald-200 transition hover:bg-emerald-500/25"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </a>
        <a
          href={redditUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-orange-400/35 bg-orange-500/15 px-3 py-1.5 font-bold text-orange-200 transition hover:bg-orange-500/25"
        >
          Reddit
        </a>
        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-semibold text-slate-200 transition hover:bg-white/10"
        >
          <Share2 className="h-3.5 w-3.5" />
          More Apps
        </button>
      </div>
    </div>
  );
}
