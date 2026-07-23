import * as XLSX from "xlsx";
import { StatRow, Transaction } from "@/lib/types";
import { parseStatsFromWorkbook } from "./parse-infloww";
import { parseTransactionsFromWorkbook } from "./parse-transactions";

/**
 * Single entry point for imports: reads the workbook once and figures out which
 * infloww report it is — the aggregate "Detailed breakdown" or the
 * transaction-level fan/earnings report.
 */

export type ParsedReport =
  | { kind: "stats"; rows: StatRow[]; sheetUsed: string; warnings: string[] }
  | { kind: "transactions"; transactions: Transaction[]; sheetUsed: string; warnings: string[] }
  | { kind: "unknown"; warnings: string[] };

export function parseReport(input: ArrayBuffer | Uint8Array): ParsedReport {
  const wb = XLSX.read(input, { type: "array", cellDates: true });

  // Transaction report wins when present — it has a Fan column, which the
  // aggregate sheets never do.
  const txns = parseTransactionsFromWorkbook(wb);
  if (txns && txns.transactions.length) {
    return {
      kind: "transactions",
      transactions: txns.transactions,
      sheetUsed: txns.sheetUsed,
      warnings: txns.warnings,
    };
  }

  const stats = parseStatsFromWorkbook(wb);
  if (stats.rows.length) {
    return { kind: "stats", rows: stats.rows, sheetUsed: stats.sheetUsed, warnings: stats.warnings };
  }

  return {
    kind: "unknown",
    warnings: [
      "This file didn't match either infloww report. Expected an aggregate sheet (Detailed breakdown) or a transaction report with Date & time, Employee, Creator, Fan and Earnings columns.",
    ],
  };
}
