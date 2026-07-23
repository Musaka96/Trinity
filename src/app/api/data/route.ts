import { NextResponse } from "next/server";
import { getDataset, isConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }
  try {
    const { rows, events, transactions } = await getDataset();
    return NextResponse.json({ configured: true, rows, events, transactions });
  } catch (err) {
    console.error("GET /api/data failed", err);
    return NextResponse.json({ configured: true, error: "db_error" }, { status: 500 });
  }
}
