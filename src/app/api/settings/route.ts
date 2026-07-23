import { NextRequest, NextResponse } from "next/server";
import { isConfigured, saveSetting } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isConfigured()) return NextResponse.json({ configured: false }, { status: 503 });
  try {
    const body = (await req.json()) as { key?: string; value?: unknown };
    if (!body.key) return NextResponse.json({ error: "missing_key" }, { status: 400 });
    await saveSetting(body.key, body.value ?? null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/settings failed", err);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
