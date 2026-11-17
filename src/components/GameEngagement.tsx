"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, Send, ThumbsUp, CornerDownRight } from "lucide-react";
import { trackGameEvent } from "@/lib/analytics";

interface CommentItem {
  id: string;
  name: string;
  text: string;
  at: number;
  owner: boolean;
  reply_to?: string;
  replies?: CommentItem[];
}

function getOrCreateVisitorId(): string {
  try {
    const key = "anykrillion_vid";
    const existing = window.localStorage.getItem(key);
    if (existing && existing.length >= 6) return existing;
    const next =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(key, next);
    return next;
  } catch {
    return `v_${Date.now()}`;
  }
}

function formatTimeAgo(ts: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return "just now";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function GameEngagement({
  gameLabel = "this game",
}: {
  gameLabel?: string;
}) {
  const pathname = usePathname() || "/";
  const normalizedPath = pathname === "/" ? "/" : pathname.endsWith("/") ? pathname : `${pathname}/`;

  const [likes, setLikes] = useState<number>(0);
  const [liked, setLiked] = useState<boolean>(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expanded, setExpanded] = useState<boolean>(false);

  const [nameInput, setNameInput] = useState<string>("");
  const [textInput, setTextInput] = useState<string>("");
  const [replyTarget, setReplyTarget] = useState<{ parentId: string; replyTo: string } | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch(`/api/engage?path=${encodeURIComponent(normalizedPath)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { likes?: number; comments?: CommentItem[] } | null) => {
        if (!active) return;
        try {
          setLiked(window.localStorage.getItem(`anykrillion_liked_${normalizedPath}`) === "1");
        } catch {
          // ignore
        }
        if (data) {
          setLikes(Number(data.likes ?? 0));
          setComments(Array.isArray(data.comments) ? data.comments : []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [normalizedPath]);

  const totalComments = comments.reduce(
    (sum, c) => sum + 1 + (c.replies?.length ?? 0),
    0,
  );

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    setLikes((n) => n + 1);
    try {
      window.localStorage.setItem(`anykrillion_liked_${normalizedPath}`, "1");
    } catch {
      // ignore
    }
    trackGameEvent("like", { path: normalizedPath });

    try {
      const visitorId = getOrCreateVisitorId();
      const res = await fetch("/api/engage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "like", path: normalizedPath, visitorId }),
      });
      if (res.ok) {
        const data = (await res.json()) as { likes?: number };
        if (typeof data.likes === "number") setLikes(data.likes);
      }
    } catch {
      // keep optimistic count
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = textInput.trim();
    if (trimmed.length < 2) {
      setErrorMsg("Please enter at least 2 characters.");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/engage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          path: normalizedPath,
          name: nameInput.trim() || "Diver",
          text: trimmed,
          parentId: replyTarget?.parentId ?? "",
          replyTo: replyTarget?.replyTo ?? "",
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        comment?: CommentItem;
      };
      if (!res.ok || !data.ok || !data.comment) {
        setErrorMsg(data.error || "Could not post comment right now.");
        return;
      }

      trackGameEvent("comment", { path: normalizedPath });
      const created = data.comment;
      if (replyTarget) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTarget.parentId
              ? { ...c, replies: [...(c.replies ?? []), created] }
              : c,
          ),
        );
      } else {
        setComments((prev) => [created, ...prev]);
      }
      setTextInput("");
      setReplyTarget(null);
      setExpanded(true);
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      data-nosnippet=""
      aria-label="Player reactions and comments"
      className="mx-auto mb-8 max-w-6xl px-4 sm:px-0"
    >
      <div className="rounded-2xl border border-cyan-500/20 bg-[#051629]/75 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleLike}
              disabled={liked}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-extrabold transition sm:text-sm ${
                liked
                  ? "border-cyan-400/60 bg-cyan-400/20 text-cyan-200"
                  : "border-white/15 bg-white/5 text-slate-200 hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-white"
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${liked ? "fill-cyan-300 text-cyan-300" : ""}`} />
              <span>{liked ? "Liked" : "Like"}</span>
              <span className="rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[11px] text-cyan-300">
                {likes}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10 sm:text-sm"
            >
              <MessageSquare className="h-4 w-4 text-cyan-300" />
              <span>Comments ({totalComments})</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Drop your rarest pick or score on <strong className="text-slate-200">{gameLabel}</strong>
          </p>
        </div>

        {(expanded || totalComments > 0) && (
          <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
            <form onSubmit={handleSubmitComment} className="space-y-2.5">
              {replyTarget && (
                <div className="flex items-center justify-between rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200">
                  <span>
                    Replying to <strong>@{replyTarget.replyTo}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyTarget(null)}
                    className="font-bold text-amber-300 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  maxLength={30}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Nickname (optional)"
                  className="rounded-xl border border-white/15 bg-[#03101d] px-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-cyan-400 sm:w-44"
                />
                <input
                  type="text"
                  maxLength={500}
                  value={textInput}
                  onChange={(e) => {
                    setTextInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder={
                    replyTarget
                      ? `Reply to ${replyTarget.replyTo} (plain text, no URLs)...`
                      : "Share a rare answer, score, or feedback (no URLs)..."
                  }
                  className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#03101d] px-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-cyan-400 sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-extrabold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
                >
                  <Send className="h-3.5 w-3.5" />
                  {submitting ? "Posting..." : "Post"}
                </button>
              </div>
              {errorMsg && <p className="text-xs font-semibold text-rose-300">{errorMsg}</p>}
            </form>

            {loading ? (
              <p className="text-xs text-slate-400">Loading player comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-slate-400">
                No comments yet — be the first to share your score or rarest pick!
              </p>
            ) : (
              <ul className="space-y-3">
                {comments.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-white/10 bg-[#03111f]/70 p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{c.name}</span>
                        {c.owner && (
                          <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                            Host
                          </span>
                        )}
                        <span className="text-slate-500">{formatTimeAgo(c.at)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTarget({ parentId: c.id, replyTo: c.name });
                          setExpanded(true);
                        }}
                        className="text-[11px] font-semibold text-cyan-300 hover:underline"
                      >
                        Reply
                      </button>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{c.text}</p>

                    {c.replies && c.replies.length > 0 && (
                      <ul className="mt-2.5 space-y-2 border-l-2 border-cyan-500/30 pl-3">
                        {c.replies.map((r) => (
                          <li key={r.id} className="text-xs">
                            <div className="flex items-center gap-1.5">
                              <CornerDownRight className="h-3 w-3 text-cyan-400" />
                              <span className="font-bold text-white">{r.name}</span>
                              {r.owner && (
                                <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                                  Host
                                </span>
                              )}
                              <span className="text-slate-500">{formatTimeAgo(r.at)}</span>
                            </div>
                            <p className="mt-1 text-slate-300">{r.text}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
