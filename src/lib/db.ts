import "server-only";
import postgres from "postgres";
import seedJson from "@/data/seed.json";
import { Dataset, StatRow, Transaction } from "./types";
import { TrinityEvent } from "./events";

/**
 * Postgres persistence (Vercel Postgres / Neon / Supabase / any PG).
 *
 * Reads its connection string from POSTGRES_URL or DATABASE_URL — both are
 * injected automatically when you connect a database to the Vercel project.
 * When neither is set (local dev without a DB), `isConfigured()` is false and
 * the app falls back to browser localStorage.
 */

const CONN = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";

export function isConfigured(): boolean {
  return CONN.length > 0;
}

// Reuse the client across warm serverless invocations.
declare global {
  // eslint-disable-next-line no-var
  var __trinitySql: ReturnType<typeof postgres> | undefined;
}

function getSql() {
  if (!isConfigured()) throw new Error("No database configured (set POSTGRES_URL).");
  if (!global.__trinitySql) {
    global.__trinitySql = postgres(CONN, { prepare: false, max: 1, idle_timeout: 20 });
  }
  return global.__trinitySql;
}

const seed = seedJson as unknown as Dataset;

const ROW_COLS = [
  "key", "date", "shift", "chatter_id", "chatter_name", "group_name", "creator",
  "platform", "tier", "sales", "ppv_sales", "tips", "dm_sales", "dms_sent",
  "ppvs_sent", "ppvs_unlocked", "priority_mass_sales", "of_mass_sales",
  "fans_chatted", "fans_who_spent", "char_count",
] as const;

