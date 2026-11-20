"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackGameEvent } from "@/lib/analytics";

const SOCIAL_BAR_SRC =
  "https://bicea.org/14/d2e7e003db7ca28137356ed3effe8688";
const SOCIAL_BAR_SCRIPT_ID = "ak-social-bar-script";
const DWELL_TRIGGER_MS = 90_000;
const POST_COMPLETE_DELAY_MS = 1_500;

const ALLOWED_GAME_ROUTES = new Set([
  "/",
  "/noillirk",
  "/krillion-sports",
  "/krillion-geography",
  "/pokekrillion",
  "/footbillion",
  "/nba-krillion",
  "/krillion-movies",
  "/poople-unlimited",
]);

let socialBarInjected = false;

function normalizeRoute(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

function isEligibleDesktop(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (
    /bot|crawl|spider|slurp|mediapartners|lighthouse|pagespeed|headless|adsbot|google-inspectiontool/i.test(
      ua,
    )
  ) {
    return false;
  }
  if (/android|iphone|ipad|ipod|mobile|tablet|silk|kindle/i.test(ua)) {
    return false;
  }
  if (window.innerWidth < 1024) return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/**
 * Scheme B: Loads Adsterra Social Bar strictly on desktop interactive game
 * routes after completing round 1 (or 90s active visible dwell), never on
 * mobile/tablet or editorial/guide/legal pages.
 */
export default function DeferredSocialBar() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (socialBarInjected || document.getElementById(SOCIAL_BAR_SCRIPT_ID)) {
      return;
    }

    const route = normalizeRoute(pathname);
    if (!ALLOWED_GAME_ROUTES.has(route) || !isEligibleDesktop()) {
      return;
    }

    let hasInteracted = false;
    let activeVisibleMs = 0;
    let postCompleteTimer: ReturnType<typeof setTimeout> | undefined;
    let dwellInterval: ReturnType<typeof setInterval> | undefined;

    const cleanup = () => {
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("ak:game_complete", onGameComplete);
      if (postCompleteTimer !== undefined) {
        clearTimeout(postCompleteTimer);
        postCompleteTimer = undefined;
      }
      if (dwellInterval !== undefined) {
        clearInterval(dwellInterval);
        dwellInterval = undefined;
      }
    };

    const inject = (trigger: "game_complete" | "dwell_90s") => {
      if (
        socialBarInjected ||
        document.getElementById(SOCIAL_BAR_SCRIPT_ID) ||
        !isEligibleDesktop() ||
        document.fullscreenElement
      ) {
        return;
      }

      socialBarInjected = true;
      cleanup();

      const script = document.createElement("script");
      script.id = SOCIAL_BAR_SCRIPT_ID;
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      script.src = SOCIAL_BAR_SRC;
      document.body.appendChild(script);

      trackGameEvent("social_bar_loaded", { trigger, route });
    };

    const onInteract = () => {
      hasInteracted = true;
    };

    const onGameComplete = () => {
      if (socialBarInjected || postCompleteTimer !== undefined) return;
      postCompleteTimer = setTimeout(
        () => inject("game_complete"),
        POST_COMPLETE_DELAY_MS,
      );
    };

    window.addEventListener("pointerdown", onInteract, {
      passive: true,
      once: true,
    });
    window.addEventListener("keydown", onInteract, {
      passive: true,
      once: true,
    });
    window.addEventListener("ak:game_complete", onGameComplete);

    dwellInterval = setInterval(() => {
      if (socialBarInjected) {
        cleanup();
        return;
      }
      if (
        document.visibilityState === "visible" &&
        !document.fullscreenElement
      ) {
        activeVisibleMs += 1_000;
      }
      if (activeVisibleMs >= DWELL_TRIGGER_MS && hasInteracted) {
        inject("dwell_90s");
      }
    }, 1_000);

    return cleanup;
  }, [pathname]);

  return null;
}
