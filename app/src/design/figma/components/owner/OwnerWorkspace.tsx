import { useMemo, useState } from "react"
import {
  activity,
  categories,
  categoryName,
  formatMoney,
} from "../../data/demo"
import type { MerchantProduct, Rules, Run, View } from "../../types"
import Icon from "../shared/Icon"
import StatusBadge from "../shared/StatusBadge"
import MerchantShell, { type MerchantSection } from "../ops/MerchantShell"

type Props = {
  products: MerchantProduct[]
  runs: Run[]
  rules: Rules
  orderCount: number
  onNavigate: (view: View) => void
  onSaveRules: (rules: Rules) => void
  onSignOut: () => void
  initialSection: "Overview" | "Inventory" | "Rules" | "Activity"
  onOpenOps: (section: "Copilot" | "Approvals") => void
}

export default function OwnerWorkspace({
  products,
  runs,
  rules,
  orderCount,
  onNavigate,
  onSaveRules,
  onSignOut,
  initialSection,
  onOpenOps,
}: Props) {
  const [section, setSection] = useState<MerchantSection>(initialSection)
  const [category, setCategory] = useState("all")
  const [draft, setDraft] = useState(rules)
  const [confirming, setConfirming] = useState(false)
  const [saved, setSaved] = useState(false)
  const [chartMode, setChartMode] = useState<"inventory" | "runs">("inventory")
  const lowStock = products.filter((product) => product.stock <= 5)
  const approvalCount = runs.filter(
    (run) => run.status === "awaiting_approval",
  ).length
  const filtered = useMemo(
    () =>
      products.filter(
        (product) => category === "all" || product.category === category,
      ),
    [category, products],
  )
  const categoryStock = categories.map(([id, name]) => ({
    name,
    units: products.filter((product) => product.category === id).reduce((sum, product) => sum + product.stock, 0),
  })).sort((a, b) => b.units - a.units).slice(0, 6)
  const maxCategoryStock = Math.max(1, ...categoryStock.map((item) => item.units))
  const statusCounts = [
    { name: "Awaiting approval", count: runs.filter((run) => run.status === "awaiting_approval").length, tone: "amber" },
    { name: "Executed / approved", count: runs.filter((run) => run.status === "executed" || run.status === "approved").length, tone: "teal" },
    { name: "Rejected / blocked", count: runs.filter((run) => run.status === "rejected" || run.status === "rejected_by_policy").length, tone: "coral" },
    { name: "Running / failed", count: runs.filter((run) => run.status === "running" || run.status === "failed" || run.status === "needs_input").length, tone: "muted" },
  ]
  const invalid =
    draft.minMarginPct < 0 ||
    draft.minMarginPct > 95 ||
    draft.maxDiscountPct < 0 ||
    draft.maxDiscountPct > 90
  const navigateSection = (next: MerchantSection) =>
    next === "Copilot" || next === "Approvals"
      ? onOpenOps(next)
      : setSection(next)

  return (
    <MerchantShell
      section={section}
      approvalCount={approvalCount}
      onSectionChange={navigateSection}
      onNavigate={onNavigate}
      onSignOut={onSignOut}
    >
      <div className="merchant-page-title">
        <div>
          <span className="dark-kicker">Owner control center</span>
          <h1>{section === "Overview" ? "Commercial overview" : section}</h1>
          <p>
            {section === "Overview"
              ? "A factual view of current synthetic records—no forecasts or growth claims."
              : "Catalog and policy controls for this local demonstration."}
          </p>
        </div>
        <span className="source-note">
          <Icon name="shield" size={15} /> Values shown are from defined data
          objects
        </span>
      </div>

      {section === "Overview" && (
        <>
          <div className="metric-grid">
            <article>
              <span>Runs</span>
              <strong>{runs.length}</strong>
              <small>{approvalCount} awaiting approval</small>
            </article>
            <article>
              <span>Orders</span>
              <strong>{orderCount}</strong>
              <small>Synthetic records</small>
            </article>
            <article>
              <span>Low stock</span>
              <strong>{lowStock.length}</strong>
              <small>5 units or fewer</small>
            </article>
            <article>
              <span>Out of stock</span>
              <strong>
                {products.filter((product) => product.stock === 0).length}
              </strong>
              <small>Catalog products</small>
            </article>
          </div>
          <div className="insight-grid">
            <section className="panel insight-panel">
              <div className="panel-heading">
                <div><span className="panel-label">Live catalog snapshot</span><h2>Operational pulse</h2></div>
                <div className="chart-tabs" role="group" aria-label="Choose chart"><button className={chartMode === "inventory" ? "active" : ""} onClick={() => setChartMode("inventory")}>Stock by category</button><button className={chartMode === "runs" ? "active" : ""} onClick={() => setChartMode("runs")}>Run outcomes</button></div>
              </div>
              {chartMode === "inventory" ? (
                <div className="bar-chart" role="list" aria-label="Units in stock by category">
                  {categoryStock.map((item) => <div className="bar-row" role="listitem" key={item.name}><span>{item.name}</span><div className="bar-track"><i style={{ width: `${(item.units / maxCategoryStock) * 100}%` }} /></div><strong>{item.units}</strong></div>)}
                </div>
              ) : (
                <div className="bar-chart" role="list" aria-label="Workflow counts by status">
                  {statusCounts.map((item) => <div className="bar-row" role="listitem" key={item.name}><span>{item.name}</span><div className="bar-track"><i className={item.tone} style={{ width: `${(item.count / Math.max(1, runs.length)) * 100}%` }} /></div><strong>{item.count}</strong></div>)}
                </div>
              )}
              <p className="chart-footnote">Derived from the current synthetic catalog and workflow records. No revenue forecast or live analytics is implied.</p>
            </section>
            <section className="panel insight-panel status-insight">
              <div className="panel-heading"><div><span className="panel-label">Inventory health</span><h2>Stock exposure</h2></div><span className="status-badge status-awaiting_approval">{lowStock.length} low stock</span></div>
              <div className="stock-summary"><div><strong>{products.reduce((sum, product) => sum + product.stock, 0)}</strong><span>Units on hand</span></div><div><strong>{products.filter((product) => product.stock === 0).length}</strong><span>Out of stock</span></div><div><strong>{products.length}</strong><span>Catalog items</span></div></div>
              <p className="chart-footnote">Counts are calculated directly from the current catalog snapshot.</p>
            </section>
          </div>
          <div className="owner-grid">
            <section className="panel overview-runs">
              <div className="panel-heading">
                <div>
                  <span className="panel-label">Run status</span>
                  <h2>Recent workflows</h2>
                </div>
                <button onClick={() => onNavigate("ops")}>
                  Open approvals <Icon name="arrow" size={15} />
                </button>
              </div>
              {runs.map((run) => (
                <button key={run.id} onClick={() => onNavigate("ops")}>
                  <span>
                    <small>
                      {run.id} · {run.createdAt}
                    </small>
                    <strong>{run.request}</strong>
                  </span>
                  <StatusBadge status={run.status} />
                </button>
              ))}
            </section>
            <aside className="panel stock-watch">
              <div className="panel-heading">
                <div>
                  <span className="panel-label">Inventory</span>
                  <h2>Low-stock products</h2>
                </div>
              </div>
              {lowStock.slice(0, 6).map((product) => (
                <button
                  key={product.id}
                  onClick={() => setSection("Inventory")}
                >
                  <span>
                    <strong>{product.name}</strong>
                    <small>{categoryName(product.category)}</small>
                  </span>
                  <b>{product.stock}</b>
                </button>
              ))}
            </aside>
          </div>
        </>
      )}

      {section === "Inventory" && (
        <section className="panel inventory-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-label">Catalog inventory</span>
              <h2>{filtered.length} products</h2>
            </div>
            <label>
              Category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="all">All categories</option>
                {categories.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="inventory-table">
            <div className="inventory-row inventory-head">
              <span>Product</span>
              <span>Stock</span>
              <span>Price</span>
              <span>Cost</span>
              <span>Margin</span>
            </div>
            {filtered.map((product) => {
              const margin = Math.round(
                ((product.priceCents - product.costCents) /
                  product.priceCents) *
                  100,
              )
              return (
                <div
                  className={`inventory-row ${
                    product.stock <= 5 ? "low-stock" : ""
                  }`}
                  key={product.id}
                >
                  <span>
                    <strong>{product.name}</strong>
                    <small>
                      {categoryName(product.category)} · {product.id}
                    </small>
                  </span>
                  <span>
                    <i />
                    {product.stock ? product.stock : "Out"}
                  </span>
                  <span>{formatMoney(product.priceCents)}</span>
                  <span>{formatMoney(product.costCents)}</span>
                  <strong>{margin}%</strong>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {section === "Rules" && (
        <div className="rules-layout">
          <section className="panel rules-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-label">Deterministic guardrails</span>
                <h2>Commercial rules</h2>
              </div>
            </div>
            <label>
              <span>
                Minimum margin <small>0–95%</small>
              </span>
              <div>
                <input
                  type="number"
                  min="0"
                  max="95"
                  value={draft.minMarginPct}
                  onChange={(event) => {
                    setDraft({
                      ...draft,
                      minMarginPct: Number(event.target.value),
                    })
                    setSaved(false)
                  }}
                />
                <b>%</b>
              </div>
            </label>
            <label>
              <span>
                Maximum discount <small>0–90%</small>
              </span>
              <div>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={draft.maxDiscountPct}
                  onChange={(event) => {
                    setDraft({
                      ...draft,
                      maxDiscountPct: Number(event.target.value),
                    })
                    setSaved(false)
                  }}
                />
                <b>%</b>
              </div>
            </label>
            {invalid && (
              <p className="validation-error">
                Enter a margin from 0–95 and a discount from 0–90.
              </p>
            )}
            {!confirming ? (
              <button
                className="merchant-primary"
                disabled={
                  invalid ||
                  (draft.minMarginPct === rules.minMarginPct &&
                    draft.maxDiscountPct === rules.maxDiscountPct)
                }
                onClick={() => setConfirming(true)}
              >
                Review changes
              </button>
            ) : (
              <div className="confirm-box">
                <Icon name="shield" />
                <div>
                  <strong>Confirm local rule change</strong>
                  <p>
                    Future prototype checks will use {draft.minMarginPct}%
                    minimum margin and {draft.maxDiscountPct}% maximum discount.
                    No production policy changes.
                  </p>
                  <div>
                    <button onClick={() => setConfirming(false)}>Cancel</button>
                    <button
                      className="merchant-primary"
                      onClick={() => {
                        onSaveRules(draft)
                        setConfirming(false)
                        setSaved(true)
                      }}
                    >
                      Confirm rules
                    </button>
                  </div>
                </div>
              </div>
            )}
            {saved && (
              <p className="saved-note">
                <Icon name="check" size={15} /> Rules updated in local prototype
                state.
              </p>
            )}
          </section>
          <aside className="rules-note">
            <Icon name="shield" size={25} />
            <h3>Human authority stays explicit</h3>
            <p>
              This interface simulates rule editing. A production change would
              require authentication, audit logging, policy versioning, and
              authorization.
            </p>
          </aside>
        </div>
      )}

      {section === "Activity" && (
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-label">Newest first</span>
              <h2>Audit activity</h2>
            </div>
          </div>
          {activity.map((item) => (
            <article key={item.at + item.title}>
              <time>{item.at}</time>
              <span />
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
            </article>
          ))}
        </section>
      )}
    </MerchantShell>
  )
}
