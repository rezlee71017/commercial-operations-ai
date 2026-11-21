import { useState } from "react"
import { formatMoney } from "../../data/demo"
import type { PublicProduct, View } from "../../types"
import Brand from "../shared/Brand"
import Icon from "../shared/Icon"
import { DemoBadge } from "../shared/StatusBadge"

type Props = {
  products: PublicProduct[]
  cartCount: number
  onNavigate: (view: View) => void
  onAddBundle: (productIds: string[], discountPct: number) => void
  onOpenCart: () => void
  onSubmitRequest: (request: string) => void
}

const bundleIds = ["phone-a1", "case-a1", "charger-30", "cable-c"]

export default function BundleView({
  products,
  cartCount,
  onNavigate,
  onAddBundle,
  onOpenCart,
  onSubmitRequest,
}: Props) {
  const [request, setRequest] = useState(
    "A phone setup under $700 for everyday use",
  )
  const [status, setStatus] =
    useState<"results" | "thinking" | "question" | "error" | "empty">("results")
  const bundle = bundleIds.flatMap((id) => {
    const product = products.find((item) => item.id === id)
    return product ? [product] : []
  })
  const subtotal = bundle.reduce((sum, product) => sum + product.priceCents, 0)
  const discountPct = 5
  const total = Math.round(subtotal * (1 - discountPct / 100))
  const submit = () => {
    if (request.trim().length < 8) {
      setStatus("question")
      return
    }
    setStatus("thinking")
    onSubmitRequest(request)
    window.setTimeout(
      () =>
        setStatus(
          request.toLowerCase().includes("error")
            ? "error"
            : request.toLowerCase().includes("nothing")
              ? "empty"
              : "results",
        ),
      700,
    )
  }
  const addBundle = () =>
    onAddBundle(
      bundle
        .filter((product) => product.stock > 0)
        .map((product) => product.id),
      discountPct,
    )

  return (
    <div className="customer bundle-view">
      <header className="store-header">
        <button className="brand-button" onClick={() => onNavigate("store")}>
          <Brand />
        </button>
        <nav>
          <button onClick={() => onNavigate("store")}>Shop</button>
          <button className="active">Smart bundles</button>
        </nav>
        <div className="header-actions">
          <DemoBadge />
          <button
            className="icon-button cart-button"
            onClick={onOpenCart}
            aria-label={`Open cart with ${cartCount} items`}
          >
            <Icon name="bag" />
            <span>{cartCount}</span>
          </button>
        </div>
      </header>
      <main className="bundle-shell">
        <div className="bundle-heading">
          <span className="kicker">
            <Icon name="spark" size={15} /> Smart bundles
          </span>
          <h1>
            One goal.
            <br />
            <em>A complete setup.</em>
          </h1>
          <p>
            Recommendations use catalog price, stock, and explicit compatibility
            only.
          </p>
        </div>
        <section className="bundle-request">
          <label htmlFor="bundle-goal">
            What do you need? Budget? What will you use it for?
          </label>
          <div>
            <input
              id="bundle-goal"
              value={request}
              onChange={(event) => setRequest(event.target.value)}
            />
            <button
              className="primary"
              onClick={submit}
              disabled={status === "thinking"}
            >
              {status === "thinking" ? "Checking…" : "Build recommendation"}{" "}
              <Icon name="spark" size={17} />
            </button>
          </div>
          <div className="prompt-chips">
            {[
              "Phone setup under $700",
              "Portable laptop setup",
              "Video call desk setup",
            ].map((prompt) => (
              <button key={prompt} onClick={() => setRequest(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        </section>
        {status === "thinking" && (
          <div className="state-panel">
            <span className="state-spinner" />
            <div>
              <h2>Checking the catalog</h2>
              <p>
                Reading stock · Confirming compatibility · Applying bundle
                pricing
              </p>
            </div>
          </div>
        )}
        {status === "question" && (
          <div className="state-panel">
            <Icon name="spark" />
            <div>
              <h2>What’s the main use case?</h2>
              <p>
                Add a product type or intended use so the demo can match catalog
                items.
              </p>
            </div>
            <button onClick={() => setRequest(`${request} for everyday work`)}>
              Everyday work
            </button>
          </div>
        )}
        {status === "error" && (
          <div className="state-panel error">
            <Icon name="close" />
            <div>
              <h2>We couldn’t build that bundle</h2>
              <p>Your current recommendation is unchanged.</p>
            </div>
            <button onClick={submit}>Retry</button>
          </div>
        )}
        {status === "empty" && (
          <div className="state-panel">
            <Icon name="search" />
            <div>
              <h2>No bundle matched</h2>
              <p>Try one of the example requests above.</p>
            </div>
          </div>
        )}
        {status === "results" && (
          <section className="bundle-result">
            <div className="bundle-items">
              <div className="result-label">
                <span>Recommended setup</span>
                <strong>{bundle.length} catalog items</strong>
              </div>
              {bundle.map((product, index) => (
                <article key={product.id}>
                  <span className="item-index">0{index + 1}</span>
                  <div className={`mini-visual glyph-${product.category}`}>
                    <span />
                  </div>
                  <div>
                    <small>{product.category}</small>
                    <h3>{product.name}</h3>
                    <p>
                      {product.id === "phone-a1"
                        ? "The core device for this setup."
                        : product.compatibleWith.includes("phone-a1")
                          ? "Confirmed compatible with Phone Aria."
                          : "Selected for the requested mobile use case."}
                    </p>
                    <span
                      className={
                        product.compatibleWith.includes("phone-a1")
                          ? "compat confirmed"
                          : "compat"
                      }
                    >
                      {product.compatibleWith.includes("phone-a1")
                        ? "Confirmed compatible"
                        : "Not confirmed"}
                    </span>
                  </div>
                  <strong>{formatMoney(product.priceCents)}</strong>
                </article>
              ))}
            </div>
            <aside className="bundle-summary">
              <DemoBadge />
              <span className="kicker">Bundle summary</span>
              <h2>
                Mobile essentials,
                <br />
                without guesswork.
              </h2>
              <p>
                Phone Aria plus catalog-listed protection and charging
                essentials. Compatibility is only claimed where product
                relationships confirm it.
              </p>
              <div className="price-lines">
                <div>
                  <span>Bought separately</span>
                  <s>{formatMoney(subtotal)}</s>
                </div>
                <div>
                  <span>Bundle discount</span>
                  <strong>{discountPct}%</strong>
                </div>
                <div className="total">
                  <span>Bundle price</span>
                  <strong>{formatMoney(total)}</strong>
                </div>
              </div>
              <button className="primary wide" onClick={addBundle}>
                Add bundle to cart <Icon name="bag" size={17} />
              </button>
              <p className="demo-note">
                <Icon name="shield" size={14} /> Demo cart only. No checkout is
                executed.
              </p>
            </aside>
          </section>
        )}
      </main>
    </div>
  )
}
