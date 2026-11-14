import unicodedata
from typing import Dict, List, Sequence, Tuple


def strip_accents(text: str) -> str:
    return "".join(
        ch
        for ch in unicodedata.normalize("NFD", text)
        if unicodedata.category(ch) != "Mn"
    )


def build_aliases(name: str, extra: Sequence[str] = ()) -> List[str]:
    """Generates clean lowercase spelling variants and common abbreviations."""
    aliases = set()
    for candidate in [name, *extra]:
        if not candidate:
            continue
        cleaned = candidate.strip()
        low = cleaned.lower()
        aliases.add(low)
        ascii_low = strip_accents(low)
        aliases.add(ascii_low)
        for prefix in ("the ", "a ", "an "):
            if ascii_low.startswith(prefix):
                aliases.add(ascii_low[len(prefix) :].strip())
        if "&" in ascii_low:
            aliases.add(ascii_low.replace("&", "and"))
        if "st." in ascii_low or "st " in ascii_low:
            aliases.add(ascii_low.replace("st.", "saint").replace("st ", "saint "))
    aliases.discard(name.strip().lower())
    return sorted(aliases)[:8]


def rarity_to_tier(rarity: int) -> str:
    if rarity >= 85:
        return "One in a Krillion"
    if rarity >= 70:
        return "Deep Sea"
    if rarity >= 55:
        return "Rare"
    if rarity >= 35:
        return "Uncommon"
    if rarity >= 20:
        return "Common"
    return "Plankton"


def make_answer(
    name: str,
    rarity: int,
    fact: str,
    aliases: Sequence[str] = (),
) -> Dict[str, object]:
    clamped = max(10, min(100, int(round(rarity))))
    return {
        "name": name,
        "aliases": build_aliases(name, aliases),
        "rarity": clamped,
        "tier": rarity_to_tier(clamped),
        "fact": fact,
    }


def score_ranked_items(
    items: Sequence[Tuple[str, float, str, Sequence[str]]],
    higher_is_more_famous: bool = True,
) -> List[Dict[str, object]]:
    """
    Converts (name, metric, fact, aliases) tuples into calibrated 10..100
    rarity scores where famous crowd-favorites approach 10 (Plankton) and
    deep-cut obscure picks reach 85..100 (One in a Krillion).
    """
    n = len(items)
    if n == 0:
        return []
    ordered = sorted(items, key=lambda x: x[1], reverse=higher_is_more_famous)
    out: List[Dict[str, object]] = []
    for idx, (name, _metric, fact, aliases) in enumerate(ordered):
        if n == 1:
            rarity = 50
        else:
            frac = idx / (n - 1)
            rarity = round(10 + frac * 90)
        out.append(make_answer(name, rarity, fact, aliases))
    return out


def dedupe_answers(answers: List[Dict[str, object]]) -> List[Dict[str, object]]:
    seen = set()
    unique: List[Dict[str, object]] = []
    for ans in answers:
        key = strip_accents(str(ans["name"])).lower().strip()
        if key in seen:
            continue
        seen.add(key)
        unique.append(ans)
    return unique
