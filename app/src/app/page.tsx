"use client";

import { useState } from "react";
import type { RunResult } from "@/core/run";

const OWNABLE = [
  { id: "phone-a1", label: "Phone Aria" },
  { id: "phone-b2", label: "Phone Bolt" },
  { id: "laptop-l1", label: "Laptop Lume" },
];

export default function Home() {
  const [request, setRequest] = useState("I just bought the Aria phone. I need a case and a charger.");
  const [owned, setOwned] = useState<string[]>(["phone-a1"]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggle(id: string) {
    setOwned((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  }

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request, owned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult(data as RunResult);
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

      {result && (
        <>
          <h2>Status: {result.status}</h2>

          <h3>Events</h3>
          <ol>
            {result.events.map((e, i) => (
              <li key={i}>
                <b>{e.step}</b> {e.status === "ok" ? "OK" : "FAILED"} <small>({e.at})</small>
                {e.status === "failed" && (
                  <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(e.data, null, 2)}</pre>
                )}
              </li>
            ))}
          </ol>

          {result.proposal && (
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

          {result.evaluation && (
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
        </>
      )}
    </main>
  );
}
