import { useMemo, useState } from "react"
import { categories, categoryName, formatMoney } from "../../data/demo"
import type { LoadState, PublicProduct, View } from "../../types"
import Brand from "../shared/Brand"
import Icon from "../shared/Icon"
import { DemoBadge } from "../shared/StatusBadge"

type AssistantState = "idle" | "thinking" | "clarification" | "results" | "failure" | "nothing"

type Props = {
  products: PublicProduct[]
  state: LoadState
  cartCount: number
  signedIn: boolean
  onNavigate: (view: View) => void
  onAddToCart: (productId: string) => void
  onCompare: (productIds: string[]) => void
  onOpenCart: () => void
  onSignIn: () => void
}

const prompts = [
  "A phone setup under $700",
  "A portable work setup",
  "Audio for commuting",
]

function ProductVisual({ product }: { product: PublicProduct }) {
  return (
    <div
      className={`product-visual glyph-${product.category}`}
      aria-hidden="true"
    >
      <span className="visual-orbit" />
      <span className="visual-object" />
      <small>{categoryName(product.category)}</small>
    </div>
  )
}

export default function Storefront({
  products,
  state,
  cartCount,
  signedIn,
  onNavigate,
  onAddToCart,
  onCompare,
  onOpenCart,
  onSignIn,
}: Props) {
  const [query, setQuery] = useState("")
  const [assistant, setAssistant] = useState<AssistantState>("idle")
  const [category, setCategory] = useState("all")
  const [search, setSearch] = useState("")
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [showCompare, setShowCompare] = useState(false)

  const filtered = useMemo(
    () =>
      products.filter(
        (product) =>
          (category === "all" || product.category === category) &&
          product.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [category, products, search],
  )
  const recommendations = products.filter((product) =>
    ["phone-a1", "charger-30", "case-a1", "cable-c"].includes(product.id),
  )
  const compared = compareIds.flatMap((id) => {
    const product = products.find((item) => item.id === id)
    return product ? [product] : []
  })

  const submit = (nextQuery = query) => {
    setQuery(nextQuery)
    setAssistant("thinking")
    window.setTimeout(() => {
      const normalized = nextQuery.toLowerCase()
      if (normalized.includes("error")) setAssistant("failure")
      else if (normalized.includes("nothing")) setAssistant("nothing")
      else if (nextQuery.trim().length < 8) setAssistant("clarification")
      else setAssistant("results")
    }, 700)
  }

  const toggleCompare = (id: string) => {
    setCompareIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < 4
          ? [...current, id]
          : current,
    )
  }

  return (
    <div className="customer">
      <header className="store-header">
        <button
          className="brand-button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <Brand />
        </button>
        <nav aria-label="Customer navigation">
          <button className="active" onClick={() => onNavigate("store")}>
            Shop
          </button>
          <button onClick={() => onNavigate("bundle")}>Smart bundles</button>
        </nav>
        <div className="header-actions">
          <DemoBadge />
          <button
            className="text-button"
            onClick={signedIn ? () => onNavigate("ops") : onSignIn}
          >
            <Icon name="user" size={17} /> {signedIn ? "Workspace" : "Sign in"}
          </button>
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

      <main>
        <section className="store-hero">
          <div className="hero-copy">
            <span className="kicker">
              <Icon name="spark" size={15} /> Shopping intelligence, grounded in
              the catalog
            </span>
            <h1>
              Start with a goal.
              <br />
              <em>Find the right fit.</em>
            </h1>
            <p>
              Describe what you need, your budget, and how you’ll use it.
              Aperture compares real catalog price, stock, and confirmed
              compatibility.
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                submit()
              }}
              className="goal-box"
            >
              <label htmlFor="shopping-goal">
                What do you need? Budget? What will you use it for?
              </label>
              <div>
                <input
                  id="shopping-goal"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Build me a phone setup under $700…"
                />
                <button className="primary" type="submit">
                  Find my setup <Icon name="arrow" size={18} />
                </button>
              </div>
            </form>
            <div className="prompt-chips">
              {prompts.map((prompt) => (
                <button key={prompt} onClick={() => submit(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
          <div className="hero-device" aria-hidden="true">
            <div className="device-glow" />
            <div className="device-card device-back">
              <span />
            </div>
            <div className="device-card device-front">
              <span className="device-island" />
              <i />
              <b>ARIA</b>
            </div>
            <span className="hero-fact fact-one">
              128GB <small>Phone Aria</small>
            </span>
            <span className="hero-fact fact-two">
              $600 <small>Catalog price</small>
            </span>
          </div>
        </section>

        {assistant !== "idle" && (
          <section className="assistant-response" aria-live="polite">
            {assistant === "thinking" && (
              <div className="thinking-panel">
                <span className="thinking-mark">
                  <Icon name="spark" />
                </span>
                <div>
                  <h2>Building a grounded shortlist</h2>
                  <p>
                    Reading your goal · Checking catalog stock · Confirming
                    compatibility · Comparing price
                  </p>
                </div>
              </div>
            )}
            {assistant === "clarification" && (
              <div className="clarify-panel">
                <span className="kicker">One quick question</span>
                <h2>Which setup matters most?</h2>
                <div className="prompt-chips">
                  {[
                    "Mobile essentials",
                    "Work from anywhere",
                    "Desk setup",
                  ].map((item) => (
                    <button
                      key={item}
                      onClick={() => submit(`${query} ${item}`)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {assistant === "failure" && (
              <div className="state-panel error">
                <Icon name="close" />
                <div>
                  <h2>The assistant is unavailable</h2>
                  <p>
                    Your cart is unchanged. Try the request again or browse the
                    catalog below.
                  </p>
                </div>
                <button onClick={() => submit()}>Retry</button>
              </div>
            )}
            {assistant === "nothing" && (
              <div className="state-panel">
                <Icon name="search" />
                <div>
                  <h2>Nothing matched that request</h2>
                  <p>
                    Try a broader goal or browse all products. No substitute
                    compatibility has been assumed.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setQuery("")
                    setAssistant("idle")
                  }}
                >
                  Start over
                </button>
              </div>
            )}
            {assistant === "results" && (
              <div className="assistant-results">
                <div className="results-title">
                  <div>
                    <span className="kicker">Catalog-grounded results</span>
                    <h2>A balanced mobile starter kit</h2>
                    <p>
                      Within the stated budget, in stock, with accessories whose
                      compatibility is explicitly listed.
                    </p>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => onNavigate("bundle")}
                  >
                    Open smart bundle <Icon name="arrow" size={16} />
                  </button>
                </div>
                <div className="recommendation-grid">
                  {recommendations.map((product) => (
                    <article key={product.id} className="recommendation-card">
                      <ProductVisual product={product} />
                      <small>{categoryName(product.category)}</small>
                      <h3>{product.name}</h3>
                      <strong>{formatMoney(product.priceCents)}</strong>
                      <p>
                        {product.id === "phone-a1"
                          ? "A capable base device that leaves budget for essentials."
                          : product.compatibleWith.includes("phone-a1")
                            ? "Confirmed compatible with Phone Aria in the catalog."
                            : "Useful for the requested mobile setup; compatibility is not required."}
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
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="catalog-section">
          <div className="section-heading">
            <div>
              <span className="kicker">One connected catalog</span>
              <h2>Explore the collection</h2>
            </div>
            <p>
              All prices and availability shown here come directly from the
              synthetic demo catalog.
            </p>
          </div>
          <div className="catalog-controls">
            <div className="category-scroll">
              <button
                className={category === "all" ? "active" : ""}
                onClick={() => setCategory("all")}
              >
                All
              </button>
              {categories.map(([id, name]) => (
                <button
                  className={category === id ? "active" : ""}
                  key={id}
                  onClick={() => setCategory(id)}
                >
                  {name}
                </button>
              ))}
            </div>
            <label className="catalog-search">
              <Icon name="search" size={17} />
              <span className="sr-only">Search products</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search catalog"
              />
            </label>
          </div>
          {state === "loading" ? (
            <div className="product-grid">
              {[1, 2, 3, 4].map((item) => (
                <div className="skeleton-card" key={item} />
              ))}
            </div>
          ) : state === "error" ? (
            <div className="empty-panel">
              <h3>Catalog couldn’t be loaded</h3>
              <p>Try again when the source is available.</p>
            </div>
          ) : !filtered.length || state === "empty" ? (
            <div className="empty-panel">
              <Icon name="search" size={28} />
              <h3>No products found</h3>
              <p>Clear the search or choose another category.</p>
              <button
                className="secondary"
                onClick={() => {
                  setSearch("")
                  setCategory("all")
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {filtered.map((product) => (
                <article
                  className={`product-card ${
                    product.stock === 0 ? "out-of-stock" : ""
                  }`}
                  key={product.id}
                >
                  <ProductVisual product={product} />
                  <div className="product-info">
                    <div>
                      <small>{categoryName(product.category)}</small>
                      <h3>{product.name}</h3>
                    </div>
                    <strong>{formatMoney(product.priceCents)}</strong>
                  </div>
                  <p>
                    {product.stock
                      ? `${product.stock} in stock`
                      : "Out of stock"}
                  </p>
                  {product.stock === 0 && (
                    <span className="alternative-note">
                      In-stock alternatives are available in this category.
                    </span>
                  )}
                  <div className="card-actions">
                    <button
                      className={`compare-toggle ${
                        compareIds.includes(product.id) ? "selected" : ""
                      }`}
                      onClick={() => toggleCompare(product.id)}
                      aria-pressed={compareIds.includes(product.id)}
                    >
                      <Icon
                        name={
                          compareIds.includes(product.id) ? "check" : "compare"
                        }
                        size={15}
                      />{" "}
                      Compare
                    </button>
                    <button
                      className="add-button"
                      disabled={!product.stock}
                      onClick={() => onAddToCart(product.id)}
                      aria-label={`Add ${product.name} to cart`}
                    >
                      <Icon name="plus" size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {compareIds.length > 0 && (
        <div className="compare-dock">
          <span>
            <Icon name="compare" size={18} />
            <strong>{compareIds.length}</strong> selected{" "}
            <small>Choose 2–4</small>
          </span>
          <button
            className="primary"
            disabled={compareIds.length < 2}
            onClick={() => {
              onCompare(compareIds)
              setShowCompare(true)
            }}
          >
            Compare products
          </button>
          <button
            className="icon-button"
            aria-label="Clear comparison"
            onClick={() => setCompareIds([])}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      )}

      {showCompare && (
        <div className="modal-scrim" onMouseDown={() => setShowCompare(false)}>
          <section
            className="compare-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="drawer-title">
              <div>
                <span className="kicker">Side-by-side</span>
                <h2>Product comparison</h2>
              </div>
              <button
                className="icon-button"
                aria-label="Close comparison"
                onClick={() => setShowCompare(false)}
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="compare-grid">
              {compared.map((product) => (
                <article key={product.id}>
                  <ProductVisual product={product} />
                  <small>{categoryName(product.category)}</small>
                  <h3>{product.name}</h3>
                  <strong>{formatMoney(product.priceCents)}</strong>
                  <dl>
                    <div>
                      <dt>Stock</dt>
                      <dd>{product.stock || "Out"}</dd>
                    </div>
                    <div>
                      <dt>Compatibility records</dt>
                      <dd>{product.compatibleWith.length}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
            <p className="tradeoff">
              <strong>Trade-off:</strong> Prices vary by{" "}
              {formatMoney(
                Math.max(...compared.map((item) => item.priceCents)) -
                  Math.min(...compared.map((item) => item.priceCents)),
              )}
              . Choose based on category and available stock; the catalog does
              not provide additional technical specifications.
            </p>
          </section>
        </div>
      )}
    </div>
  )
}
