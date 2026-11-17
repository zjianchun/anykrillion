interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
  run(): Promise<{ success: boolean }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface PagesEnv {
  DB?: D1Database;
}

interface PagesContext {
  request: Request;
  env: PagesEnv;
}

interface CommentRow {
  id: string;
  path: string;
  name: string;
  text: string;
  parent_id: string;
  reply_to: string;
  is_owner: number;
  created_at: number;
}

interface ShownComment {
  id: string;
  name: string;
  text: string;
  at: number;
  owner: boolean;
  reply_to?: string;
  replies?: ShownComment[];
}

const CRAWLERS =
  /googlebot|bingbot|yandexbot|duckduckbot|baiduspider|chatgpt-user|oai-searchbot|gptbot|perplexity|claudebot|claude-user|facebookexternalhit|twitterbot|slurp|applebot/i;
const URL_PATTERN = /(https?:\/\/|www\.|\b[a-z0-9-]{2,}\.(com|net|org|io|gg|xyz|co|me|info|biz|ru|cn|tk|top|vip|site|online)\b)/i;

const NAME_MAX = 30;
const COMMENT_MAX = 500;
const PER_IP_HOUR = 8;
const PER_SITE_DAY = 300;

function json(body: unknown, status = 200, cache = "no-store"): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cache,
    },
  });
}

function normalizePath(raw: string | null): string {
  if (!raw) return "/";
  const clean = raw.split("?")[0].split("#")[0].trim();
  if (!clean.startsWith("/")) return "/";
  if (clean === "/") return "/";
  return clean.endsWith("/") ? clean : `${clean}/`;
}

function toShown(row: CommentRow): ShownComment {
  return {
    id: row.id,
    name: row.name,
    text: row.text,
    at: row.created_at,
    owner: Boolean(row.is_owner),
    ...(row.reply_to ? { reply_to: row.reply_to } : {}),
  };
}

function threadComments(roots: CommentRow[], replies: CommentRow[]): ShownComment[] {
  const byParent = new Map<string, ShownComment[]>();
  const sortedReplies = [...replies].sort((a, b) => a.created_at - b.created_at);
  for (const r of sortedReplies) {
    const list = byParent.get(r.parent_id) ?? [];
    list.push(toShown(r));
    byParent.set(r.parent_id, list);
  }
  return roots.map((root) => ({
    ...toShown(root),
    replies: byParent.get(root.id) ?? [],
  }));
}

async function checkAndBumpRate(db: D1Database, bucket: string, limit: number, ttlMs: number): Promise<boolean> {
  const now = Date.now();
  const row = await db
    .prepare("SELECT hits, expires_at FROM rate_limits WHERE bucket = ?")
    .bind(bucket)
    .first<{ hits: number; expires_at: number }>();

  if (row && row.expires_at > now) {
    if (row.hits >= limit) return false;
    await db
      .prepare("UPDATE rate_limits SET hits = hits + 1 WHERE bucket = ?")
      .bind(bucket)
      .run();
    return true;
  }

  await db
    .prepare(
      "INSERT OR REPLACE INTO rate_limits (bucket, hits, expires_at) VALUES (?, 1, ?)",
    )
    .bind(bucket, now + ttlMs)
    .run();
  return true;
}

export async function onRequestGet(ctx: PagesContext): Promise<Response> {
  const ua = ctx.request.headers.get("user-agent") ?? "";
  if (CRAWLERS.test(ua)) {
    return json({ likes: 0, comments: [] }, 200, "public, max-age=300");
  }
  if (!ctx.env.DB) {
    return json({ likes: 0, comments: [] });
  }

  const url = new URL(ctx.request.url);
  const path = normalizePath(url.searchParams.get("path"));

  try {
    const likeRow = await ctx.env.DB.prepare(
      "SELECT COUNT(*) AS cnt FROM likes WHERE path = ?",
    )
      .bind(path)
      .first<{ cnt: number }>();

    const rootsRes = await ctx.env.DB.prepare(
      "SELECT id, path, name, text, parent_id, reply_to, is_owner, created_at FROM comments WHERE path = ? AND status = 'live' AND parent_id = '' ORDER BY created_at DESC LIMIT 50",
    )
      .bind(path)
      .all<CommentRow>();

    const repliesRes = await ctx.env.DB.prepare(
      "SELECT id, path, name, text, parent_id, reply_to, is_owner, created_at FROM comments WHERE path = ? AND status = 'live' AND parent_id != '' ORDER BY created_at ASC LIMIT 200",
    )
      .bind(path)
      .all<CommentRow>();

    const comments = threadComments(
      rootsRes.results ?? [],
      repliesRes.results ?? [],
    );

    return json(
      {
        likes: Number(likeRow?.cnt ?? 0),
        comments,
      },
      200,
      "public, max-age=15, s-maxage=30",
    );
  } catch {
    return json({ likes: 0, comments: [] });
  }
}

