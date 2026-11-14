import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://anykrillion.com";
  const lastModified = "2026-11-14T18:00:00.000Z";

  const routes: Array<{
    path: string;
    changeFrequency: "daily" | "weekly" | "monthly";
    priority: number;
  }> = [
    { path: "/", changeFrequency: "daily", priority: 1.0 },
    { path: "/krillion-answers-today/", changeFrequency: "daily", priority: 0.95 },
    { path: "/noillirk/", changeFrequency: "weekly", priority: 0.95 },
    { path: "/krillion-sports/", changeFrequency: "weekly", priority: 0.9 },
    { path: "/krillion-geography/", changeFrequency: "weekly", priority: 0.9 },
    { path: "/krillion-archive/", changeFrequency: "daily", priority: 0.85 },
    { path: "/pokekrillion/", changeFrequency: "weekly", priority: 0.85 },
    { path: "/footbillion/", changeFrequency: "weekly", priority: 0.85 },
    { path: "/nba-krillion/", changeFrequency: "weekly", priority: 0.85 },
    { path: "/krillion-movies/", changeFrequency: "weekly", priority: 0.85 },
    { path: "/guides/", changeFrequency: "monthly", priority: 0.75 },
    { path: "/sources/", changeFrequency: "monthly", priority: 0.7 },
    { path: "/privacy-policy/", changeFrequency: "monthly", priority: 0.3 },
    { path: "/terms/", changeFrequency: "monthly", priority: 0.3 },
  ];

  return routes.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
