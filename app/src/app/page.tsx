"use client";

import { useState } from "react";
import type { RunResult } from "@/core/run";
import type { StreamMessage } from "@/core/stream";
import type { RunEvent } from "@/core/types";

const OWNABLE = [
  { id: "phone-a1", label: "Phone Aria" },
  { id: "phone-b2", label: "Phone Bolt" },
  { id: "laptop-l1", label: "Laptop Lume" },
];

export default function Home() {
  const [request, setRequest] = useState("I just bought the Aria phone. I need a case and a charger.");
  const [owned, setOwned] = useState<string[]>(["phone-a1"]);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggle(id: string) {
    setOwned((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  }

  // When a step finishes, its "started" line is removed and the finished event is appended,
  // so the list shows events in the order they really completed.
  function addEvent(e: RunEvent) {
    setEvents((prev) => {
      if (e.status === "started") return [...prev, e];
      const i = prev.findIndex((p) => p.step === e.step && p.status === "started");
      const rest = i >= 0 ? prev.filter((_, idx) => idx !== i) : prev;
      return [...rest, e];
    });
  }

  function handle(m: StreamMessage) {
    if (m.type === "event") addEvent(m.event);
    else if (m.type === "result") setResult(m.result);
    else setError(m.error);
  }

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    setEvents([]);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request, owned }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Request failed");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl = buffer.indexOf("\n");
        while (nl >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (line) handle(JSON.parse(line) as StreamMessage);
          nl = buffer.indexOf("\n");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      <h1>Commercial Operations AI (demo data)</h1>
      <textarea
        value={request}
        onChange={(e) => setRequest(e.target.value)}
        rows={3}
        style={{ width: "100%", padding: 8 }}
      />
      <p style={{ marginBottom: 4 }}>Customer already owns:</p>
      <div>
        {OWNABLE.map((o) => (
          <label key={o.id} style={{ marginRight: 12 }}>
            <input type="checkbox" checked={owned.includes(o.id)} onChange={() => toggle(o.id)} /> {o.label}
          </label>
        ))}
      </div>
      <button onClick={run} disabled={loading} style={{ marginTop: 8, padding: "8px 16px" }}>
        {loading ? "Running..." : "Run workflow"}
      </button>

      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {(loading || result) && <h2>Status: {result ? result.status : "running..."}</h2>}

      {events.length > 0 && (
        <>
          <h3>Events</h3>
          <ol>
            {events.map((e, i) => (
              <li key={i}>
                <b>{e.step}</b> {e.status === "started" ? "RUNNING..." : e.status === "ok" ? "OK" : "FAILED"}{" "}
                <small>({e.at})</small>
                {e.data !== undefined && (e.status === "failed" || e.step.startsWith("tool:")) && (
                  <details open={e.status === "failed"}>
                    <summary>details</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(e.data, null, 2)}</pre>
                  </details>
                )}
              </li>
            ))}
          </ol>
        </>
      )}

      {result?.proposal && (
        <>
          <h3>Proposal</h3>
          <ul>
            {result.proposal.items.map((it, i) => (
              <li key={i}>
                {it.productId} x {it.qty}
              </li>
            ))}
          </ul>
          <p>Discount: {result.proposal.discountPct}%</p>
          {result.proposal.explanation && <p>{result.proposal.explanation}</p>}
        </>
      )}

      {result?.evaluation && (
        <>
          <h3>Policy checks</h3>
          <ul>
            {result.evaluation.results.map((r) => (
              <li key={r.rule}>
                {r.passed ? "PASS" : "FAIL"} {r.rule}: {r.detail}
              </li>
            ))}
          </ul>
          <p>
            Subtotal {result.evaluation.subtotal} | Total {result.evaluation.total} | Margin{" "}
            {result.evaluation.marginPct}%
          </p>
        </>
      )}
    </main>
  );
}
