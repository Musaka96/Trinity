import {
  Chatter,
  Model,
  Platform,
  SalesRecord,
  SHIFTS,
  ShiftId,
} from "./types";

/**
 * Deterministic seeded data so server and client render identically
 * (no hydration mismatch) and numbers are stable across reloads.
 * Replace this whole module with the real inflow import later — the
 * rest of the app only consumes the exported arrays + selectors.
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

const rng = mulberry32(20260723);
const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
const between = (min: number, max: number) => min + rng() * (max - min);
const intBetween = (min: number, max: number) => Math.floor(between(min, max + 1));

const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}`;

// ---- Models ---------------------------------------------------------------

const MODEL_NAMES = [
  "Aurora Vale", "Luna Reyes", "Scarlett Fox", "Mia Sinclair", "Ivy Bloom",
  "Nova Sterling", "Ruby Lane", "Chloe Marsh", "Sienna Vaughn", "Bella Knight",
  "Jade Rivers", "Violet Hale", "Skye Monroe", "Ember Wolfe", "Daisy Quinn",
];
const PLATFORMS: Platform[] = ["OnlyFans", "Fansly", "Fanvue"];
const MODEL_TAGS = ["VIP", "GFE", "Fitness", "Cosplay", "Premium", "New", "Top 1%"];

export const models: Model[] = MODEL_NAMES.map((name, i) => {
  const handle = "@" + name.toLowerCase().replace(/\s+/g, "");
  return {
    id: `mdl_${(i + 1).toString().padStart(2, "0")}`,
    name,
    handle,
    avatar: avatar(name),
    platform: PLATFORMS[i % PLATFORMS.length],
    status: i % 7 === 0 ? "paused" : "active",
    joinedAt: new Date(2024, (i * 3) % 12, 1 + (i % 27)).toISOString().slice(0, 10),
    tags: [pick(MODEL_TAGS), pick(MODEL_TAGS)].filter((v, idx, a) => a.indexOf(v) === idx),
    subscribers: intBetween(1800, 42000),
    subscriptionPrice: pick([4.99, 7.99, 9.99, 12.99, 14.99]),
  };
});

// ---- Chatters -------------------------------------------------------------

const CHATTER_NAMES = [
  "Alex Carter", "Jordan Blake", "Sam Rivera", "Taylor Nguyen", "Morgan Lee",
  "Casey Brooks", "Riley Adams", "Jamie Cole", "Devon Price", "Quinn Foster",
  "Avery Reed", "Parker Hayes", "Rowan Diaz", "Emerson Ward", "Hayden Cruz",
  "Reese Bennett", "Sage Morgan", "Drew Palmer",
];
const TEAMS = ["Alpha", "Bravo", "Nightwatch"];
const LANGS = ["EN", "ES", "FR", "DE", "PT"];

export const chatters: Chatter[] = CHATTER_NAMES.map((name, i) => {
  const defaultShifts: ShiftId[] = [SHIFTS[i % 3].id];
  if (rng() > 0.6) defaultShifts.push(SHIFTS[(i + 1) % 3].id);
  return {
    id: `cht_${(i + 1).toString().padStart(2, "0")}`,
    name,
    avatar: avatar(name),
    status: i % 9 === 0 ? "inactive" : "active",
    hiredAt: new Date(2024, (i * 2) % 12, 1 + (i % 26)).toISOString().slice(0, 10),
    team: TEAMS[i % TEAMS.length],
    languages: [LANGS[0], ...(rng() > 0.6 ? [pick(LANGS.slice(1))] : [])],
    defaultShifts,
  };
});

// ---- Sales records --------------------------------------------------------

const DAYS = 90;
const today = new Date("2026-07-23T00:00:00Z");

function dateNDaysAgo(n: number) {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const activeChatters = chatters.filter((c) => c.status !== "inactive");
const activeModels = models.filter((m) => m.status !== "inactive");

export const salesRecords: SalesRecord[] = (() => {
  const out: SalesRecord[] = [];
  let seq = 0;
  for (let d = DAYS - 1; d >= 0; d--) {
    const date = dateNDaysAgo(d);
    const dow = new Date(date + "T00:00:00Z").getUTCDay();
    const weekendBoost = dow === 5 || dow === 6 ? 1.25 : 1;
    // gentle upward trend over the window
    const trend = 0.8 + (DAYS - d) / DAYS * 0.5;

    for (const shift of SHIFTS) {
      // each shift a subset of chatters is on
      const onShift = activeChatters.filter(
        (c) => c.defaultShifts.includes(shift.id) || rng() > 0.75,
      );
      for (const chatter of onShift) {
        // each chatter covers 1-3 models this shift
        const nModels = intBetween(1, 3);
        const assigned = new Set<string>();
        for (let k = 0; k < nModels; k++) assigned.add(pick(activeModels).id);
        for (const modelId of assigned) {
          const model = activeModels.find((m) => m.id === modelId)!;
          const base = between(120, 900) * weekendBoost * trend;
          const shiftMult = shift.id === "night" ? 1.15 : shift.id === "afternoon" ? 1.05 : 0.85;
          const gross = Math.round(base * shiftMult);
          const net = Math.round(gross * between(0.72, 0.8));
          const ppvSent = intBetween(8, 40);
          const ppvUnlocked = Math.round(ppvSent * between(0.25, 0.6));
          const messagesSent = intBetween(120, 640);
          out.push({
            id: `sal_${(seq++).toString(36)}`,
            date,
            shift: shift.id,
            chatterId: chatter.id,
            modelId,
            net,
            gross,
            ppvSent,
            ppvUnlocked,
            tips: Math.round(net * between(0.08, 0.22)),
            messagesSent,
            fansChatted: intBetween(20, Math.max(21, Math.round(messagesSent / 4))),
          });
        }
      }
    }
  }
  return out;
})();
