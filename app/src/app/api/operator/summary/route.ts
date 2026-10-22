import { NextResponse } from "next/server";
import { requireOperator } from "@/api/operator-auth";
import { serverError } from "@/api/http";
import { getDb } from "@/db/client";
import { getSummary } from "@/db/summary";

export const dynamic = "force-dynamic";

// Business-owner numbers: runs by status, orders, revenue, cost, margin, low stock, current rules.
export async function GET(req: Request) {
  const denied = requireOperator(req);
  if (denied) return denied;
  try {
    return NextResponse.json(await getSummary(await getDb()));
  } catch (e) {
    return serverError(e);
  }
}
