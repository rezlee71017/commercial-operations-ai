// One place for every HTTP call to an LLM provider (Gemini, OpenRouter): timeout, polite retry on rate limits, and errors
// that are safe to show to a customer. The technical detail is kept for the operator.

export type ProviderErrorKind = "rate_limited" | "timeout" | "unavailable" | "auth" | "bad_request";

const PUBLIC_MESSAGES: Record<ProviderErrorKind, string> = {
  rate_limited: "The AI service is busy right now. Please try again in a minute.",
  timeout: "The AI service took too long to answer. Please try again.",
  unavailable: "The AI service is temporarily unavailable. Please try again.",
  auth: "The AI service is not configured correctly. Please contact the store.",
  bad_request: "The AI service could not process this request. Please try again.",
};

export class ProviderError extends Error {
  readonly publicMessage: string;
  constructor(
    public readonly kind: ProviderErrorKind,
    public readonly status: number | undefined,
    detail: string,
    public readonly provider: string = "Gemini",
  ) {
    super(`${provider} HTTP ${status ?? "none"} (${kind}): ${detail.slice(0, 500)}`);
    this.name = "ProviderError";
    this.publicMessage = PUBLIC_MESSAGES[kind];
  }
}

// Providers say how long to wait: Gemini as "retryDelay": "40s" / "Please retry in 40.7s";
// OpenRouter via X-RateLimit-Reset (ms epoch) in the error metadata.
export function parseRetryDelayMs(body: string): number | null {
  const m = body.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/) ?? body.match(/retry in (\d+(?:\.\d+)?)s/i);
  return m ? Math.ceil(Number(m[1]) * 1000) + 1000 : null; // +1s safety margin
}

export type FetchOptions = {
  timeoutMs?: number; // per attempt
  maxRetries?: number; // extra attempts after the first one
  maxWaitMs?: number; // never wait longer than this for a retry: fail fast instead
  sleep?: (ms: number) => Promise<void>; // injectable for tests
  provider?: string; // name used in error messages (default "Gemini")
};

export async function geminiFetch(url: string, init: RequestInit, opts: FetchOptions = {}): Promise<Response> {
  const { timeoutMs = 30_000, maxRetries = 2, maxWaitMs = 45_000, provider = "Gemini" } = opts;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    } catch (e) {
      const name = e instanceof Error ? e.name : "";
      if (name === "TimeoutError" || name === "AbortError") {
        throw new ProviderError("timeout", undefined, `no answer within ${timeoutMs}ms`, provider);
      }
      throw new ProviderError("unavailable", undefined, e instanceof Error ? e.message : String(e), provider);
    }
    if (res.ok) return res;

    const body = await res.text().catch(() => "");
    if (res.status === 429 || res.status === 503) {
      const wait = parseRetryDelayMs(body) ?? 2000 * 2 ** attempt;
      if (attempt < maxRetries && wait <= maxWaitMs) {
        await sleep(wait);
        continue;
      }
      throw new ProviderError(res.status === 429 ? "rate_limited" : "unavailable", res.status, body, provider);
    }
    if (res.status === 401 || res.status === 403) throw new ProviderError("auth", res.status, body, provider);
    if (res.status >= 500) throw new ProviderError("unavailable", res.status, body, provider);
    throw new ProviderError("bad_request", res.status, body, provider);
  }
}
