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
    ? Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined),
      ) as Record<string, string | number | boolean>
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
