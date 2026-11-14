import csv
import json
import math
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Set, Tuple

from catalogs.common import make_answer, score_ranked_items


ICONIC_COUNTRIES: Set[str] = {
    "United States", "China", "India", "United Kingdom", "France", "Germany",
    "Japan", "Brazil", "Italy", "Canada", "Australia", "Spain", "Mexico",
    "Russia", "South Korea", "Argentina", "Egypt", "Nigeria", "South Africa",
    "Turkey", "Saudi Arabia", "Indonesia", "Thailand", "Vietnam", "Greece",
    "Netherlands", "Switzerland", "Sweden", "Norway", "Poland", "Portugal",
    "Ukraine", "Ireland", "New Zealand", "Singapore", "United Arab Emirates",
}

US_STATES: List[Tuple[str, str, int, bool, bool, bool]] = [
    # (name, capital, pop_rank_famous_metric, ocean_border, capital_diff_from_largest, landlocked)
    ("California", "Sacramento", 100, True, True, False),
    ("Texas", "Austin", 98, True, True, False),
    ("Florida", "Tallahassee", 97, True, True, False),
    ("New York", "Albany", 99, True, True, False),
    ("Illinois", "Springfield", 90, False, True, False),
    ("Pennsylvania", "Harrisburg", 88, False, True, False),
    ("Ohio", "Columbus", 84, False, False, False),
    ("Georgia", "Atlanta", 86, True, False, False),
    ("North Carolina", "Raleigh", 80, True, True, False),
    ("Michigan", "Lansing", 82, False, True, False),
    ("New Jersey", "Trenton", 81, True, True, False),
    ("Virginia", "Richmond", 79, True, True, False),
    ("Washington", "Olympia", 83, True, True, False),
    ("Arizona", "Phoenix", 85, False, False, True),
    ("Massachusetts", "Boston", 87, True, False, False),
    ("Tennessee", "Nashville", 76, False, False, True),
    ("Indiana", "Indianapolis", 72, False, False, True),
    ("Maryland", "Annapolis", 71, True, True, False),
    ("Missouri", "Jefferson City", 68, False, True, True),
    ("Wisconsin", "Madison", 69, False, True, False),
    ("Colorado", "Denver", 78, False, False, True),
    ("Minnesota", "Saint Paul", 70, False, True, False),
    ("South Carolina", "Columbia", 64, True, True, False),
    ("Alabama", "Montgomery", 62, True, True, False),
    ("Louisiana", "Baton Rouge", 67, True, True, False),
    ("Kentucky", "Frankfort", 58, False, True, True),
    ("Oregon", "Salem", 66, True, True, False),
    ("Oklahoma", "Oklahoma City", 55, False, False, True),
    ("Connecticut", "Hartford", 57, True, True, False),
    ("Utah", "Salt Lake City", 60, False, False, True),
    ("Iowa", "Des Moines", 48, False, False, True),
    ("Nevada", "Carson City", 74, False, True, True),
    ("Arkansas", "Little Rock", 45, False, False, True),
    ("Mississippi", "Jackson", 47, True, False, False),
    ("Kansas", "Topeka", 50, False, True, True),
    ("New Mexico", "Santa Fe", 52, False, True, True),
    ("Nebraska", "Lincoln", 42, False, True, True),
    ("Idaho", "Boise", 40, False, False, True),
    ("Hawaii", "Honolulu", 92, True, False, False),
    ("Maine", "Augusta", 54, True, True, False),
    ("New Hampshire", "Concord", 49, True, True, False),
    ("Rhode Island", "Providence", 46, True, False, False),
    ("Montana", "Helena", 44, False, True, True),
    ("Delaware", "Dover", 41, True, True, False),
    ("South Dakota", "Pierre", 30, False, True, True),
    ("North Dakota", "Bismarck", 28, False, True, True),
    ("Alaska", "Juneau", 89, True, True, False),
    ("Vermont", "Montpelier", 35, False, True, True),
    ("Wyoming", "Cheyenne", 25, False, False, True),
    ("West Virginia", "Charleston", 36, False, False, True),
]

COUNTRY_ALIASES: Dict[str, List[str]] = {
    "United States": ["usa", "us", "united states of america", "america"],
    "United Kingdom": ["uk", "great britain", "britain", "england"],
    "United Arab Emirates": ["uae", "emirates"],
    "DR Congo": ["drc", "democratic republic of the congo", "congo kinshasa"],
    "Republic of the Congo": ["congo", "congo brazzaville"],
    "Ivory Coast": ["cote d'ivoire", "cote divoire"],
    "Czechia": ["czech republic"],
    "North Macedonia": ["macedonia"],
    "Eswatini": ["swaziland"],
    "Timor-Leste": ["east timor"],
    "Cabo Verde": ["cape verde"],
    "South Korea": ["korea", "republic of korea"],
    "North Korea": ["dprk"],
    "Vatican City": ["holy see", "vatican"],
    "Bosnia and Herzegovina": ["bosnia"],
    "Saint Vincent and the Grenadines": ["st vincent"],
    "Saint Kitts and Nevis": ["st kitts"],
    "Saint Lucia": ["st lucia"],
    "São Tomé and Príncipe": ["sao tome"],
    "Micronesia": ["federated states of micronesia"],
}


