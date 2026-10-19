import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { listRuns } from "@/db/runs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await listRuns(await getDb(), 20));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
