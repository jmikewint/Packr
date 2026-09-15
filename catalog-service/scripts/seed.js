// One-off seed script - NOT part of the running app, not imported by index.js.
//
// Fetches real Pokémon TCG cards from the free pokemontcg.io API and inserts
// them directly into catalog-service's database via Prisma, bypassing the
// HTTP CRUD API entirely (much faster for a bulk insert, and doesn't need
// the server running).
//
// Usage (from catalog-service/):
//   node scripts/seed.js
//   npm run seed
//
// pokemontcg.io needs no API key for this volume (free tier: 1,000
// requests/day) but is noticeably flaky in practice - an otherwise-valid
// request will occasionally 500 for no evident reason. Every request here
// retries with backoff; a set that still fails is skipped rather than
// aborting the whole run.

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const API_BASE = "https://api.pokemontcg.io/v2/cards";

// Vintage -> modern, so the seeded catalog spans real eras and the full
// rarity spectrum (Common through Secret/Hyper Rare), not just one look.
const SET_IDS = ["base1", "jungle", "swsh12", "sv3pt5"];
const CARDS_PER_SET = 12;

const CONDITIONS = ["MINT", "NEAR_MINT", "LIGHTLY_PLAYED", "DAMAGED"];
// Most marketplace listings skew toward better condition - not a uniform draw.
const CONDITION_WEIGHTS = [0.3, 0.35, 0.25, 0.1];

// Made-up prices, scaled by rarity tier so the catalog "feels" right
// (cheap commons, expensive chase cards) rather than uniformly random.
const PRICE_RANGES = {
  COMMON: [0.25, 1.5],
  UNCOMMON: [0.5, 3],
  RARE: [2, 15],
  ULTRA_RARE: [10, 60],
  SECRET_RARE: [30, 250],
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, { retries = 4, baseDelayMs = 1000 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "packr-seed-script/1.0" } });
      if (res.ok) return res.json();
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    if (attempt < retries) {
      const delay = baseDelayMs * 2 ** attempt;
      console.warn(`  request failed (${lastErr.message}), retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

async function fetchSetCards(setId) {
  const url = `${API_BASE}?q=${encodeURIComponent(`set.id:${setId}`)}&pageSize=250`;
  const json = await fetchWithRetry(url);
  return json.data || [];
}

// pokemontcg.io's `rarity` field is a much finer-grained, era-specific
// vocabulary than our 5-value enum ("Rare Holo VMAX", "Special Illustration
// Rare", "Rare Shining", ...). Bucket by keyword, rarest-tier first, so a
// more-specific match (e.g. "Special Illustration Rare") wins over a
// coarser one (e.g. the generic "illustration" -> ULTRA_RARE check).
function mapRarity(pokemonRarity) {
  const r = (pokemonRarity || "").toLowerCase();

  const secret = ["secret", "rainbow", "hyper", "shiny", "gold", "special illustration"];
  const ultra = [
    "ultra", "double rare", "illustration", "vmax", "vstar", "gx", "-ex", " ex",
    "break", "amazing", "radiant", "ace spec", "legend", "prime", "star",
  ];
  const uncommon = ["uncommon"];
  const rare = ["rare", "promo"];

  if (secret.some((p) => r.includes(p))) return "SECRET_RARE";
  if (ultra.some((p) => r.includes(p))) return "ULTRA_RARE";
  if (uncommon.some((p) => r.includes(p))) return "UNCOMMON";
  if (rare.some((p) => r.includes(p))) return "RARE";
  return "COMMON"; // "Common", a missing rarity (some Energy cards), or anything unrecognized
}

function pickCondition() {
  const roll = Math.random();
  let cumulative = 0;
  for (let i = 0; i < CONDITIONS.length; i++) {
    cumulative += CONDITION_WEIGHTS[i];
    if (roll <= cumulative) return CONDITIONS[i];
  }
  return CONDITIONS[CONDITIONS.length - 1];
}

function randomPrice(rarity) {
  const [min, max] = PRICE_RANGES[rarity];
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function toCardRecord(pokemonCard) {
  const rarity = mapRarity(pokemonCard.rarity);
  return {
    name: pokemonCard.name,
    set: pokemonCard.set?.name || "Unknown Set",
    rarity,
    condition: pickCondition(),
    price: randomPrice(rarity),
    imageUrl: pokemonCard.images?.large || pokemonCard.images?.small || null,
  };
}

async function main() {
  const records = [];

  for (const setId of SET_IDS) {
    console.log(`Fetching set "${setId}"...`);
    let cards;
    try {
      cards = await fetchSetCards(setId);
    } catch (err) {
      console.warn(`  skipping "${setId}" - fetch failed after retries: ${err.message}`);
      continue;
    }
    if (cards.length === 0) {
      console.warn(`  skipping "${setId}" - no cards returned`);
      continue;
    }

    // Full sets are printed rarest-first (vintage) or grouped by rarity
    // (modern) - take the first N in print order and we'd get all holo
    // rares or all commons. Shuffle first for a realistic rarity mix.
    const sample = shuffle(cards).slice(0, CARDS_PER_SET);
    console.log(`  got ${cards.length} cards total, sampling ${sample.length}`);
    records.push(...sample.map(toCardRecord));
  }

  if (records.length === 0) {
    throw new Error("No cards were fetched from any set - aborting without touching the database.");
  }

  console.log(`\nInserting ${records.length} cards into catalog-service's database...`);
  const result = await prisma.card.createMany({ data: records });
  console.log(`Done - inserted ${result.count} cards.`);

  const byRarity = records.reduce((acc, c) => {
    acc[c.rarity] = (acc[c.rarity] || 0) + 1;
    return acc;
  }, {});
  console.log("Rarity breakdown:", byRarity);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