def build_geography_and_language_prompts(cache_dir: Path) -> Tuple[List[dict], List[dict]]:
    with open(cache_dir / "countries.json", encoding="utf-8") as f:
        raw_countries = json.load(f)

    # Filter UN sovereign states + Vatican/Palestine widely recognized sovereign entities
    sovereign = [
        c for c in raw_countries
        if c.get("independent") is True
    ]

    def country_fame(c: dict) -> float:
        name = c["name"]["common"]
        area = max(1.0, float(c.get("area") or 1.0))
        translations = len(c.get("translations") or {})
        borders = len(c.get("borders") or [])
        base = math.log10(area + 10.0) * 6.0 + translations * 1.2 + borders * 1.8
        if name in ICONIC_COUNTRIES:
            base += 55.0
        return base

    def to_country_tuples(items: List[dict]) -> List[Tuple[str, float, str, List[str]]]:
        tuples: List[Tuple[str, float, str, List[str]]] = []
        for c in items:
            name = c["name"]["common"]
            cap = ", ".join(c.get("capital") or ["N/A"])
            area_val = int(round(c.get("area") or 0))
            region = c.get("subregion") or c.get("region") or "World"
            fact = f"{region} · Capital: {cap} · Area: {area_val:,} km²"
            aliases = list(COUNTRY_ALIASES.get(name, []))
            for alt in c.get("altSpellings") or []:
                if len(alt) >= 4:
                    aliases.append(alt)
            tuples.append((name, country_fame(c), fact, aliases))
        return tuples

    def to_capital_tuples(items: List[dict]) -> List[Tuple[str, float, str, List[str]]]:
        tuples: List[Tuple[str, float, str, List[str]]] = []
        seen_cap: Set[str] = set()
        for c in items:
            caps = c.get("capital") or []
            if not caps:
                continue
            cap_name = caps[0]
            if cap_name in seen_cap:
                continue
            seen_cap.add(cap_name)
            name = c["name"]["common"]
            fact = f"Capital of {name} ({c.get('subregion') or c.get('region')})"
            tuples.append((cap_name, country_fame(c), fact, caps[1:]))
        return tuples

    geo_defs = [
        (
            "geo-africa-countries",
            "Name any sovereign country located in Africa.",
            "Africa Geography",
            ["Think across North, West, East, Central, and Southern Africa (54 nations total).",
             "Well-known giants like Egypt, Nigeria, and South Africa score low; island or tiny states score high.",
             "Try Indian Ocean or Gulf of Guinea microstates such as Comoros, Eswatini, or Djibouti."],
            [c for c in sovereign if c.get("region") == "Africa"],
            False,
        ),
        (
            "geo-europe-countries",
            "Name any sovereign country located in Europe.",
            "Europe Geography",
            ["Includes both EU members and non-EU European sovereign nations.",
             "France, Germany, Italy, Spain, and the UK are heavy Plankton picks.",
             "Microstates and Balkan nations like San Marino, Moldova, or Liechtenstein earn 85–100 pts."],
            [c for c in sovereign if c.get("region") == "Europe"],
            False,
        ),
        (
            "geo-asia-countries",
            "Name any sovereign country located in Asia.",
            "Asia Geography",
            ["Covers East, South, Southeast, Central, and Western Asia (Middle East).",
             "Avoid China, India, Japan, and South Korea if you want high rarity scores.",
             "Central Asian '-stan' states or Himalayan/Gulf nations like Bhutan, Brunei, or Bahrain score big."],
            [c for c in sovereign if c.get("region") == "Asia"],
            False,
        ),
        (
            "geo-americas-countries",
            "Name any sovereign country in North, Central, or South America.",
            "Americas Geography",
            ["Spans from Canada down through the Caribbean and Andes to Chile.",
             "The US, Canada, Brazil, and Mexico are top Plankton traps.",
             "Caribbean or Guianas states such as Suriname, Belize, Dominica, or Saint Lucia hit Deep Sea scores."],
            [c for c in sovereign if c.get("region") == "Americas"],
            False,
        ),
        (
            "geo-landlocked-world",
            "Name any landlocked sovereign country (zero coastline on an open ocean).",
            "Landlocked Nations",
            ["Roughly 44 sovereign nations have no direct ocean coast (Caspian Sea counts as landlocked).",
             "Switzerland, Austria, and Bolivia are well-known picks.",
             "Try double-landlocked Uzbekistan/Liechtenstein or small African states like Burundi or Malawi."],
            [c for c in sovereign if c.get("landlocked") is True],
            False,
        ),
        (
            "geo-landlocked-africa",
            "Name any landlocked country in Africa.",
            "Landlocked Africa",
            ["Africa has 16 landlocked countries spanning the Sahel, Great Lakes, and Southern plateau.",
             "Ethiopia and Uganda are among the more commonly remembered ones.",
             "Look toward Botswana, Eswatini, Lesotho, Burkina Faso, or Chad."],
            [c for c in sovereign if c.get("region") == "Africa" and c.get("landlocked") is True],
            False,
        ),
        (
            "geo-island-nations",
            "Name any sovereign island nation (entirely surrounded by water).",
            "Island Nations",
            ["Includes single-island and archipelago countries across Oceania, the Caribbean, Europe, and Asia.",
             "Japan, United Kingdom, Australia, and Cuba are common surface answers.",
             "Oceania microstates such as Nauru, Tuvalu, Palau, or Vanuatu sit in the One in a Krillion tier."],
            [c for c in sovereign if len(c.get("borders") or []) == 0],
            False,
        ),
        (
            "geo-small-countries",
            "Name any sovereign country with a total land area under 25,000 km².",
            "Small Countries",
            ["Think microstates, Caribbean islands, Gulf city-states, and compact nations smaller than Sicily.",
             "Israel, Belgium, and Switzerland are too large—think smaller than Rwanda or Belize.",
             "Monaco, Andorra, Malta, Antigua and Barbuda, or Seychelles earn top scores."],
            [c for c in sovereign if 0 < float(c.get("area") or 0) < 25000],
            False,
        ),
        (
            "geo-six-plus-borders",
            "Name any country that shares a land border with 6 or more neighboring countries.",
            "World Borders",
            ["Big continental crossroads in Europe, South America, Asia, and Central Africa dominate this list.",
             "China, Russia, France (with French Guiana), Brazil, and Germany top out 8+ borders.",
             "Lesser-guessed neighbors-rich states include Serbia, Mali, Zambia, and Hungary."],
            [c for c in sovereign if len(c.get("borders") or []) >= 6],
            False,
        ),
        (
            "geo-southern-hemisphere",
            "Name any sovereign country located primarily in the Southern Hemisphere.",
            "Southern Hemisphere",
            ["Includes South America below Ecuador, Southern Africa, Australia, New Zealand, and Oceania.",
             "Brazil, Australia, Argentina, and South Africa are immediate Plankton traps.",
             "Eswatini, Timor-Leste, Comoros, Samoa, or Tonga deliver elite rarity scores."],
            [c for c in sovereign if (c.get("latlng") or [0, 0])[0] < 0],
            False,
        ),
        (
            "geo-starts-with-s",
            "Name any sovereign country whose English name starts with the letter 'S'.",
            "Word Pattern Geo",
            ["One of the largest starting letters on the UN map, featuring Saint- island states and European picks.",
             "Spain, Switzerland, Sweden, South Korea, and Saudi Arabia are frequent guesses.",
             "Saint Vincent and the Grenadines, Suriname, or São Tomé and Príncipe score near 100."],
            [c for c in sovereign if c["name"]["common"].upper().startswith("S")],
            False,
        ),
        (
            "geo-starts-with-m-or-b",
            "Name any sovereign country whose English name starts with 'M' or 'B'.",
            "Word Pattern Geo",
            ["Think across Maghreb, Central America, Balkans, Himalayas, and Southeast Asia.",
             "Mexico, Brazil, Morocco, and Belgium are early Plankton picks.",
             "Mauritania, Micronesia, Brunei, Burkina Faso, or Moldova offer huge points."],
            [c for c in sovereign if c["name"]["common"].upper().startswith(("M", "B"))],
            False,
        ),
        (
            "geo-capitals-europe",
            "Name the capital city of any sovereign country in Europe.",
            "World Capitals",
            ["Includes capitals of all 40+ European sovereign nations from Atlantic to Caucasus.",
             "Paris, London, Rome, Berlin, and Madrid earn minimal points.",
             "Try Chisinau, Vaduz, Podgorica, Valletta, or Tórshavn-region microstate capitals like San Marino."],
            [c for c in sovereign if c.get("region") == "Europe" and c.get("capital")],
            True,
        ),
        (
            "geo-capitals-africa",
            "Name the capital city of any sovereign country in Africa.",
            "African Capitals",
            ["Every sovereign African state's primary national capital counts.",
             "Cairo, Nairobi, and Addis Ababa are among the most common picks.",
             "Try Gitega, Mbabane, Moroni, São Tomé, or Yamoussoukro for One in a Krillion points."],
            [c for c in sovereign if c.get("region") == "Africa" and c.get("capital")],
            True,
        ),
        (
            "geo-capitals-asia",
            "Name the capital city of any sovereign country in Asia.",
            "Asian Capitals",
            ["Spans East Asia, ASEAN, South Asia, Central Asia, and the Middle East.",
             "Tokyo, Seoul, Beijing, Bangkok, and New Delhi are top Plankton traps.",
             "Thimphu, Ashgabat, Dili, Bandar Seri Begawan, or Bishkek yield 85+ points."],
            [c for c in sovereign if c.get("region") == "Asia" and c.get("capital")],
            True,
        ),
    ]

    geo_prompts: List[dict] = []
    for pid, question, cat, hints, subset, is_cap in geo_defs:
        tuples = to_capital_tuples(subset) if is_cap else to_country_tuples(subset)
        if len(tuples) < 15:
            continue
        geo_prompts.append({
            "id": pid,
            "pack": "geography",
            "question": question,
            "categoryLabel": cat,
            "timerSeconds": 25,
            "sourceAttribution": "Wikidata & mledoze Open Countries Dataset (ISO-3166)",
            "hints": hints,
            "answers": score_ranked_items(tuples, higher_is_more_famous=True),
        })

    # Additional Geography prompts (US States & Mountain Ranges/Lakes)
    us_ocean = [
        (name, fame, f"US Ocean-Border State · Capital: {cap}", [])
        for name, cap, fame, ocean, _, _ in US_STATES if ocean
    ]
    us_diff_cap = [
        (name, fame, f"Capital is {cap} (smaller than its largest metro)", [])
        for name, cap, fame, _, diff, _ in US_STATES if diff
    ]
    us_landlocked = [
        (name, fame, f"Landlocked US State · Capital: {cap}", [])
        for name, cap, fame, _, _, ll in US_STATES if ll
    ]
    us_capitals_list = [
        (cap, fame, f"Capital city of {name}", [])
        for name, cap, fame, _, _, _ in US_STATES
    ]

    geo_prompts.extend([
        {
            "id": "geo-us-ocean-states",
            "pack": "geography",
            "question": "Name a US state that borders the Atlantic Ocean, Pacific Ocean, or Gulf Coast.",
            "categoryLabel": "US Geography",
            "timerSeconds": 25,
            "sourceAttribution": "US Census Bureau Coastal & State Registry",
            "hints": [
                "Includes East Coast, Gulf Coast, West Coast, plus Alaska and Hawaii.",
                "California, Florida, New York, and Texas are instant Plankton picks.",
                "Try Delaware, New Hampshire, Rhode Island, or Mississippi."
            ],
            "answers": score_ranked_items(us_ocean, higher_is_more_famous=True),
        },
        {
            "id": "geo-us-nonlargest-capitals",
            "pack": "geography",
            "question": "Name a US state whose capital is NOT its most populous city.",
            "categoryLabel": "US Capitals Trap",
            "timerSeconds": 25,
            "sourceAttribution": "US Census Bureau Municipal Rankings",
            "hints": [
                "33 US states have a smaller capital than their biggest metro (e.g., Albany vs NYC).",
                "California (Sacramento) and Texas (Austin vs Houston) are widely known.",
                "North Dakota (Bismarck vs Fargo) and South Dakota (Pierre vs Sioux Falls) score 85+."
            ],
            "answers": score_ranked_items(us_diff_cap, higher_is_more_famous=True),
        },
        {
            "id": "geo-us-landlocked-states",
            "pack": "geography",
            "question": "Name any US state with no ocean coastline and no Great Lakes shoreline.",
            "categoryLabel": "US Geography",
            "timerSeconds": 25,
            "sourceAttribution": "US Geological Survey Boundaries",
            "hints": [
                "Covers the Mountain West, Great Plains, and interior Appalachia/South.",
                "Colorado, Arizona, and Nevada are commonly named.",
                "Wyoming, North Dakota, Montana, or West Virginia climb past 80 pts."
            ],
            "answers": score_ranked_items(us_landlocked, higher_is_more_famous=True),
        },
        {
            "id": "geo-us-state-capitals",
            "pack": "geography",
            "question": "Name the state capital city of any of the 50 US states.",
            "categoryLabel": "US Capitals",
            "timerSeconds": 25,
            "sourceAttribution": "US State Government Directory",
            "hints": [
                "Only the official capital city counts (not Seattle, Chicago, or Los Angeles).",
                "Boston, Austin, Phoenix, and Atlanta are high-visibility Plankton choices.",
                "Pierre, Montpelier, Augusta, Dover, and Cheyenne score 85–100 pts."
            ],
            "answers": score_ranked_items(us_capitals_list, higher_is_more_famous=True),
        },
    ])

    world_landmarks = [
        ("Nile", 99, "Africa · ~6,650 km river flowing north into the Mediterranean", ["nile river"]),
        ("Amazon River", 98, "South America · Largest river by water discharge", ["amazon"]),
        ("Mount Everest", 100, "Himalayas (Nepal/Tibet) · Highest peak at 8,848.86 m", ["everest", "sagarmatha"]),
        ("K2", 82, "Karakoram (Pakistan/China) · Second highest peak at 8,611 m", ["chhogori"]),
        ("Sahara", 97, "North Africa · Largest hot desert in the world", ["sahara desert"]),
        ("Gobi", 80, "China/Mongolia · Vast rain-shadow desert", ["gobi desert"]),
        ("Andes", 91, "South America · Longest continental mountain range", ["andes mountains"]),
        ("Alps", 93, "Central Europe · Iconic eight-nation alpine arc", ["the alps"]),
        ("Mississippi River", 89, "United States · Primary North American drainage basin", ["mississippi"]),
        ("Danube", 78, "Central/Eastern Europe · Flows through 10 countries", ["danube river"]),
        ("Lake Baikal", 70, "Siberia, Russia · Deepest and oldest freshwater lake", ["baikal"]),
        ("Lake Superior", 76, "North America · Largest freshwater lake by surface area", ["superior"]),
        ("Mount Kilimanjaro", 88, "Tanzania · Highest peak in Africa at 5,895 m", ["kilimanjaro"]),
        ("Rockies", 86, "Western North America · Spans from New Mexico to British Columbia", ["rocky mountains"]),
        ("Yangtze", 74, "China · Longest river in Asia (~6,300 km)", ["yangtze river"]),
        ("Mekong", 60, "Southeast Asia · Trans-boundary river across 6 nations", ["mekong river"]),
        ("Atacama Desert", 54, "Northern Chile · Driest non-polar desert on Earth", ["atacama"]),
        ("Mount Elbrus", 48, "Russia (Caucasus) · Highest peak in Europe at 5,642 m", ["elbrus"]),
        ("Mariana Trench", 85, "Western Pacific Ocean · Deepest oceanic trench (~10,984 m)", ["challenger deep"]),
        ("Lake Titicaca", 62, "Peru/Bolivia · Highest navigable lake at 3,812 m", ["titicaca"]),
        ("Pamir Mountains", 22, "Central Asia · High junction sometimes called Roof of the World", ["pamirs"]),
        ("Okavango Delta", 34, "Botswana · Inland endorheic river delta in the Kalahari", ["okavango"]),
        ("Ural Mountains", 58, "Russia/Kazakhstan · Traditional physiographic Europe–Asia divide", ["urals"]),
        ("Great Barrier Reef", 94, "Queensland, Australia · World's largest coral reef system", ["barrier reef"]),
        ("Drakensberg", 28, "South Africa/Lesotho · Highest mountain range in Southern Africa", ["ukahlamba"]),
        ("Lake Tanganyika", 42, "East Africa · Second-deepest freshwater lake globally", ["tanganyika"]),
        ("Karakoram", 38, "Pakistan/India/China · Home to four 8,000-meter peaks", ["karakoram range"]),
        ("Namib Desert", 36, "Namibia/Angola · Oldest desert along the Atlantic coast", ["namib"]),
    ]
    geo_prompts.append({
        "id": "geo-natural-wonders",
        "pack": "geography",
        "question": "Name a major world river, mountain peak/range, desert, trench, or freshwater lake.",
        "categoryLabel": "Physical Geo",
        "timerSeconds": 25,
        "sourceAttribution": "Natural Earth Physical Features & UNESCO Atlas",
        "hints": [
            "Any famous natural mountain, range, desert, ocean trench, river, or major lake counts.",
            "Mount Everest, the Nile, Sahara, and Amazon River score minimal Plankton points.",
            "Specific ranges or African/Asian features like Pamir Mountains, Okavango Delta, or Drakensberg soar past 85 pts."
        ],
        "answers": score_ranked_items(world_landmarks, higher_is_more_famous=True),
    })

    # Currency and Language prompts extracted from countries.json for General pack
    currency_counts: Dict[str, int] = defaultdict(int)
    currency_ex: Dict[str, str] = {}
    lang_counts: Dict[str, int] = defaultdict(int)
    lang_ex: Dict[str, str] = {}
    for c in sovereign:
        cname = c["name"]["common"]
        for _code, info in (c.get("currencies") or {}).items():
            cur_name = info.get("name")
            if cur_name:
                currency_counts[cur_name] += 1
                currency_ex.setdefault(cur_name, cname)
        for _lcode, lname in (c.get("languages") or {}).items():
            lang_counts[lname] += 1
            lang_ex.setdefault(lname, cname)

    currency_items = []
    seen_cur_lower: Set[str] = set()
    for cur_name, cnt in currency_counts.items():
        short = cur_name.split()[-1].title() if "dollar" in cur_name.lower() and cnt > 1 else cur_name
        # Keep exact currency names for specificity
        low = cur_name.lower()
        if low in seen_cur_lower:
            continue
        seen_cur_lower.add(low)
        fame = cnt * 20 + (50 if any(k in low for k in ["united states dollar", "euro", "japanese yen", "british pound", "swiss franc", "canadian dollar"]) else 0)
        aliases = []
        if "dollar" in low:
            aliases.append(cur_name.split()[0].lower() + " dollar")
        currency_items.append((
            cur_name.title(),
            fame,
            f"Official currency used in {currency_ex[cur_name]}" + (f" and {cnt - 1} other state(s)" if cnt > 1 else ""),
            aliases,
        ))

    lang_items = []
    for lname, cnt in lang_counts.items():
        fame = cnt * 25 + (60 if lname in {"English", "Spanish", "French", "Arabic", "Mandarin", "Chinese", "Portuguese", "Russian", "German", "Japanese", "Hindi"} else 0)
        lang_items.append((
            lname,
            fame,
            f"Official/national language in {cnt} sovereign state(s) incl. {lang_ex[lname]}",
            [],
        ))

    extra_general = [
        {
            "id": "gen-world-currencies",
            "pack": "general",
            "question": "Name an official sovereign national currency currently in circulation.",
            "categoryLabel": "Global Finance",
            "timerSeconds": 25,
            "sourceAttribution": "ISO-4217 & Open Countries Currency Registry",
            "hints": [
                "Use full currency names like 'Japanese Yen', 'Euro', 'Swiss Franc', or 'Malaysian Ringgit'.",
                "US Dollar, Euro, and British Pound are heavy Plankton picks.",
                "Single-nation currencies like Bhutanese Ngultrum, Gambian Dalasi, or Paraguayan Guaraní score 90+."
            ],
            "answers": score_ranked_items(currency_items, higher_is_more_famous=True),
        },
        {
            "id": "gen-official-languages",
            "pack": "general",
            "question": "Name any official or nationally recognized language spoken in a sovereign country.",
            "categoryLabel": "World Languages",
            "timerSeconds": 25,
            "sourceAttribution": "ISO-639 & Sovereign Constitutions Dataset",
            "hints": [
                "Any major world, regional, or indigenous official national language counts.",
                "English, Spanish, French, Arabic, and Chinese earn bottom-tier points.",
                "National tongues such as Dzongkha, Bislama, Tetum, Malagasy, or Aymara earn top Krillion scores."
            ],
            "answers": score_ranked_items(lang_items, higher_is_more_famous=True),
        },
    ]

    return geo_prompts, extra_general


