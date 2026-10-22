import { NextResponse } from "next/server";
import { requireOperator } from "@/api/operator-auth";
import { serverError } from "@/api/http";
import { toOperatorProduct } from "@/core/operator";
import { getDb } from "@/db/client";
import { loadCatalog } from "@/db/repo";

export const dynamic = "force-dynamic";

// Operator view of the catalog: includes purchase cost and margin (never shown to customers).
export async function GET(req: Request) {
  const denied = requireOperator(req);
  if (denied) return denied;
  try {
    const catalog = await loadCatalog(await getDb());
    return NextResponse.json({ products: catalog.map(toOperatorProduct) });
  } catch (e) {
    return serverError(e);
  }
}