export async function onRequestPost(ctx: PagesContext): Promise<Response> {
  if (!ctx.env.DB) {
    return json({ error: "Database not configured" }, 503);
  }

  const ua = ctx.request.headers.get("user-agent") ?? "";
  if (CRAWLERS.test(ua)) {
    return json({ error: "Forbidden" }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = (await ctx.request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const action = String(body.action ?? "");
  const path = normalizePath(typeof body.path === "string" ? body.path : "/");
  const ip = ctx.request.headers.get("cf-connecting-ip") ?? "anon";

  if (action === "like") {
    const visitorId = String(body.visitorId ?? "").trim().slice(0, 64);
    if (!visitorId || visitorId.length < 6) {
      return json({ error: "Invalid visitorId" }, 400);
    }

    await ctx.env.DB.prepare(
      "INSERT OR IGNORE INTO likes (path, visitor_id, created_at) VALUES (?, ?, ?)",
    )
      .bind(path, visitorId, Date.now())
      .run();

    const row = await ctx.env.DB.prepare(
      "SELECT COUNT(*) AS cnt FROM likes WHERE path = ?",
    )
      .bind(path)
      .first<{ cnt: number }>();

    return json({ ok: true, likes: Number(row?.cnt ?? 0) });
  }

  if (action === "comment") {
    const rawName = String(body.name ?? "Diver").replace(/\s+/g, " ").trim();
    const name = (rawName || "Diver").slice(0, NAME_MAX);
    const text = String(body.text ?? "").replace(/\s+/g, " ").trim();
    const parentId = String(body.parentId ?? "").trim().slice(0, 64);
    const replyTo = String(body.replyTo ?? "").trim().slice(0, NAME_MAX);

    if (text.length < 2 || text.length > COMMENT_MAX) {
      return json({ error: `Comment must be between 2 and ${COMMENT_MAX} characters.` }, 400);
    }
    if (URL_PATTERN.test(text) || URL_PATTERN.test(name)) {
      return json({ error: "Links and URLs are not allowed in comments." }, 400);
    }

    const hourAllowed = await checkAndBumpRate(ctx.env.DB, `ip:${ip}`, PER_IP_HOUR, 3600_000);
    if (!hourAllowed) {
      return json({ error: "Too many comments recently. Please wait a bit." }, 429);
    }

    const dayKey = new Date().toISOString().slice(0, 10);
    const dayAllowed = await checkAndBumpRate(ctx.env.DB, `site:${dayKey}`, PER_SITE_DAY, 86400_000);
    if (!dayAllowed) {
      return json({ error: "Daily comment limit reached." }, 429);
    }

    const id = crypto.randomUUID();
    const createdAt = Date.now();

    await ctx.env.DB.prepare(
      "INSERT INTO comments (id, path, name, text, parent_id, reply_to, is_owner, status, visitor_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, 'live', ?, ?)",
    )
      .bind(id, path, name, text, parentId, replyTo, ip.slice(0, 24), createdAt)
      .run();

    return json({
      ok: true,
      comment: {
        id,
        name,
        text,
        at: createdAt,
        owner: false,
        ...(replyTo ? { reply_to: replyTo } : {}),
        ...(parentId ? {} : { replies: [] }),
      },
    });
  }

  return json({ error: "Unknown action" }, 400);
}
