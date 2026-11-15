interface PagesEnv {
  PVUV_SITE?: string;
  PVUV_INGEST_TOKEN?: string;
}

interface PagesContext {
  request: Request;
  env: PagesEnv;
  next: () => Promise<Response>;
  waitUntil: (promise: Promise<unknown>) => void;
}

const CRAWLERS =
  /chatgpt-user|oai-searchbot|gptbot|perplexity-user|perplexitybot|claude-user|claude-searchbot|claudebot|bingbot|googlebot|applebot|duckduckbot|duckassistbot|yandexbot|meta-externalagent|bytespider/i;
const ASSET = /\.(?!(?:html?|txt|xml|md)$)[a-z0-9]{1,8}$/i;

/**
 * Reports non-JS AI assistant and search crawler page fetches to pvuv.ai
 * asynchronously after serving the static Cloudflare Pages response.
 */
export async function onRequest(ctx: PagesContext): Promise<Response> {
  const response = await ctx.next();
  const { request, env } = ctx;
  const ua = request.headers.get("user-agent") ?? "";
  const path = new URL(request.url).pathname;
  const siteId = env.PVUV_SITE || "CLjAnNi8";

  if (
    (request.method === "GET" || request.method === "HEAD") &&
    CRAWLERS.test(ua) &&
    !path.startsWith("/api/") &&
    !path.startsWith("/_") &&
    !ASSET.test(path) &&
    env.PVUV_INGEST_TOKEN
  ) {
    ctx.waitUntil(
      fetch(`https://api.pvuv.ai/v1/sites/${siteId}/crawler_hits`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${env.PVUV_INGEST_TOKEN}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          hits: [
            {
              ua,
              path,
              ip: request.headers.get("cf-connecting-ip") ?? undefined,
              status: response.status,
              ts: Date.now(),
            },
          ],
        }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => {}),
    );
  }

  return response;
}
