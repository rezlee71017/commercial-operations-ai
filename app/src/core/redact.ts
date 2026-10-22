// What a CUSTOMER may see of a workflow run. Purchase cost and margin are operator-only.
// The full, unredacted run is stored in the database and shown to the operator.

const SECRET_KEYS = new Set(["costCents", "marginPct", "unitCostCents", "cost_cents"]);

export function redactForCustomer<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => redactForCustomer(v)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEYS.has(k)) continue;
      out[k] = redactForCustomer(v);
    }
    // The margin rule's text contains the margin numbers: keep the verdict, drop the numbers.
    if (out.rule === "min_margin") {
      out.detail = out.passed ? "ok" : "Does not meet the store's profitability rules";
    }
    return out as T;
  }
  return value;
}

// Applies the redaction to a newline-delimited JSON stream (the format of POST /api/run),
// line by line, without waiting for the end of the run.
export function redactNdjson(stream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  let buf = "";
  const emit = (line: string, ctl: TransformStreamDefaultController<Uint8Array>) => {
    if (!line.trim()) return;
    try {
      ctl.enqueue(enc.encode(JSON.stringify(redactForCustomer(JSON.parse(line))) + "\n"));
    } catch {
      // A line that is not valid JSON is dropped rather than risk passing raw data through.
    }
  };
  return stream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, ctl) {
        buf += dec.decode(chunk, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const l of lines) emit(l, ctl);
      },
      flush(ctl) {
        emit(buf + dec.decode(), ctl);
      },
    }),
  );
}
