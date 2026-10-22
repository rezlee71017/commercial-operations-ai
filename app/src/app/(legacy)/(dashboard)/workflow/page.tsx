"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { collapseEvents } from "@/core/events"
import { formatCents } from "@/core/money"
import type { StreamMessage } from "@/core/stream"
import type { Evaluation, Proposal, RunEvent } from "@/core/types"

const OWNABLE = [
  { id: "phone-a1", label: "Phone Aria" },
  { id: "phone-b2", label: "Phone Bolt" },
  { id: "laptop-l1", label: "Laptop Lume" },
]

const STATUS_LABEL: Record<string, string> = {
  running: "Running...",
  awaiting_approval: "Awaiting approval",
  rejected_by_policy: "Rejected by policy",
  failed: "Failed",
  executed: "Executed",
  rejected: "Rejected by merchant",
  blocked: "Blocked at approval",
}
const GOOD = new Set(["awaiting_approval", "executed"])

type RunSummary = { id: string; request: string; status: string; mode: string; createdAt: string }
type OrderView = { id: string; totalCents: number; items: { productId: string; qty: number }[] }
type View = {
  id: string | null
  status: string
  proposal: Proposal | null
  evaluation: Evaluation | null
  order: OrderView | null
}
type RunDetail = {
  run: { id: string; status: string; proposal: Proposal | null; evaluation: Evaluation | null }
  events: RunEvent[]
  order: OrderView | null
}
type Decision = { ok: true; status: string; orderId?: string; totalCents?: number } | { ok: false; message: string; reasons?: { rule: string; detail: string }[] }

function stepLabel(step: string) {
  const text = step.replace(/^tool:/, "").replaceAll("_", " ")
  return step.startsWith("tool:") ? `Tool: ${text}` : text.charAt(0).toUpperCase() + text.slice(1)
}

function EventIcon({ status }: { status: RunEvent["status"] }) {
  if (status === "started") return <Loader2 className="size-4 animate-spin text-muted-foreground" />
  if (status === "ok") return <CheckCircle2 className="size-4 text-green-600" />
  return <XCircle className="size-4 text-destructive" />
}

const hasDetails = (e: RunEvent) => e.data !== undefined && (e.status === "failed" || e.step.startsWith("tool:"))

export default function WorkflowPage() {
  const [request, setRequest] = useState("I just bought the Aria phone. I need a case and a charger.")
  const [owned, setOwned] = useState<string[]>(["phone-a1"])
  const [events, setEvents] = useState<RunEvent[]>([])
  const [view, setView] = useState<View | null>(null)
  const [history, setHistory] = useState<RunSummary[]>([])
  const [note, setNote] = useState("")
  const [decision, setDecision] = useState<Decision | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [deciding, setDeciding] = useState(false)

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/runs")
      if (res.ok) setHistory((await res.json()) as RunSummary[])
    } catch {
      /* history is optional */
    }
  }, [])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  function toggle(id: string) {
    setOwned((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]))
  }

  function handle(m: StreamMessage) {
    if (m.type === "run") setView({ id: m.runId, status: "running", proposal: null, evaluation: null, order: null })
    else if (m.type === "event") setEvents((prev) => collapseEvents([...prev, m.event]))
    else if (m.type === "result") {
      setView((v) => ({
        id: v?.id ?? null,
        status: m.result.status,
        proposal: m.result.proposal,
        evaluation: m.result.evaluation,
        order: null,
      }))
    } else setError(m.error)
  }

  async function openRun(id: string) {
    setError(null)
    setDecision(null)
    const res = await fetch(`/api/runs/${id}`)
    if (!res.ok) {
      setError("Could not load that run")
      return
    }
    const d = (await res.json()) as RunDetail
    setEvents(collapseEvents(d.events))
    setView({ id: d.run.id, status: d.run.status, proposal: d.run.proposal, evaluation: d.run.evaluation, order: d.order })
  }

  async function run() {
    setLoading(true)
    setError(null)
    setView(null)
    setDecision(null)
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
      void loadHistory()
    }
  }

  async function decide(kind: "approve" | "reject") {
    if (!view?.id) return
    setDeciding(true)
    setDecision(null)
    try {
      const res = await fetch(`/api/runs/${view.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: kind, note: note.trim() || undefined }),
      })
      setDecision((await res.json()) as Decision)
      await openRun(view.id) // show what is really stored now
      void loadHistory()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setDeciding(false)
    }
  }

  const proposal = view?.proposal
  const evaluation = view?.evaluation

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Workflow</h1>
          <Badge variant="outline">demo data</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Describe a customer request. Every step below is recorded as it really happens, and saved.
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
              {view && (
                <Badge variant={GOOD.has(view.status) || view.status === "running" ? "secondary" : "destructive"}>
                  {STATUS_LABEL[view.status] ?? view.status}
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

      {view?.id && view.status === "awaiting_approval" && (
        <Card>
          <CardHeader>
            <CardTitle>Your decision</CardTitle>
            <CardDescription>
              Approving re-checks the rules against the current stock, then removes the stock and creates the order, all
              or nothing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Optional note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
            <div className="flex gap-2">
              <Button onClick={() => decide("approve")} disabled={deciding}>
                {deciding && <Loader2 className="size-4 animate-spin" />}
                Approve and execute
              </Button>
              <Button variant="outline" onClick={() => decide("reject")} disabled={deciding}>
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {decision && (
        <Card>
          <CardHeader>
            <CardTitle>{decision.ok ? "Done" : "Not executed"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {decision.ok && decision.status === "executed" && (
              <p>
                Order <span className="font-mono">{decision.orderId}</span> created for {formatCents(decision.totalCents ?? 0)}. Stock
                was updated: see Inventory and Orders.
              </p>
            )}
            {decision.ok && decision.status === "rejected" && <p>The proposal was rejected. Nothing changed.</p>}
            {!decision.ok && (
              <>
                <p>{decision.message}. Nothing was changed.</p>
                {decision.reasons?.map((r) => (
                  <p key={r.rule} className="text-muted-foreground">
                    {r.rule}: {r.detail}
                  </p>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {view?.order && (
        <Card>
          <CardHeader>
            <CardTitle>Order</CardTitle>
            <CardDescription>
              <span className="font-mono">{view.order.id}</span> · {formatCents(view.order.totalCents)}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">{view.order.items.map((i) => `${i.productId} x${i.qty}`).join(", ")}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent runs</CardTitle>
          <CardDescription>Saved in the database. Click one to open it again, also after a refresh.</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing yet.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() => openRun(h.id)}
                    className="flex w-full items-center gap-2 rounded-md border p-2 text-left text-sm hover:bg-muted"
                  >
                    <Badge variant={GOOD.has(h.status) ? "secondary" : "outline"}>{STATUS_LABEL[h.status] ?? h.status}</Badge>
                    <span className="truncate">{h.request}</span>
                    <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">{h.mode}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
