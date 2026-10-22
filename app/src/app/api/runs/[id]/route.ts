import { NextResponse } from "next/server";
import { requireOperator } from "@/api/operator-auth";
import { serverError } from "@/api/http";
import { getDb } from "@/db/client";
import { getRunDetail } from "@/db/runs";

export const dynamic = "force-dynamic";

// Operator-only: the stored run includes the full evaluation (cost and margin).
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = requireOperator(req);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const detail = await getRunDetail(await getDb(), id);
    if (!detail) return NextResponse.json({ error: "Run not found", code: "not_found" }, { status: 404 });
    return NextResponse.json(detail);
  } catch (e) {
    return serverError(e);
  }
}
