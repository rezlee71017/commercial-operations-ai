"use client"

import { useState } from "react"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { formatCents } from "@/core/money"
import type { RunResult } from "@/core/run"
import type { StreamMessage } from "@/core/stream"
import type { RunEvent } from "@/core/types"

const OWNABLE = [
  { id: "phone-a1", label: "Phone Aria" },
  { id: "phone-b2", label: "Phone Bolt" },
  { id: "laptop-l1", label: "Laptop Lume" },
]

const STATUS_LABEL: Record<RunResult["status"], string> = {
  awaiting_approval: "Awaiting approval",
  rejected_by_policy: "Rejected by policy",
  failed: "Failed",
}

function stepLabel(step: string) {
  const text = step.replace(/^tool:/, "").replaceAll("_", " ")
  return step.startsWith("tool:") ? `Tool: ${text}` : text.charAt(0).toUpperCase() + text.slice(1)
}

function EventIcon({ status }: { status: RunEvent["status"] }) {
  if (status === "started") return <Loader2 className="size-4 animate-spin text-muted-foreground" />
  if (status === "ok") return <CheckCircle2 className="size-4 text-green-600" />
  return <XCircle className="size-4 text-destructive" />
}

const hasDetails = (e: RunEvent) =>
  e.data !== undefined && (e.status === "failed" || e.step.startsWith("tool:"))

export default function WorkflowPage() {
  const [request, setRequest] = useState("I just bought the Aria phone. I need a case and a charger.")
  const [owned, setOwned] = useState<string[]>(["phone-a1"])
  const [events, setEvents] = useState<RunEvent[]>([])
  const [result, setResult] = useState<RunResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function toggle(id: string) {
    setOwned((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]))
  }

  // When a step finishes, its "started" line is removed and the finished event is appended,
  // so the list shows events in the order they really completed.
  function addEvent(e: RunEvent) {
    setEvents((prev) => {
      if (e.status === "started") return [...prev, e]
      const i = prev.findIndex((p) => p.step === e.step && p.status === "started")
      const rest = i >= 0 ? prev.filter((_, idx) => idx !== i) : prev
      return [...rest, e]
    })
  }

  function handle(m: StreamMessage) {
    if (m.type === "event") addEvent(m.event)
    else if (m.type === "result") setResult(m.result)
    else setError(m.error)
  }

  async function run() {
    setLoading(true)
    setError(null)
    setResult(null)
    setEvents([])
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request, owned }),
      })
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Request failed")
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let nl = buffer.indexOf("\n")
        while (nl >= 0) {
          const line = buffer.slice(0, nl).trim()
          buffer = buffer.slice(nl + 1)
          if (line) handle(JSON.parse(line) as StreamMessage)
          nl = buffer.indexOf("\n")
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const proposal = result?.proposal
  const evaluation = result?.evaluation

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Workflow</h1>
          <Badge variant="outline">demo data</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Describe a customer request. Every step below is recorded as it really happens.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer request</CardTitle>
            <CardDescription>What the customer asks for, and what they already own.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={request} onChange={(e) => setRequest(e.target.value)} rows={3} />
            <div className="space-y-2">
              <p className="text-sm font-medium">Customer already owns</p>
              <div className="flex flex-wrap gap-4">
                {OWNABLE.map((o) => (
                  <Label key={o.id} className="cursor-pointer">
                    <Checkbox checked={owned.includes(o.id)} onCheckedChange={() => toggle(o.id)} />
                    {o.label}
                  </Label>
                ))}
              </div>
            </div>
            <Button onClick={run} disabled={loading || request.trim() === ""}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? "Running..." : "Run workflow"}
            </Button>
            {error && <p className="text-sm text-destructive">Error: {error}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Live events</CardTitle>
              {(loading || result) && (
                <Badge variant={result && result.status !== "awaiting_approval" ? "destructive" : "secondary"}>
                  {result ? STATUS_LABEL[result.status] : "Running..."}
                </Badge>
              )}
            </div>
            <CardDescription>Times are UTC. Tool calls can be expanded to see input and output.</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No run yet.</p>
            ) : (
              <ol className="space-y-2">
                {events.map((e, i) => (
                  <li key={i} className="rounded-md border p-2">
                    <div className="flex items-center gap-2">
                      <EventIcon status={e.status} />
                      <span className="text-sm font-medium">{stepLabel(e.step)}</span>
                      <span className="ml-auto font-mono text-xs text-muted-foreground">{e.at.slice(11, 23)}</span>
                    </div>
                    {hasDetails(e) && (
                      <details open={e.status === "failed"} className="mt-1">
                        <summary className="cursor-pointer text-xs text-muted-foreground">details</summary>
                        <pre className="mt-1 max-h-64 overflow-auto rounded-md bg-muted p-2 text-xs">
                          {JSON.stringify(e.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {proposal && (
        <Card>
          <CardHeader>
            <CardTitle>Proposal</CardTitle>
            {proposal.explanation && <CardDescription>{proposal.explanation}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposal.items.map((it, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono">{it.productId}</TableCell>
                    <TableCell className="text-right">{it.qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {evaluation && (
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  ["Discount", `${proposal.discountPct}%`],
                  ["Subtotal", formatCents(evaluation.subtotalCents)],
                  ["Total", formatCents(evaluation.totalCents)],
                  ["Margin", `${evaluation.marginPct}%`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {evaluation && (
        <Card>
          <CardHeader>
            <CardTitle>Policy checks</CardTitle>
            <CardDescription>Deterministic business rules. The model cannot change these results.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {evaluation.results.map((r) => (
                <li key={r.rule} className="flex items-start gap-2 text-sm">
                  <Badge variant={r.passed ? "secondary" : "destructive"}>{r.passed ? "PASS" : "FAIL"}</Badge>
                  <span className="font-medium">{r.rule}</span>
                  <span className="text-muted-foreground">{r.detail === "ok" ? "" : r.detail}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
