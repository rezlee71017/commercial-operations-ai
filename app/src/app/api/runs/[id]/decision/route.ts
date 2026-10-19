import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { decideRun } from "@/db/execute";

const Body = z.object({
  decision: z.enum(["approve", "reject"]),
  note: z.string().max(500).optional(),
});

// NOTE: there is no login yet. Before a public deployment this endpoint must require
// a signed-in merchant, because it changes stock and creates orders.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "decision must be 'approve' or 'reject'" }, { status: 400 });
    }
    // Only the run id and the decision come from the browser. The proposal is read from the database.
    const result = await decideRun(await getDb(), id, parsed.data.decision, parsed.data.note);
    if (result.ok) return NextResponse.json(result);
    const status = result.code === "not_found" ? 404 : result.code === "not_awaiting" ? 409 : 422;
    return NextResponse.json(result, { status });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
