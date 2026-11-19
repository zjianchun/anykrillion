#!/usr/bin/env node
/**
 * scripts/sync_daily_orbs.mjs
 *
 * Fetches today's public Daily Orbs board metadata from api.dailyorbs.com/api/game-day,
 * strips inline display markup, synthesizes original spoiler-free 3-tier hints,
 * and writes src/data/daily_orbs_hints.json (with idempotency & rolling 30-day archive).
 *
 * Usage:
 *   node scripts/sync_daily_orbs.mjs
 *   node scripts/sync_daily_orbs.mjs --ping-indexnow
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.join(ROOT_DIR, "src/data/daily_orbs_hints.json");
const INDEXNOW_KEY_FILE = path.join(ROOT_DIR, "public/indexnow-key.txt");

const GAME_DAY_URL = "https://api.dailyorbs.com/api/game-day";
const DOMAIN = "anykrillion.com";
const TARGET_PAGE_URL = `https://${DOMAIN}/daily-orbs-hint/`;
const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
];
const ORB_COLORS = ["orange", "purple", "green", "blue"];
const KNOWN_FORMATS = new Set([
  "bijection",
  "categorization",
  "themed",
  "open-ended",
  "long-list",
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(url, retries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "user-agent": "AnyKrillion-DailyOrbs-Sync/1.0 (+https://anykrillion.com)",
          accept: "application/json",
        },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        const bodyPreview = await res.text().catch(() => "");
        const err = new Error(`HTTP ${res.status} from ${url}: ${bodyPreview.slice(0, 200)}`);
        if (res.status >= 500 && attempt < retries) {
          lastError = err;
          await sleep(1500 * (attempt + 1));
          continue;
        }
        throw err;
      }
      return await res.json();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
    }
  }
  throw lastError;
}

/**
 * Removes Daily Orbs custom template tokens and markdown links cleanly
 * without leaving raw braces or hotlinked asset URLs.
 */
