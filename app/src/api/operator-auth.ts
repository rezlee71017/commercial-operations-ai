import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

type Env = Record<string, string | undefined>;

export type OperatorCheck =
  | { ok: true }
  | { ok: false; status: 401 | 503; code: "unauthorized" | "operator_not_configured"; message: string };

const digest = (s: string) => createHash("sha256").update(s).digest();

// Simplest protection that meets the need today: one secret token (OPERATOR_TOKEN) that the
// operator UI sends as "Authorization: Bearer <token>".
//  - token set            -> the request must carry it
//  - no token, development -> open (so local work is not slowed down)
//  - no token, production  -> operator endpoints are CLOSED (fail safe), never silently open
// Replaced later by real merchant login (Supabase Auth); the routes only call this one function.
export function checkOperator(req: Request, env: Env = process.env): OperatorCheck {
  const token = env.OPERATOR_TOKEN?.trim();
  if (!token) {
    if (env.NODE_ENV === "production") {
      return {
        ok: false,
        status: 503,
        code: "operator_not_configured",
        message: "Operator access is not configured on this server (set OPERATOR_TOKEN)",
      };
    }
    return { ok: true };
  }
  const m = /^Bearer\s+(.+)$/i.exec(req.headers.get("authorization") ?? "");
  // Compare hashes so the comparison time does not depend on how much of the token matched.
  if (m && timingSafeEqual(digest(m[1].trim()), digest(token))) return { ok: true };
  return { ok: false, status: 401, code: "unauthorized", message: "Operator token required" };
}

// Use at the top of an operator-only route:  const denied = requireOperator(req); if (denied) return denied;
export function requireOperator(req: Request): Response | null {
  const c = checkOperator(req);
  return c.ok ? null : NextResponse.json({ error: c.message, code: c.code }, { status: c.status });
}

export const isOperator = (req: Request): boolean => checkOperator(req).ok;
