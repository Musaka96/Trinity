import { Chatter, Model, ShiftId, Transaction, shiftFromRange } from "./types";

/**
 * TEMPORARY demo data for the transaction-level report.
 *
 * Generated deterministically at runtime (never written to the database) so the
 * spender screens are populated before a real transaction export exists. As soon
 * as transactions are imported, the real ones replace this set entirely.
 *
 * Shape mirrors the infloww report: Date & time · Employee · Creator · Fan · Earnings.
 */

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  "Harrison", "John", "Marc", "Devin", "Nick", "jannick", "Tom", "Alex", "Brian", "Chris",
  "Daniel", "Ethan", "Frank", "Greg", "Henry", "Ian", "Jake", "Kevin", "Liam", "Mason",
  "Noah", "Oliver", "Peter", "Quinn", "Ryan", "Sam", "Tyler", "Victor", "Wyatt", "Zach",
  "Aaron", "Blake", "Cole", "Derek", "Eli", "Finn", "Gabe", "Hugo", "Isaac", "Jonah",
  "Keith", "Logan", "Miles", "Nate", "Owen", "Paul", "Reed", "Shane", "Trent", "Wade",
];
const TAGS = ["Michigan", "NYC", "Texas", "UK", "CA", "Chicago", "Miami", "Boston", "Denver", "Seattle"];

/** Names styled like the real report: plain, tagged, and "big spender" markers. */
function fanName(rng: () => number, i: number): string {
  const base = FIRST[i % FIRST.length];
  const roll = rng();
  if (roll < 0.12) return `$$ ${base}/CUSTOM`;
  if (roll < 0.24) return `${base} | ${TAGS[Math.floor(rng() * TAGS.length)]}`;
  if (roll < 0.32) return base.toLowerCase();
  if (roll < 0.44) return `${base}${Math.floor(rng() * 900 + 100)}`;
  return base;
}

/** Power-law pick: lower indices are much more likely (a few dominate). */
function weightedIndex(rng: () => number, n: number, skew = 1.7): number {
  return Math.min(n - 1, Math.floor(Math.pow(rng(), skew) * n));
}

type Tier = "whale" | "mid" | "small";

/**
 * Sale "product types" are encoded in the cents, mirroring how agencies tag
 * sales in infloww: e.g. .09 = mass-message PPV (MMPPV), .04 = custom.
 */
const SALE_TYPES = [
  { cents: 9, weight: 0.3 }, // MMPPV (mass message PPV)
  { cents: 4, weight: 0.12 }, // custom
  { cents: 0, weight: 0.4 }, // standard PPV / tip
  { cents: -1, weight: 0.18 }, // misc — random cents
] as const;

function saleCents(rng: () => number): number {
  let r = rng();
  for (const s of SALE_TYPES) {
    if (r < s.weight) return s.cents === -1 ? Math.floor(rng() * 100) : s.cents;
    r -= s.weight;
  }
  return 0;
}

function baseDollars(rng: () => number, tier: Tier): number {
  if (tier === "whale") return [99, 149, 198, 199, 249, 299][Math.floor(rng() * 6)];
  if (tier === "mid") return [11, 15, 20, 25, 30, 45, 60][Math.floor(rng() * 7)];
  return [3, 5, 6, 8, 10, 12][Math.floor(rng() * 6)];
}

function amountFor(rng: () => number, tier: Tier): number {
  return +(baseDollars(rng, tier) + saleCents(rng) / 100).toFixed(2);
}

/** Evening/night weighted, like real chatting traffic. */
function hourFor(rng: () => number): number {
  const buckets = [
    [20, 24, 0.34],
    [12, 20, 0.33],
    [4, 12, 0.2],
    [0, 4, 0.13],
  ] as const;
  let r = rng();
  for (const [lo, hi, w] of buckets) {
    if (r < w) return lo + Math.floor(rng() * (hi - lo));
    r -= w;
  }
  return 21;
}

export interface DemoInput {
  /** Ordered by sales desc so the busiest chatters dominate, as in reality. */
  chatters: Chatter[];
  models: Model[];
  dates: string[];
}

export function generateDemoTransactions({ chatters, models, dates }: DemoInput): Transaction[] {
  if (!chatters.length || !models.length || !dates.length) return [];
  const rng = mulberry32(20260724);

  // Build a fan pool; each fan mostly spends on one model.
  const FAN_COUNT = 420;
  const fans = Array.from({ length: FAN_COUNT }, (_, i) => {
    const r = rng();
    const tier: Tier = r < 0.07 ? "whale" : r < 0.4 ? "mid" : "small";
    const name = fanName(rng, i);
    return {
      id: `fan_${i.toString(36)}`,
      name,
      tier,
      modelIdx: weightedIndex(rng, models.length, 1.4),
    };
  });

  const TARGET = 3200;
  const out: Transaction[] = [];

  for (let i = 0; i < TARGET; i++) {
    const fan = fans[weightedIndex(rng, fans.length, fans.length > 100 ? 1.5 : 1)];
    const model = models[fan.modelIdx];
    const chatter = chatters[weightedIndex(rng, chatters.length, 2.1)];
    const date = dates[Math.floor(rng() * dates.length)];
    const hour = hourFor(rng);
    const minute = Math.floor(rng() * 60);
    const datetime = `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`;
    const shift: ShiftId = shiftFromRange(hour, false);

    out.push({
      id: `demo_txn_${i.toString(36)}`,
      datetime,
      date,
      shift,
      chatterId: chatter.id,
      chatterName: chatter.name,
      group: chatter.group,
      creator: model.id,
      platform: model.platform,
      tier: model.tier,
      fanId: fan.id,
      fanName: fan.name,
      earnings: amountFor(rng, fan.tier),
    });
  }

  return out.sort((a, b) => b.datetime.localeCompare(a.datetime));
}
