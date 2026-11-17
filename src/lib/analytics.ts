type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    pvuv?: (command: string, eventName: string, params?: Record<string, string | number | boolean>) => void;
    gtag?: (command: string, eventName: string, params?: Record<string, string | number | boolean>) => void;
  }
}

/**
 * Sends a gameplay or conversion event to both pvuv.ai and Google Analytics 4.
 */
export function trackGameEvent(eventName: string, params?: EventParams): void {
  if (typeof window === "undefined") return;

  const cleanParams = params
    ? (Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined),
      ) as Record<string, string | number | boolean>)
    : undefined;

  try {
    window.pvuv?.("event", eventName, cleanParams);
  } catch {
    // Analytics must never interrupt gameplay
  }

  try {
    window.gtag?.("event", eventName, cleanParams);
  } catch {
    // Analytics must never interrupt gameplay
  }
}

const EXP_PREFIX = "anykrillion_exp_";

/**
 * Sticky client-side A/B experiment bucketing.
 * Crawlers/SSR always receive the control variant ("direct") so SEO HTML never shifts.
 */
export function getStickyExperimentVariant<T extends string>(
  expName: string,
  variants: readonly [T, ...T[]],
): T {
  if (typeof window === "undefined") return variants[0];
  const ua = navigator.userAgent || "";
  if (/bot|crawl|spider|slurp|mediapartners/i.test(ua)) {
    return variants[0];
  }
  try {
    const key = `${EXP_PREFIX}${expName}`;
    const saved = window.localStorage.getItem(key) as T | null;
    if (saved && variants.includes(saved)) {
      return saved;
    }
    const chosen = variants[Math.floor(Math.random() * variants.length)];
    window.localStorage.setItem(key, chosen);
    return chosen;
  } catch {
    return variants[0];
  }
}