function cleanInlineMarkup(raw) {
  if (raw === null || raw === undefined) return "";
  let s = String(raw);

  // [label ↗](url) or [label](url) -> label
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // {{dim:Text}} -> (Text)
  s = s.replace(/\{\{dim:([\s\S]*?)\}\}/g, (_m, inner) => {
    const cleaned = inner.replace(/\\\|/g, "|").trim();
    return cleaned ? ` (${cleaned})` : "";
  });

  // {{img:path|Alt Text|styles}} -> Alt Text (or cleaned basename)
  s = s.replace(/\{\{img:([^|}]+)(?:\|([^|}]*))?(?:\|[^}]*)?\}\}/g, (_m, imgPath, alt) => {
    const label = (alt || "").replace(/\\\|/g, "|").trim();
    if (label) return label;
    const base = path.basename(String(imgPath || ""), path.extname(String(imgPath || "")));
    return base.replace(/[-_]+/g, " ").trim();
  });

  // {{flag:XX}} -> XX
  s = s.replace(/\{\{flag:([^}]+)\}\}/g, (_m, code) => String(code || "").trim().toUpperCase());

  // {{animal:...}}, {{sport:...}}, {{exchange:...}}, {{ans:...}}
  s = s.replace(
    /\{\{(?:animal|sport|exchange|ans):([^}]+)\}\}/g,
    (_m, inner) => String(inner || "").replace(/\\\|/g, "|").replace(/[-_]+/g, " ").trim()
  );

  // Any remaining {{tag:value}} fallback
  s = s.replace(/\{\{[^:}]+:([^}]+)\}\}/g, (_m, val) => String(val || "").replace(/\\\|/g, "|").trim());
  s = s.replace(/\{\{|\}\}/g, "");

  // Clean stray arrows or whitespace
  s = s.replace(/\s*↗/g, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function answerStringOf(entry) {
  if (typeof entry === "string") return cleanInlineMarkup(entry);
  if (entry && typeof entry === "object") {
    const candidate = entry.name ?? entry.answer ?? entry.text ?? entry.title ?? entry.display ?? "";
    return cleanInlineMarkup(candidate);
  }
  return "";
}

function makeClueMask(answerText) {
  const cleaned = String(answerText || "").trim();
  if (!cleaned) return "Hidden";

  const words = cleaned.split(/\s+/).filter(Boolean);
  const maskedWords = words.map((word) => {
    // Keep leading punctuation if any, reveal first alphanumeric char
    const match = /^([^A-Za-z0-9]*)([A-Za-z0-9])(.*)$/.exec(word);
    if (!match) return "_".repeat(Math.min(word.length, 6));
    const [, prefix, first, rest] = match;
    const hiddenRest = rest
      .split("")
      .map((ch) => (/[A-Za-z0-9]/.test(ch) ? "_" : ch))
      .join("");
    return `${prefix}${first}${hiddenRest}`;
  });

  const lettersCount = cleaned.replace(/\s+/g, "").length;
  const meta =
    words.length > 1
      ? `${words.length} words, ${lettersCount} chars`
      : `${lettersCount} chars`;
  return `${maskedWords.join(" ")} (${meta})`;
}

function normalizeThresholds(raw) {
  if (Array.isArray(raw) && raw.length >= 3) {
    const nums = raw.slice(0, 3).map((n) => Math.max(1, Math.round(Number(n) || 1)));
    return [nums[0], Math.max(nums[0] + 1, nums[1]), Math.max(nums[1] + 1, nums[2])];
  }
  return [2, 5, 9];
}

function normalizeContext(rawContext) {
  if (typeof rawContext === "string" && rawContext.trim()) {
    return rawContext.trim().toLowerCase();
  }
  if (rawContext && typeof rawContext === "object" && typeof rawContext.base === "string") {
    return rawContext.base.trim().toLowerCase();
  }
  return "general";
}

function topLetterSummary(items) {
  const counts = new Map();
  for (const item of items) {
    const m = /[A-Za-z0-9]/.exec(item);
    if (!m) continue;
    const ch = m[0].toUpperCase();
    counts.set(ch, (counts.get(ch) || 0) + 1);
  }
  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3);
  if (!top.length) return "Diverse initial letters across valid answers.";
  return `Top starting letters: ${top.map(([ch, n]) => `${ch} (${n})`).join(", ")}.`;
}

