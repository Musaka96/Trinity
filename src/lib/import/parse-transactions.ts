import * as XLSX from "xlsx";
import { ShiftId, Transaction, shiftFromRange } from "@/lib/types";
import { cleanCreator } from "./parse-infloww";

/**
 * Parser for the transaction-level infloww report:
 *   Date & time · Employee · Creator · Fan · Earnings
 * One row per fan payment. Returns null when the sheet isn't this report.
 */

const ALIASES: Record<string, string> = {
  "date & time": "datetime",
  "date and time": "datetime",
  "date/time": "datetime",
  date: "datetime",
  datetime: "datetime",
  employee: "employee",
  employees: "employee",
  chatter: "employee",
  email: "email",
  group: "group",
  creator: "creator",
  creators: "creator",
  model: "creator",
  fan: "fan",
  fans: "fan",
  "fan name": "fan",
  earnings: "earnings",
  earning: "earnings",
  amount: "earnings",
  total: "earnings",
};

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Accepts Date cells, Excel serials, "Jul 23, 2026 11:59pm", and ISO-ish strings. */
export function parseDateTime(v: unknown): { datetime: string; date: string; hour: number } | null {
  if (v == null || v === "") return null;

  const build = (y: number, mo: number, d: number, h: number, mi: number) => {
    const date = `${y}-${pad(mo + 1)}-${pad(d)}`;
    return { datetime: `${date}T${pad(h)}:${pad(mi)}:00Z`, date, hour: h };
  };

  if (v instanceof Date && !isNaN(v.getTime())) {
    return build(v.getFullYear(), v.getMonth(), v.getDate(), v.getHours(), v.getMinutes());
  }

  if (typeof v === "number" && isFinite(v)) {
    // Excel serial date (days since 1899-12-30), fractional part = time of day.
    const ms = Math.round((v - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (isNaN(d.getTime())) return null;
    return build(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes());
  }

  const s = String(v).trim();

  // "Jul 23, 2026 11:59pm"  /  "Jul 23, 2026 11:59 PM"
  const us = s.match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})[,\s]+(\d{1,2}):(\d{2})\s*([ap])\.?m\.?$/i);
  if (us) {
    const mo = MONTHS[us[1].toLowerCase()];
    if (mo === undefined) return null;
    let h = parseInt(us[4], 10) % 12;
    if (us[6].toLowerCase() === "p") h += 12;
    return build(parseInt(us[3], 10), mo, parseInt(us[2], 10), h, parseInt(us[5], 10));
  }

  // "2026-07-23 23:59[:00]" or ISO "2026-07-23T23:59"
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/);
  if (iso) {
    return build(+iso[1], +iso[2] - 1, +iso[3], +iso[4], +iso[5]);
  }

  // Date only
  const dateOnly = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) return build(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3], 12, 0);

  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return build(
      parsed.getFullYear(), parsed.getMonth(), parsed.getDate(),
      parsed.getHours(), parsed.getMinutes(),
    );
  }
  return null;
}

function money(v: unknown): number {
  if (v == null || v === "-" || v === "") return 0;
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const slug = (s: string) =>
  s.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_|/$.-]/g, "").slice(0, 60);

/** Takes the first line of a multi-line cell (the report shows account + display name). */
const firstLine = (s: string) => String(s).split(/\r?\n/)[0].trim();

function headerMap(header: unknown[]): Record<string, number> {
  const map: Record<string, number> = {};
  header.forEach((h, i) => {
    const key = ALIASES[String(h ?? "").trim().toLowerCase()];
    if (key && map[key] === undefined) map[key] = i;
  });
  return map;
}

export interface TransactionParseResult {
  transactions: Transaction[];
  sheetUsed: string;
  warnings: string[];
}

/** Returns null when no sheet looks like the transaction report. */
export function parseTransactionsFromWorkbook(wb: XLSX.WorkBook): TransactionParseResult | null {
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], {
      header: 1,
      defval: null,
      raw: false,
      dateNF: "yyyy-mm-dd hh:mm:ss",
    });
    if (rows.length < 2) continue;
    const hm = headerMap(rows[0] ?? []);
    // The distinguishing columns: a Fan and an Earnings amount.
    if (hm.fan === undefined || hm.earnings === undefined || hm.datetime === undefined) continue;

    const warnings: string[] = [];
    const out: Transaction[] = [];
    const seen = new Set<string>();
    let skipped = 0;

    for (const r of rows.slice(1)) {
      const when = parseDateTime(r[hm.datetime]);
      const fanRaw = r[hm.fan];
      const creatorRaw = r[hm.creator ?? -1];
      if (!when || fanRaw == null || String(fanRaw).trim() === "") {
        skipped++;
        continue;
      }

      const fanName = firstLine(String(fanRaw));
      const chatterName = hm.employee !== undefined ? firstLine(String(r[hm.employee] ?? "")) : "";
      const email = hm.email !== undefined ? String(r[hm.email] ?? "").trim().toLowerCase() : "";
      const creatorCell = creatorRaw != null ? firstLine(String(creatorRaw)) : "";
      const { name: creator, platform, tier } = cleanCreator(creatorCell || "Unknown");
      const earnings = money(r[hm.earnings]);
      const chatterId = email || slug(chatterName) || "unknown";
      const fanId = `fan_${slug(fanName)}`;
      const shift: ShiftId = shiftFromRange(when.hour, false);

      // Stable key so re-importing the same export updates rather than duplicates.
      let key = `txn_${when.datetime}_${chatterId}_${creator}_${fanId}_${earnings.toFixed(2)}`;
      if (seen.has(key)) {
        let n = 2;
        while (seen.has(`${key}#${n}`)) n++;
        key = `${key}#${n}`;
      }
      seen.add(key);

      out.push({
        id: key,
        datetime: when.datetime,
        date: when.date,
        shift,
        chatterId,
        chatterName: chatterName || "Unknown",
        group: hm.group !== undefined ? firstLine(String(r[hm.group] ?? "")) : "",
        creator,
        platform,
        tier,
        fanId,
        fanName,
        earnings,
      });
    }

    if (out.length === 0) continue;
    if (skipped) warnings.push(`${skipped} row(s) skipped (unparsable date or missing fan).`);
    out.sort((a, b) => b.datetime.localeCompare(a.datetime));
    return { transactions: out, sheetUsed: name, warnings };
  }
  return null;
}
