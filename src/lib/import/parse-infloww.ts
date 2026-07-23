import * as XLSX from "xlsx";
import { Platform, ShiftId, shiftFromRange, StatRow } from "@/lib/types";

/**
 * Parse an infloww export (.xlsx/.csv) into canonical StatRows.
 *
 * The finest-grain sheet is "Detailed breakdown" — one row per
 * (day, employee, creator). We prefer it; otherwise we fall back to the
 * most granular sheet available (single creator per row, shortest window).
 *
 * Shared by the build-time seed generator and the in-app import, so it must
 * stay dependency-light and run in both Node and the browser.
 */

export interface ParseResult {
  rows: StatRow[];
  sheetUsed: string;
  warnings: string[];
}

const HEADER_ALIASES: Record<string, string> = {
  "date/time europe/belgrade": "datetime",
  group: "group",
  employees: "employee",
  email: "email",
  creators: "creator",
  sales: "sales",
  "ppv sales": "ppvSales",
  tips: "tips",
  "direct message sales": "dmSales",
  "direct messages sent": "dmsSent",
  "direct ppvs sent": "ppvsSent",
  "ppvs unlocked": "ppvsUnlocked",
  "priority mass messages sales": "priorityMassSales",
  "of mass message sales": "ofMassSales",
  "fans chatted": "fansChatted",
  "fans who spent money": "fansWhoSpent",
  "character count": "charCount",
};

function money(v: unknown): number {
  if (v == null || v === "-" || v === "") return 0;
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function int(v: unknown): number {
  if (v == null || v === "-" || v === "") return 0;
  if (typeof v === "number") return Math.round(v);
  const n = parseFloat(String(v).replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/** "2026-07-16 04:00:00 - 2026-07-16 12:00:00" → { date, shift } */
function parseWindow(raw: unknown): { date: string; shift: ShiftId } | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  const [startPart, endPart] = s.split(" - ");
  if (!startPart) return null;
  const startMatch = startPart.match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/);
  if (!startMatch) {
    // date-only cell
    const dOnly = startPart.match(/(\d{4}-\d{2}-\d{2})/);
    return dOnly ? { date: dOnly[1], shift: "full" } : null;
  }
  const date = startMatch[1];
  const startHour = parseInt(startMatch[2], 10);
  const startMin = parseInt(startMatch[3], 10);
  const endMatch = endPart?.match(/(\d{2}):(\d{2}):(\d{2})/);
  const isFullDay =
    startHour === 0 && startMin === 0 && (!endMatch || endMatch[1] === "23");
  return { date, shift: shiftFromRange(startHour, isFullDay) };
}

function cleanCreator(raw: string): { name: string; platform: Platform; tier: "VIP" | "Free" | "Standard" } {
  let name = raw.trim();
  let platform: Platform = "Other";
  const suffix = name.match(/\(([^)]+)\)\s*$/);
  if (suffix) {
    const code = suffix[1].toUpperCase();
    if (code === "OF") platform = "OnlyFans";
    else if (code === "FANSLY" || code === "FS") platform = "Fansly";
    else if (code === "FANVUE" || code === "FV") platform = "Fanvue";
    name = name.replace(/\s*\([^)]+\)\s*$/, "").trim();
  }
  const tier: "VIP" | "Free" | "Standard" = /\bVIP\b/i.test(name)
    ? "VIP"
    : /\bFree\b/i.test(name)
      ? "Free"
      : "Standard";
  return { name, platform, tier };
}

function headerMap(header: unknown[]): Record<string, number> {
  const map: Record<string, number> = {};
  header.forEach((h, i) => {
    const key = HEADER_ALIASES[String(h ?? "").trim().toLowerCase()];
    if (key) map[key] = i;
  });
  return map;
}

/** Rows that describe a single creator over a single day are "detailed". */
function detailScore(rows: unknown[][], creatorIdx: number, dtIdx: number): number {
  let score = 0;
  for (const r of rows.slice(0, 40)) {
    const creator = String(r[creatorIdx] ?? "");
    const w = parseWindow(r[dtIdx]);
    if (creator && !creator.includes(",")) score += 1;
    if (w && w.shift !== "full") score += 0.5;
  }
  return score;
}

export function parseInflowwWorkbook(input: ArrayBuffer | Uint8Array): ParseResult {
  const wb = XLSX.read(input, { type: "array" });
  const warnings: string[] = [];

  // Rank candidate sheets: prefer "Detailed breakdown", else best detail score.
  const candidates = wb.SheetNames.map((name) => {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], {
      header: 1,
      defval: null,
      raw: true,
    });
    const header = rows[0] ?? [];
    const hm = headerMap(header);
    return { name, rows: rows.slice(1), hm };
  }).filter((c) => c.hm.creator != null && c.hm.datetime != null && c.hm.sales != null);

  if (candidates.length === 0) {
    return { rows: [], sheetUsed: "", warnings: ["No infloww sheet with the expected columns was found."] };
  }

  let chosen =
    candidates.find((c) => c.name.toLowerCase().includes("detailed")) ??
    candidates
      .map((c) => ({ c, s: detailScore(c.rows, c.hm.creator, c.hm.datetime) }))
      .sort((a, b) => b.s - a.s)[0].c;

  const hm = chosen.hm;
  const out: StatRow[] = [];
  const seen = new Set<string>();

  for (const r of chosen.rows) {
    const rawCreator = r[hm.creator];
    const win = parseWindow(r[hm.datetime]);
    if (!win || rawCreator == null || String(rawCreator).trim() === "") continue;

    // Skip aggregate rows that list multiple creators.
    const creatorStr = String(rawCreator);
    if (creatorStr.includes(",")) continue;

    const email = String(r[hm.email] ?? "").trim().toLowerCase();
    const chatterName = String(r[hm.employee] ?? "").trim();
    if (!email && !chatterName) continue;
    const chatterId = email || chatterName.toLowerCase();
    const { name: creator, platform, tier } = cleanCreator(creatorStr);

    const key = `${win.date}::${win.shift}::${chatterId}::${creator}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      key,
      date: win.date,
      shift: win.shift,
      chatterId,
      chatterName,
      group: String(r[hm.group] ?? "").trim(),
      creator,
      platform,
      tier,
      sales: money(r[hm.sales]),
      ppvSales: money(r[hm.ppvSales]),
      tips: money(r[hm.tips]),
      dmSales: money(r[hm.dmSales]),
      dmsSent: int(r[hm.dmsSent]),
      ppvsSent: int(r[hm.ppvsSent]),
      ppvsUnlocked: int(r[hm.ppvsUnlocked]),
      priorityMassSales: money(r[hm.priorityMassSales]),
      ofMassSales: money(r[hm.ofMassSales]),
      fansChatted: int(r[hm.fansChatted]),
      fansWhoSpent: int(r[hm.fansWhoSpent]),
      charCount: int(r[hm.charCount]),
    });
  }

  if (out.length === 0) warnings.push("The chosen sheet had no usable rows.");
  return { rows: out, sheetUsed: chosen.name, warnings };
}
