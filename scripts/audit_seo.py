#!/usr/bin/env python3
"""
Multi-dimensional SEO, Schema.org, Content Depth, Link Integrity & Dataset Audit
for AnyKrillion.com static export (/out).

Exits 0 only if all 10 audit gates pass with 0 errors and 0 warnings.
"""

from __future__ import annotations

import glob
import html
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

ROOT_DIR = Path("/Users/echo/Desktop/ProjectY/krillion")
OUT_DIR = ROOT_DIR / "out"
BASE_URL = "https://anykrillion.com"

PLANNED_ROUTES: Dict[str, dict] = {
    "/": {
        "batch": "Root",
        "primary_kw": "krillion unlimited",
        "expected_title": "Krillion Unlimited — Play Free Trivia Game | AnyKrillion",
        "expected_h1": "Krillion Unlimited: Free Endless & Daily Dive Trivia Game",
        "required_h2s": [
            "Play Endless Krillion Game Online",
            "How Krillion Rules & Rarity Scoring Work",
            "Switch Between Unlimited & Daily Dive Mode",
            "Explore Any Krillion Topic Packs",
            "Krillion Unlimited FAQ",
        ],
        "required_schemas": {"Organization", "WebSite", "WebApplication", "VideoGame", "WebPage", "FAQPage", "BreadcrumbList"},
        "min_words": 900,
    },
    "/krillion-answers-today/": {
        "batch": "P0",
        "primary_kw": "krillion answers today",
        "expected_title": "Krillion Answers Today & Daily Hints (Live) | AnyKrillion",
        "expected_h1": "Krillion Answers Today, Spoiler-Free Hints & Top Picks",
        "required_h2s": [
            "Today's 7 Krillion Questions & Progressive Hints",
            "One in a Krillion Best Answers (85–100 Pts)",
            "Common Plankton Traps to Avoid Today",
            "Krillion Answers & Hints FAQ",
        ],
        "required_schemas": {"WebPage", "FAQPage", "BreadcrumbList"},
        "min_words": 2000,
    },
    "/noillirk/": {
        "batch": "P0",
        "primary_kw": "noillirk",
        "expected_title": "Noillirk Unlimited — Reverse Krillion Game | AnyKrillion",
        "expected_h1": "Noillirk: Play Reverse Krillion Game & Endless Mode",
        "required_h2s": [
            "Play Noillirk Unlimited Online",
            "How Noillirk (Krillion in Reverse) Scoring Works",
            "Top Plankton Strategies for High Scores",
            "Noillirk Daily Game FAQ",
        ],
        "required_schemas": {"WebPage", "VideoGame", "FAQPage", "BreadcrumbList"},
        "min_words": 700,
    },
    "/krillion-sports/": {
        "batch": "P0",
        "primary_kw": "krillion sports",
        "expected_title": "Krillion Sports — Sports Rarity Trivia Free | AnyKrillion",
        "expected_h1": "Krillion Sports: Endless Sports Rarity Trivia Game",
        "required_h2s": [
            "Play Sports Krillion & Endless Challenges",
            "Sports Categories Covered (Football, Basketball & More)",
            "How Rare Athlete Scoring Is Calculated",
            "Krillion Sports FAQ",
        ],
        "required_schemas": {"WebPage", "VideoGame", "FAQPage", "BreadcrumbList"},
        "min_words": 700,
    },
    "/krillion-geography/": {
        "batch": "P0",
        "primary_kw": "krillion geography",
        "expected_title": "Krillion Geography — World Map Trivia Game | AnyKrillion",
        "expected_h1": "Krillion Geography: Countries, Capitals & World Trivia",
        "required_h2s": [
            "Play Krillion Geography Unlimited",
            "Continents, Borders & Landmark Prompts",
            "Wikidata Population & Rarity Methodology",
            "Krillion Geography FAQ",
        ],
        "required_schemas": {"WebPage", "VideoGame", "FAQPage", "BreadcrumbList"},
        "min_words": 700,
    },
    "/krillion-archive/": {
        "batch": "P0",
        "primary_kw": "krillion archive",
        "expected_title": "Krillion Archive — Past Daily Krillion Games | AnyKrillion",
        "expected_h1": "Krillion Archive: Replay Past Daily Krillion Games",
        "required_h2s": [
            "Past Daily Krillion Boards Calendar",
            "Replay Past Days & Compare Rarity Scores",
            "Archive Filtering by Topic Pack",
            "Krillion Archive FAQ",
        ],
        "required_schemas": {"CollectionPage", "FAQPage", "BreadcrumbList"},
        "min_words": 700,
    },
    "/pokekrillion/": {
        "batch": "P1",
        "primary_kw": "pokekrillion",
        "expected_title": "Pokekrillion — Free Pokemon Krillion Trivia | AnyKrillion",
        "expected_h1": "Pokekrillion: Play Pokemon Krillion Rarity Trivia",
        "required_h2s": [
            "Play Pokekrillion Unlimited (Gen 1–9)",
            "Pokemon Types, Abilities & Generation Prompts",
            "How Pokekrillion Rarity Is Scored via PokeAPI",
            "Pokekrillion FAQ",
        ],
        "required_schemas": {"WebPage", "VideoGame", "FAQPage", "BreadcrumbList"},
        "min_words": 700,
    },
    "/footbillion/": {
        "batch": "P1",
        "primary_kw": "footbillion",
        "expected_title": "Footbillion — Football Krillion Trivia | AnyKrillion",
        "expected_h1": "Footbillion: Football Krillion & Goalillion Trivia Game",
        "required_h2s": [
            "Play Footbillion & Goalillion Unlimited",
            "World Cup, Premier League & Club Squad Datasets",
            "Scoring & 40-Second Match Timer Rules",
            "Footbillion FAQ",
        ],
        "required_schemas": {"WebPage", "VideoGame", "FAQPage", "BreadcrumbList"},
        "min_words": 700,
    },
    "/nba-krillion/": {
        "batch": "P1",
        "primary_kw": "nba krillion",
        "expected_title": "NBA Krillion — Basketball Rarity Trivia | AnyKrillion",
        "expected_h1": "NBA Krillion: Play Basketball Rarity Trivia Online",
        "required_h2s": [
            "Play NBA Krillion & Hoopillion Unlimited",
            "Draft Classes, Championships & Career Stat Prompts",
            "How NBA Player Rarity Is Weighted",
            "NBA Krillion FAQ",
        ],
        "required_schemas": {"WebPage", "VideoGame", "FAQPage", "BreadcrumbList"},
        "min_words": 700,
    },
    "/krillion-movies/": {
        "batch": "P1",
        "primary_kw": "krillion movies",
        "expected_title": "Krillion Movies — Film & Oscars Trivia Free | AnyKrillion",
        "expected_h1": "Krillion Movies: Play Cinema & Oscar Rarity Trivia",
        "required_h2s": [
            "Play Krillion at the Movies Unlimited",
            "Oscars, Directors, Franchises & Box Office Prompts",
            "TMDB Vote-Count Rarity Methodology",
            "Krillion Movies FAQ",
        ],
        "required_schemas": {"WebPage", "VideoGame", "FAQPage", "BreadcrumbList"},
        "min_words": 700,
    },
    "/poople-unlimited/": {
        "batch": "P2",
        "primary_kw": "poople unlimited",
        "expected_title": "Poople Unlimited — Word Ladder & Solver | AnyKrillion",
        "expected_h1": "Poople Unlimited: Free 4-Letter Word Ladder Game, Daily Answer & Solver",
        "required_h2s": [
            "Play Poople Unlimited & Daily Word Ladder",
            "Poople Answer Today & Optimal Step-by-Step Hints",
            "How the Poople Game & Shortest-Path Solver Work",
            "Best Bridge Words to Reach POOP in 3–4 Steps",
            "Explore Any Krillion Topic Packs",
            "Poople Unlimited FAQ",
        ],
        "required_schemas": {"WebPage", "WebApplication", "VideoGame", "FAQPage", "BreadcrumbList"},
        "min_words": 800,
    },
    "/games-like-krillion/": {
        "batch": "P2",
        "primary_kw": "games like krillion",
        "expected_title": "Games Like Krillion — 9 Best Trivia Games | AnyKrillion",
        "expected_h1": "Games Like Krillion: Best Free Rarity Trivia & Daily Dles Alternatives",
        "required_h2s": [
            "Play All -illion & Daily Trivia Alternatives Online",
            "Side-by-Side Comparison of Games Like Krillion",
            "Reverse & General Trivia Alternatives (Krillion Unlimited & Noillirk)",
            "Sports, Football & Basketball Alternatives (Footbillion & NBA Krillion)",
            "Fandom, Geography, Cinema & Word Ladder Alternatives",
            "Games Like Krillion FAQ",
        ],
        "required_schemas": {"CollectionPage", "FAQPage", "BreadcrumbList"},
        "min_words": 950,
    },
    "/guides/": {
        "batch": "Compliance",
        "primary_kw": "krillion rules & strategy",
        "expected_title": "Krillion Strategy Guides & Rules Playbook | AnyKrillion",
        "expected_h1": "Krillion Rules, Rarity Scoring & High-Score Strategy Guides",
        "required_h2s": [
            "How Rarity Tiers Convert Facts Into 10–100 Points",
            "10-Part Rarity Playbook Directory Across All AnyKrillion Modes",
            "Krillion Strategy FAQ",
        ],
        "required_schemas": {"CollectionPage", "FAQPage", "BreadcrumbList"},
        "min_words": 1400,
    },
    "/sources/": {
        "batch": "Compliance",
        "primary_kw": "open data sources & methodology",
        "expected_title": "Open Data Sources & Rarity Methodology | AnyKrillion",
        "expected_h1": "Open Data Sources & Rarity Methodology",
        "required_h2s": [
            "Live Corpus Inventory by Topic Pack",
            "Primary Datasets Used Across Packs",
            "Percentile Calibration & Independence Notice",
            "Reproducible Quantile Formula & Alias Normalization Pipeline",
        ],
        "required_schemas": {"WebPage", "BreadcrumbList"},
        "min_words": 650,
    },
    "/privacy-policy/": {
        "batch": "Legal",
        "primary_kw": "privacy policy",
        "expected_title": "Privacy Policy, Cookies & AdSense Disclosure | AnyKrillion",
        "expected_h1": "Privacy Policy",
        "required_h2s": [],
        "required_schemas": {"WebPage", "BreadcrumbList"},
        "min_words": 200,
    },
    "/about/": {
        "batch": "Trust",
        "primary_kw": "about anykrillion",
        "expected_title": "About AnyKrillion — Our Mission & Trivia Craft | AnyKrillion",
        "expected_h1": "About AnyKrillion",
        "required_h2s": [],
        "required_schemas": {"WebPage", "BreadcrumbList"},
        "min_words": 200,
    },
    "/contact/": {
        "batch": "Trust",
        "primary_kw": "contact anykrillion",
        "expected_title": "Contact AnyKrillion — Support, Corrections & Feedback | AnyKrillion",
        "expected_h1": "Contact AnyKrillion",
        "required_h2s": [],
        "required_schemas": {"WebPage", "BreadcrumbList"},
        "min_words": 150,
    },
    "/terms/": {
        "batch": "Legal",
        "primary_kw": "terms of use",
        "expected_title": "Terms of Use & Open Dataset Disclaimer | AnyKrillion",
        "expected_h1": "Terms of Use",
        "required_h2s": [],
        "required_schemas": {"WebPage", "BreadcrumbList"},
        "min_words": 200,
    },
}


