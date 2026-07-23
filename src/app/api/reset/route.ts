import { NextResponse } from "next/server";
import { isConfigured, resetToSeed } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (!isConfigured()) return NextResponse.json({ configured: false }, { status: 503 });
  try {
    await resetToSeed();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/reset failed", err);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
