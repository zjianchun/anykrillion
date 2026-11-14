#!/usr/bin/env python3
"""
Builds and validates AnyKrillion's precomputed trivia prompt corpus and
30-day deterministic Daily Dive schedule from open ETL datasets and curated
domain catalogs.

Outputs:
  - src/data/prompts.json
  - src/data/daily_boards.json
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from datetime import date, timedelta
from pathlib import Path
from typing import Dict, List

SCRIPTS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPTS_DIR.parent
CACHE_DIR = SCRIPTS_DIR / "raw_cache"
OUT_DIR = PROJECT_ROOT / "src" / "data"

if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from catalogs.common import dedupe_answers, rarity_to_tier  # noqa: E402
from catalogs.domain_general_movies import (  # noqa: E402
    build_general_prompts,
    build_movies_prompts,
)
from catalogs.domain_sports_nba import (  # noqa: E402
    build_nba_prompts,
    build_sports_prompts,
)
from catalogs.open_etl import (  # noqa: E402
    build_football_prompts,
    build_geography_and_language_prompts,
    build_pokemon_prompts,
)

VALID_PACKS = (
    "general",
    "geography",
    "movies",
    "sports",
    "football",
    "nba",
    "pokemon",
)

DAILY_THEMES = (
    "Deep Sea Horizon: Mixed Vault",
    "Trench Explorer: World & Screen",
    "Continental Drift & Stadiums",
    "Pelagic Classics: Pop & Pitch",
    "Abyssal Trivia Marathon",
    "Oceanic Trivia Sprint",
    "All-Star Rarity Gauntlet",
    "Global Atlas & Hardwood",
    "Box Office to World Cup",
    "Coral Reef Trivia Challenge",
    "Midnight Zone Deep Cuts",
    "Champions, Capitals & Cinema",
    "Pokédex to Premier League",
    "Rookie to One in a Krillion",
    "Deep Current Knowledge Test",
)

ANCHOR_END_DATE = date(2026, 11, 14)
TOTAL_DAILY_BOARDS = 30


def validate_and_normalize_prompts(raw_prompts: List[Dict[str, object]]) -> List[Dict[str, object]]:
    seen_ids = set()
    normalized: List[Dict[str, object]] = []

    for prompt in raw_prompts:
        pid = str(prompt["id"]).strip()
        if not pid:
            raise ValueError("Encountered prompt with empty id")
        if pid in seen_ids:
            raise ValueError(f"Duplicate prompt id: {pid}")
        seen_ids.add(pid)

        pack = str(prompt["pack"]).strip()
        if pack not in VALID_PACKS:
            raise ValueError(f"Invalid pack '{pack}' on prompt '{pid}'")

        hints = list(prompt.get("hints", []))
        if len(hints) != 3 or any(not str(h).strip() for h in hints):
            raise ValueError(f"Prompt '{pid}' must have exactly 3 non-empty hints")

        raw_answers = list(prompt.get("answers", []))
        answers = dedupe_answers(raw_answers)
        if len(answers) < 15:
            raise ValueError(
                f"Prompt '{pid}' has only {len(answers)} unique answers (minimum 15 required)"
            )

        checked_answers = []
        for ans in answers:
            rarity = max(10, min(100, int(round(float(ans["rarity"])))))
            checked_answers.append(
                {
                    "name": str(ans["name"]).strip(),
                    "aliases": [str(a).strip().lower() for a in ans.get("aliases", []) if str(a).strip()],
                    "rarity": rarity,
                    "tier": rarity_to_tier(rarity),
                    "fact": str(ans["fact"]).strip(),
                }
            )

        # Ensure consistent ordering: easiest/most famous (10) first, rarest (100) last
        checked_answers.sort(key=lambda item: (item["rarity"], item["name"]))

        normalized.append(
            {
                "id": pid,
                "pack": pack,
                "question": str(prompt["question"]).strip(),
                "categoryLabel": str(prompt["categoryLabel"]).strip(),
                "timerSeconds": int(prompt["timerSeconds"]),
                "sourceAttribution": str(prompt["sourceAttribution"]).strip(),
                "hints": [str(h).strip() for h in hints],
                "answers": checked_answers,
            }
        )

    return normalized


def build_daily_boards(prompts: List[Dict[str, object]]) -> List[Dict[str, object]]:
    """
    Creates 30 deterministic Daily Dive boards anchored so Board #30 falls on
    ANCHOR_END_DATE (2026-11-14) and Board #1 falls on 2026-10-16.
    Each board contains 7 prompts across the 7 core packs, avoiding repeats across
    adjacent days.
    """
    by_pack: Dict[str, List[Dict[str, object]]] = {pack: [] for pack in VALID_PACKS}
    for p in prompts:
        by_pack[str(p["pack"])].append(p)

    for pack, pool in by_pack.items():
        if not pool:
            raise ValueError(f"Pack '{pack}' has 0 prompts")

    boards: List[Dict[str, object]] = []
    start_date = ANCHOR_END_DATE - timedelta(days=TOTAL_DAILY_BOARDS - 1)
    prev_day_ids = set()

    # Keep fixed pack progression per Daily Dive slot for well-rounded 7-round pacing:
    # General -> Geography -> Movies -> Sports -> Football -> NBA -> Pokemon
    pack_order = ["general", "geography", "movies", "sports", "football", "nba", "pokemon"]
    pack_offsets = {pack: 0 for pack in pack_order}

    for idx in range(TOTAL_DAILY_BOARDS):
        day_number = idx + 1
        board_date = (start_date + timedelta(days=idx)).isoformat()
        selected_ids: List[str] = []

        for slot_idx, pack in enumerate(pack_order):
            pool = by_pack[pack]
            candidate = pool[pack_offsets[pack] % len(pool)]
            # Advance if somehow colliding with previous day (safe when len(pool) >= 2)
            attempts = 0
            while candidate["id"] in prev_day_ids and attempts < len(pool):
                pack_offsets[pack] += 1
                candidate = pool[pack_offsets[pack] % len(pool)]
                attempts += 1
            selected_ids.append(str(candidate["id"]))
            # Use coprime-style step >= 1 so consecutive days pull distinct prompts
            pack_offsets[pack] += 1 + (idx + slot_idx) % 2 if len(pool) > 3 else 1

        # Rotate the 7 prompt positions subtly each day so round 1 isn't always the same pack
        rot = idx % len(selected_ids)
        rotated_ids = selected_ids[rot:] + selected_ids[:rot]
        prev_day_ids = set(rotated_ids)

        theme = (
            "Daily Dive #30 — Atlas, Champions & Deep Cinema"
            if day_number == TOTAL_DAILY_BOARDS
            else DAILY_THEMES[idx % len(DAILY_THEMES)]
        )
        boards.append(
            {
                "dayNumber": day_number,
                "date": board_date,
                "themeLabel": theme,
                "promptIds": rotated_ids,
            }
        )

    # Sort descending so newest board (Today #30) appears first where convenient,
    # while consumers can look up by date or dayNumber cleanly.
    boards.sort(key=lambda b: int(b["dayNumber"]), reverse=True)
    return boards


def main() -> None:
    if not CACHE_DIR.exists():
        raise FileNotFoundError(f"Expected ETL cache directory at {CACHE_DIR}")

    geo_prompts, extra_general = build_geography_and_language_prompts(CACHE_DIR)
    pokemon_prompts = build_pokemon_prompts(CACHE_DIR)
    football_prompts = build_football_prompts(CACHE_DIR)
    nba_prompts = build_nba_prompts()
    sports_prompts = build_sports_prompts()
    movies_prompts = build_movies_prompts()
    general_prompts = build_general_prompts() + extra_general

    raw_all = (
        general_prompts
        + geo_prompts
        + movies_prompts
        + sports_prompts
        + football_prompts
        + nba_prompts
        + pokemon_prompts
    )

    prompts = validate_and_normalize_prompts(raw_all)
    boards = build_daily_boards(prompts)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    prompts_path = OUT_DIR / "prompts.json"
    boards_path = OUT_DIR / "daily_boards.json"

    prompts_path.write_text(
        json.dumps(prompts, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    boards_path.write_text(
        json.dumps(boards, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    pack_counts = Counter(p["pack"] for p in prompts)
    total_answers = sum(len(p["answers"]) for p in prompts)
    min_answers = min(len(p["answers"]) for p in prompts)

    print(f"Wrote {len(prompts)} prompts ({total_answers} verified answers, min/prompt={min_answers}) -> {prompts_path}")
    for pack in VALID_PACKS:
        pack_ans = sum(len(p["answers"]) for p in prompts if p["pack"] == pack)
        print(f"  - {pack:<10}: {pack_counts[pack]:>3} prompts | {pack_ans:>5} answers")
    print(f"Wrote {len(boards)} Daily Dive boards ({boards[-1]['date']} .. {boards[0]['date']}) -> {boards_path}")


if __name__ == "__main__":
    main()
