"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { usePathname } from "next/navigation";

const AD_KEYS = {
  native: "8b452858dd079521bffb57c7077f87f3",
  banner468: "c12b6981220534421f55693f71f4a9df",
  skyscraper160: "d7f4b58b7d9b5407f51355edc3064740",
  leaderboard728: "b63141234dd079d6b4b8a96558f7cb13",
} as const;

const NATIVE_CONTAINER_ID = `container-${AD_KEYS.native}`;
const NATIVE_SCRIPT_SRC = `https://bicea.org/21/${AD_KEYS.native}`;

type ViewportTier = "ssr" | "mobile" | "tablet" | "md" | "lg" | "2xl";

function getViewportTierSnapshot(): ViewportTier {
  if (typeof window === "undefined") return "ssr";
  const width = window.innerWidth;
  if (width < 480) return "mobile";
  if (width < 768) return "tablet";
  if (width < 1024) return "md";
  if (width < 1536) return "lg";
  return "2xl";
}

function getServerViewportTier(): ViewportTier {
  return "ssr";
}

function subscribeViewportResize(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("resize", callback, { passive: true });
  return () => window.removeEventListener("resize", callback);
}

function useViewportTier(): ViewportTier {
  return useSyncExternalStore(
    subscribeViewportResize,
    getViewportTierSnapshot,
    getServerViewportTier,
  );
}

function getFullscreenSnapshot(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(document.fullscreenElement);
}

function getServerFullscreen(): boolean {
  return false;
}

function subscribeFullscreen(callback: () => void): () => void {
  if (typeof document === "undefined") return () => {};
  document.addEventListener("fullscreenchange", callback);
  return () => document.removeEventListener("fullscreenchange", callback);
}

function useIsFullscreen(): boolean {
  return useSyncExternalStore(
    subscribeFullscreen,
    getFullscreenSnapshot,
    getServerFullscreen,
  );
}

/**
 * Delays ad network execution until browser idle (eager) or near-viewport scroll (lazy)
 * so game hydration and 60FPS canvas startup stay prioritized.
 */
function useAdVisible(
  ref: RefObject<HTMLElement | null>,
  eager: boolean,
): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;

    if (eager) {
      if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
        const ricId = window.requestIdleCallback(() => setVisible(true), { timeout: 600 });
        return () => window.cancelIdleCallback(ricId);
      }
      const timerId = window.setTimeout(() => setVisible(true), 350);
      return () => window.clearTimeout(timerId);
    }

    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const timerId = window.setTimeout(() => setVisible(true), 150);
      return () => window.clearTimeout(timerId);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [eager, ref, visible]);

  return visible;
}

interface AtOptionsIframeProps {
  adKey: string;
  width: number;
  height: number;
  eager: boolean;
}

function AtOptionsIframeBody({ adKey, width, height, eager }: AtOptionsIframeProps) {
  const asideRef = useRef<HTMLElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const visible = useAdVisible(asideRef, eager);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!visible || failed) return;
    const host = slotRef.current;
    if (!host) return;

    host.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.title = "Sponsored advertisement";
    iframe.width = String(width);
    iframe.height = String(height);
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("frameborder", "0");
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.style.border = "0";
    iframe.style.overflow = "hidden";
    iframe.style.display = "block";
    iframe.style.width = `${width}px`;
    iframe.style.height = `${height}px`;
    iframe.style.maxWidth = "100%";

    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;
      const payload = event.data as { type?: string; key?: string } | null;
      if (payload?.type === "ak-ad-err" && payload.key === adKey) {
        setFailed(true);
      }
    };
    window.addEventListener("message", onMessage);

    host.appendChild(iframe);

    const doc = iframe.contentDocument;
    if (doc) {
      const optionsJson = JSON.stringify({
        key: adKey,
        format: "iframe",
        height,
        width,
        params: {},
      });
      doc.open();
      doc.write(
        `<!DOCTYPE html><html><head><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;display:flex;align-items:center;justify-content:center;}</style></head><body><script>atOptions=${optionsJson};<` +
          `/script><script src="https://bicea.org/22/${adKey}" onerror="window.parent.postMessage({type:'ak-ad-err',key:'${adKey}'},'*')"><` +
          `/script></body></html>`,
      );
      doc.close();
    }

    return () => {
      window.removeEventListener("message", onMessage);
      host.innerHTML = "";
    };
  }, [adKey, failed, height, visible, width]);

  if (failed) return null;

  return (
    <aside
      ref={asideRef}
      aria-label="Sponsored advertisement"
      data-nosnippet=""
      className="mx-auto w-fit max-w-full overflow-hidden rounded-xl border border-white/[0.07] bg-[#041322]/55 px-0.5 pb-1.5 pt-1 shadow-sm lg:px-2"
    >
      <span className="mb-1 block select-none text-center font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        Sponsored
      </span>
      <div
        ref={slotRef}
        className="mx-auto max-w-full overflow-hidden"
        style={{ width, height }}
      />
    </aside>
  );
}