function endWithPeriod(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return "";
  return /[.!?…]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function synthesizePuzzle(color, raw) {
  const rawFormat = String(raw.type || "other");
  const format = KNOWN_FORMATS.has(rawFormat) ? rawFormat : "other";
  const thresholds = normalizeThresholds(raw.starThresholds);
  const title = cleanInlineMarkup(raw.title) || `${color.toUpperCase()} Puzzle`;
  const prompt = cleanInlineMarkup(raw.description) || `Solve today's ${color} board.`;
  const context = normalizeContext(raw.context);
  const topics = Array.isArray(raw.topics)
    ? raw.topics.map((t) => cleanInlineMarkup(t)).filter(Boolean)
    : [];

  const [orb1, orb2, orb3] = thresholds;

  if (format === "bijection") {
    const rawPairs = Array.isArray(raw.pairs) ? raw.pairs : [];
    const pairs = rawPairs
      .map((p) => ({
        label: cleanInlineMarkup(p.itemA),
        answer: cleanInlineMarkup(p.itemB),
      }))
      .filter((p) => p.label && p.answer);

    const rows = pairs.map((p) => ({
      label: p.label,
      clueMask: makeClueMask(p.answer),
      answer: p.answer,
    }));

    const colA = cleanInlineMarkup(raw.columnA) || "Prompt";
    const colB = cleanInlineMarkup(raw.columnB) || "Match";
    const totalCount = pairs.length;
    const anchorPair = pairs[0] ? `${pairs[0].label} -> ${pairs[0].answer}` : "";

    const hint1 = `One-to-one matching board (${totalCount} pairs linking ${colA} to ${colB}). Lock your highest-confidence pairs first to shrink the pool; ${orb1} correct earns 1 Orb, ${orb2} earns 2 Orbs, and ${orb3} reaches 3 Orbs with a 3-heart allowance.`;
    const hint2 = anchorPair
      ? endWithPeriod(
          `Every ${colA} item maps to exactly one ${colB} option. Eliminate confident pairs early to force remaining bottlenecks. Verified starter anchor: ${anchorPair}`
        )
      : `Every ${colA} item maps to exactly one ${colB} option. Focus on unambiguous pairings before risking a heart on close pairs.`;

    return {
      color,
      id: String(raw.id || `${color}-puzzle`),
      title,
      format,
      context,
      topics,
      prompt,
      starThresholds: thresholds,
      totalCount,
      columnA: colA,
      columnB: colB,
      hint1,
      hint2,
      starterAnchor: anchorPair || "Open Clue masks below for starter help.",
      rows,
    };
  }

  if (format === "categorization") {
    const rawCats = Array.isArray(raw.categories)
      ? raw.categories.map((c) => cleanInlineMarkup(c)).filter(Boolean)
      : [];
    const rawItems = Array.isArray(raw.items) ? raw.items : [];
    const cleanedItems = rawItems
      .map((item) => ({
        text: cleanInlineMarkup(item.text),
        category: cleanInlineMarkup(item.category),
      }))
      .filter((item) => item.text && item.category);

    const catOrder = [...rawCats];
    for (const item of cleanedItems) {
      if (!catOrder.includes(item.category)) catOrder.push(item.category);
    }

    const categories = catOrder.map((name) => {
      const items = cleanedItems.filter((i) => i.category === name).map((i) => i.text);
      return { name, count: items.length, items };
    });

    const rows = cleanedItems.map((item) => ({
      label: item.text,
      clueMask: makeClueMask(item.category),
      answer: item.category,
    }));

    const totalCount = cleanedItems.length;
    const distribution = categories.map((c) => `${c.name} (${c.count})`).join(", ");
    const bucketAnchors = categories
      .filter((c) => c.items.length > 0)
      .map((c) => `${c.name}: "${c.items[0]}"`)
      .join(" | ");

    const hint1 = `Sorting board with ${totalCount} items split into ${categories.length} buckets (${catOrder.join(" / ")}). Reaching ${orb1}, ${orb2}, and ${orb3} correct sorts earns 1, 2, and 3 Orbs—place boundary items last so your 3 hearts survive.`;
    const hint2 = `Exact bucket split: ${distribution}. Starter anchor for each bucket -> ${bucketAnchors || "expand Clue masks below"}.`;

    return {
      color,
      id: String(raw.id || `${color}-puzzle`),
      title,
      format,
      context,
      topics,
      prompt,
      starThresholds: thresholds,
      totalCount,
      categories,
      hint1,
      hint2,
      starterAnchor: bucketAnchors || "Use per-row clues below.",
      rows,
    };
  }

  if (format === "themed") {
    const rawClues = Array.isArray(raw.clues) ? raw.clues : [];
    const rows = [];
    for (const clue of rawClues) {
      const clueLabel = cleanInlineMarkup(clue.hint ?? clue.prompt ?? clue.title ?? `Clue #${rows.length + 1}`);
      const answers = Array.isArray(clue.answers)
        ? clue.answers.map(answerStringOf).filter(Boolean)
        : [];
      const topAnswer = answers[0] || "";
      if (!clueLabel && !topAnswer) continue;
      const joined = answers.slice(0, 3).join(" / ") || topAnswer;
      rows.push({
        label: clueLabel || `Clue #${rows.length + 1}`,
        clueMask: makeClueMask(topAnswer || joined),
        answer: joined,
      });
    }

    const totalCount = rows.length;
    const starterAnchor = rows[0] ? `${rows[0].label} -> ${rows[0].answer}` : "Reveal Row #1 below.";
    const topicLabel = topics.length ? topics.join(", ") : context;

    return {
      color,
      id: String(raw.id || `${color}-puzzle`),
      title,
      format,
      context,
      topics,
      prompt,
      starThresholds: thresholds,
      totalCount,
      hint1: `Themed clue board (${totalCount} clues around ${topicLabel}). Milestones sit at ${orb1} / ${orb2} / ${orb3} solved clues with 3 hearts. Knock out clear literal matches before tackling wordplay.`,
      hint2: endWithPeriod(
        `Focus closely on each clue's exact constraint rather than loose associations. Starter anchor: ${starterAnchor}`
      ),
      starterAnchor,
      rows,
    };
  }

  if (format === "open-ended" || format === "long-list") {
    const rawAnswers = Array.isArray(raw.answers) ? raw.answers : [];
    const answers = rawAnswers.map(answerStringOf).filter(Boolean);
    const totalCount = answers.length;
    const capped = answers.slice(0, 60);
    const rows = capped.map((ans, idx) => ({
      label: `Valid Pick #${idx + 1}`,
      clueMask: makeClueMask(ans),
      answer: ans,
    }));

    const anchor = answers[0] || "";
    const noHeartsNote =
      format === "long-list"
        ? "Long-list board: wrong guesses do not lose hearts, so test clean recall freely toward your milestones."
        : "Open-ended board with 3 hearts: confirm spelling carefully before hitting submit.";

    return {
      color,
      id: String(raw.id || `${color}-puzzle`),
      title,
      format,
      context,
      topics,
      prompt,
      starThresholds: thresholds,
      totalCount,
      hint1: `${noHeartsNote} Collect ${orb1} answers for 1 Orb, ${orb2} for 2 Orbs, and ${orb3} for all 3 Orbs (${totalCount} valid targets exist).`,
      hint2: endWithPeriod(`${topLetterSummary(answers)} Safe starter answer: ${anchor || "open clues below"}`),
      starterAnchor: anchor || "Reveal a row clue below.",
      rows,
    };
  }

  // Fallback for unforeseen future formats
  const fallbackRows = [];
  if (Array.isArray(raw.pairs)) {
    for (const p of raw.pairs.slice(0, 40)) {
      const a = cleanInlineMarkup(p.itemA);
      const b = cleanInlineMarkup(p.itemB);
      if (a || b) fallbackRows.push({ label: a || "Item", clueMask: makeClueMask(b), answer: b });
    }
  } else if (Array.isArray(raw.items)) {
    for (const it of raw.items.slice(0, 40)) {
      const t = cleanInlineMarkup(it.text || it.name);
      const c = cleanInlineMarkup(it.category || it.answer);
      if (t) fallbackRows.push({ label: t, clueMask: makeClueMask(c || t), answer: c || t });
    }
  } else if (Array.isArray(raw.answers)) {
    for (const a of raw.answers.slice(0, 40)) {
      const ans = answerStringOf(a);
      if (ans) {
        fallbackRows.push({
          label: `Entry #${fallbackRows.length + 1}`,
          clueMask: makeClueMask(ans),
          answer: ans,
        });
      }
    }
  }

  return {
    color,
    id: String(raw.id || `${color}-puzzle`),
    title,
    format: "other",
    context,
    topics,
    prompt,
    starThresholds: thresholds,
    totalCount: fallbackRows.length,
    hint1: `Collect ${orb1}, ${orb2}, and ${orb3} verified matches to earn 1, 2, or 3 Orbs.`,
    hint2: fallbackRows[0]
      ? `Starter anchor: ${fallbackRows[0].label} -> ${fallbackRows[0].answer}.`
      : "Use the expandable clues below step by step.",
    starterAnchor: fallbackRows[0]?.answer || "Check clues below.",
    rows: fallbackRows,
  };
}

function normalizeForCompare(board) {
  if (!board) return null;
  return {
    date: board.date,
    puzzles: board.puzzles,
  };
}

function readExistingDataset() {
  if (!fs.existsSync(OUTPUT_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
  } catch {
    return null;
  }
}

async function pingIndexNow() {
  if (!fs.existsSync(INDEXNOW_KEY_FILE)) {
    console.warn(`[indexnow] Missing key file: ${INDEXNOW_KEY_FILE}; skipping.`);
    return;
  }
  const key = fs.readFileSync(INDEXNOW_KEY_FILE, "utf-8").trim();
  if (!key) {
    console.warn("[indexnow] Empty indexnow-key.txt; skipping.");
    return;
  }
  const keyLocation = `https://${DOMAIN}/${key}.txt`;
  const payload = {
    host: DOMAIN,
    key,
    keyLocation,
    urlList: [TARGET_PAGE_URL],
  };

  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json; charset=utf-8",
          "user-agent": "AnyKrillion-IndexNow/1.0",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      });
      console.log(`[indexnow] POST ${endpoint} -> HTTP ${res.status}`);
    } catch (err) {
      console.warn(`[indexnow] Warning contacting ${endpoint}: ${err.message}`);
    }
  }
}

