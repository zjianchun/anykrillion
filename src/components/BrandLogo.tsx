"use client";

import { useId } from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  subtitle?: string;
}

export function BrandMark({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  const uid = useId().replace(/:/g, "");
  const dimClass =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11" : "h-9 w-9";

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`${dimClass} shrink-0 drop-shadow-[0_0_12px_rgba(34,211,238,0.3)]`}
    >
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#07223e" />
          <stop offset="100%" stopColor="#020b16" />
        </linearGradient>
        <linearGradient id={`bd-${uid}`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id={`body-${uid}`} x1="14" y1="20" x2="48" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="55%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id={`star-${uid}`} x1="42" y1="12" x2="54" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="16"
        fill={`url(#bg-${uid})`}
        stroke={`url(#bd-${uid})`}
        strokeWidth="2.5"
      />
      <circle
        cx="31"
        cy="33"
        r="22"
        stroke="#22d3ee"
        strokeOpacity="0.24"
        strokeWidth="1.5"
        strokeDasharray="6 4"
      />
      <circle
        cx="31"
        cy="33"
        r="14"
        stroke="#34d399"
        strokeOpacity="0.34"
        strokeWidth="1.5"
      />
      <path
        d="M15 37C15 27.5 23 20 34 20C39.5 20 43.5 22.5 46 26C42 27 38.5 29 36.5 31.8C40.5 32.8 43.8 35.8 45 40C40 42.2 34.5 43.2 28.5 43C20.5 42.8 15 40.2 15 37Z"
        fill={`url(#body-${uid})`}
      />
      <path d="M11 36.5L17.5 33V40L11 36.5Z" fill="#34d399" />
      <circle cx="35.5" cy="25.5" r="2.4" fill="#03111f" />
      <circle cx="35.5" cy="25.5" r="1" fill="#fde68a" />
      <path
        d="M23 44.5L21 50M29 44.8L27.8 50.5M35 44.3L34.5 49.5"
        stroke="#67e8f9"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M49 10L51 15.5L56.5 17.5L51 19.5L49 25L47 19.5L41.5 17.5L47 15.5L49 10Z"
        fill={`url(#star-${uid})`}
      />
    </svg>
  );
}

export default function BrandLogo({
  size = "md",
  subtitle = "One in a Krillion Trivia",
}: BrandLogoProps) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <BrandMark size={size} />
      <span className="leading-tight">
        <span
          className={`block font-black tracking-tight text-white ${
            size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base"
          }`}
        >
          Any
          <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-200 bg-clip-text text-transparent">
            Krillion
          </span>
        </span>
        {subtitle && (
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-cyan-300/75">
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