function AtOptionsIframeUnit(props: AtOptionsIframeProps) {
  const pathname = usePathname() || "/";
  return <AtOptionsIframeBody key={`${pathname}:${props.adKey}`} {...props} />;
}

function NativeAdBody({ eager }: { eager: boolean }) {
  const asideRef = useRef<HTMLElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const visible = useAdVisible(asideRef, eager);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!visible || failed) return;
    const aside = asideRef.current;
    const slot = slotRef.current;
    if (!aside || !slot) return;

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = NATIVE_SCRIPT_SRC;
    script.onerror = () => setFailed(true);
    aside.insertBefore(script, slot);

    return () => {
      script.remove();
      slot.innerHTML = "";
    };
  }, [failed, visible]);

  if (failed) return null;

  return (
    <aside
      ref={asideRef}
      aria-label="Sponsored recommendations"
      data-nosnippet=""
      className="max-w-full overflow-hidden rounded-2xl border border-cyan-500/15 bg-[#051629]/65 p-3.5 text-slate-200 sm:p-4"
    >
      <span className="mb-2 block select-none font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        Sponsored
      </span>
      <div
        id={NATIVE_CONTAINER_ID}
        ref={slotRef}
        className="min-h-[90px] w-full overflow-hidden"
      />
    </aside>
  );
}

function NativeAdUnit({ eager }: { eager: boolean }) {
  const pathname = usePathname() || "/";
  return <NativeAdBody key={`${pathname}:${AD_KEYS.native}`} eager={eager} />;
}

export function PrimaryLeaderboardSlot({ className = "" }: { className?: string }) {
  const tier = useViewportTier();
  if (tier === "md" || tier === "lg" || tier === "2xl") {
    return (
      <div className={className}>
        <AtOptionsIframeUnit
          adKey={AD_KEYS.leaderboard728}
          width={728}
          height={90}
          eager={true}
        />
      </div>
    );
  }
  if (tier === "tablet") {
    return (
      <div className={className}>
        <AtOptionsIframeUnit
          adKey={AD_KEYS.banner468}
          width={468}
          height={60}
          eager={true}
        />
      </div>
    );
  }
  return null;
}

export function MobilePostGameNativeSlot({ className = "" }: { className?: string }) {
  const tier = useViewportTier();
  if (tier !== "mobile") return null;
  return (
    <div className={className}>
      <NativeAdUnit eager={true} />
    </div>
  );
}

export function MidContentBannerSlot({ className = "" }: { className?: string }) {
  const tier = useViewportTier();
  if (tier !== "md" && tier !== "lg" && tier !== "2xl") return null;
  return (
    <div className={className}>
      <AtOptionsIframeUnit
        adKey={AD_KEYS.banner468}
        width={468}
        height={60}
        eager={false}
      />
    </div>
  );
}

export function BottomNativeSlot({ className = "" }: { className?: string }) {
  const tier = useViewportTier();
  if (tier === "ssr" || tier === "mobile") return null;
  return (
    <div className={className}>
      <NativeAdUnit eager={false} />
    </div>
  );
}

export function GuideWithSkyscraper({
  mode,
  children,
  className = "",
}: {
  mode: "game" | "content";
  children: ReactNode;
  className?: string;
}) {
  const tier = useViewportTier();
  const isFullscreen = useIsFullscreen();

  if (mode === "game" && tier === "2xl" && !isFullscreen) {
    return (
      <>
        <div className={`space-y-8 ${className}`}>{children}</div>
        <div className="fixed left-[calc(50%+588px)] top-20 z-20">
          <AtOptionsIframeUnit
            adKey={AD_KEYS.skyscraper160}
            width={160}
            height={600}
            eager={true}
          />
        </div>
      </>
    );
  }

  const showStickySidebar =
    (mode === "game" && tier === "lg") ||
    (mode === "content" && (tier === "lg" || tier === "2xl"));

  if (showStickySidebar && !isFullscreen) {
    return (
      <div
        className={`grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_178px] ${className}`}
      >
        <div className="min-w-0 space-y-8">{children}</div>
        <div className="sticky top-20 flex justify-center">
          <AtOptionsIframeUnit
            adKey={AD_KEYS.skyscraper160}
            width={160}
            height={600}
            eager={mode === "content"}
          />
        </div>
      </div>
    );
  }

  return <div className={`space-y-8 ${className}`}>{children}</div>;
}
