import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { loadCatalog } from "@/db/repo";
import { toPublicProduct } from "@/core/public";

export const dynamic = "force-dynamic";

// Storefront catalog. Uses the public projection, so cost and margin are never included.
export async function GET() {
  try {
    const catalog = await loadCatalog(await getDb());
    return NextResponse.json({ products: catalog.map(toPublicProduct) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