@dataclass
class PageData:
    title: str = ""
    meta_desc: Optional[str] = None
    canonical: Optional[str] = None
    og_url: Optional[str] = None
    og_image: Optional[str] = None
    robots: Optional[str] = None
    h1s: List[str] = field(default_factory=list)
    h2s: List[str] = field(default_factory=list)
    heading_levels: List[int] = field(default_factory=list)
    json_ld_raw: List[str] = field(default_factory=list)
    schema_types: Set[str] = field(default_factory=set)
    links: List[str] = field(default_factory=list)
    imgs: List[Tuple[str, Optional[str]]] = field(default_factory=list)
    word_count: int = 0


class PageHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.data = PageData()
        self._in_title = False
        self._heading_level: Optional[int] = None
        self._heading_buf: List[str] = []
        self._in_script = False
        self._script_type: Optional[str] = None
        self._script_buf: List[str] = []
        self._in_style = False
        self._visible_tokens: List[str] = []

    def handle_starttag(self, tag: str, attrs_list: List[Tuple[str, Optional[str]]]) -> None:
        attrs = dict(attrs_list)
        if tag == "title":
            self._in_title = True
        elif tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            lvl = int(tag[1])
            self.data.heading_levels.append(lvl)
            if lvl in (1, 2):
                self._heading_level = lvl
                self._heading_buf = []
        elif tag == "meta":
            name = (attrs.get("name") or "").lower()
            prop = (attrs.get("property") or "").lower()
            content = attrs.get("content") or ""
            if name == "description":
                self.data.meta_desc = html.unescape(content)
            elif name == "robots":
                self.data.robots = content
            elif prop == "og:url":
                self.data.og_url = content
            elif prop == "og:image":
                self.data.og_image = content
        elif tag == "link":
            if (attrs.get("rel") or "").lower() == "canonical":
                self.data.canonical = attrs.get("href") or ""
        elif tag == "script":
            self._in_script = True
            self._script_type = attrs.get("type")
            self._script_buf = []
        elif tag == "style":
            self._in_style = True
        elif tag == "a":
            href = attrs.get("href")
            if href is not None:
                self.data.links.append(href)
        elif tag == "img":
            self.data.imgs.append((attrs.get("src") or "", attrs.get("alt")))

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False
        elif tag in ("h1", "h2"):
            text = re.sub(r"\s+", " ", html.unescape("".join(self._heading_buf))).strip()
            if tag == "h1":
                self.data.h1s.append(text)
            else:
                self.data.h2s.append(text)
            self._heading_level = None
            self._heading_buf = []
        elif tag == "script":
            if self._script_type == "application/ld+json":
                self.data.json_ld_raw.append("".join(self._script_buf).strip())
            self._in_script = False
            self._script_type = None
        elif tag == "style":
            self._in_style = False

    def handle_data(self, raw: str) -> None:
        if self._in_title:
            self.data.title += html.unescape(raw)
        if self._heading_level is not None:
            self._heading_buf.append(raw)
        if self._in_script:
            self._script_buf.append(raw)
        elif not self._in_style:
            stripped = raw.strip()
            if stripped:
                self._visible_tokens.append(stripped)

    def finalize(self) -> PageData:
        self.data.title = re.sub(r"\s+", " ", self.data.title).strip()
        text = " ".join(self._visible_tokens)
        self.data.word_count = len(text.split())
        return self.data


