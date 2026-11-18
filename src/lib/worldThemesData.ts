import type { ThemeVariant } from "@/lib/gameThemes";

export interface WorldMarker {
  depth: number;
  label: string;
  sublabel?: string;
  accent?: string;
}

export type LandmarkVisualKind =
  // abyss
  | "kelp"
  | "diver"
  | "turtle"
  | "submarine"
  | "shipwreck"
  | "jellyfish"
  | "squid"
  | "angler"
  | "vents"
  | "ufo"
  | "leviathan"
  // sky
  | "paperplane"
  | "birds"
  | "biplane"
  | "balloons"
  | "rainbow"
  | "satellite"
  | "station"
  | "astronaut"
  // pitch (football)
  | "cornerflag"
  | "goalkeeper"
  | "flashbulbs"
  | "varbooth"
  | "goldenboot"
  | "starball"
  | "worldcup"
  // hardwood (nba)
  | "shotclock"
  | "hoop"
  | "jerseys"
  | "sneaker"
  | "moneyrack"
  | "obrien"
  // pokedex (pokemon)
  | "tallgrass"
  | "pikachu"
  | "pokestop"
  | "badges"
  | "masterball"
  | "evostone"
  | "fossil"
  | "rift"
  // atlas (geography)
  | "compass"
  | "pyramids"
  | "eiffel"
  | "everest"
  | "airship"
  | "moai"
  | "aurora"
  // cinema (movies)
  | "clapper"
  | "popcorn"
  | "projector"
  | "walkstar"
  | "scifi"
  | "oscar"
  // stadium (sports)
  | "hurdles"
  | "torch"
  | "tennis"
  | "f1car"
  | "podium";

export interface WorldLandmark {
  id: LandmarkVisualKind;
  depth: number;
  xRatio: number;
  title: string;
  discoveryLog: string;
  zone: string;
}

export interface WorldThemeMeta {
  hudMetricTitle: string;
  unitPrefix: string;
  unitSuffix: string;
  submitVerb: string;
  promptHintText: string;
  nextDiveLabel: string;
  stageAriaLabel: string;
  actionDescendLabel: string;
  sinkingVerb: string;
  scanPromptLabel: string;
  specimens: string[];
  markers: WorldMarker[];
  landmarks: WorldLandmark[];
  tiers: {
    miss: { title: string; tagline: string };
    low: { title: string; tagline: string };
    mid: { title: string; tagline: string };
    high: { title: string; tagline: string };
    rare: { title: string; tagline: string };
  };
}

