import { NextResponse } from "next/server";
import { requireOperator } from "@/api/operator-auth";
import { serverError } from "@/api/http";
import { getDb } from "@/db/client";
import { listAudit } from "@/db/runs";

export const dynamic = "force-dynamic";

// ?limit=1..200 (default 50). Newest first.
export async function GET(req: Request) {
  const denied = requireOperator(req);
  if (denied) return denied;
  try {
    const n = Number(new URL(req.url).searchParams.get("limit"));
    const limit = Number.isInteger(n) && n >= 1 ? Math.min(n, 200) : 50;
    return NextResponse.json({ entries: await listAudit(await getDb(), limit) });
  } catch (e) {
    return serverError(e);
  }
}