ICONIC_POKEMON: Set[str] = {
    "Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard",
    "Squirtle", "Wartortle", "Blastoise", "Pikachu", "Raichu", "Jigglypuff",
    "Meowth", "Psyduck", "Arcanine", "Alakazam", "Machamp", "Gengar", "Onix",
    "Gyarados", "Lapras", "Ditto", "Eevee", "Vaporeon", "Jolteon", "Flareon",
    "Snorlax", "Articuno", "Zapdos", "Moltres", "Dragonite", "Mewtwo", "Mew",
    "Chikorita", "Cyndaquil", "Totodile", "Togepi", "Umbreon", "Espeon",
    "Scizor", "Tyranitar", "Lugia", "Ho-Oh", "Celebi", "Treecko", "Torchic",
    "Blaziken", "Mudkip", "Gardevoir", "Metagross", "Rayquaza", "Kyogre",
    "Groudon", "Piplup", "Lucario", "Garchomp", "Giratina", "Arceus",
    "Greninja", "Sylveon", "Mimikyu", "Dragapult", "Sprigatito", "Fuecoco",
}


def build_pokemon_prompts(cache_dir: Path) -> List[dict]:
    species_names: Dict[int, Tuple[str, str]] = {}
    with open(cache_dir / "poke_species_names.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["local_language_id"] == "9":
                species_names[int(row["pokemon_species_id"])] = (row["name"], row["genus"])

    species_meta: Dict[int, dict] = {}
    with open(cache_dir / "poke_species.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            sid = int(row["id"])
            species_meta[sid] = {
                "generation": int(row["generation_id"]),
                "capture_rate": int(row["capture_rate"] or 45),
                "is_baby": row["is_baby"] == "1",
                "is_legendary": row["is_legendary"] == "1",
                "is_mythical": row["is_mythical"] == "1",
                "evolves_from": row["evolves_from_species_id"],
            }

    default_poke_for_species: Dict[int, int] = {}
    with open(cache_dir / "poke_pokemon.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["is_default"] == "1":
                default_poke_for_species[int(row["species_id"])] = int(row["id"])

    type_lookup: Dict[int, str] = {}
    with open(cache_dir / "poke_type_names.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            type_lookup[int(row["id"])] = row["identifier"]

    poke_types: Dict[int, List[str]] = defaultdict(list)
    with open(cache_dir / "poke_types.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            pid = int(row["pokemon_id"])
            tname = type_lookup.get(int(row["type_id"]), "")
            if tname:
                poke_types[pid].append(tname)

    bst_map: Dict[int, int] = defaultdict(int)
    with open(cache_dir / "poke_stats.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            bst_map[int(row["pokemon_id"])] += int(row["base_stat"])

    ability_lookup: Dict[int, str] = {}
    with open(cache_dir / "poke_ability_names.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            ability_lookup[int(row["id"])] = row["identifier"]

    poke_abilities: Dict[int, Set[str]] = defaultdict(set)
    with open(cache_dir / "poke_abilities.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            pid = int(row["pokemon_id"])
            aname = ability_lookup.get(int(row["ability_id"]), "")
            if aname:
                poke_abilities[pid].add(aname)

    catalog: List[dict] = []
    for sid, meta in species_meta.items():
        if sid not in species_names or sid not in default_poke_for_species:
            continue
        pid = default_poke_for_species[sid]
        name, genus = species_names[sid]
        types = poke_types.get(pid, [])
        bst = bst_map.get(pid, 400)
        abilities = poke_abilities.get(pid, set())

        # Fame heuristic: Gen 1 + Iconic mons + Legendaries score higher fame (lower rarity)
        fame = (10 - meta["generation"]) * 11.0 + bst * 0.05
        if name in ICONIC_POKEMON:
            fame += 140.0
        if meta["is_legendary"] or meta["is_mythical"]:
            fame += 65.0
        if sid <= 151:
            fame += 45.0

        type_str = " / ".join(t.title() for t in types)
        fact = f"Gen {meta['generation']} · {type_str} · {genus} · BST {bst}"
        aliases = []
        cleaned_ascii = name.replace("♀", " f").replace("♂", " m").replace(".", "").replace(":", "").strip()
        if cleaned_ascii != name:
            aliases.append(cleaned_ascii.lower())
        if "-" in name:
            aliases.append(name.replace("-", " ").lower())

        catalog.append({
            "sid": sid,
            "name": name,
            "aliases": aliases,
            "fame": fame,
            "fact": fact,
            "generation": meta["generation"],
            "types": set(types),
            "bst": bst,
            "is_legendary": meta["is_legendary"],
            "is_mythical": meta["is_mythical"],
            "is_baby": meta["is_baby"],
            "abilities": abilities,
        })

    def to_poke_tuples(items: List[dict]) -> List[Tuple[str, float, str, List[str]]]:
        return [(p["name"], p["fame"], p["fact"], p["aliases"]) for p in items]

    poke_defs = [
        ("poke-kanto-fire-water", "Name any Generation 1 (Kanto) Fire-type or Water-type Pokémon.", "Kanto Starters & Co", [p for p in catalog if p["generation"] == 1 and bool(p["types"] & {"fire", "water"})],
         ["Think original #001–#151 Kanto Pokédex entries with Fire or Water typing.", "Charmander, Squirtle, Gyarados, and Arcanine are common Plankton answers.", "Mid-tier or overlooked Kanto picks like Seadra, Goldeen, Magmar, or Kingler score big."]),
        ("poke-kanto-grass-poison", "Name any Generation 1 (Kanto) Grass-type or Poison-type Pokémon.", "Kanto Flora & Toxins", [p for p in catalog if p["generation"] == 1 and bool(p["types"] & {"grass", "poison"})],
         ["Spans Bulbasaur through Venomoth, Muk, and Exeggutor.", "Bulbasaur, Gengar, and Venusaur score near the bottom.", "Try Tangela, Weepinbell, Nidorina, or Koffing for elite points."]),
        ("poke-dragon-type", "Name any Pokémon that has the Dragon type (primary or secondary).", "Dragon Mastery", [p for p in catalog if "dragon" in p["types"]],
         ["Includes Pseudo-Legendaries, box legendaries, and later-gen dragons.", "Dragonite, Rayquaza, Garchomp, and Charizard won't count for Charizard—only real Dragon types!", "Obscure picks like Turtonator, Arctibax, or Cyclizar hit One in a Krillion tiers."]),
        ("poke-ghost-type", "Name any Ghost-type Pokémon across Generations 1–9.", "Spectral Pokédex", [p for p in catalog if "ghost" in p["types"]],
         ["Gengar was the famous Gen 1 pioneer, joined by dozens from Sinnoh through Paldea.", "Gengar and Mimikyu are the biggest Plankton traps here.", "Think Phantump, Greavard, Bramblin, or Lampent for 85–100 pts."]),
        ("poke-steel-type", "Name any Steel-type Pokémon across Generations 2–9.", "Steel Armor", [p for p in catalog if "steel" in p["types"]],
         ["Steel was introduced in Gen 2 (plus Magnemite/Magneton retconned in Kanto).", "Lucario, Metagross, and Scizor are common picks.", "Try Klink, Wormadam, Togedemaru, or Orthworm for deep-cut points."]),
        ("poke-fairy-type", "Name any Fairy-type Pokémon (including Gen 1–5 retcons).", "Fairy Pokédex", [p for p in catalog if "fairy" in p["types"]],
         ["Includes Jigglypuff/Clefairy/Gardevoir retcons plus Kalos, Alola, Galar, and Paldea fairies.", "Sylveon, Gardevoir, and Togepi are easy Plankton picks.", "Comfey, Spritzee, Morgrem, or Fidough deliver huge rarity scores."]),
        ("poke-electric-type", "Name any Electric-type Pokémon from any generation.", "High Voltage", [p for p in catalog if "electric" in p["types"]],
         ["Covers Pikachu clones, Rotom forms, and regional shockers.", "Pikachu, Raichu, Zapdos, and Jolteon score bottom-tier Plankton points.", "Pincurchin, Tadbulb, Charjabug, or Eelektrik reach One in a Krillion."]),
        ("poke-psychic-type", "Name any Psychic-type Pokémon across Generations 1–9.", "Mind Over Matter", [p for p in catalog if "psychic" in p["types"]],
         ["Over 100 species share Psychic typing across legends and common wild lines.", "Mewtwo, Mew, Alakazam, and Gardevoir give minimal points.", "Munna, Elgyem, Rabsca, or Chingling earn top deep-sea scores."]),
        ("poke-ice-type", "Name any Ice-type Pokémon across Generations 1–9.", "Frozen Trench", [p for p in catalog if "ice" in p["types"]],
         ["Often paired with Water, Rock, Ground, or Bug across chilly routes.", "Lapras and Articuno are top crowd answers.", "Try Bergmite, Cetoddle, Eiscue, or Cryogonal for top points."]),
        ("poke-rock-ground-early", "Name any Rock-type or Ground-type Pokémon from Generations 1–3.", "Fossils & Tectonics", [p for p in catalog if p["generation"] <= 3 and bool(p["types"] & {"rock", "ground"})],
         ["Spans Kanto, Johto, and Hoenn species only (#001–#386).", "Onix, Tyranitar, and Groudon are obvious Plankton picks.", "Baltoy, Nosepass, Lileep, or Magcargo climb straight to the trench."]),
        ("poke-legendary-mythical", "Name any Legendary or Mythical Pokémon (Gen 1–9).", "Myth & Legend", [p for p in catalog if p["is_legendary"] or p["is_mythical"]],
         ["Includes sub-legendary trios, box mascots, and event mythicals.", "Mewtwo, Mew, Rayquaza, and Arceus score the lowest.", "Try Kubfu, Pecharunt, Enamorus, or Regidrago for 85+ points."]),
        ("poke-baby", "Name any official Baby Pokémon.", "Tiny Hatchlings", [p for p in catalog if p["is_baby"]],
         ["Introduced mainly in Gen 2 and Gen 4 via Egg hatching mechanics.", "Pichu and Togepi are immediately recognizable.", "Mantyke, Happiny, Chingling, or Toxel offer elite rarity scores."]),
        ("poke-johto-bug-dark-fly", "Name a Generation 2 (Johto) Bug, Dark, or Flying-type Pokémon.", "Johto Dex", [p for p in catalog if p["generation"] == 2 and bool(p["types"] & {"bug", "dark", "flying"})],
         ["Only Pokémon #152–#251 (Gold/Silver era) count.", "Umbreon, Scizor, Lugia, and Ho-Oh are heavy Plankton answers.", "Ledian, Yanma, Murkrow, or Xatu earn strong Deep Sea points."]),
        ("poke-hoenn-water-fighting", "Name a Generation 3 (Hoenn) Water or Fighting-type Pokémon.", "Hoenn Routes", [p for p in catalog if p["generation"] == 3 and bool(p["types"] & {"water", "fighting"})],
         ["Ruby/Sapphire era (#252–#386)—known for abundant water routes!", "Mudkip, Kyogre, and Blaziken score near 10–15 pts.", "Barboach, Clamperl, Makuhita, or Luvdisc earn huge points."]),
        ("poke-gen4-sinnoh", "Name any Pokémon originally introduced in Generation 4 (Sinnoh).", "Sinnoh Region", [p for p in catalog if p["generation"] == 4],
         ["Diamond/Pearl/Platinum era (#387–#493).", "Lucario, Garchomp, Piplup, and Arceus are big Plankton picks.", "Kricketot, Lumineon, Stunky, or Mothim give near-100 scores."]),
        ("poke-gen5-unova", "Name any Pokémon originally introduced in Generation 5 (Unova).", "Unova 156", [p for p in catalog if p["generation"] == 5],
         ["The largest fresh regional dex since Kanto (#494–#649).", "Zoroark, Reshiram, and Hydreigon are early crowd favorites.", "Maractus, Basculin, Klink, or Tympole climb to the top."]),
        ("poke-gen9-paldea", "Name any Pokémon originally introduced in Generation 9 (Paldea).", "Paldea Dex", [p for p in catalog if p["generation"] == 9],
         ["Scarlet & Violet newcomers (#906–#1025).", "Sprigatito and Fuecoco are popular starters.", "Capsakid, Squawkabilly, Greavard, or Spidops score 90+."]),
        ("poke-dual-water", "Name any Dual-Type Water Pokémon that is ALSO Ground, Ice, Flying, or Psychic.", "Dual-Type Water", [p for p in catalog if "water" in p["types"] and bool(p["types"] & {"ground", "ice", "flying", "psychic"})],
         ["Think Pelican birds, mud fish, frozen clams, and telepathic sea stars.", "Lapras, Gyarados, and Swampert/Mudkip-line are well known.", "Pelipper, Whiscash, Bruxish, or Iron Bundle soar past 85."]),
        ("poke-levitate-intimidate", "Name any Pokémon that can have the Ability Levitate, Intimidate, or Sturdy.", "Competitive Abilities", [p for p in catalog if bool(p["abilities"] & {"levitate", "intimidate", "sturdy"})],
         ["Includes floating psychic/ghost Pokémon, intimidating predators, and sturdy rock/steel species.", "Gyarados, Arcanine, Skarmory, and Salamence are classic competitive picks.", "Claydol, Masquerain, Nosepass, or Qwilfish climb near 100 pts."]),
        ("poke-high-bst", "Name any non-Mega Pokémon with a Base Stat Total (BST) of 580 or higher.", "Powerhouse 580+", [p for p in catalog if p["bst"] >= 580],
         ["Includes Pseudo-Legendaries (600 BST), Legendaries, Mythicals, and Slaking!", "Dragonite, Tyranitar, Mewtwo, and Rayquaza are Plankton traps.", "Deep picks like Regieleki, Urshifu, Wo-Chien, or Goodra soar past 85 pts."]),
    ]

    out: List[dict] = []
    for pid, q, cat, subset, hints in poke_defs:
        if len(subset) < 15:
            continue
        out.append({
            "id": pid,
            "pack": "pokemon",
            "question": q,
            "categoryLabel": cat,
            "timerSeconds": 25,
            "sourceAttribution": "PokéAPI v2 Official Species, Types, Abilities & Stats CSV",
            "hints": hints,
            "answers": score_ranked_items(to_poke_tuples(subset), higher_is_more_famous=True),
        })
    return out


FAMOUS_WC_LASTNAMES: Set[str] = {
    "Messi", "Ronaldo", "Mbappé", "Neymar", "Pelé", "Maradona", "Zidane",
    "Ronaldinho", "Beckham", "Modrić", "Lewandowski", "Kane", "Benzema",
    "Rooney", "Henry", "Cruyff", "Beckenbauer", "Klose", "Müller", "Buffon",
    "Casillas", "Neuer", "Iniesta", "Xavi", "Puyol", "Ramos", "Suárez",
    "Salah", "De Bruyne", "Griezmann", "Haaland", "Bellingham", "Vinícius",
    "Pirlo", "Totti", "Maldini", "Cafu", "Kaka", "Rivaldo", "Romário",
}


def build_football_prompts(cache_dir: Path) -> List[dict]:
    players_meta: Dict[str, dict] = {}
    with open(cache_dir / "wc_players.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            given = "" if row["given_name"] in ("not applicable", "") else row["given_name"]
            fam = "" if row["family_name"] in ("not applicable", "") else row["family_name"]
            full = f"{given} {fam}".strip()
            players_meta[row["player_id"]] = {
                "name": full,
                "given": given,
                "family": fam,
                "count_tournaments": int(row["count_tournaments"] or 1),
                "list_tournaments": row["list_tournaments"],
                "gk": row["goal_keeper"] == "1",
                "female": row["female"] == "1",
            }

    goal_counts: Dict[str, int] = defaultdict(int)
    knockout_final_scorers: Set[str] = set()
    with open(cache_dir / "wc_goals.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            pid = row["player_id"]
            if row["own_goal"] != "1":
                goal_counts[pid] += 1
                if row["stage_name"] in ("final", "semi-finals"):
                    knockout_final_scorers.add(pid)

    def wc_player_fame(pid: str, recency_year: int = 2000) -> float:
        meta = players_meta.get(pid, {})
        goals = goal_counts.get(pid, 0)
        tourns = meta.get("count_tournaments", 1)
        fame = goals * 14.0 + tourns * 20.0 + (recency_year - 1930) * 0.35
        fam = meta.get("family", "")
        if fam in FAMOUS_WC_LASTNAMES or meta.get("name", "") in FAMOUS_WC_LASTNAMES:
            fame += 110.0
        return fame

    def player_aliases(pid: str) -> List[str]:
        meta = players_meta.get(pid, {})
        fam = meta.get("family", "")
        # Allow last name if unique enough (>= 5 chars)
        return [fam.lower()] if len(fam) >= 5 else []

    # Parse squads per nation/window
    nation_squads: Dict[str, Dict[str, int]] = defaultdict(dict)
    all_wc_nations: Dict[str, int] = defaultdict(int)
    modern_gks: Dict[str, int] = {}
    with open(cache_dir / "wc_squads.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            tid = row["tournament_id"]
            if not tid.startswith("WC-"):
                continue
            year = int(tid.split("-")[1])
            team = row["team_name"]
            pid = row["player_id"]
            meta = players_meta.get(pid)
            if not meta or meta["female"]:
                continue
            all_wc_nations[team] += 1
            if year >= 1990 and team in {"Brazil", "Argentina", "France", "England", "Germany", "West Germany", "Spain"}:
                key_team = "Germany" if team == "West Germany" else team
                nation_squads[key_team][pid] = max(nation_squads[key_team].get(pid, 0), year)
            if year >= 1994 and row["position_code"] == "GK":
                modern_gks[pid] = max(modern_gks.get(pid, 0), year)

    fb_prompts: List[dict] = []

    # 1. All World Cup Nations
    nation_tuples = [
        (team, count + (250 if team in {"Brazil", "Argentina", "France", "England", "Germany", "Italy", "Spain"} else 0),
         f"Competed in Men's FIFA World Cup history", COUNTRY_ALIASES.get(team, []))
        for team, count in all_wc_nations.items()
    ]
    fb_prompts.append({
        "id": "fb-wc-nations",
        "pack": "football",
        "question": "Name any national team that has appeared at a Men's FIFA World Cup finals.",
        "categoryLabel": "World Cup Nations",
        "timerSeconds": 40,
        "sourceAttribution": "Fjelstul World Cup Database (CC-BY-SA-4.0)",
        "hints": [
            "Over 80 distinct historical and active nations have qualified since 1930.",
            "Brazil, Germany, France, and Argentina score bottom-tier Plankton points.",
            "Think Trinidad and Tobago, Kuwait, Haiti, Zaire, or North Macedonia."
        ],
        "answers": score_ranked_items(nation_tuples, higher_is_more_famous=True),
    })

    # 2. World Cup Hosts & Champions (Men's + Women's)
    host_win: Dict[str, Tuple[int, str]] = {}
    with open(cache_dir / "wc_tournaments.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            for col, label in [("host_country", "Host"), ("winner", "Champion")]:
                for part in row[col].split(","):
                    country = part.strip()
                    if country == "Korea":
                        country = "South Korea"
                    elif country == "West Germany":
                        country = "Germany"
                    if not country:
                        continue
                    prev_cnt, prev_desc = host_win.get(country, (0, ""))
                    tag = f"{row['year']} {label}"
                    host_win[country] = (prev_cnt + 1, (prev_desc + ", " + tag).strip(", "))
    hw_tuples = [
        (c, cnt * 20 + (40 if c in {"Brazil", "Germany", "France", "Italy", "England", "Argentina"} else 0),
         f"FIFA World Cup record: {desc}", COUNTRY_ALIASES.get(c, []))
        for c, (cnt, desc) in host_win.items()
    ]
    fb_prompts.append({
        "id": "fb-wc-hosts-winners",
        "pack": "football",
        "question": "Name any country that has hosted OR won a Men's or Women's FIFA World Cup.",
        "categoryLabel": "World Cup Hosts",
        "timerSeconds": 40,
        "sourceAttribution": "Fjelstul World Cup Tournaments CSV",
        "hints": [
            "Includes historic 1930s hosts plus 1991–2019 Women's World Cup hosts and champions.",
            "Brazil, France, Italy, and USA are immediate Plankton choices.",
            "Remember early or women's hosts like Uruguay, Chile, China, Sweden, Norway, or Switzerland."
        ],
        "answers": score_ranked_items(hw_tuples, higher_is_more_famous=True),
    })

    # 3. FIFA World Cup Award Winners
    award_players: Dict[str, str] = {}
    with open(cache_dir / "wc_awards.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            pid = row["player_id"]
            yr = row["tournament_id"].replace("WC-", "")
            award_players[pid] = f"{yr} {row['award_name']} ({row['team_name']})"
    award_tuples = [
        (players_meta[pid]["name"], wc_player_fame(pid, 2005), desc, player_aliases(pid))
        for pid, desc in award_players.items() if pid in players_meta
    ]
    fb_prompts.append({
        "id": "fb-wc-awards",
        "pack": "football",
        "question": "Name a player who won a FIFA World Cup Golden/Silver/Bronze Boot, Ball, Glove, or Best Young Player.",
        "categoryLabel": "World Cup Awards",
        "timerSeconds": 40,
        "sourceAttribution": "Fjelstul World Cup Awards CSV",
        "hints": [
            "Covers Men's & Women's Golden/Silver/Bronze Boot, Ball, Glove & Young Player winners.",
            "Lionel Messi, Kylian Mbappé, Ronaldo, and Luka Modrić are low-scoring Plankton traps.",
            "Look back to 1960s–90s Silver/Bronze winners like Salvatore Schillaci, Oleg Salenko, or Guillermo Stábile."
        ],
        "answers": score_ranked_items(award_tuples, higher_is_more_famous=True),
    })

    # 4. World Cup Semi-Final / Final Scorers
    sf_tuples = [
        (players_meta[pid]["name"], wc_player_fame(pid, 2000),
         f"Scored in a World Cup Semi-Final or Final ({goal_counts[pid]} career WC goals)", player_aliases(pid))
        for pid in knockout_final_scorers if pid in players_meta
    ]
    fb_prompts.append({
        "id": "fb-wc-final-semifinal-scorers",
        "pack": "football",
        "question": "Name any player who scored a goal in a FIFA World Cup Semi-Final or Final match.",
        "categoryLabel": "Clutch Scorers",
        "timerSeconds": 40,
        "sourceAttribution": "Fjelstul World Cup Goals CSV",
        "hints": [
            "Any player who found the net in a Semi-Final or Final (excluding own goals).",
            "Pelé, Mbappé, Messi, Zidane, and Ronaldo Nazário earn Plankton points.",
            "Unsung defenders or 1950s/1970s semi-finalists like Lilian Thuram, Marco Materazzi, or Helmut Rahn score high."
        ],
        "answers": score_ranked_items(sf_tuples, higher_is_more_famous=True),
    })

    # 5. Modern World Cup Goalkeepers (1994-2022)
    gk_tuples = [
        (players_meta[pid]["name"], wc_player_fame(pid, yr),
         f"FIFA World Cup Goalkeeper ({players_meta[pid]['list_tournaments']})", player_aliases(pid))
        for pid, yr in modern_gks.items() if pid in players_meta
    ]
    fb_prompts.append({
        "id": "fb-wc-goalkeepers",
        "pack": "football",
        "question": "Name any goalkeeper selected for a Men's FIFA World Cup squad since 1994.",
        "categoryLabel": "Goalkeepers",
        "timerSeconds": 40,
        "sourceAttribution": "Fjelstul World Cup Squads CSV",
        "hints": [
            "All #1 starters plus #2/#3 backup squad goalkeepers from 1994–2022 count.",
            "Manuel Neuer, Gianluigi Buffon, Iker Casillas, and Emiliano Martínez are low-scoring.",
            "Backup keepers like Franco Armani, Scott Carson, or Alphonse Areola score 90+."
        ],
        "answers": score_ranked_items(gk_tuples, higher_is_more_famous=True),
    })

    # 6. Top World Cup Scorers (4+ goals)
    scorers_4plus = [
        (players_meta[pid]["name"], wc_player_fame(pid, 2005) + goals * 10,
         f"Scored {goals} career FIFA World Cup goal(s) ({players_meta[pid]['list_tournaments']})",
         player_aliases(pid))
        for pid, goals in goal_counts.items() if goals >= 4 and pid in players_meta
    ]
    fb_prompts.append({
        "id": "fb-wc-4plus-goals",
        "pack": "football",
        "question": "Name a player with 4 or more career FIFA World Cup goals.",
        "categoryLabel": "World Cup Scorers",
        "timerSeconds": 40,
        "sourceAttribution": "Fjelstul World Cup Goals CSV",
        "hints": [
            "Includes both all-time Men's legends and Women's World Cup prolific strikers.",
            "Miroslav Klose, Ronaldo, Messi, and Mbappé are classic Plankton picks.",
            "Names like Just Fontaine, Sandor Kocsis, Emilio Butragueño, or Christine Sinclair score deep."
        ],
        "answers": score_ranked_items(scorers_4plus, higher_is_more_famous=True),
    })

    # 7-12: National World Cup Squads since 1990 for 6 powerhouse countries
    for country, desc_years in [
        ("Brazil", "1990–2022"),
        ("Argentina", "1990–2022"),
        ("France", "1990–2022"),
        ("England", "1990–2022"),
        ("Germany", "1990–2022"),
        ("Spain", "1990–2022"),
    ]:
        sq = nation_squads[country]
        sq_tuples = [
            (players_meta[pid]["name"], wc_player_fame(pid, yr),
             f"{country} WC Squad ({players_meta[pid]['list_tournaments']})", player_aliases(pid))
            for pid, yr in sq.items() if pid in players_meta
        ]
        fb_prompts.append({
            "id": f"fb-squad-{country.lower()}",
            "pack": "football",
            "question": f"Name any player named to {country}'s Men's FIFA World Cup squad ({desc_years}).",
            "categoryLabel": f"{country} Squad",
            "timerSeconds": 40,
            "sourceAttribution": "Fjelstul World Cup Squads CSV",
            "hints": [
                f"Includes every 23- or 26-man squad member selected for {country} since Italia '90.",
                "Superstars with multiple World Cups score low Plankton points.",
                "Reserve defenders, third-choice goalkeepers, or one-tournament bench picks yield 90–100 pts."
            ],
            "answers": score_ranked_items(sq_tuples, higher_is_more_famous=True),
        })

    # 13-18: Verified European Club / Ballon d'Or / Premier League Football Prompts
    ucl_winners = [
        ("Real Madrid", 100, "15 European Cup / Champions League titles", ["madrid"]),
        ("AC Milan", 94, "7 titles (most recent 2007)", ["milan"]),
        ("Bayern Munich", 95, "6 titles (incl. 2013 & 2020 trebles)", ["bayern"]),
        ("Liverpool", 96, "6 titles (incl. 2005 Istanbul & 2019)", []),
        ("Barcelona", 97, "5 titles (1992, 2006, 2009, 2011, 2015)", ["barca"]),
        ("Ajax", 78, "4 titles (three-peat 1971–1973 & 1995)", ["afc ajax"]),
        ("Inter Milan", 82, "3 titles (1964, 1965, 2010)", ["inter", "internazionale"]),
        ("Manchester United", 93, "3 titles (1968, 1999, 2008)", ["man utd", "man united"]),
        ("Juventus", 85, "2 titles (1985, 1996)", ["juve"]),
        ("Benfica", 68, "2 titles (1961, 1962 under Béla Guttmann)", []),
        ("Chelsea", 88, "2 titles (2012 & 2021)", []),
        ("Nottingham Forest", 52, "Back-to-back titles in 1979 & 1980 under Brian Clough", ["forest"]),
        ("Porto", 65, "2 titles (1987 & 2004 under José Mourinho)", ["fc porto"]),
        ("Manchester City", 92, "1 title (2023 Treble in Istanbul)", ["man city"]),
        ("Borussia Dortmund", 74, "1 title (1997 vs Juventus)", ["dortmund", "bvb"]),
        ("Celtic", 56, "1967 Lisbon Lions — first British club winner", ["celtic fc"]),
        ("Feyenoord", 42, "1970 winner — first Dutch club to lift the trophy", []),
        ("Aston Villa", 50, "1982 winner in Rotterdam vs Bayern Munich", ["villa"]),
        ("Hamburger SV", 34, "1983 winner in Athens vs Juventus", ["hamburg", "hsv"]),
        ("Steaua București", 26, "1986 winner on penalties vs Barcelona", ["steaua bucharest", "fcsb"]),
        ("PSV Eindhoven", 40, "1988 treble and shootout victory over Benfica", ["psv"]),
        ("Red Star Belgrade", 24, "1991 European Cup winner in Bari", ["crvena zvezda"]),
        ("Marseille", 48, "1993 inaugural UEFA Champions League rebrand winner", ["om", "olympique marseille"]),
    ]
    epl_winners = [
        ("Manchester United", 99, "13 Premier League titles (20 total English top-flight)", ["man utd", "man united"]),
        ("Manchester City", 98, "8 Premier League titles (10 total)", ["man city"]),
        ("Liverpool", 97, "19 First Division + 2019–20 Premier League title", []),
        ("Arsenal", 96, "3 Premier League titles incl. 2003–04 Invincibles (13 total)", []),
        ("Chelsea", 95, "5 Premier League titles (6 total)", []),
        ("Everton", 72, "9 English First Division titles", []),
        ("Aston Villa", 68, "7 First Division titles", ["villa"]),
        ("Sunderland", 54, "6 First Division titles", []),
        ("Newcastle United", 74, "4 First Division titles", ["newcastle"]),
        ("Sheffield Wednesday", 42, "4 First Division titles", ["sheff wed"]),
        ("Leeds United", 66, "3 First Division titles (last in 1991–92)", ["leeds"]),
        ("Wolverhampton Wanderers", 50, "3 First Division titles in the 1950s", ["wolves"]),
        ("Huddersfield Town", 26, "Three-peat champions from 1924–1926", ["huddersfield"]),
        ("Blackburn Rovers", 62, "2 First Division + 1994–95 Premier League", ["blackburn"]),
        ("Tottenham Hotspur", 84, "2 First Division titles (1951 & 1961 Double)", ["tottenham", "spurs"]),
        ("Derby County", 36, "2 First Division titles (1972 & 1975)", ["derby"]),
        ("Burnley", 40, "2 First Division titles (1921 & 1960)", []),
        ("Portsmouth", 32, "Back-to-back First Division champions (1949, 1950)", ["pompey"]),
        ("Leicester City", 82, "2015–16 5,000-to-1 Premier League Champions", ["leicester"]),
        ("Preston North End", 28, "First English champions & original Invincibles (1888–89)", ["preston"]),
        ("Sheffield United", 34, "1897–98 English First Division champions", ["sheff utd"]),
        ("West Bromwich Albion", 38, "1919–20 First Division champions", ["west brom", "wba"]),
        ("Ipswich Town", 30, "1961–62 champions under Alf Ramsey", ["ipswich"]),
        ("Nottingham Forest", 56, "1977–78 champions under Brian Clough", ["forest"]),
    ]
    ballon_dor = [
        ("Lionel Messi", 100, "8 Ballon d'Or awards (record)", ["messi"]),
        ("Cristiano Ronaldo", 99, "5 Ballon d'Or awards", ["ronaldo", "cr7"]),
        ("Michel Platini", 78, "3 consecutive awards (1983–1985)", ["platini"]),
        ("Johan Cruyff", 86, "3 Ballon d'Or awards (1971, 1973, 1974)", ["cruyff"]),
        ("Marco van Basten", 76, "3 Ballon d'Or awards (1988, 1989, 1992)", ["van basten"]),
        ("Franz Beckenbauer", 82, "2 awards (1972, 1976)", ["beckenbauer"]),
        ("Ronaldo Nazário", 92, "2 awards (1997, 2002)", ["ronaldo", "r9"]),
        ("Alfredo Di Stéfano", 68, "2 awards (1957, 1959) + Super Ballon d'Or", ["di stefano"]),
        ("Kevin Keegan", 50, "2 consecutive awards (1978, 1979)", ["keegan"]),
        ("Karl-Heinz Rummenigge", 54, "2 consecutive awards (1980, 1981)", ["rummenigge"]),
        ("Zinedine Zidane", 94, "1998 Ballon d'Or winner", ["zidane"]),
        ("Ronaldinho", 93, "2005 Ballon d'Or winner", []),
        ("Kaka", 85, "2007 Ballon d'Or winner", []),
        ("Luka Modrić", 90, "2018 Ballon d'Or winner", ["modric"]),
        ("Karim Benzema", 89, "2022 Ballon d'Or winner", ["benzema"]),
        ("Rodri", 87, "2024 Ballon d'Or winner", []),
        ("Ousmane Dembélé", 80, "Modern wing superstar contender / winner", ["dembele"]),
        ("George Best", 72, "1968 Ballon d'Or winner", ["best"]),
        ("Bobby Charlton", 74, "1966 Ballon d'Or winner", ["charlton"]),
        ("Lev Yashin", 70, "1963 winner — only goalkeeper ever to win", ["yashin"]),
        ("Eusébio", 66, "1965 Ballon d'Or winner", ["eusebio"]),
        ("Gerd Müller", 69, "1970 Ballon d'Or winner", ["gerd muller"]),
        ("Roberto Baggio", 73, "1993 Ballon d'Or winner", ["baggio"]),
        ("George Weah", 71, "1995 winner — first non-European winner after rule change", ["weah"]),
        ("Pavel Nedvěd", 62, "2003 Ballon d'Or winner", ["nedved"]),
        ("Andriy Shevchenko", 64, "2004 Ballon d'Or winner", ["shevchenko"]),
        ("Fabio Cannavaro", 67, "2006 Ballon d'Or winner", ["cannavaro"]),
        ("Michael Owen", 65, "2001 Ballon d'Or winner", ["owen"]),
        ("Luís Figo", 63, "2000 Ballon d'Or winner", ["figo"]),
        ("Rivaldo", 61, "1999 Ballon d'Or winner", []),
        ("Hristo Stoichkov", 52, "1994 Ballon d'Or winner", ["stoichkov"]),
        ("Jean-Pierre Papin", 42, "1991 Ballon d'Or winner", ["papin"]),
        ("Lothar Matthäus", 58, "1990 Ballon d'Or winner", ["matthaus"]),
        ("Ruud Gullit", 60, "1987 Ballon d'Or winner", ["gullit"]),
        ("Igor Belanov", 22, "1986 Ballon d'Or winner (Dynamo Kyiv & USSR)", ["belanov"]),
        ("Paolo Rossi", 56, "1982 Ballon d'Or winner", ["rossi"]),
        ("Allan Simonsen", 20, "1977 Ballon d'Or winner (Borussia Mönchengladbach)", ["simonsen"]),
        ("Oleg Blokhin", 28, "1975 Ballon d'Or winner", ["blokhin"]),
        ("Gianni Rivera", 36, "1969 Ballon d'Or winner", ["rivera"]),
        ("Flórián Albert", 18, "1967 Ballon d'Or winner (Hungary)", ["albert"]),
        ("Denis Law", 46, "1964 Ballon d'Or winner", ["law"]),
        ("Josef Masopust", 24, "1962 Ballon d'Or winner (Czechoslovakia)", ["masopust"]),
        ("Omar Sívori", 26, "1961 Ballon d'Or winner", ["sivori"]),
        ("Luis Suárez Miramontes", 30, "1960 Ballon d'Or winner (Spain)", ["luis suarez"]),
        ("Raymond Kopa", 34, "1958 Ballon d'Or winner", ["kopa"]),
        ("Stanley Matthews", 44, "1956 inaugural Ballon d'Or winner", ["matthews"]),
    ]
    epl_golden_boot = [
        ("Erling Haaland", 98, "2022–23 (36 goals) & 2023–24 Golden Boot", ["haaland"]),
        ("Mohamed Salah", 99, "4-time Premier League Golden Boot winner", ["salah"]),
        ("Harry Kane", 96, "3-time Golden Boot winner (2015–16, 2016–17, 2020–21)", ["kane"]),
        ("Thierry Henry", 95, "4-time Golden Boot winner (2001–06)", ["henry"]),
        ("Alan Shearer", 93, "3-time consecutive Golden Boot winner (1994–97)", ["shearer"]),
        ("Sergio Agüero", 91, "2014–15 Golden Boot winner (26 goals)", ["aguero"]),
        ("Robin van Persie", 88, "Back-to-back winner (2011–12 & 2012–13)", ["van persie", "rvp"]),
        ("Didier Drogba", 87, "2-time Golden Boot winner (2006–07 & 2009–10)", ["drogba"]),
        ("Cristiano Ronaldo", 94, "2007–08 Golden Boot winner (31 goals)", ["ronaldo"]),
        ("Jamie Vardy", 84, "2019–20 Golden Boot winner (23 goals)", ["vardy"]),
        ("Son Heung-min", 89, "2021–22 shared Golden Boot winner (23 goals)", ["son", "heung min son"]),
        ("Luis Suárez", 90, "2013–14 Golden Boot winner (31 goals)", ["suarez"]),
        ("Pierre-Emerick Aubameyang", 76, "2018–19 shared Golden Boot winner", ["aubameyang"]),
        ("Sadio Mané", 82, "2018–19 shared Golden Boot winner", ["mane"]),
        ("Alexander Isak", 72, "Top-tier modern Premier League striker", ["isak"]),
        ("Michael Owen", 78, "Shared 1997–98 & 1998–99 Golden Boot", ["owen"]),
        ("Dwight Yorke", 52, "1998–99 shared Golden Boot winner", ["yorke"]),
        ("Jimmy Floyd Hasselbaink", 58, "1998–99 & 2000–01 Golden Boot winner", ["hasselbaink"]),
        ("Ruud van Nistelrooy", 74, "2002–03 Golden Boot winner", ["van nistelrooy"]),
        ("Nicolas Anelka", 64, "2008–09 Golden Boot winner (Chelsea)", ["anelka"]),
        ("Dimitar Berbatov", 66, "2010–11 shared Golden Boot winner", ["berbatov"]),
        ("Carlos Tevez", 70, "2010–11 shared Golden Boot winner", ["tevez"]),
        ("Andrew Cole", 56, "1993–94 Golden Boot winner (34 goals)", ["andy cole", "cole"]),
        ("Teddy Sheringham", 54, "1992–93 inaugural Premier League Golden Boot winner", ["sheringham"]),
        ("Kevin Phillips", 40, "1999–2000 Golden Boot winner & European Golden Shoe (Sunderland)", ["phillips"]),
        ("Les Ferdinand", 42, "Prolific 1990s QPR & Newcastle striker (near-miss & 149 PL goals)", ["ferdinand"]),
        ("Dion Dublin", 34, "1997–98 shared Golden Boot winner (Coventry City)", ["dublin"]),
        ("Chris Sutton", 36, "1997–98 shared Golden Boot winner (Blackburn Rovers)", ["sutton"]),
    ]
    ucl_managers = [
        ("Carlo Ancelotti", 100, "Record 5 UEFA Champions League titles", ["ancelotti"]),
        ("Pep Guardiola", 99, "3 titles (Barcelona 2009, 2011; Man City 2023)", ["guardiola"]),
        ("Zinedine Zidane", 96, "3 consecutive titles with Real Madrid (2016–2018)", ["zidane"]),
        ("Bob Paisley", 72, "3 European Cups with Liverpool (1977, 1978, 1981)", ["paisley"]),
        ("Alex Ferguson", 95, "2 titles with Manchester United (1999, 2008)", ["sir alex", "ferguson"]),
        ("José Mourinho", 94, "2 titles (Porto 2004 & Inter Milan 2010)", ["mourinho"]),
        ("Jürgen Klopp", 93, "2019 title with Liverpool", ["klopp"]),
        ("Jupp Heynckes", 68, "2 titles (Real Madrid 1998 & Bayern Munich 2013)", ["heynckes"]),
        ("Ottmar Hitzfeld", 64, "2 titles (Dortmund 1997 & Bayern 2001)", ["hitzfeld"]),
        ("Vicente del Bosque", 66, "2 titles with Real Madrid (2000, 2002)", ["del bosque"]),
        ("Arrigo Sacchi", 62, "2 titles with AC Milan (1989, 1990)", ["sacchi"]),
        ("Ernst Happel", 52, "2 titles (Feyenoord 1970 & Hamburg 1983)", ["happel"]),
        ("Brian Clough", 60, "2 titles with Nottingham Forest (1979, 1980)", ["clough"]),
        ("Helenio Herrera", 48, "2 titles with Inter Milan (1964, 1965)", ["herrera"]),
        ("Nereo Rocco", 38, "2 titles with AC Milan (1963, 1969)", ["rocco"]),
        ("Béla Guttmann", 42, "2 titles with Benfica (1961, 1962)", ["guttmann"]),
        ("Miguel Muñoz", 44, "2 titles with Real Madrid (1960, 1966)", ["munoz"]),
        ("José Villalonga", 24, "Winner of the first two European Cups (Real Madrid 1956, 1957)", ["villalonga"]),
        ("Hansi Flick", 80, "2020 sextuple season with Bayern Munich", ["flick"]),
        ("Thomas Tuchel", 82, "2021 title with Chelsea", ["tuchel"]),
        ("Luis Enrique", 84, "2015 treble with Barcelona", ["enrique"]),
        ("Roberto Di Matteo", 56, "2012 title with Chelsea", ["di matteo"]),
        ("Rafael Benítez", 74, "2005 Miracle of Istanbul with Liverpool", ["benitez"]),
        ("Frank Rijkaard", 61, "2006 title with Barcelona", ["rijkaard"]),
        ("Louis van Gaal", 76, "1995 title with Ajax", ["van gaal"]),
        ("Marcello Lippi", 65, "1996 title with Juventus", ["lippi"]),
        ("Fabio Capello", 69, "1994 title with AC Milan", ["capello"]),
        ("Johan Cruyff", 86, "1992 European Cup with Barcelona's Dream Team", ["cruyff"]),
        ("Guus Hiddink", 58, "1988 treble with PSV Eindhoven", ["hiddink"]),
        ("Giovanni Trapattoni", 59, "1985 European Cup with Juventus", ["trapattoni"]),
        ("Tony Barton", 22, "1982 European Cup with Aston Villa", ["barton"]),
        ("Dettmar Cramer", 26, "1975 & 1976 European Cups with Bayern Munich", ["cramer"]),
        ("Stefan Kovács", 28, "1972 & 1973 European Cups with Ajax", ["kovacs"]),
        ("Rinus Michels", 67, "1971 European Cup with Ajax", ["michels"]),
        ("Matt Busby", 70, "1968 European Cup with Manchester United", ["busby"]),
        ("Jock Stein", 50, "1967 European Cup with Celtic", ["stein"]),
    ]

    epl_all_clubs = [
        ("Arsenal", 99, "Founding Premier League club (never relegated)", []),
        ("Chelsea", 98, "Founding Premier League club", []),
        ("Everton", 93, "Founding Premier League club", []),
        ("Liverpool", 100, "Founding Premier League club", []),
        ("Manchester United", 100, "Founding Premier League club", ["man utd"]),
        ("Tottenham Hotspur", 96, "Founding Premier League club", ["tottenham", "spurs"]),
        ("Manchester City", 97, "8-time Premier League champions", ["man city"]),
        ("Newcastle United", 90, "St James' Park club", ["newcastle"]),
        ("Aston Villa", 89, "Birmingham club & 1982 European champions", ["villa"]),
        ("West Ham United", 88, "East London club", ["west ham"]),
        ("Brighton & Hove Albion", 82, "South Coast Seagulls", ["brighton"]),
        ("Crystal Palace", 80, "South London Eagles", ["palace"]),
        ("Brentford", 76, "West London Bees", []),
        ("Fulham", 78, "Craven Cottage club", []),
        ("Bournemouth", 74, "AFC Bournemouth Cherries", ["afc bournemouth"]),
        ("Wolverhampton Wanderers", 79, "Molineux club", ["wolves"]),
        ("Nottingham Forest", 81, "City Ground club", ["forest"]),
        ("Leicester City", 85, "2015–16 champions", ["leicester"]),
        ("Southampton", 75, "St Mary's Saints", []),
        ("Ipswich Town", 68, "Portman Road Tractor Boys", ["ipswich"]),
        ("Leeds United", 83, "Elland Road club", ["leeds"]),
        ("Sunderland", 72, "Stadium of Light Black Cats", []),
        ("Burnley", 70, "Turf Moor Clarets", []),
        ("Sheffield United", 69, "Bramall Lane Blades", ["sheff utd"]),
        ("Watford", 66, "Vicarage Road Hornets", []),
        ("Norwich City", 64, "Carrow Road Canaries", ["norwich"]),
        ("West Bromwich Albion", 62, "The Hawthorns Baggies", ["west brom", "wba"]),
        ("Stoke City", 65, "10 consecutive seasons in the 2000s–10s", ["stoke"]),
        ("Swansea City", 58, "First Welsh club in the Premier League (2011)", ["swansea"]),
        ("Hull City", 50, "Joined Premier League in 2008", ["hull"]),
        ("Middlesbrough", 60, "Riverside Stadium club", ["boro"]),
        ("Bolton Wanderers", 56, "Four-time top-8 Sam Allardyce era club", ["bolton"]),
        ("Blackburn Rovers", 63, "1994–95 champions", ["blackburn"]),
        ("Wigan Athletic", 52, "8 consecutive Premier League seasons (2005–2013)", ["wigan"]),
        ("Portsmouth", 54, "Fratton Park 2003–2010", ["pompey"]),
        ("Reading", 42, "Three Premier League seasons incl. 106-pt promotion", []),
        ("Derby County", 46, "Pride Park club", ["derby"]),
        ("Coventry City", 48, "9 consecutive Premier League seasons (1992–2001)", ["coventry"]),
        ("Charlton Athletic", 44, "The Valley Addicks", ["charlton"]),
        ("QPR", 49, "Queens Park Rangers (Loftus Road)", ["queens park rangers"]),
        ("Wimbledon", 40, "Founding Premier League Crazy Gang club (1992–2000)", []),
        ("Blackpool", 36, "2010–11 attacking debut under Ian Holloway", []),
        ("Huddersfield Town", 38, "Played 2017–2019 in Premier League", ["huddersfield"]),
        ("Cardiff City", 41, "Welsh capital club (2013–14 & 2018–19)", ["cardiff"]),
        ("Oldham Athletic", 28, "Two seasons (1992–1994)", ["oldham"]),
        ("Swindon Town", 22, "Single season in 1993–94 (conceded 100 goals)", ["swindon"]),
        ("Barnsley", 24, "Single season in 1997–98", []),
        ("Bradford City", 30, "Two seasons (1999–2001)", ["bradford"]),
        ("Luton Town", 55, "Promoted for 2023–24 Kenilworth Road season", ["luton"]),
    ]

    for pid, q, cat, data, hints in [
        ("fb-ucl-winners", "Name any club that has won the European Cup / UEFA Champions League.", "Champions League", ucl_winners,
         ["Covers all 23 clubs to lift Europe's top trophy from 1956 to today.", "Real Madrid, AC Milan, Bayern Munich, and Liverpool score Plankton points.", "Remember single-time champions like Feyenoord, Steaua București, or Red Star Belgrade."]),
        ("fb-epl-champions", "Name any club that has won the English top-flight football title (First Division or Premier League).", "English Champions", epl_winners,
         ["Includes all 7 Premier League-era champions plus historical First Division winners.", "Man Utd, Man City, Liverpool, Arsenal, and Chelsea score low.", "Historical winners like Huddersfield Town, Ipswich Town, or Preston North End score 85–100."]),
        ("fb-ballon-dor", "Name any player who has won the Ballon d'Or.", "Ballon d'Or", ballon_dor,
         ["Spans from Stanley Matthews (1956) through Messi, Ronaldo, Benzema, and Rodri.", "Messi and Cristiano Ronaldo score 10 pts.", "Eastern European icons like Igor Belanov, Oleg Blokhin, or Josef Masopust hit 90+."]),
        ("fb-epl-golden-boot", "Name any player who has won the Premier League Golden Boot (since 1992–93).", "Golden Boot", epl_golden_boot,
         ["Every full or shared top scorer since Teddy Sheringham in 1992–93.", "Haaland, Salah, Harry Kane, and Thierry Henry earn low Plankton points.", "1990s winners like Dion Dublin, Chris Sutton, or Kevin Phillips hit Deep Sea scores."]),
        ("fb-ucl-managers", "Name any head coach / manager who has won the European Cup or UEFA Champions League.", "UCL Managers", ucl_managers,
         ["Includes icons from Ancelotti and Guardiola back to the 1950s–70s.", "Pep Guardiola, Carlo Ancelotti, and Sir Alex Ferguson are top Plankton answers.", "Vintage winners such as Tony Barton, Dettmar Cramer, or Stefan Kovács score 85–100."]),
        ("fb-epl-all-clubs", "Name any football club to have played at least one season in the English Premier League (since 1992).", "All-Time EPL Clubs", epl_all_clubs,
         ["Every club from founding Ever-Presents to single-season promoted underdogs counts.", "Big Six clubs earn minimum Plankton points.", "Brief 1990s clubs like Swindon Town, Barnsley, or Oldham Athletic earn ~100 pts."]),
    ]:
        fb_prompts.append({
            "id": pid,
            "pack": "football",
            "question": q,
            "categoryLabel": cat,
            "timerSeconds": 40,
            "sourceAttribution": "UEFA, Premier League & RSSSF Verified Club Records",
            "hints": hints,
            "answers": score_ranked_items(data, higher_is_more_famous=True),
        })

    return fb_prompts
