import type {
  ApiErrorBody,
  Category,
  DecisionResult,
  OperatorProduct,
  PublicProduct,
  RunListItem,
  Rules,
  StreamMessage,
  Summary,
} from "./contract";

// Typed browser client for our own API. The Figma UI calls these functions instead of using fetch directly.
// Operator calls need the operator token (see docs/api.md).

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    message: string,
  ) {
    super(message);
  }
}

export type ClientOptions = { baseUrl?: string; operatorToken?: string; fetch?: typeof fetch };

export function createApiClient(opts: ClientOptions = {}) {
  const base = opts.baseUrl ?? "";
  const doFetch: typeof fetch = (...a) => (opts.fetch ?? fetch)(...a);
  const headers = (operator: boolean, json = false): HeadersInit => ({
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(operator && opts.operatorToken ? { Authorization: `Bearer ${opts.operatorToken}` } : {}),
  });

  async function request<T>(path: string, init: RequestInit = {}, operator = false): Promise<T> {
    const res = await doFetch(base + path, { ...init, headers: { ...headers(operator, init.body != null), ...init.headers } });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const e = (body ?? {}) as Partial<ApiErrorBody>;
      // The decision endpoint answers 404/409/422 with a structured DecisionResult: let callers read it.
      if (path.endsWith("/decision") && body && typeof body === "object" && "ok" in body) return body as T;
      throw new ApiError(res.status, e.code, e.error ?? `Request failed (${res.status})`);
    }
    return body as T;
  }

  // POST /api/run answers with newline-delimited JSON. Calls onMessage for every message as it
  // arrives and resolves with the final "result" message (or throws on an "error" message).
  async function streamRun(
    input: { request: string; owned?: string[]; previousRunId?: string },
    onMessage: (m: StreamMessage) => void,
    signal?: AbortSignal,
  ): Promise<Extract<StreamMessage, { type: "result" }>["result"]> {
    const res = await doFetch(base + "/api/run", {
      method: "POST",
      headers: headers(true, true), // sends the token if there is one: operators get the full run
      body: JSON.stringify(input),
      signal,
    });
    if (!res.ok || !res.body) {
      const e = ((await res.json().catch(() => null)) ?? {}) as Partial<ApiErrorBody>;
      throw new ApiError(res.status, e.code, e.error ?? `Request failed (${res.status})`);
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let result: Extract<StreamMessage, { type: "result" }>["result"] | null = null;
    const handle = (line: string) => {
      if (!line.trim()) return;
      const m = JSON.parse(line) as StreamMessage;
      onMessage(m);
      if (m.type === "result") result = m.result;
      if (m.type === "error") throw new ApiError(500, "run_failed", m.error);
    };
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      lines.forEach(handle);
    }
    handle(buf + dec.decode());
    if (!result) throw new ApiError(502, "no_result", "The run ended without a result");
    return result;
  }

  return {
    // customer
    getProducts: () => request<{ products: PublicProduct[]; categories: Category[] }>("/api/products"),
    streamRun,
    // operator (token required)
    listRuns: () => request<RunListItem[]>("/api/runs", {}, true),
    getRun: (id: string) => request<unknown>(`/api/runs/${encodeURIComponent(id)}`, {}, true),
    decide: (id: string, decision: "approve" | "reject", note?: string) =>
      request<DecisionResult>(
        `/api/runs/${encodeURIComponent(id)}/decision`,
        { method: "POST", body: JSON.stringify({ decision, note }) },
        true,
      ),
    operator: {
      summary: () => request<Summary>("/api/operator/summary", {}, true),
      inventory: () => request<{ products: OperatorProduct[] }>("/api/operator/inventory", {}, true),
      getRules: () => request<Rules>("/api/operator/rules", {}, true),
      saveRules: (rules: Rules) =>
        request<Rules>("/api/operator/rules", { method: "PUT", body: JSON.stringify(rules) }, true),
      orders: (limit = 50) => request<{ orders: unknown[] }>(`/api/operator/orders?limit=${limit}`, {}, true),
      audit: (limit = 50) => request<{ entries: unknown[] }>(`/api/operator/audit?limit=${limit}`, {}, true),
    },
  };
}
