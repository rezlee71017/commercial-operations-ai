import { NextResponse } from "next/server";
import { requireOperator } from "@/api/operator-auth";
import { serverError } from "@/api/http";
import { getDb } from "@/db/client";
import { listRuns } from "@/db/runs";

export const dynamic = "force-dynamic";

// Operator-only: the run history of every customer.
export async function GET(req: Request) {
  const denied = requireOperator(req);
  if (denied) return denied;
  try {
    return NextResponse.json(await listRuns(await getDb(), 20));
  } catch (e) {
    return serverError(e);
  }
}
