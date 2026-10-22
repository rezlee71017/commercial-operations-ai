import { NextResponse } from "next/server";
import { serverError } from "@/api/http";
import { getDb } from "@/db/client";
import { loadCatalog, loadCategories } from "@/db/repo";
import { toPublicProduct } from "@/core/public";

export const dynamic = "force-dynamic";

// Storefront catalog. Uses the public projection, so cost and margin are never included.
export async function GET() {
  try {
    const db = await getDb();
    const [catalog, categories] = await Promise.all([loadCatalog(db), loadCategories(db)]);
    return NextResponse.json({ products: catalog.map(toPublicProduct), categories });
  } catch (e) {
    return serverError(e);
  }
}
