import { useState } from "react"
import { formatMoney } from "../../data/demo"
import type { MerchantProduct, Rules, Run, RunStatus, View } from "../../types"
import Icon from "../shared/Icon"
import StatusBadge from "../shared/StatusBadge"
import MerchantShell, { type MerchantSection } from "./MerchantShell"

type Props = {
  products: MerchantProduct[]
  runs: Run[]
  rules: Rules
  onNavigate: (view: View) => void
  onApprove: (runId: string, note: string) => void
  onReject: (runId: string, note: string) => void
  onRetry: (runId: string) => void
  onSubmitRequest: (request: string) => void
  onSignOut: () => void
  initialSection: "Copilot" | "Approvals"
  onOpenOwner: (
    section: "Overview" | "Inventory" | "Rules" | "Activity",
  ) => void
}

const stateCopy: Record<RunStatus, string> = {
  running: "The workflow is evaluating catalog and rule inputs.",
  needs_input: "More detail is required before evaluation can continue.",
  awaiting_approval: "Rule checks passed and a human decision is required.",
  rejected_by_policy: "A deterministic guardrail blocked this proposal.",
  approved: "A human approved this proposal; execution has not been simulated.",
  executed: "This synthetic run is read-only because it is already decided.",
  rejected: "A human rejected this proposal.",
  failed: "The workflow stopped before a decision was reached.",
}