async function syncDailyOrbs() {
  console.log(`[sync] Fetching ${GAME_DAY_URL}...`);
  const payload = await fetchJsonWithRetry(GAME_DAY_URL, 2);

  const todayKey = payload?.todayKey;
  if (typeof todayKey !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(todayKey)) {
    throw new Error(`Invalid todayKey in response: ${JSON.stringify(todayKey)}`);
  }

  const rawPuzzles = payload?.puzzles;
  if (!rawPuzzles || typeof rawPuzzles !== "object") {
    throw new Error("Missing puzzles object in Daily Orbs response");
  }

  const puzzles = [];
  for (const color of ORB_COLORS) {
    const rawPuzzle = rawPuzzles[color];
    if (!rawPuzzle || typeof rawPuzzle !== "object") {
      throw new Error(`Missing required puzzle color "${color}" for ${todayKey}`);
    }
    puzzles.push(synthesizePuzzle(color, rawPuzzle));
  }

  const nowIso = new Date().toISOString();
  const nextRolloverUtc =
    typeof payload.nextRollover === "string" && payload.nextRollover
      ? payload.nextRollover
      : `${todayKey}T10:00:00.000Z`;

  const newToday = {
    date: todayKey,
    nextRolloverUtc,
    fetchedAt: nowIso,
    puzzles,
  };

  const existing = readExistingDataset();
  if (
    existing?.today &&
    JSON.stringify(normalizeForCompare(existing.today)) ===
      JSON.stringify(normalizeForCompare(newToday))
  ) {
    console.log(`Already up to date for ${todayKey}`);
    return;
  }

  const archiveMap = new Map();
  if (existing?.today?.date && existing.today.date !== todayKey) {
    archiveMap.set(existing.today.date, existing.today);
  }
  if (Array.isArray(existing?.archive)) {
    for (const item of existing.archive) {
      if (item?.date && item.date !== todayKey && !archiveMap.has(item.date)) {
        archiveMap.set(item.date, item);
      }
    }
  }

  const archive = [...archiveMap.values()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 29);

  const dataset = {
    updatedAt: nowIso,
    today: newToday,
    archive,
  };

  const serialized = JSON.stringify(dataset, null, 2) + "\n";
  if (/\{\{|\}\}/.test(serialized)) {
    throw new Error("Sanity check failed: uncleaned {{...}} template tokens remained in output JSON.");
  }

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, serialized, "utf-8");
  console.log(
    `[sync] Wrote ${OUTPUT_FILE} for ${todayKey} (${puzzles.map((p) => `${p.color}:${p.format}`).join(", ")}; archive=${archive.length})`
  );
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has("--ping-indexnow")) {
    await pingIndexNow();
    return;
  }
  await syncDailyOrbs();
}

main().catch((err) => {
  console.error(`[sync] ERROR: ${err?.stack || err}`);
  process.exit(1);
});
