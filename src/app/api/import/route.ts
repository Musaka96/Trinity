import { NextRequest, NextResponse } from "next/server";
import { isConfigured, upsertRows } from "@/lib/db";
import { StatRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }
  try {
    const body = (await req.json()) as { rows?: StatRow[] };
    const rows = body.rows ?? [];
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "no_rows" }, { status: 400 });
    }
    const diff = await upsertRows(rows);
    return NextResponse.json({ ok: true, ...diff });
  } catch (err) {
    console.error("POST /api/import failed", err);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