export default function OpsWorkspace({
  products,
  runs,
  rules,
  onNavigate,
  onApprove,
  onReject,
  onRetry,
  onSubmitRequest,
  onSignOut,
  initialSection,
  onOpenOwner,
}: Props) {
  const [section, setSection] = useState<MerchantSection>(initialSection)
  const [request, setRequest] = useState(
    "Build a mobile starter kit under $700",
  )
  const [selectedRunId, setSelectedRunId] = useState(runs[0]?.id ?? "")
  const [note, setNote] = useState("")
  const selectedRun = runs.find((run) => run.id === selectedRunId) ?? runs[0]
  const approvalCount = runs.filter(
    (run) => run.status === "awaiting_approval",
  ).length

  return (
    <MerchantShell
      section={section}
      approvalCount={approvalCount}
      onSectionChange={(next) =>
        next === "Overview" ||
        next === "Inventory" ||
        next === "Rules" ||
        next === "Activity"
          ? onOpenOwner(next)
          : setSection(next)
      }
      onNavigate={onNavigate}
      onSignOut={onSignOut}
    >
      <div className="merchant-page-title">
        <div>
          <span className="dark-kicker">Operator workspace</span>
          <h1>
            {section === "Copilot" ? "Inventory-to-Bundle" : "Approval queue"}
          </h1>
          <p>
            {section === "Copilot"
              ? "Turn a commercial goal into a catalog-grounded proposal with visible checks."
              : "Review proposals after deterministic guardrails have run."}
          </p>
        </div>
        <span className="source-note">
          <Icon name="shield" size={15} /> No backend actions execute in this
          prototype
        </span>
      </div>

      {section === "Copilot" && (
        <>
          <section className="copilot-request panel">
            <div>
              <span className="panel-label">New request</span>
              <h2>What commercial outcome do you need?</h2>
            </div>
            <label htmlFor="ops-request">Request</label>
            <div>
              <textarea
                id="ops-request"
                maxLength={500}
                value={request}
                onChange={(event) => setRequest(event.target.value)}
              />
              <button
                className="merchant-primary"
                onClick={() => onSubmitRequest(request)}
                disabled={!request.trim()}
              >
                Run checks <Icon name="arrow" size={17} />
              </button>
            </div>
            <small>
              {request.length}/500 · Uses synthetic catalog data and local
              prototype state
            </small>
          </section>
          {!selectedRun ? (
            <div className="merchant-empty">
              <Icon name="spark" />
              <h2>No runs yet</h2>
              <p>Submit a request to begin a workflow.</p>
            </div>
          ) : (
            <div className="copilot-grid">
              <section className="panel workflow-panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-label">Live workflow</span>
                    <h2>{selectedRun.id}</h2>
                  </div>
                  <StatusBadge status={selectedRun.status} />
                </div>
                <div className="workflow-list">
                  {selectedRun.events.map((event, index) => (
                    <article
                      className={event.status}
                      key={`${event.step}-${event.at}`}
                    >
                      <span className="event-dot">
                        {event.status === "ok" ? (
                          <Icon name="check" size={13} />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <div>
                        <strong>{event.step}</strong>
                        <p>{event.message}</p>
                      </div>
                      <time>{event.at}</time>
                    </article>
                  ))}
                </div>
              </section>
              <ProposalCard
                run={selectedRun}
                products={products}
                rules={rules}
              />
            </div>
          )}
        </>
      )}

      {section === "Approvals" && (
        <div className="approval-layout">
          <aside className="run-list panel">
            <div className="panel-heading">
              <div>
                <span className="panel-label">Run history</span>
                <h2>{runs.length} synthetic runs</h2>
              </div>
            </div>
            {runs.map((run) => (
              <button
                className={run.id === selectedRun?.id ? "active" : ""}
                key={run.id}
                onClick={() => setSelectedRunId(run.id)}
              >
                <span>
                  <strong>{run.id}</strong>
                  <small>{run.request}</small>
                </span>
                <StatusBadge status={run.status} />
              </button>
            ))}
          </aside>
          {selectedRun && (
            <div className="approval-detail">
              <section className="panel approval-header">
                <div>
                  <span className="panel-label">{selectedRun.createdAt}</span>
                  <h2>{selectedRun.request}</h2>
                  <p>{stateCopy[selectedRun.status]}</p>
                </div>
                <StatusBadge status={selectedRun.status} />
              </section>
              <ProposalCard
                run={selectedRun}
                products={products}
                rules={rules}
              />
              <section className="panel decision-panel">
                <label htmlFor="decision-note">
                  Decision note <span>Optional · max 500 characters</span>
                </label>
                <textarea
                  id="decision-note"
                  maxLength={500}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Add context for the audit history…"
                />
                <div>
                  {selectedRun.status === "awaiting_approval" ? (
                    <>
                      <button
                        className="reject-button"
                        onClick={() => {
                          onReject(selectedRun.id, note)
                          setNote("")
                        }}
                      >
                        Reject
                      </button>
                      <button
                        className="merchant-primary"
                        onClick={() => {
                          onApprove(selectedRun.id, note)
                          setNote("")
                        }}
                      >
                        Approve proposal <Icon name="check" size={16} />
                      </button>
                    </>
                  ) : selectedRun.status === "failed" ? (
                    <button
                      className="merchant-primary"
                      onClick={() => onRetry(selectedRun.id)}
                    >
                      Retry run
                    </button>
                  ) : (
                    <button className="merchant-primary" disabled>
                      {selectedRun.status === "rejected_by_policy"
                        ? "Approval blocked by policy"
                        : "Already decided"}
                    </button>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      )}
    </MerchantShell>
  )
}

function ProposalCard({
  run,
  products,
  rules,
}: {
  run: Run
  products: MerchantProduct[]
  rules: Rules
}) {
  const items = run.proposal.items.flatMap((item) => {
    const product = products.find(
      (candidate) => candidate.id === item.productId,
    )
    return product ? [{ ...item, product }] : []
  })
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.priceCents * item.qty,
    0,
  )
  const total = Math.round(subtotal * (1 - run.proposal.discountPct / 100))
  return (
    <section className="panel proposal-card">
      <div className="panel-heading">
        <div>
          <span className="panel-label">Proposal</span>
          <h2>{items.length} catalog items</h2>
        </div>
        <strong>{formatMoney(total)}</strong>
      </div>
      <p>{run.proposal.explanation}</p>
      <div className="proposal-items">
        {items.map(({ product, qty }) => (
          <div key={product.id}>
            <span>
              <strong>{product.name}</strong>
              <small>
                {qty} × {formatMoney(product.priceCents)}
              </small>
            </span>
            <strong>{formatMoney(product.priceCents * qty)}</strong>
          </div>
        ))}
      </div>
      <div className="discount-line">
        <span>Discount</span>
        <strong>{run.proposal.discountPct}%</strong>
      </div>
      <div className="checks">
        <span className="panel-label">
          Rule checks · thresholds {rules.minMarginPct}% /{" "}
          {rules.maxDiscountPct}%
        </span>
        {run.checks.map((check) => (
          <div className={check.passed ? "passed" : "failed"} key={check.rule}>
            <span>
              <Icon name={check.passed ? "check" : "close"} size={14} />
            </span>
            <div>
              <strong>{check.rule}</strong>
              <p>{check.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