def route_to_html_path(route: str) -> Path:
    if route == "/":
        return OUT_DIR / "index.html"
    slug = route.strip("/")
    return OUT_DIR / slug / "index.html"


def normalize_heading(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip())


def run_audit() -> Tuple[int, List[str], List[str], List[dict]]:
    errors: List[str] = []
    warnings: List[str] = []
    rows: List[dict] = []

    if not OUT_DIR.exists():
        errors.append(f"Build output directory missing: {OUT_DIR}")
        return 1, errors, warnings, rows

    # Check 1 & 9: Static files & sitemap.xml
    for required_asset in ["robots.txt", "llms.txt", "sitemap.xml", "og-image.png", "_headers", "BingSiteAuth.xml", "indexnow-key.txt"]:
        if not (OUT_DIR / required_asset).exists():
            errors.append(f"[Check 9] Required static asset missing in out/: {required_asset}")

    sitemap_locs: Set[str] = set()
    sitemap_path = OUT_DIR / "sitemap.xml"
    if sitemap_path.exists():
        try:
            tree = ET.parse(sitemap_path)
            root = tree.getroot()
            ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
            for loc in root.findall(".//sm:loc", ns):
                if loc.text:
                    sitemap_locs.add(loc.text.strip())
        except Exception as exc:
            errors.append(f"[Check 1] Failed parsing sitemap.xml: {exc}")

    # Valid internal targets from out/
    valid_routes = set(PLANNED_ROUTES.keys())

    for route, spec in PLANNED_ROUTES.items():
        html_path = route_to_html_path(route)
        expected_url = f"{BASE_URL}{route}"

        if not html_path.exists():
            errors.append(f"[Check 1] Missing HTML output for planned route {route}: {html_path}")
            continue

        if expected_url not in sitemap_locs:
            errors.append(f"[Check 1] Missing {expected_url} in out/sitemap.xml")

        parser = PageHTMLParser()
        parser.feed(html_path.read_text(encoding="utf-8"))
        pdata = parser.finalize()

        # Check 2: Title Tag Gate
        if not pdata.title:
            errors.append(f"[Check 2] Empty <title> on {route}")
        elif pdata.title != spec["expected_title"]:
            errors.append(
                f"[Check 2] Title mismatch on {route}: got {pdata.title!r}, expected {spec['expected_title']!r}"
            )
        if not (25 <= len(pdata.title) <= 75):
            warnings.append(f"[Check 2] Title length {len(pdata.title)} unusual on {route}")

        # Check 3: Meta Description Gate (strictly 145-160 chars)
        desc = pdata.meta_desc or ""
        if not (145 <= len(desc) <= 160):
            errors.append(
                f"[Check 3] Meta description length {len(desc)} not in [145, 160] on {route}: {desc!r}"
            )

        # Check 4: Canonical & og:url trailing-slash parity
        if pdata.canonical != expected_url:
            errors.append(
                f"[Check 4] Canonical mismatch on {route}: got {pdata.canonical!r}, expected {expected_url!r}"
            )
        if pdata.og_url != expected_url:
            errors.append(
                f"[Check 4] og:url mismatch on {route}: got {pdata.og_url!r}, expected {expected_url!r}"
            )

        # Check 5: Heading Hierarchy & RESEARCH.md 8.4 Alignment
        if len(pdata.h1s) != 1:
            errors.append(f"[Check 5] Expected exactly 1 <h1> on {route}, found {len(pdata.h1s)}: {pdata.h1s}")
        elif pdata.h1s[0] != spec["expected_h1"]:
            errors.append(
                f"[Check 5] H1 mismatch on {route}: got {pdata.h1s[0]!r}, expected {spec['expected_h1']!r}"
            )

        prev_lvl = 0
        for lvl in pdata.heading_levels:
            if prev_lvl > 0 and lvl > prev_lvl + 1:
                errors.append(
                    f"[Check 5] Skipped heading level H{prev_lvl} -> H{lvl} on {route}"
                )
            prev_lvl = lvl

        norm_h2s = {normalize_heading(h) for h in pdata.h2s}
        for req_h2 in spec["required_h2s"]:
            if normalize_heading(req_h2) not in norm_h2s:
                errors.append(
                    f"[Check 5] Missing required H2 {req_h2!r} on {route}. Found H2s: {pdata.h2s}"
                )

        # Check 6: Schema.org JSON-LD Validity
        if not pdata.json_ld_raw:
            errors.append(f"[Check 6] Missing JSON-LD structured data on {route}")
        for raw_json in pdata.json_ld_raw:
            try:
                parsed = json.loads(raw_json)
                if "@graph" in parsed and isinstance(parsed["@graph"], list):
                    for node in parsed["@graph"]:
                        t = node.get("@type")
                        if isinstance(t, str):
                            pdata.schema_types.add(t)
                elif isinstance(parsed.get("@type"), str):
                    pdata.schema_types.add(parsed["@type"])
            except Exception as exc:
                errors.append(f"[Check 6] Invalid JSON-LD syntax on {route}: {exc}")

        missing_schemas = spec["required_schemas"] - pdata.schema_types
        if missing_schemas:
            errors.append(
                f"[Check 6] Missing required Schema.org types on {route}: {sorted(missing_schemas)}"
            )

        # Check 7: Content Depth & Anti-Thin-Content Gate
        if pdata.word_count < spec["min_words"]:
            errors.append(
                f"[Check 7] Word count {pdata.word_count} below minimum {spec['min_words']} on {route}"
            )

        # Check 8: Internal Link Integrity & Trailing Slashes
        for href in pdata.links:
            if not href or href.startswith("#") or href.startswith("mailto:") or href.startswith("http://") or href.startswith("https://"):
                continue
            clean = href.split("#")[0].split("?")[0]
            if not clean.startswith("/"):
                errors.append(f"[Check 8] Relative non-root internal href {href!r} on {route}")
                continue
            if "." in Path(clean).name:
                # Asset file such as /og-image.png
                asset_file = OUT_DIR / clean.lstrip("/")
                if not asset_file.exists():
                    errors.append(f"[Check 8] Broken internal asset link {href!r} on {route}")
                continue
            if clean != "/" and not clean.endswith("/"):
                errors.append(f"[Check 8] Internal page link missing trailing slash: {href!r} on {route}")
            if clean not in valid_routes:
                errors.append(f"[Check 8] Broken internal route link {href!r} on {route}")

        # Check 9: Image alt integrity
        for src, alt in pdata.imgs:
            if alt is None or not alt.strip():
                errors.append(f"[Check 9] Image missing alt attribute ({src}) on {route}")

        rows.append(
            {
                "route": route,
                "batch": spec["batch"],
                "primary_kw": spec["primary_kw"],
                "title": pdata.title,
                "title_len": len(pdata.title),
                "desc_len": len(desc),
                "canonical_ok": pdata.canonical == expected_url and pdata.og_url == expected_url,
                "h1_count": len(pdata.h1s),
                "h2_count": len(pdata.h2s),
                "words": pdata.word_count,
                "schemas": sorted(pdata.schema_types),
            }
        )

    # Ensure no stray unexpected index.html routes outside planned + 404/_not-found
    for html_file in glob.glob(str(OUT_DIR / "**/index.html"), recursive=True):
        rel_dir = os.path.relpath(os.path.dirname(html_file), OUT_DIR)
        route_str = "/" if rel_dir == "." else f"/{rel_dir}/"
        if route_str not in valid_routes and route_str not in {"/404/", "/_not-found/"}:
            warnings.append(f"[Check 1] Unlisted route present in out/: {route_str}")

    # Check 10: Dataset Integrity
    try:
        prompts = json.loads((ROOT_DIR / "src/data/prompts.json").read_text(encoding="utf-8"))
        boards = json.loads((ROOT_DIR / "src/data/daily_boards.json").read_text(encoding="utf-8"))
        poople = json.loads((ROOT_DIR / "src/data/poople_words.json").read_text(encoding="utf-8"))

        if len(prompts) < 136:
            errors.append(f"[Check 10] Expected >=136 trivia prompts, got {len(prompts)}")
        total_ans = 0
        seen_ids = set()
        for p in prompts:
            if p["id"] in seen_ids:
                errors.append(f"[Check 10] Duplicate prompt id: {p['id']}")
            seen_ids.add(p["id"])
            ans_count = len(p.get("answers", []))
            if ans_count < 16:
                errors.append(f"[Check 10] Prompt {p['id']} has only {ans_count} answers (<16)")
            total_ans += ans_count
        if total_ans < 7000:
            errors.append(f"[Check 10] Total trivia answers {total_ans} below expected 7000+")
        if len(boards) != 30:
            errors.append(f"[Check 10] Expected 30 daily trivia boards, got {len(boards)}")
        if len(poople.get("dictionary", [])) < 1500 or len(poople.get("dailyBoards", [])) != 30:
            errors.append(
                f"[Check 10] Invalid poople_words.json size: dict={len(poople.get('dictionary', []))}, daily={len(poople.get('dailyBoards', []))}"
            )
    except Exception as exc:
        errors.append(f"[Check 10] Dataset validation failed: {exc}")

    print(f"=== AnyKrillion Multi-Dimensional SEO & Content Audit ({len(rows)} Planned Routes) ===")
    print(f"{'Route':<26} {'Batch':<10} {'Title':>5} {'Desc':>4} {'Canon':>5} {'H1/H2':>6} {'Words':>6}  Schemas")
    for r in rows:
        print(
            f"{r['route']:<26} {r['batch']:<10} {r['title_len']:>5} {r['desc_len']:>4} "
            f"{('OK' if r['canonical_ok'] else 'FAIL'):>5} {r['h1_count']}/{r['h2_count']:<4} "
            f"{r['words']:>6}  {', '.join(r['schemas'])}"
        )

    print(f"\nAudit Summary: {len(errors)} error(s), {len(warnings)} warning(s)")
    for w in warnings:
        print(f"  WARN: {w}")
    for e in errors:
        print(f"  ERR : {e}")

    if "--json-out" in sys.argv:
        idx = sys.argv.index("--json-out")
        if idx + 1 < len(sys.argv):
            Path(sys.argv[idx + 1]).write_text(
                json.dumps({"errors": errors, "warnings": warnings, "routes": rows}, indent=2),
                encoding="utf-8",
            )

    return (1 if (errors or warnings) else 0), errors, warnings, rows


if __name__ == "__main__":
    code, _, _, _ = run_audit()
    sys.exit(code)
