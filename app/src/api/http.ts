import { NextResponse } from "next/server";

// One error shape for every route: { error: string, code?: string }.
// In production the real message stays in the server log (it can contain hostnames and SQL).
export function serverError(e: unknown): Response {
  console.error("api error:", e);
  const message = process.env.NODE_ENV === "production" ? "Internal error" : e instanceof Error ? e.message : String(e);
  return NextResponse.json({ error: message, code: "internal" }, { status: 500 });
}

export function badRequest(message: string): Response {
  return NextResponse.json({ error: message, code: "bad_request" }, { status: 400 });
}
