// Small in-memory fixed-window limiter. It protects the free LLM quota from a single noisy client.
// Limits: per server instance only (a restart or a second instance starts from zero), so it is a safety net, not security.
export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return function allow(key: string): boolean {
    const t = now();
    if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt <= t) hits.delete(k);
    const cur = hits.get(key);
    if (!cur || cur.resetAt <= t) {
      hits.set(key, { count: 1, resetAt: t + windowMs });
      return true;
    }
    cur.count += 1;
    return cur.count <= limit;
  };
}

export function clientKey(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}
