import { NextRequest, NextResponse } from "next/server";
import { deleteEventDb, isConfigured, updateEventDb } from "@/lib/db";
import { TrinityEvent } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isConfigured()) return NextResponse.json({ configured: false }, { status: 503 });
  try {
    const { id } = await ctx.params;
    const ev = (await req.json()) as TrinityEvent;
    await updateEventDb({ ...ev, id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/events/[id] failed", err);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isConfigured()) return NextResponse.json({ configured: false }, { status: 503 });
  try {
    const { id } = await ctx.params;
    await deleteEventDb(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/events/[id] failed", err);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
