import { NextResponse } from "next/server";
import { requireOperator } from "@/api/operator-auth";
import { badRequest, serverError } from "@/api/http";
import { getDb } from "@/db/client";
import { RulesInput, loadRules, saveRules } from "@/db/repo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = requireOperator(req);
  if (denied) return denied;
  try {
    return NextResponse.json(await loadRules(await getDb()));
  } catch (e) {
    return serverError(e);
  }
}

// Body: { minMarginPct: 0..95, maxDiscountPct: 0..90 }. The change is written to the audit log.
export async function PUT(req: Request) {
  const denied = requireOperator(req);
  if (denied) return denied;
  try {
    const parsed = RulesInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return badRequest("minMarginPct must be 0-95 and maxDiscountPct must be 0-90 (numbers)");
    }
    return NextResponse.json(await saveRules(await getDb(), parsed.data));
  } catch (e) {
    return serverError(e);
  }
}