const WORLD_THEMES_META: Record<ThemeVariant, WorldThemeMeta> = {
  abyss: {
    hudMetricTitle: "DEPTH",
    unitPrefix: "-",
    unitSuffix: "m",
    submitVerb: "DIVE",
    promptHintText: "▼ rarer answers sink deeper ▼",
    nextDiveLabel: "NEXT DIVE →",
    stageAriaLabel: "Interactive Krillion Ocean Dive Canvas",
    actionDescendLabel: "DESCEND ▼",
    sinkingVerb: "Sinking into the deep...",
    scanPromptLabel: "Click water to ping sonar",
    specimens: [
      "Bioluminescent Comb Jelly",
      "Glowing Nautilus Shell",
      "Sunken Message Bottle",
      "Luminous Sea Butterfly",
      "Hydrothermal Amber Pearl",
    ],
    markers: [
      { depth: 50, label: "— light begins to fade", accent: "text-cyan-200/55" },
      { depth: 100, label: "PLANKTON · 10", sublabel: "crowd favorite zone", accent: "text-rose-300/75" },
      { depth: 200, label: "most sunlight stops here", accent: "text-cyan-300/55" },
      { depth: 300, label: "SCHOOLER · 30", sublabel: "moderate depth", accent: "text-sky-300/80" },
      { depth: 332, label: "deepest scuba dive ever · -332m", accent: "text-slate-300/50" },
      { depth: 550, label: "TWILIGHT ZONE · -550m", accent: "text-indigo-300/60" },
      { depth: 700, label: "DEEP DIVER · 70", sublabel: "rare knowledge band", accent: "text-cyan-300/85" },
      { depth: 1000, label: "ONE IN A KRILLION · 100", sublabel: "single-question max sink", accent: "text-amber-300/90" },
      { depth: 1500, label: "giant squid hunting ground", accent: "text-purple-300/60" },
      { depth: 2200, label: "MIDNIGHT ZONE · -2,200m", accent: "text-slate-400/60" },
      { depth: 3000, label: "sunken shipwreck abyss", accent: "text-cyan-400/65" },
      { depth: 4000, label: "ABYSSAL PLAIN · -4,000m", accent: "text-emerald-300/75" },
      { depth: 5000, label: "HADAL TRENCH · -5,000m", accent: "text-amber-300/80" },
    ],
    landmarks: [
      { id: "kelp", depth: 95, xRatio: 0.78, title: "Giant Kelp Forest", discoveryLog: "Kelp Canopy (-95m): swaying fronds shelter early plankton.", zone: "Sunlight Reef" },
      { id: "diver", depth: 145, xRatio: 0.76, title: "Research Diver", discoveryLog: "Research Diver (-145m): signaling your descent with a floodlight!", zone: "Sunlight Reef" },
      { id: "turtle", depth: 225, xRatio: 0.22, title: "Green Sea Turtle", discoveryLog: "Green Sea Turtle (-225m): gliding along the reef drop-off.", zone: "Sunlight Reef" },
      { id: "submarine", depth: 365, xRatio: 0.74, title: "Submarine ALVIN-7", discoveryLog: "ALVIN-7 Research Sub (-365m): floodlights sweeping the thermocline.", zone: "Twilight Zone" },
      { id: "shipwreck", depth: 690, xRatio: 0.24, title: "Sunken Galleon", discoveryLog: "Sunken Galleon (-690m): faint gold glinting inside the hull.", zone: "Twilight Zone" },
      { id: "jellyfish", depth: 1120, xRatio: 0.77, title: "Neon Jellyfish", discoveryLog: "Neon Jelly Swarm (-1,120m): bioluminescent bells pulsing below.", zone: "Bioluminescent Zone" },
      { id: "squid", depth: 1720, xRatio: 0.23, title: "Giant Squid", discoveryLog: "Architeuthis (-1,720m): giant tentacles drifting in dark water.", zone: "Bioluminescent Zone" },
      { id: "angler", depth: 2580, xRatio: 0.75, title: "Abyssal Anglerfish", discoveryLog: "Anglerfish (-2,580m): hypnotic golden lantern spotted in the dark.", zone: "Midnight Zone" },
      { id: "vents", depth: 3500, xRatio: 0.25, title: "Black Smoker Vents", discoveryLog: "Hydrothermal Vents (-3,500m): mineral plumes rising from the crust.", zone: "Abyssal Plain" },
      { id: "ufo", depth: 4700, xRatio: 0.75, title: "Sunken Relay Disc", discoveryLog: "Anomalous Relay (-4,700m): unexplained cyan pulse beneath the silt.", zone: "Hadal Trench" },
      { id: "leviathan", depth: 5800, xRatio: 0.3, title: "Golden Leviathan", discoveryLog: "Golden Leviathan (-5,800m): mythical guardian of One-in-a-Krillion.", zone: "Hadal Trench" },
    ],
    tiers: {
      miss: { title: "NOTHING LANDED", tagline: "The clock closed this route." },
      low: { title: "PLANKTON", tagline: "The answer everyone blurts out." },
      mid: { title: "SCHOOLER", tagline: "A strong answer with a crowd." },
      high: { title: "DEEP DIVER", tagline: "Far below the crowded surface." },
      rare: { title: "ONE IN A KRILLION", tagline: "Almost nobody went there." },
    },
  },

  sky: {
    hudMetricTitle: "ALTITUDE",
    unitPrefix: "+",
    unitSuffix: "ft",
    submitVerb: "ASCEND",
    promptHintText: "▲ obvious answers fly higher ▲",
    nextDiveLabel: "NEXT FLIGHT →",
    stageAriaLabel: "Interactive Noillirk Sky Ascent Canvas",
    actionDescendLabel: "ASCEND ▲",
    sinkingVerb: "Ascending through sky...",
    scanPromptLabel: "Click sky to scan",
    specimens: [
      "Stray Weather Balloon",
      "Monarch Butterfly Swarm",
      "Golden Cumulus Spark",
      "Meteoric Stardust Mote",
      "Radio Telemetry Probe",
    ],
    markers: [
      { depth: 50, label: "treetop updraft", accent: "text-emerald-200/65" },
      { depth: 100, label: "DEEP CUT PENALTY · 10", sublabel: "barely left the ground", accent: "text-rose-300/75" },
      { depth: 300, label: "MAINSTREAM BREEZE · 30", accent: "text-sky-200/80" },
      { depth: 700, label: "CUMULUS CLIMBER · 70", accent: "text-amber-200/85" },
      { depth: 1000, label: "CROWD FAVORITE #1 · 100", sublabel: "max single-round lift", accent: "text-amber-300/95" },
      { depth: 2000, label: "jetstream golden hour", accent: "text-orange-300/75" },
      { depth: 3500, label: "stratosphere cruise", accent: "text-fuchsia-300/75" },
      { depth: 5000, label: "LOW EARTH ORBIT · +5,000 ft", accent: "text-amber-300/90" },
    ],
    landmarks: [
      { id: "paperplane", depth: 110, xRatio: 0.77, title: "Paper Glider", discoveryLog: "Paper Glider (+110ft): riding warm morning thermals.", zone: "Treetop Updraft" },
      { id: "birds", depth: 195, xRatio: 0.23, title: "Swallow Flock", discoveryLog: "Swallow Flock (+195ft): drafting beside your balloon envelope.", zone: "Treetop Updraft" },
      { id: "biplane", depth: 480, xRatio: 0.75, title: "Vintage Biplane", discoveryLog: "Crimson Biplane (+480ft): circling the cumulus ridge!", zone: "Cumulus Climb" },
      { id: "balloons", depth: 860, xRatio: 0.24, title: "Rival Balloons", discoveryLog: "Sky Festival (+860ft): neighboring gondolas cheering you up.", zone: "Cumulus Climb" },
      { id: "rainbow", depth: 1550, xRatio: 0.75, title: "Prism Rainbow", discoveryLog: "Stratocumulus Arc (+1,550ft): double rainbow over thunderheads.", zone: "Jetstream Golden Hour" },
      { id: "satellite", depth: 2700, xRatio: 0.75, title: "Weather Satellite", discoveryLog: "Orbital Relay (+2,700ft): solar wings glinting in lavender air.", zone: "Stratosphere" },
      { id: "station", depth: 3650, xRatio: 0.25, title: "Space Station", discoveryLog: "Orbital Module (+3,650ft): cruising along Earth curvature.", zone: "Stratosphere" },
      { id: "astronaut", depth: 4600, xRatio: 0.74, title: "EV-Suit Astronaut", discoveryLog: "Spacewalk (+4,600ft): waving beside northern aurora ribbons!", zone: "Low Earth Orbit" },
    ],
    tiers: {
      miss: { title: "STALLED OUT", tagline: "Lost thermal lift before the buzzer." },
      low: { title: "OBSCURE TRAP", tagline: "Way too deep-cut for reverse mode!" },
      mid: { title: "MID-ALTITUDE", tagline: "Solid guess, decent mainstream appeal." },
      high: { title: "CUMULUS CLIMBER", tagline: "Strong household-name instinct." },
      rare: { title: "CROWD FAVORITE #1", tagline: "Everyone on earth thought of that!" },
    },
  },

  pitch: {
    hudMetricTitle: "STRIKE RANGE",
    unitPrefix: "",
    unitSuffix: "yd",
    submitVerb: "STRIKE",
    promptHintText: "rarer clubs & players strike from further out",
    nextDiveLabel: "NEXT MATCH →",
    stageAriaLabel: "Interactive Footbillion Stadium Pitch Canvas",
    actionDescendLabel: "NEXT HALF ▼",
    sinkingVerb: "Driving downfield into World Cup territory...",
    scanPromptLabel: "Click pitch to flash cameras",
    specimens: [
      "Golden Match Ball",
      "Referee Whistle Token",
      "VAR Offside Replay",
      "Captain's Armband",
      "Top-Bins Match Pin",
    ],
    markers: [
      { depth: 95, label: "KICKOFF CIRCLE · 10", sublabel: "superstar bandwagon", accent: "text-rose-300/80" },
      { depth: 220, label: "midfield build-up · 22yd", accent: "text-emerald-200/60" },
      { depth: 350, label: "FIRST TEAM PICK · 35", sublabel: "tactical selection", accent: "text-sky-300/80" },
      { depth: 700, label: "MAN OF THE MATCH · 70", sublabel: "deep squad knowledge", accent: "text-emerald-300/90" },
      { depth: 1000, label: "BALLON D'OR GEM · 100", sublabel: "max single-round strike", accent: "text-amber-300/95" },
      { depth: 1800, label: "CHAMPS LEAGUE KNOCKOUT STAGE", accent: "text-emerald-300/75" },
      { depth: 3200, label: "WORLD CUP LEGENDS VAULT", accent: "text-amber-300/80" },
    ],
    landmarks: [
      { id: "cornerflag", depth: 105, xRatio: 0.78, title: "Corner Flag & Arc", discoveryLog: "Corner Quadrant (105yd): fresh chalk lines glowing under floodlights.", zone: "Kickoff Circle" },
      { id: "goalkeeper", depth: 165, xRatio: 0.75, title: "Diving Goalkeeper", discoveryLog: "Goalframe (165yd): keeper diving at full stretch across the top corner!", zone: "Penalty Area" },
      { id: "flashbulbs", depth: 260, xRatio: 0.23, title: "Ultra Crowd Flashes", discoveryLog: "Grandstand Tier (260yd): 80,000 stadium camera bulbs strobing.", zone: "Midfield Terrace" },
      { id: "varbooth", depth: 420, xRatio: 0.74, title: "VAR Monitor Booth", discoveryLog: "Touchline VAR (420yd): official frame review cleared in your favor!", zone: "Technical Area" },
      { id: "goldenboot", depth: 740, xRatio: 0.24, title: "Golden Boot Plinth", discoveryLog: "Tunnel Showcase (740yd): historic World Cup scoring boot.", zone: "Champions Tunnel" },
      { id: "starball", depth: 1220, xRatio: 0.76, title: "European Starball", discoveryLog: "Floodlight Rafters (1,220yd): glowing silver-star European emblem.", zone: "Knockout Night" },
      { id: "worldcup", depth: 1950, xRatio: 0.26, title: "World Cup Trophy", discoveryLog: "Jules Rimet Vault (1,950yd): solid gold championship pedestal!", zone: "Trophy Vault" },
    ],
    tiers: {
      miss: { title: "OFFSIDE!", tagline: "Hit the woodwork on the whistle." },
      low: { title: "TAP-IN TRAP", tagline: "Every highlight reel names that superstar." },
      mid: { title: "SQUAD ROTATION", tagline: "Reliable starter with solid cup pedigree." },
      high: { title: "MAN OF THE MATCH", tagline: "Cult veteran most fans forgot!" },
      rare: { title: "BALLON D'OR GEM", tagline: "Pure top-bins deep-cut mastery." },
    },
  },

  hardwood: {
    hudMetricTitle: "COURT RANGE",
    unitPrefix: "",
    unitSuffix: "ft",
    submitVerb: "SHOOT",
    promptHintText: "deep-cut legends splash from way downtown",
    nextDiveLabel: "NEXT GAME →",
    stageAriaLabel: "Interactive NBA Krillion Hardwood Arena Canvas",
    actionDescendLabel: "NEXT QUARTER ▼",
    sinkingVerb: "Cutting through arena spotlights...",
    scanPromptLabel: "Click court for arena cam",
    specimens: [
      "All-Star Money Ball",
      "Championship Ring Spark",
      "Chalk-Toss Cloud",
      "Playoff Towel Spin",
      "Retired Locker Key",
    ],
    markers: [
      { depth: 100, label: "BENCH / LOTTERY · 10", sublabel: "poster dunk cliché", accent: "text-rose-300/80" },
      { depth: 240, label: "three-point perimeter", accent: "text-orange-200/60" },
      { depth: 360, label: "SIXTH MAN SPARK · 35", sublabel: "smart rotation pick", accent: "text-amber-300/85" },
      { depth: 700, label: "ALL-STAR SLEEPER · 70", sublabel: "deep franchise lore", accent: "text-orange-300/90" },
      { depth: 1000, label: "HALL OF FAME GEM · 100", sublabel: "max buzzer-beater pull", accent: "text-amber-300/95" },
      { depth: 1850, label: "CHAMPIONSHIP RAFTERS", accent: "text-amber-300/75" },
    ],
    landmarks: [
      { id: "shotclock", depth: 100, xRatio: 0.77, title: "24s Shot Clock", discoveryLog: "Stanchion Clock (100ft): crimson LED digits counting down possession.", zone: "Tip-Off Center" },
      { id: "hoop", depth: 165, xRatio: 0.75, title: "Glass Backboard Hoop", discoveryLog: "Orange Rim (165ft): net rippling from a nothing-but-net swish!", zone: "Three-Point Arc" },
      { id: "jerseys", depth: 360, xRatio: 0.24, title: "Championship Banners", discoveryLog: "Arena Rafters (360ft): golden retired jersey banners swaying.", zone: "Upper Rafters" },
      { id: "sneaker", depth: 720, xRatio: 0.75, title: "Deadstock Sneaker Vault", discoveryLog: "Tunnel Locker (720ft): glowing 1996 retro hardwood kicks.", zone: "Playoff Tunnel" },
      { id: "moneyrack", depth: 1200, xRatio: 0.24, title: "All-Star 3-Pt Rack", discoveryLog: "Money Ball Rack (1,200ft): tricolor shooters' rack lit in gold.", zone: "All-Star Floor" },
      { id: "obrien", depth: 1900, xRatio: 0.74, title: "Gold Trophy Pedestal", discoveryLog: "Finals Vault (1,900ft): Larry O'Brien silver-and-gold trophy.", zone: "Hall of Fame" },
    ],
    tiers: {
      miss: { title: "SHOT CLOCK VIOLATION", tagline: "Buzzer sounded before release." },
      low: { title: "ALL-STAR CLICHÉ", tagline: "Every casual NBA fan typed that star." },
      mid: { title: "SIXTH MAN PICK", tagline: "Valuable rotation contributor." },
      high: { title: "ALL-NBA SLEEPER", tagline: "Deep defensive/era specialist!" },
      rare: { title: "HALL OF FAME GEM", tagline: "Logo deep-cut nothing-but-net!" },
    },
  },

  pokedex: {
    hudMetricTitle: "DEX RADAR",
    unitPrefix: "",
    unitSuffix: "m",
    submitVerb: "CATCH",
    promptHintText: "rarer Pokémon hide deeper in the Pokédex",
    nextDiveLabel: "NEXT ROUTE →",
    stageAriaLabel: "Interactive Pokekrillion Dex Radar Canvas",
    actionDescendLabel: "NEXT ROUTE ▼",
    sinkingVerb: "Scanning deep tall grass & caverns...",
    scanPromptLabel: "Click radar to scan wild spawns",
    specimens: [
      "Glowing Rare Candy",
      "Nugget / Star Piece",
      "Shiny Sparkle Orb",
      "Mysterious Pokéblock",
      "GS Ball Signal",
    ],
    markers: [
      { depth: 100, label: "PIKACHU GRASS · 10", sublabel: "starters & mascots trap", accent: "text-rose-300/80" },
      { depth: 240, label: "route 2 cavern threshold", accent: "text-amber-200/65" },
      { depth: 360, label: "GYM CHALLENGER · 35", sublabel: "mid-dex pick", accent: "text-sky-300/85" },
      { depth: 700, label: "ELITE FOUR DEPTH · 70", sublabel: "obscure gen 2-9 cut", accent: "text-amber-300/90" },
      { depth: 1000, label: "SHINY MYTHICAL · 100", sublabel: "1/8192 rare dex catch", accent: "text-amber-300/95" },
      { depth: 1850, label: "DISTORTION WORLD RIFT", accent: "text-fuchsia-300/80" },
    ],
    landmarks: [
      { id: "tallgrass", depth: 100, xRatio: 0.77, title: "Shaking Tall Grass", discoveryLog: "Route 1 Patch (100m): a wild encounter rustled with a ! ping.", zone: "Tall Grass" },
      { id: "pikachu", depth: 155, xRatio: 0.75, title: "Mascot Trap", discoveryLog: "Cover Silhouette (155m): watch out — starters only score 10–15 pts!", zone: "Tall Grass" },
      { id: "pokestop", depth: 270, xRatio: 0.23, title: "Spinning PokéStop", discoveryLog: "Beacon Spire (270m): rotating cyan module dropping supplies.", zone: "Cerulean Cave" },
      { id: "badges", depth: 460, xRatio: 0.75, title: "8-Badge Case", discoveryLog: "League Gate (460m): eight polished metallic gym badges gleaming.", zone: "Victory Road" },
      { id: "masterball", depth: 820, xRatio: 0.24, title: "Master Ball", discoveryLog: "Silph Vault (820m): purple-M Master Ball hovering in stasis.", zone: "Elite Four Chamber" },
      { id: "evostone", depth: 1320, xRatio: 0.76, title: "Evolution Prisms", discoveryLog: "Celadon Altar (1,320m): Fire, Thunder & Water stones resonating.", zone: "Mt. Silver Deep" },
      { id: "fossil", depth: 1950, xRatio: 0.25, title: "Old Amber Helix", discoveryLog: "Cinnabar Lab (1,950m): ancient fossilized DNA pulsing.", zone: "Fossil Trench" },
      { id: "rift", depth: 2800, xRatio: 0.74, title: "Distortion Rift", discoveryLog: "Ultra Wormhole (2,800m): cosmic purple rift warping space.", zone: "Distortion Rift" },
    ],
    tiers: {
      miss: { title: "WILD FLED!", tagline: "Run out of Poké Balls on the clock." },
      low: { title: "PIKACHU TRAP", tagline: "Every trainer knows that mascot!" },
      mid: { title: "GYM PICK", tagline: "Solid mid-game team staple." },
      high: { title: "ELITE FOUR GEM", tagline: "True Pokédex completionist knowledge!" },
      rare: { title: "SHINY MYTHICAL", tagline: "Full-odds 1-in-a-Krillion capture!" },
    },
  },

  atlas: {
    hudMetricTitle: "DISTANCE",
    unitPrefix: "",
    unitSuffix: "km",
    submitVerb: "CHART",
    promptHintText: "obscure nations chart further off-grid",
    nextDiveLabel: "NEXT EXPEDITION →",
    stageAriaLabel: "Interactive Krillion Geography Atlas Canvas",
    actionDescendLabel: "CHART NEXT ▼",
    sinkingVerb: "Charting uncharted coordinates...",
    scanPromptLabel: "Click map to take compass bearing",
    specimens: [
      "Brass Sextant Glimmer",
      "Vintage Air-Mail Stamp",
      "Sunken Astrolabe",
      "Arctic Aurora Crystal",
      "Atoll Pearl Buoy",
    ],
    markers: [
      { depth: 100, label: "TOURIST HOTSPOT · 10", sublabel: "postcards & capitals", accent: "text-rose-300/80" },
      { depth: 240, label: "tropic of capricorn meridian", accent: "text-teal-200/60" },
      { depth: 360, label: "BACKPACKER ROUTE · 35", sublabel: "off-the-beaten path", accent: "text-cyan-300/85" },
      { depth: 700, label: "CARTOGRAPHER · 70", sublabel: "island & border lore", accent: "text-teal-300/90" },
      { depth: 1000, label: "TERRA INCOGNITA · 100", sublabel: "tiny sovereign micro-gem", accent: "text-amber-300/95" },
      { depth: 1850, label: "ANTARCTIC EXPEDITION ARC", accent: "text-emerald-300/80" },
    ],
    landmarks: [
      { id: "compass", depth: 100, xRatio: 0.77, title: "Brass Compass Rose", discoveryLog: "Meridian 0° (100km): magnetic needle locking onto rare territory.", zone: "Prime Meridian" },
      { id: "pyramids", depth: 165, xRatio: 0.75, title: "Giza Pyramids", discoveryLog: "29°N Desert (165km): limestone silhouette under desert sun.", zone: "Continental Shelf" },
      { id: "eiffel", depth: 280, xRatio: 0.23, title: "Iron Spire Beacon", discoveryLog: "48°N Capitals (280km): skip Paris for true 100-pt gems!", zone: "World Capitals" },
      { id: "everest", depth: 460, xRatio: 0.75, title: "Sagarmatha Peak", discoveryLog: "Himalayan Ridge (460km): high-altitude snowline gleaming.", zone: "Highlands Trail" },
      { id: "airship", depth: 820, xRatio: 0.24, title: "Zeppelin Explorer", discoveryLog: "Trade Winds (820km): survey dirigible crossing archipelago seas.", zone: "Archipelago Belt" },
      { id: "moai", depth: 1320, xRatio: 0.76, title: "Rapa Nui Moai", discoveryLog: "Pacific Monoliths (1,320km): volcanic stone guardians in mist.", zone: "Oceanic Outpost" },
      { id: "aurora", depth: 2100, xRatio: 0.26, title: "Polar Aurora Arc", discoveryLog: "78°S Station (2,100km): emerald polar ribbons over ice caps.", zone: "Terra Incognita" },
    ],
    tiers: {
      miss: { title: "LOST AT SEA", tagline: "Storm washed away your compass." },
      low: { title: "TOURIST TRAP", tagline: "First pin on every classroom globe." },
      mid: { title: "BACKPACKER PICK", tagline: "Solid travel atlas recall." },
      high: { title: "CARTOGRAPHER", tagline: "Deep border and island knowledge!" },
      rare: { title: "TERRA INCOGNITA", tagline: "Uncharted micro-nation mastery!" },
    },
  },

  cinema: {
    hudMetricTitle: "REEL FOOTAGE",
    unitPrefix: "",
    unitSuffix: "ft",
    submitVerb: "ROLL",
    promptHintText: "indie & archival gems earn top billing",
    nextDiveLabel: "NEXT FEATURE →",
    stageAriaLabel: "Interactive Krillion Movies Premiere Canvas",
    actionDescendLabel: "NEXT REEL ▼",
    sinkingVerb: "Spooling 35mm director's cut...",
    scanPromptLabel: "Click screen to spotlight props",
    specimens: [
      "Golden Premiere Ticket",
      "Lost 35mm Reel Canister",
      "Marquee Bulb Spark",
      "Festival Palme Pin",
      "Vintage Clapper Snap",
    ],
    markers: [
      { depth: 100, label: "OPENING NIGHT CLICHÉ · 10", sublabel: "$1B blockbuster trap", accent: "text-rose-300/80" },
      { depth: 240, label: "midnight matinee reel", accent: "text-fuchsia-200/65" },
      { depth: 360, label: "INDIE SHOWCASE · 35", sublabel: "critics' favorite", accent: "text-purple-300/85" },
      { depth: 700, label: "DIRECTOR'S CUT · 70", sublabel: "deep filmography pick", accent: "text-fuchsia-300/90" },
      { depth: 1000, label: "PALME D'OR GEM · 100", sublabel: "master cinephile cut", accent: "text-amber-300/95" },
      { depth: 1850, label: "CRITERION SECRET ARCHIVE", accent: "text-amber-300/80" },
    ],
    landmarks: [
      { id: "clapper", depth: 100, xRatio: 0.77, title: "Director's Clapper", discoveryLog: "Take 1 (100ft): black-and-white slate snapping under stage lights.", zone: "Premiere Lobby" },
      { id: "popcorn", depth: 165, xRatio: 0.75, title: "Midnight Popcorn & 3D", discoveryLog: "Matinee Row (165ft): retro red-cyan cinema glasses glinting.", zone: "Matinee Screen" },
      { id: "projector", depth: 285, xRatio: 0.23, title: "35mm Twin Projector", discoveryLog: "Booth Cone (285ft): carbon-arc projector beam slicing through haze!", zone: "Projection Booth" },
      { id: "walkstar", depth: 520, xRatio: 0.75, title: "Walk of Fame Star", discoveryLog: "Boulevard Tile (520ft): brass terrazzo star polished to a shine.", zone: "Festival Alley" },
      { id: "scifi", depth: 980, xRatio: 0.24, title: "Drive-In Saucer Classic", discoveryLog: "B-Movie Vault (980ft): practical miniature saucer glowing neon.", zone: "Cult Midnight" },
      { id: "oscar", depth: 1680, xRatio: 0.75, title: "Golden Statuette", discoveryLog: "Academy Archive (1,680ft): gleaming art-deco gold trophy.", zone: "Criterion Vault" },
    ],
    tiers: {
      miss: { title: "LEFT ON CUTTING FLOOR", tagline: "Scene wrapped before your cue." },
      low: { title: "BOX OFFICE CLICHÉ", tagline: "Everyone saw that opening weekend!" },
      mid: { title: "MATINEE PICK", tagline: "Good taste beyond the posters." },
      high: { title: "FESTIVAL JURY", tagline: "Deep cinephile script recall!" },
      rare: { title: "PALME D'OR GEM", tagline: "Archival Criterion masterpiece!" },
    },
  },

  stadium: {
    hudMetricTitle: "SPLIT DISTANCE",
    unitPrefix: "",
    unitSuffix: "m",
    submitVerb: "SPRINT",
    promptHintText: "historic sleeper champions sprint further ahead",
    nextDiveLabel: "NEXT EVENT →",
    stageAriaLabel: "Interactive Krillion Sports Stadium Canvas",
    actionDescendLabel: "NEXT HEAT ▼",
    sinkingVerb: "Sprinting down Olympic lanes...",
    scanPromptLabel: "Click track for photo-finish flash",
    specimens: [
      "Olympic Gold Disc",
      "Checkered Flag Spark",
      "Photo-Finish Chronometer",
      "Fastest Lap Split",
      "Champion Laurel Wreath",
    ],
    markers: [
      { depth: 100, label: "WARMUP HEAT · 10", sublabel: "cover-athlete trap", accent: "text-rose-300/80" },
      { depth: 240, label: "quarterfinal straightaway", accent: "text-sky-200/65" },
      { depth: 360, label: "CONTENDER SPLIT · 35", sublabel: "podium challenger", accent: "text-cyan-300/85" },
      { depth: 700, label: "MEDALIST RECORD · 70", sublabel: "historic stat cut", accent: "text-sky-300/90" },
      { depth: 1000, label: "OLYMPIC LEGEND · 100", sublabel: "unbroken deep-cut mark", accent: "text-amber-300/95" },
      { depth: 1850, label: "IMMORTAL GOAT PANTHEON", accent: "text-amber-300/80" },
    ],
    landmarks: [
      { id: "hurdles", depth: 100, xRatio: 0.77, title: "Track Hurdles & Blocks", discoveryLog: "Lane 4 (100m): crimson sprint lane ready for the starter pistol.", zone: "Heat Qualifier" },
      { id: "torch", depth: 165, xRatio: 0.75, title: "Olympic Flame Relay", discoveryLog: "Cauldron Flame (165m): golden torch embers lighting up the stadium.", zone: "Opening Track" },
      { id: "tennis", depth: 290, xRatio: 0.23, title: "Center Court Volley", discoveryLog: "Grand Slam Turf (290m): optic-yellow ball arcing over center net.", zone: "Grand Slam" },
      { id: "f1car", depth: 560, xRatio: 0.74, title: "Turbo F1 Racer", discoveryLog: "Apex Chicane (560m): titanium sparks flying off championship tarmac!", zone: "Motorsport Pit" },
      { id: "podium", depth: 1120, xRatio: 0.25, title: "1st Place Gold Podium", discoveryLog: "Medal Ceremony (1,120m): triple-tier gold podium illuminated.", zone: "World Podium" },
      { id: "worldcup", depth: 1850, xRatio: 0.74, title: "Immortal GOAT Trophy", discoveryLog: "All-Sports Vault (1,850m): eternal championship chalice.", zone: "GOAT Pantheon" },
    ],
    tiers: {
      miss: { title: "FALSE START!", tagline: "Clock beat you off the blocks." },
      low: { title: "COVER ATHLETE TRAP", tagline: "On every cereal box and billboard!" },
      mid: { title: "FINALIST SPLIT", tagline: "Clean podium contender pick." },
      high: { title: "MEDALIST SLEEPER", tagline: "Deep sports almanac memory!" },
      rare: { title: "OLYMPIC LEGEND", tagline: "All-time historic rarity gold!" },
    },
  },
};

export function getWorldThemeMeta(themeId: ThemeVariant, isReverse: boolean): WorldThemeMeta {
  if (isReverse) return WORLD_THEMES_META.sky;
  return WORLD_THEMES_META[themeId] ?? WORLD_THEMES_META.abyss;
}

export function getZoneNarrative(
  depth: number,
  isReverse: boolean,
  themeId: ThemeVariant = "abyss",
): { zone: string; hint: string } {
  const meta = getWorldThemeMeta(themeId, isReverse);
  const list = meta.landmarks;
  let closest = list[0];
  let minDiff = Infinity;
  for (const lm of list) {
    const diff = Math.abs(lm.depth - depth);
    if (diff < minDiff) {
      minDiff = diff;
      closest = lm;
    }
  }
  return {
    zone: closest.zone,
    hint: `${closest.title} (${meta.unitPrefix}${closest.depth.toLocaleString()}${meta.unitSuffix})`,
  };
}
