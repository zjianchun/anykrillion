"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ImageIcon,
  Link2,
  MessageCircle,
  Share2,
  Swords,
  X,
} from "lucide-react";
import { trackGameEvent } from "@/lib/analytics";
import { buildSocialShareLinks } from "@/lib/challengeCodec";
import { renderScoreCardPng, type ScoreCardSpec } from "@/lib/scoreCardCanvas";

function XLogoIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TelegramIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
    </svg>
  );
}

function DiscordIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function BlueskyIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
    </svg>
  );
}

function triggerPngDownload(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

interface ShareChallengePanelProps {
  /** Direct URL that loads the exact same questions/word for a friend */
  challengeUrl: string;
  /** Spoiler-free text for social share or clipboard */
  shareText: string;
  /** Title used for Reddit / Web Share API */
  shareTitle: string;
  /** Full text including emojis + URL for "Copy Result Grid" */
  fullResultCopyText?: string;
  /** Custom Discord Markdown snippet (falls back to fullResultCopyText) */
  discordCopyText?: string;
  /** Optional 1200x675 Canvas score card specification */
  scoreCardSpec?: ScoreCardSpec;
  /** Filename used when saving the PNG score card */
  scoreCardFilename?: string;
  /** Compact inline strip during gameplay vs full card on summary */
  variant?: "inline" | "summary";
  /** Accent hint */
  accent?: "cyan" | "amber" | "emerald" | "purple";
  /** Optional challenger CTA label shown on the primary share button */
  ctaLabel?: string;
}

export default function ShareChallengePanel({
  challengeUrl,
  shareText,
  shareTitle,
  fullResultCopyText,
  discordCopyText,
  scoreCardSpec,
  scoreCardFilename = "anykrillion-score.png",
  variant = "summary",
  accent = "cyan",
  ctaLabel,
}: ShareChallengePanelProps) {
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [copiedGrid, setCopiedGrid] = useState(false);
  const [copiedDiscord, setCopiedDiscord] = useState(false);
  const [cardBusy, setCardBusy] = useState(false);
  const [cardStatus, setCardStatus] = useState<"idle" | "copied" | "saved">("idle");
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);

  const {
    xUrl,
    telegramUrl,
    whatsappUrl,
    blueskyUrl,
    redditUrl,
    facebookUrl,
  } = buildSocialShareLinks({
    text: shareText,
    url: challengeUrl,
    title: shareTitle,
  });

  const trackAndOpen = (channel: string) => {
    trackGameEvent("share_click", { channel, title: shareTitle });
  };

  const handleCopyLink = async () => {
    trackAndOpen("copy_link");
    try {
      await navigator.clipboard.writeText(challengeUrl);
      setCopiedChallenge(true);
      window.setTimeout(() => setCopiedChallenge(false), 2200);
    } catch {
      // ignore
    }
  };

  const handleCopyGrid = async () => {
    trackAndOpen("copy_grid");
    const payload = fullResultCopyText ?? `${shareText}\n${challengeUrl}`;
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedGrid(true);
      window.setTimeout(() => setCopiedGrid(false), 2200);
    } catch {
      // ignore
    }
  };

  const handleDiscordShare = async () => {
    trackAndOpen("discord");
    const payload =
      discordCopyText ??
      fullResultCopyText ??
      `**${shareTitle}**\n${shareText}\n${challengeUrl}`;
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedDiscord(true);
      window.setTimeout(() => setCopiedDiscord(false), 2500);
    } catch {
      // ignore
    }
  };

  const revealPreview = (dataUrl: string) => {
    setPreviewDataUrl(dataUrl);
    window.setTimeout(() => {
      previewBoxRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 60);
  };

  const handleCopyCardImage = async () => {
    if (!scoreCardSpec || cardBusy) return;
    setCardBusy(true);
    trackAndOpen("score_card_copy");
    try {
      const { blob, dataUrl } = await renderScoreCardPng(scoreCardSpec);
      revealPreview(dataUrl);
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.write === "function" &&
        typeof ClipboardItem !== "undefined"
      ) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          setCardStatus("copied");
          window.setTimeout(() => setCardStatus("idle"), 2800);
          return;
        } catch {
          // Fallback to PNG download if clipboard image write is blocked
        }
      }
      triggerPngDownload(dataUrl, scoreCardFilename);
      setCardStatus("saved");
      window.setTimeout(() => setCardStatus("idle"), 2800);
    } catch {
      // ignore
    } finally {
      setCardBusy(false);
    }
  };

  const handleDownloadCardImage = async () => {
    if (!scoreCardSpec || cardBusy) return;
    setCardBusy(true);
    trackAndOpen("score_card_download");
    try {
      const { dataUrl } = await renderScoreCardPng(scoreCardSpec);
      revealPreview(dataUrl);
      triggerPngDownload(dataUrl, scoreCardFilename);
      setCardStatus("saved");
      window.setTimeout(() => setCardStatus("idle"), 2800);
    } catch {
      // ignore
    } finally {
      setCardBusy(false);
    }
  };

  const handleNativeShare = async () => {
    trackAndOpen("native_share");
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        if (scoreCardSpec && typeof navigator.canShare === "function") {
          const { blob, dataUrl } = await renderScoreCardPng(scoreCardSpec);
          const file = new File([blob], scoreCardFilename, { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            revealPreview(dataUrl);
            await navigator.share({
              title: shareTitle,
              text: shareText,
              url: challengeUrl,
              files: [file],
            });
            return;
          }
        }
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
            href={xUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackAndOpen("x")}
            aria-label="Share challenge on X"
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 font-bold text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
          >
            <XLogoIcon className="h-3.5 w-3.5" />
            <span>Post</span>
          </a>

          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackAndOpen("telegram")}
            aria-label="Share challenge on Telegram"
            className="inline-flex items-center gap-1 rounded-lg border border-sky-400/35 bg-sky-500/15 px-2.5 py-1.5 font-bold text-sky-200 transition hover:bg-sky-500/25"
          >
            <TelegramIcon className="h-3.5 w-3.5" />
            <span>Telegram</span>
          </a>

          <button
            type="button"
            onClick={handleDiscordShare}
            aria-label="Copy Discord challenge message"
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-400/35 bg-indigo-500/15 px-2.5 py-1.5 font-bold text-indigo-200 transition hover:bg-indigo-500/25"
          >
            {copiedDiscord ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <DiscordIcon className="h-3.5 w-3.5" />}
            <span>{copiedDiscord ? "Copied!" : "Discord"}</span>
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackAndOpen("whatsapp")}
            aria-label="Send challenge via WhatsApp"
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1.5 font-bold text-emerald-200 transition hover:bg-emerald-500/20"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>WhatsApp</span>
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

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={handleNativeShare}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-4 py-2.5 text-xs font-extrabold shadow-lg transition hover:brightness-110 sm:w-auto sm:text-sm ${accentBtn}`}
          >
            <Share2 className="h-4 w-4" />
            {ctaLabel ?? "Challenge Friends"}
          </button>

          {scoreCardSpec && (
            <>
              <button
                type="button"
                onClick={handleCopyCardImage}
                disabled={cardBusy}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-400/45 bg-emerald-500/20 px-3.5 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-60 sm:text-sm"
              >
                {cardStatus === "copied" ? (
                  <Check className="h-4 w-4 text-emerald-300" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
                {cardStatus === "copied"
                  ? "Image Copied! Paste (Ctrl+V)"
                  : cardBusy
                    ? "Rendering Card..."
                    : "Copy Card Image"}
              </button>

              <button
                type="button"
                onClick={handleDownloadCardImage}
                disabled={cardBusy}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-bold text-cyan-100 transition hover:bg-cyan-500/25 disabled:opacity-60 sm:text-sm"
              >
                {cardStatus === "saved" ? (
                  <Check className="h-4 w-4 text-emerald-300" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {cardStatus === "saved" ? "PNG Downloaded!" : "Save PNG"}
              </button>
            </>
          )}

          {fullResultCopyText && (
            <button
              type="button"
              onClick={handleCopyGrid}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-100 transition hover:bg-cyan-500/20 sm:text-sm"
            >
              {copiedGrid ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedGrid ? "Result Grid Copied!" : "Copy Emoji Grid"}
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3.5 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-500/25 sm:text-sm"
          >
            {copiedChallenge ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            {copiedChallenge ? "Link Copied!" : "Copy Link"}
          </button>
        </div>
      </div>

      {previewDataUrl && (
        <div
          ref={previewBoxRef}
          className="mt-4 rounded-xl border border-cyan-400/30 bg-[#03101d]/80 p-3"
        >
          <div className="mb-2 flex items-center justify-between gap-2 text-xs">
            <span className="font-mono font-bold text-cyan-200">
              Shareable Score Card Preview (Paste directly into Discord / Telegram / X)
            </span>
            <button
              type="button"
              onClick={() => setPreviewDataUrl(null)}
              aria-label="Close score card preview"
              className="rounded-md border border-white/15 bg-white/5 p-1 text-slate-300 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <Image
            src={previewDataUrl}
            alt={`${shareTitle} shareable score card`}
            width={1200}
            height={675}
            unoptimized
            className="h-auto w-full rounded-xl border border-white/15 shadow-lg"
          />
        </div>
      )}

      <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3.5 text-xs">
        <span className="font-semibold text-slate-400">Share directly:</span>
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAndOpen("x")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-bold text-slate-100 transition hover:border-white/40 hover:bg-white/10"
        >
          <XLogoIcon className="h-3.5 w-3.5" />
          <span>X / Twitter</span>
        </a>
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAndOpen("telegram")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/35 bg-sky-500/15 px-3 py-1.5 font-bold text-sky-200 transition hover:bg-sky-500/25"
        >
          <TelegramIcon className="h-3.5 w-3.5" />
          <span>Telegram</span>
        </a>
        <button
          type="button"
          onClick={handleDiscordShare}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-3 py-1.5 font-bold text-indigo-200 transition hover:bg-indigo-500/25"
        >
          {copiedDiscord ? (
            <Check className="h-3.5 w-3.5 text-emerald-300" />
          ) : (
            <DiscordIcon className="h-3.5 w-3.5" />
          )}
          <span>{copiedDiscord ? "Copied! Paste in Discord" : "Discord"}</span>
        </button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAndOpen("whatsapp")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-3 py-1.5 font-bold text-emerald-200 transition hover:bg-emerald-500/25"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>WhatsApp</span>
        </a>
        <a
          href={blueskyUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAndOpen("bluesky")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/35 bg-sky-500/15 px-3 py-1.5 font-bold text-sky-200 transition hover:bg-sky-500/25"
        >
          <BlueskyIcon className="h-3.5 w-3.5" />
          <span>Bluesky</span>
        </a>
        <a
          href={redditUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAndOpen("reddit")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-orange-400/35 bg-orange-500/15 px-3 py-1.5 font-bold text-orange-200 transition hover:bg-orange-500/25"
        >
          <span>Reddit</span>
        </a>
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAndOpen("facebook")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/35 bg-blue-500/15 px-3 py-1.5 font-bold text-blue-200 transition hover:bg-blue-500/25"
        >
          <span>Facebook</span>
        </a>
        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-semibold text-slate-200 transition hover:bg-white/10"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>More Apps</span>
        </button>
      </div>
    </div>
  );
}