function toDb(r: StatRow) {
  return {
    key: r.key, date: r.date, shift: r.shift, chatter_id: r.chatterId,
    chatter_name: r.chatterName, group_name: r.group, creator: r.creator,
    platform: r.platform, tier: r.tier, sales: r.sales, ppv_sales: r.ppvSales,
    tips: r.tips, dm_sales: r.dmSales, dms_sent: r.dmsSent, ppvs_sent: r.ppvsSent,
    ppvs_unlocked: r.ppvsUnlocked, priority_mass_sales: r.priorityMassSales,
    of_mass_sales: r.ofMassSales, fans_chatted: r.fansChatted,
    fans_who_spent: r.fansWhoSpent, char_count: r.charCount,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function fromDb(d: any): StatRow {
  return {
    key: d.key, date: d.date, shift: d.shift, chatterId: d.chatter_id,
    chatterName: d.chatter_name, group: d.group_name, creator: d.creator,
    platform: d.platform, tier: d.tier, sales: Number(d.sales),
    ppvSales: Number(d.ppv_sales), tips: Number(d.tips), dmSales: Number(d.dm_sales),
    dmsSent: Number(d.dms_sent), ppvsSent: Number(d.ppvs_sent),
    ppvsUnlocked: Number(d.ppvs_unlocked), priorityMassSales: Number(d.priority_mass_sales),
    ofMassSales: Number(d.of_mass_sales), fansChatted: Number(d.fans_chatted),
    fansWhoSpent: Number(d.fans_who_spent), charCount: Number(d.char_count),
  };
}

const TXN_COLS = [
  "id", "datetime", "date", "shift", "chatter_id", "chatter_name", "group_name",
  "creator", "platform", "tier", "fan_id", "fan_name", "earnings",
] as const;

function toDbTxn(t: Transaction) {
  return {
    id: t.id, datetime: t.datetime, date: t.date, shift: t.shift,
    chatter_id: t.chatterId, chatter_name: t.chatterName, group_name: t.group,
    creator: t.creator, platform: t.platform, tier: t.tier,
    fan_id: t.fanId, fan_name: t.fanName, earnings: t.earnings,
  };
}

function txnFromDb(d: any): Transaction {
  return {
    id: d.id, datetime: d.datetime, date: d.date, shift: d.shift,
    chatterId: d.chatter_id, chatterName: d.chatter_name, group: d.group_name,
    creator: d.creator, platform: d.platform, tier: d.tier,
    fanId: d.fan_id, fanName: d.fan_name, earnings: Number(d.earnings),
  };
}

function eventFromDb(d: any): TrinityEvent {
  return {
    id: d.id, type: d.type, title: d.title, note: d.note ?? undefined,
    date: d.date, endDate: d.end_date ?? undefined, modelId: d.model_id ?? undefined,
    chatterId: d.chatter_id ?? undefined, shift: d.shift ?? undefined, createdAt: d.created_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) schemaReady = initSchema();
  return schemaReady;
}

async function initSchema() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS stat_rows (
      key text PRIMARY KEY,
      date text NOT NULL, shift text NOT NULL,
      chatter_id text NOT NULL, chatter_name text NOT NULL, group_name text NOT NULL,
      creator text NOT NULL, platform text NOT NULL, tier text NOT NULL,
      sales double precision NOT NULL, ppv_sales double precision NOT NULL,
      tips double precision NOT NULL, dm_sales double precision NOT NULL,
      dms_sent integer NOT NULL, ppvs_sent integer NOT NULL, ppvs_unlocked integer NOT NULL,
      priority_mass_sales double precision NOT NULL, of_mass_sales double precision NOT NULL,
      fans_chatted integer NOT NULL, fans_who_spent integer NOT NULL, char_count integer NOT NULL
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id text PRIMARY KEY, type text NOT NULL, title text NOT NULL, note text,
      date text NOT NULL, end_date text, model_id text, chatter_id text, shift text,
      created_at text NOT NULL
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id text PRIMARY KEY,
      datetime text NOT NULL, date text NOT NULL, shift text NOT NULL,
      chatter_id text NOT NULL, chatter_name text NOT NULL, group_name text NOT NULL,
      creator text NOT NULL, platform text NOT NULL, tier text NOT NULL,
      fan_id text NOT NULL, fan_name text NOT NULL,
      earnings double precision NOT NULL
    )`;
  await sql`CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions (date)`;
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key text PRIMARY KEY,
      value jsonb NOT NULL
    )`;
  const [{ count }] = await sql`SELECT count(*)::int AS count FROM stat_rows`;
  if (count === 0 && seed.rows.length) await insertRows(seed.rows);
}

async function insertRows(rows: StatRow[]) {
  const sql = getSql();
  const dbRows = rows.map(toDb);
  const updateSet = ROW_COLS.filter((c) => c !== "key")
    .map((c) => `"${c}" = excluded."${c}"`)
    .join(", ");
  for (let i = 0; i < dbRows.length; i += 500) {
    const chunk = dbRows.slice(i, i + 500);
    await sql`
      INSERT INTO stat_rows ${sql(chunk, ...ROW_COLS)}
      ON CONFLICT (key) DO UPDATE SET ${sql.unsafe(updateSet)}
    `;
  }
}

export async function getDataset(): Promise<{
  rows: StatRow[];
  events: TrinityEvent[];
  transactions: Transaction[];
  settings: Record<string, unknown>;
}> {
  await ensureSchema();
  const sql = getSql();
  const [rows, events, txns, settingsRows] = await Promise.all([
    sql`SELECT * FROM stat_rows ORDER BY date`,
    sql`SELECT * FROM events ORDER BY date DESC`,
    sql`SELECT * FROM transactions ORDER BY datetime DESC`,
    sql`SELECT key, value FROM settings`,
  ]);
  const settings: Record<string, unknown> = {};
  for (const s of settingsRows) settings[s.key] = s.value;
  return {
    rows: rows.map(fromDb),
    events: events.map(eventFromDb),
    transactions: txns.map(txnFromDb),
    settings,
  };
}

/** What the database actually contains — used by /api/health to diagnose saves. */
export async function healthReport() {
  await ensureSchema();
  const sql = getSql();
  const [[stat], [txn], [evt], settingsRows] = await Promise.all([
    sql`SELECT count(*)::int AS c FROM stat_rows`,
    sql`SELECT count(*)::int AS c FROM transactions`,
    sql`SELECT count(*)::int AS c FROM events`,
    sql`SELECT key FROM settings ORDER BY key`,
  ]);
  const keys = settingsRows.map((r) => r.key as string);
  return {
    statRows: stat.c,
    transactions: txn.c,
    events: evt.c,
    settingsKeys: keys,
    ratingsStored: keys.filter((k) => k.startsWith("rating:")).length,
    hasSpendTiers: keys.includes("spend_tiers"),
  };
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`
    INSERT INTO settings (key, value) VALUES (${key}, ${JSON.stringify(value)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = excluded.value
  `;
}

async function insertTxns(txns: Transaction[]) {
  const sql = getSql();
  const dbRows = txns.map(toDbTxn);
  const updateSet = TXN_COLS.filter((c) => c !== "id")
    .map((c) => `"${c}" = excluded."${c}"`)
    .join(", ");
  for (let i = 0; i < dbRows.length; i += 500) {
    const chunk = dbRows.slice(i, i + 500);
    await sql`
      INSERT INTO transactions ${sql(chunk, ...TXN_COLS)}
      ON CONFLICT (id) DO UPDATE SET ${sql.unsafe(updateSet)}
    `;
  }
}

export async function upsertTransactions(
  txns: Transaction[],
): Promise<{ added: number; updated: number; dates: string[] }> {
  await ensureSchema();
  const sql = getSql();
  const ids = txns.map((t) => t.id);
  const existing = ids.length
    ? new Set((await sql`SELECT id FROM transactions WHERE id IN ${sql(ids)}`).map((r) => r.id))
    : new Set<string>();
  await insertTxns(txns);
  let added = 0;
  let updated = 0;
  for (const t of txns) (existing.has(t.id) ? updated++ : added++);
  const dates = Array.from(new Set(txns.map((t) => t.date))).sort();
  return { added, updated, dates };
}

export async function upsertRows(rows: StatRow[]): Promise<{ added: number; updated: number; dates: string[] }> {
  await ensureSchema();
  const sql = getSql();
  const keys = rows.map((r) => r.key);
  const existing = keys.length
    ? new Set((await sql`SELECT key FROM stat_rows WHERE key IN ${sql(keys)}`).map((r) => r.key))
    : new Set<string>();
  await insertRows(rows);
  let added = 0;
  let updated = 0;
  for (const r of rows) (existing.has(r.key) ? updated++ : added++);
  const dates = Array.from(new Set(rows.map((r) => r.date))).sort();
  return { added, updated, dates };
}

export async function resetToSeed(): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`TRUNCATE stat_rows`;
  await sql`TRUNCATE transactions`;
  if (seed.rows.length) await insertRows(seed.rows);
}

export async function createEvent(ev: TrinityEvent): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`
    INSERT INTO events (id, type, title, note, date, end_date, model_id, chatter_id, shift, created_at)
    VALUES (${ev.id}, ${ev.type}, ${ev.title}, ${ev.note ?? null}, ${ev.date}, ${ev.endDate ?? null},
            ${ev.modelId ?? null}, ${ev.chatterId ?? null}, ${ev.shift ?? null}, ${ev.createdAt})
  `;
}

export async function updateEventDb(ev: TrinityEvent): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`
    UPDATE events SET type=${ev.type}, title=${ev.title}, note=${ev.note ?? null},
      date=${ev.date}, end_date=${ev.endDate ?? null}, model_id=${ev.modelId ?? null},
      chatter_id=${ev.chatterId ?? null}, shift=${ev.shift ?? null}
    WHERE id=${ev.id}
  `;
}

export async function deleteEventDb(id: string): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`DELETE FROM events WHERE id=${id}`;
}
