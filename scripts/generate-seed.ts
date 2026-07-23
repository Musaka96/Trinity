/**
 * Regenerate src/data/seed.json from an infloww export.
 *
 *   npx tsx scripts/generate-seed.ts <path-to-export.xlsx>
 *
 * Uses the same parser as the in-app import, so the seed and live imports
 * stay in lockstep.
 */
import * as fs from "fs";
import * as path from "path";
import { parseInflowwWorkbook } from "../src/lib/import/parse-infloww";
import { deriveChatters, deriveModels, emptyDataset, mergeDataset } from "../src/lib/dataset";

const file = process.argv[2];
if (!file) {
  console.error("Usage: npx tsx scripts/generate-seed.ts <path-to-export.xlsx>");
  process.exit(1);
}

const buf = new Uint8Array(fs.readFileSync(file));
const res = parseInflowwWorkbook(buf);
if (res.rows.length === 0) {
  console.error("No usable rows found:", res.warnings.join(" "));
  process.exit(1);
}

const ds = mergeDataset(emptyDataset(), res.rows);
const outPath = path.join(process.cwd(), "src/data/seed.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(ds));

console.log(
  `Wrote ${outPath}\n  sheet: ${res.sheetUsed}\n  rows: ${ds.rows.length}` +
    `\n  chatters: ${deriveChatters(ds.rows).length}\n  models: ${deriveModels(ds.rows).length}`,
);
