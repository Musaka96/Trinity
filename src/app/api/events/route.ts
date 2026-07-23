import { NextRequest, NextResponse } from "next/server";
import { createEvent, isConfigured } from "@/lib/db";
import { TrinityEvent } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }
  try {
    const ev = (await req.json()) as TrinityEvent;
    if (!ev?.id || !ev.title || !ev.date) {
      return NextResponse.json({ error: "invalid_event" }, { status: 400 });
    }
    await createEvent(ev);
    return NextResponse.json({ ok: true, event: ev });
  } catch (err) {
    console.error("POST /api/events failed", err);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
