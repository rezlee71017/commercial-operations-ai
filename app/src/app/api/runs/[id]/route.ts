import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getRunDetail } from "@/db/runs";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const detail = await getRunDetail(await getDb(), id);
    if (!detail) return NextResponse.json({ error: "Run not found" }, { status: 404 });
    return NextResponse.json(detail);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
