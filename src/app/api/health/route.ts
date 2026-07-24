import { NextResponse } from "next/server";
import { healthReport, isConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Diagnostics: is the database reachable, and what does it actually hold? */
export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({
      configured: false,
      hint: "No POSTGRES_URL / DATABASE_URL is set for this deployment, so data is saved per-browser instead of shared.",
    });
  }
  try {
    return NextResponse.json({ configured: true, ok: true, ...(await healthReport()) });
  } catch (err) {
    return NextResponse.json(
      {
        configured: true,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
