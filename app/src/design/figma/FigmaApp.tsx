"use client"

import { useEffect, useState } from "react"

type View = "store" | "bundle" | "ops" | "owner"
type Category = "All" | "Music" | "Electronics" | "Home" | "Office"
type Status = "Draft" | "Approved" | "Rejected"
type BundleStage = "ready" | "loading" | "error" | "insufficient"

type Product = {
  id: string
  name: string
  category: Exclude<Category, "All">
  price: number
  rating: number
  reviews: number
  stock: number
  image: string
  description: string
  tag?: string
}

const products: Product[] = [
  {
    id: "guitar",
    name: "Sable ST-100 Electric Guitar",
    category: "Music",
    price: 429,
    rating: 4.9,
    reviews: 184,
    stock: 12,
    tag: "Bestseller",
    image:
      "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?auto=format&fit=crop&w=1000&q=85",
    description:
      "A remarkably playable solid-body guitar with a slim maple neck, versatile pickups, and a rich satin finish.",
  },
  {
    id: "amp",
    name: "Northstar 20W Practice Amp",
    category: "Music",
    price: 149,
    rating: 4.8,
    reviews: 96,
    stock: 8,
    tag: "Staff pick",
    image:
      "https://images.unsplash.com/photo-1558098329-a11cff621064?auto=format&fit=crop&w=1000&q=85",
    description:
      "A compact analog amplifier with warm clean tones, responsive overdrive, and a headphone output for quiet practice.",
  },
  {
    id: "headphones",
    name: "Auralist Studio Headphones",
    category: "Electronics",
    price: 89,
    rating: 4.7,
    reviews: 231,
    stock: 21,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85",
    description:
      "Closed-back monitoring headphones tuned for detail, comfort, and late-night practice sessions.",
  },
  {
    id: "cable",
    name: "Braided Instrument Cable",
    category: "Music",
    price: 24,
    rating: 4.8,
    reviews: 340,
    stock: 64,
    image:
      "https://images.unsplash.com/photo-1550291652-6ea9114a47b1?auto=format&fit=crop&w=1000&q=85",
    description:
      "A low-noise, ten-foot instrument cable with durable woven sleeving and gold-plated connectors.",
  },
  {
    id: "keyboard",
    name: "Monogram Mechanical Keyboard",
    category: "Office",
    price: 168,
    rating: 4.9,
    reviews: 127,
    stock: 15,
    tag: "New",
    image:
      "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1000&q=85",
    description:
      "A precision wireless keyboard with tactile switches, solid aluminum construction, and an understated profile.",
  },
  {
    id: "lamp",
    name: "Arc Task Lamp",
    category: "Home",
    price: 118,
    rating: 4.6,
    reviews: 74,
    stock: 6,
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=85",
    description:
      "A sculptural dimmable task light with warm LED illumination and a compact weighted base.",
  },
  {
    id: "speaker",
    name: "Form 02 Wireless Speaker",
    category: "Electronics",
    price: 219,
    rating: 4.8,
    reviews: 153,
    stock: 9,
    image:
      "https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=1000&q=85",
    description:
      "Room-filling sound in a tactile, compact form with 18-hour battery life and multi-room pairing.",
  },
  {
    id: "chair",
    name: "Linea Work Chair",
    category: "Office",
    price: 389,
    rating: 4.7,
    reviews: 88,
    stock: 4,
    image:
      "https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=1000&q=85",
    description:
      "A supportive, beautifully proportioned work chair with a breathable back and intuitive adjustments.",
  },
]

const initialBundle = ["guitar", "amp", "headphones", "cable"]
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    bag: (
      <>
        <path d="M6 8h12l1 13H5L6 8Z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </>
    ),
    arrow: <path d="m9 18 6-6-6-6" />,
    spark: (
      <>
        <path d="m12 3 1.3 4.1L17 9l-3.7 1.9L12 15l-1.3-4.1L7 9l3.7-1.9L12 3Z" />
        <path d="m19 15 .7 2.3L22 18.5l-2.3 1.2L19 22l-.7-2.3-2.3-1.2 2.3-1.2L19 15Z" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m8 10 4 4 4-4" />,
    cube: (
      <>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
      </>
    ),
    activity: (
      <>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19V3" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    external: (
      <>
        <path d="M14 5h5v5" />
        <path d="m19 5-9 9" />
        <path d="M19 14v5H5V5h5" />
      </>
    ),
    grid: (
      <>
        <rect x="4" y="4" width="6" height="6" />
        <rect x="14" y="4" width="6" height="6" />
        <rect x="4" y="14" width="6" height="6" />
        <rect x="14" y="14" width="6" height="6" />
      </>
    ),
  }
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    >
      {paths[name]}
    </svg>
  )
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <button
      className={`logo ${light ? "logo-light" : ""}`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <span className="logo-mark">
        <span />
      </span>
      <span>Aperture</span>
    </button>
  )
}

function StoreHeader({
  active,
  setView,
  search,
  setSearch,
  cartCount,
  openCart,
}: {
  active: View
  setView: (view: View) => void
  search: string
  setSearch: (value: string) => void
  cartCount: number
  openCart: () => void
}) {
  return (
    <header className="store-header">
      <Logo />
      <nav>
        <button
          className={active === "store" ? "active" : ""}
          onClick={() => setView("store")}
        >
          Shop
        </button>
        <button
          className={active === "bundle" ? "active" : ""}
          onClick={() => setView("bundle")}
        >
          Smart bundles
        </button>
        <button
          onClick={() =>
            document
              .getElementById("story")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Our approach
        </button>
      </nav>
      <div className="header-actions">
        <label className="mini-search">
          <Icon name="search" size={17} />
          <input
            aria-label="Search products"
            onChange={(event) => {
              setSearch(event.target.value)
              setView("store")
            }}
            placeholder="Search"
            value={search}
          />
        </label>
        <button
          className="icon-button"
          aria-label={`Shopping bag with ${cartCount} items`}
          onClick={openCart}
        >
          <Icon name="bag" />
          {cartCount > 0 && <span>{cartCount}</span>}
        </button>
        <button className="ops-link" onClick={() => setView("ops")}>
          Operator view <Icon name="arrow" size={15} />
        </button>
      </div>
    </header>
  )
}

function ProductModal({
  product,
  onClose,
  onBundle,
  onCart,
}: {
  product: Product
  onClose: () => void
  onBundle: (id: string) => void
  onCart: (id: string) => void
}) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="product-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close product details"
        >
          <Icon name="close" />
        </button>
        <img src={product.image} alt={product.name} />
        <div className="modal-copy">
          <span className="eyebrow">{product.category} / New season</span>
          <h2>{product.name}</h2>
          <div className="rating">
            ★ {product.rating} <span>{product.reviews} reviews</span>
          </div>
          <p>{product.description}</p>
          <div className="detail-list">
            <div>
              <span>Availability</span>
              <strong>{product.stock} ready to ship</strong>
            </div>
            <div>
              <span>Delivery</span>
              <strong>Complimentary, 2–4 days</strong>
            </div>
            <div>
              <span>Returns</span>
              <strong>30-day home trial</strong>
            </div>
          </div>
          <div className="modal-buy">
            <strong>{currency.format(product.price)}</strong>
            <div>
              <button
                className="secondary-buy"
                onClick={() => onCart(product.id)}
              >
                Add to bag
              </button>
              <button onClick={() => onBundle(product.id)}>
                Add to smart bundle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductCard({
  product,
  onSelect,
}: {
  product: Product
  onSelect: (product: Product) => void
}) {
  return (
    <article className="product-card" onClick={() => onSelect(product)}>
      <div className="product-image">
        {product.tag && <span className="product-tag">{product.tag}</span>}
        <button aria-label={`View ${product.name}`}>
          <Icon name="arrow" size={16} />
        </button>
        <img src={product.image} alt={product.name} />
      </div>
      <div className="product-meta">
        <div>
          <span>{product.category}</span>
          <h3>{product.name}</h3>
        </div>
        <strong>{currency.format(product.price)}</strong>
      </div>
      <div className="product-rating">
        <span>★ {product.rating}</span>
        <span>
          {product.stock < 7 ? `Only ${product.stock} left` : "In stock"}
        </span>
      </div>
    </article>
  )
}

function CartDrawer({
  cart,
  setCart,
  onClose,
}: {
  cart: Record<string, number>
  setCart: React.Dispatch<React.SetStateAction<Record<string, number>>>
  onClose: () => void
}) {
  const items = Object.entries(cart)
    .map(([id, quantity]) => ({
      product: products.find((product) => product.id === id),
      quantity,
    }))
    .filter((item) => item.product) as { product: Product; quantity: number }[]
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )

  const update = (id: string, quantity: number) => {
    setCart((current) => {
      if (quantity < 1) {
        const next = { ...current }
        delete next[id]
        return next
      }
      return { ...current, [id]: quantity }
    })
  }

  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside
        className="replace-drawer cart-drawer"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close bag"
        >
          <Icon name="close" />
        </button>
        <span className="eyebrow">Your selection</span>
        <h2>Shopping bag</h2>
        <p>
          Sample catalog pricing. Checkout is intentionally disabled in this
          prototype.
        </p>
        {items.length ? (
          <>
            <div className="cart-list">
              {items.map(({ product, quantity }) => (
                <article key={product.id}>
                  <img src={product.image} alt="" />
                  <div>
                    <span>{product.category}</span>
                    <strong>{product.name}</strong>
                    <small>{currency.format(product.price)} each</small>
                    <div className="quantity-control">
                      <button
                        aria-label={`Decrease ${product.name} quantity`}
                        onClick={() => update(product.id, quantity - 1)}
                      >
                        −
                      </button>
                      <span>{quantity}</span>
                      <button
                        aria-label={`Increase ${product.name} quantity`}
                        onClick={() => update(product.id, quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <strong>{currency.format(product.price * quantity)}</strong>
                </article>
              ))}
            </div>
            <div className="cart-total">
              <span>Estimated total</span>
              <strong>{currency.format(total)}</strong>
            </div>
            <button
              className="primary-action disabled-action"
              onClick={() =>
                window.alert("Prototype only — no order was placed.")
              }
            >
              Preview checkout
            </button>
            <small className="simulation-label">
              Simulation only · No payment or order will be created
            </small>
          </>
        ) : (
          <div className="cart-empty">
            <Icon name="bag" size={26} />
            <strong>Your bag is considered, but empty.</strong>
            <p>
              Open a product to add an item, or create a complete Smart Bundle.
            </p>
            <button onClick={onClose}>Continue browsing</button>
          </div>
        )}
      </aside>
    </div>
  )
}

function Storefront({
  setView,
  search,
  setSearch,
  addToBundle,
  addToCart,
  cartCount,
  openCart,
}: {
  setView: (view: View) => void
  search: string
  setSearch: (value: string) => void
  addToBundle: (id: string) => void
  addToCart: (id: string) => void
  cartCount: number
  openCart: () => void
}) {
  const [category, setCategory] = useState<Category>("All")
  const [selected, setSelected] = useState<Product | null>(null)

  const filtered = products.filter((product) => {
    const matchesCategory = category === "All" || product.category === category
    const term = search.toLowerCase()
    return (
      matchesCategory &&
      (product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term))
    )
  })

  return (
    <div className="store">
      <StoreHeader
        active="store"
        setView={setView}
        search={search}
        setSearch={setSearch}
        cartCount={cartCount}
        openCart={openCart}
      />
      <main>
        <section className="hero">
          <div className="hero-image" />
          <div className="hero-overlay" />
          <div className="hero-content">
            <span className="eyebrow light">Curated for how you live</span>
            <h1>
              Find your
              <br />
              next obsession.
            </h1>
            <p>
              Considered tools for music, work, and home. Chosen by people—and
              an intelligence that understands what works together.
            </p>
            <button
              onClick={() =>
                document
                  .getElementById("collection")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore the edit <Icon name="arrow" size={16} />
            </button>
          </div>
          <div className="hero-note">
            <span>01</span>
            <p>
              Objects with purpose.
              <br />
              Nothing without a reason.
            </p>
          </div>
        </section>

        <section className="collection" id="collection">
          <div className="section-heading">
            <div>
              <span className="eyebrow">The collection / 2026</span>
              <h2>Everyday, elevated.</h2>
            </div>
            <p>
              A tight edit of beautifully made things, selected for performance,
              longevity, and the pleasure of daily use.
            </p>
          </div>
          <div className="catalog-tools">
            <div className="category-tabs">
              {([
                "All",
                "Music",
                "Electronics",
                "Home",
                "Office",
              ] as Category[]).map((item) => (
                <button
                  className={category === item ? "active" : ""}
                  key={item}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <label className="catalog-search">
              <Icon name="search" />
              <input
                placeholder="Search the collection"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")}>
                  <Icon name="close" size={15} />
                </button>
              )}
            </label>
          </div>
          {filtered.length ? (
            <div className="product-grid">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={setSelected}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span>Nothing matched “{search}”</span>
              <button
                onClick={() => {
                  setSearch("")
                  setCategory("All")
                }}
              >
                Clear search
              </button>
            </div>
          )}
        </section>

        <section className="ai-feature" id="story">
          <div className="ai-copy">
            <span className="eyebrow">
              <Icon name="spark" size={15} /> Aperture intelligence
            </span>
            <h2>
              Better together,
              <br />
              <em>by design.</em>
            </h2>
            <p>
              Tell us what you’re trying to do. Our product intelligence
              considers compatibility, quality, availability, and value—then
              builds the complete setup.
            </p>
            <div className="prompt-box">
              <div>
                <Icon name="spark" size={18} />
                <span>
                  Build me a beginner electric guitar setup under $750
                </span>
              </div>
              <button onClick={() => setView("bundle")}>
                <Icon name="arrow" />
              </button>
            </div>
            <small>
              Recommendations are generated from our curated catalog and
              reviewed for compatibility.
            </small>
          </div>
          <div className="ai-visual">
            <img
              src="https://images.unsplash.com/photo-1781354771866-0bdd0cc09ea9?auto=format&fit=crop&w=1200&q=85"
              alt="Guitar in a warm home music space"
            />
            <div className="floating-product">
              <span>AI matched</span>
              <strong>4 compatible pieces</strong>
              <p>$691 total · all in stock</p>
            </div>
          </div>
        </section>
      </main>
      <footer>
        <Logo />
        <p>Useful things, intelligently assembled.</p>
        <span>© 2026 Aperture Commerce</span>
      </footer>
      {selected && (
        <ProductModal
          product={selected}
          onClose={() => setSelected(null)}
          onBundle={(id) => {
            addToBundle(id)
            setSelected(null)
            setView("bundle")
          }}
          onCart={(id) => {
            addToCart(id)
            setSelected(null)
            openCart()
          }}
        />
      )}
    </div>
  )
}

function BundleBuilder({
  ids,
  setIds,
  quantities,
  setQuantities,
  setView,
  search,
  setSearch,
  cartCount,
  openCart,
}: {
  ids: string[]
  setIds: React.Dispatch<React.SetStateAction<string[]>>
  quantities: Record<string, number>
  setQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>
  setView: (view: View) => void
  search: string
  setSearch: (value: string) => void
  cartCount: number
  openCart: () => void
}) {
  const [replaceId, setReplaceId] = useState<string | null>(null)
  const [goal, setGoal] = useState("Beginner electric guitar setup")
  const [budget, setBudget] = useState(750)
  const [stage, setStage] = useState<BundleStage>("ready")
  const items = ids
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean) as Product[]
  const total = items.reduce(
    (sum, product) => sum + product.price * (quantities[product.id] ?? 1),
    0,
  )
  const replacementOptions = products.filter(
    (product) => !ids.includes(product.id),
  )

  const replace = (newId: string) => {
    setIds((current) => current.map((id) => (id === replaceId ? newId : id)))
    setQuantities((current) => {
      const next = { ...current, [newId]: current[replaceId ?? ""] ?? 1 }
      if (replaceId) delete next[replaceId]
      return next
    })
    setReplaceId(null)
  }

  const generate = () => {
    if (goal.trim().length < 8) {
      setStage("insufficient")
      return
    }
    setStage("loading")
    window.setTimeout(() => {
      if (goal.toLowerCase().includes("error")) {
        setStage("error")
      } else {
        setIds(initialBundle)
        setQuantities({ guitar: 1, amp: 1, headphones: 1, cable: 1 })
        setStage("ready")
      }
    }, 900)
  }

  return (
    <div className="store bundle-page">
      <StoreHeader
        active="bundle"
        setView={setView}
        search={search}
        setSearch={setSearch}
        cartCount={cartCount}
        openCart={openCart}
      />
      <main className="bundle-main">
        <div className="breadcrumb">
          <button onClick={() => setView("store")}>Shop</button>
          <span>/</span>
          <strong>Smart bundle</strong>
        </div>
        <section className="bundle-request" aria-label="Bundle request">
          <div>
            <span className="eyebrow">Describe the outcome</span>
            <label>
              <span>What are you trying to accomplish?</span>
              <input
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
              />
            </label>
          </div>
          <label className="budget-field">
            <span>Maximum budget</span>
            <div>
              <span>$</span>
              <input
                type="number"
                min="100"
                value={budget}
                onChange={(event) => setBudget(Number(event.target.value))}
              />
            </div>
          </label>
          <button onClick={generate} disabled={stage === "loading"}>
            {stage === "loading" ? "Building…" : "Build recommendation"}
            <Icon name="spark" size={16} />
          </button>
          <small>
            Deterministic sample rules · No external AI or inventory service
            connected
          </small>
        </section>
        {stage !== "ready" && (
          <div className={`bundle-state ${stage}`}>
            {stage === "loading" && (
              <>
                <span className="state-spinner" />
                <div>
                  <strong>Checking fit, stock, and budget</strong>
                  <p>Applying sample compatibility and commercial rules.</p>
                </div>
              </>
            )}
            {stage === "error" && (
              <>
                <Icon name="close" />
                <div>
                  <strong>We couldn’t build this bundle</strong>
                  <p>
                    The simulated recommendation service returned an error. Your
                    existing bundle is unchanged.
                  </p>
                </div>
                <button onClick={generate}>Try again</button>
              </>
            )}
            {stage === "insufficient" && (
              <>
                <Icon name="activity" />
                <div>
                  <strong>Tell us a little more</strong>
                  <p>
                    Include the use case or product type so the demo rules have
                    enough information.
                  </p>
                </div>
                <button onClick={() => setStage("ready")}>Edit request</button>
              </>
            )}
          </div>
        )}
        <section className="bundle-intro">
          <div>
            <span className="eyebrow">
              <Icon name="spark" size={14} /> Curated by Aperture intelligence
            </span>
            <h1>
              Your first electric
              <br />
              guitar setup.
            </h1>
          </div>
          <div className="bundle-explanation">
            <p>
              We balanced playability, versatile sound, quiet practice, and
              durability—without adding gear you don’t need yet.
            </p>
            <div>
              <span>{items.length} pieces</span>
              <span>100% compatible</span>
              <span>
                {items.every((item) => item.stock > 0)
                  ? "All in stock"
                  : "Stock exception"}
              </span>
            </div>
          </div>
        </section>

        <div className="bundle-layout">
          <div className="bundle-items">
            {items.length === 0 && (
              <div className="bundle-empty">
                <Icon name="spark" size={28} />
                <h2>Your recommendation is empty</h2>
                <p>
                  Add a compatible product or rebuild the recommendation from
                  your goal.
                </p>
                <button onClick={() => setReplaceId("__add__")}>
                  Browse compatible products
                </button>
              </div>
            )}
            {items.map((product, index) => (
              <article className="bundle-item" key={product.id}>
                <div className="bundle-number">0{index + 1}</div>
                <img src={product.image} alt={product.name} />
                <div className="bundle-item-copy">
                  <span>{product.category}</span>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="reason">
                    <Icon name="spark" size={14} />{" "}
                    <span>
                      <strong>Why it fits:</strong>{" "}
                      {product.id === "guitar"
                        ? "Comfortable neck and versatile pickups make learning easier."
                        : product.id === "amp"
                          ? "Enough character for home use, with room to grow."
                          : product.id === "headphones"
                            ? "Practice clearly at any hour without disturbing anyone."
                            : product.id === "cable"
                              ? "Reliable, low-noise connection with the right length for home."
                              : "Adds a complementary, well-rated component to your setup."}
                    </span>
                  </div>
                </div>
                <div className="bundle-actions">
                  <strong>{currency.format(product.price)}</strong>
                  <span className="stock-dot">In stock · {product.stock}</span>
                  <div className="bundle-quantity">
                    <button
                      onClick={() =>
                        setQuantities((current) => ({
                          ...current,
                          [product.id]: Math.max(
                            1,
                            (current[product.id] ?? 1) - 1,
                          ),
                        }))
                      }
                    >
                      −
                    </button>
                    <span>Qty {quantities[product.id] ?? 1}</span>
                    <button
                      onClick={() =>
                        setQuantities((current) => ({
                          ...current,
                          [product.id]: Math.min(
                            product.stock,
                            (current[product.id] ?? 1) + 1,
                          ),
                        }))
                      }
                    >
                      +
                    </button>
                  </div>
                  <button onClick={() => setReplaceId(product.id)}>
                    Replace
                  </button>
                  <button
                    className="remove"
                    onClick={() => (
                      setIds((current) =>
                        current.filter((id) => id !== product.id),
                      ),
                      setQuantities((current) => {
                        const next = { ...current }
                        delete next[product.id]
                        return next
                      })
                    )}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
            <button
              className="add-item"
              onClick={() => setReplaceId("__add__")}
            >
              <span>
                <Icon name="plus" />
              </span>
              <div>
                <strong>Add another piece</strong>
                <p>Browse compatible recommendations</p>
              </div>
              <Icon name="arrow" />
            </button>
          </div>
          <aside className="bundle-summary">
            <div className="summary-top">
              <span className="eyebrow">Bundle summary</span>
              <span className="match-ring">
                {items.length ? 98 : 0}
                <small>%</small>
              </span>
            </div>
            <h2>
              A complete setup,
              <br />
              ready to play.
            </h2>
            <div className="summary-lines">
              <div>
                <span>{items.length} products</span>
                <span>{currency.format(total)}</span>
              </div>
              <div>
                <span>Shipping</span>
                <span>Complimentary</span>
              </div>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>{currency.format(total)}</strong>
            </div>
            <button
              className="primary-action"
              disabled={!items.length}
              onClick={() => setView("ops")}
            >
              Send for review <Icon name="arrow" size={17} />
            </button>
            <p className="secure-note">
              <Icon name="shield" size={15} /> This demo submits to the
              simulated operator workspace.
            </p>
            <div className="summary-checks">
              <div>
                <Icon name="check" />
                <span>
                  <strong>Compatibility verified</strong>
                  <small>All connections and use cases align</small>
                </span>
              </div>
              <div>
                <Icon name="check" />
                <span>
                  <strong>
                    {total <= budget
                      ? `Within your $${budget} budget`
                      : `Over your $${budget} budget`}
                  </strong>
                  <small>
                    {total <= budget
                      ? `${currency.format(budget - total)} left for future additions`
                      : `${currency.format(total - budget)} above target`}
                  </small>
                </span>
              </div>
              <div>
                <Icon name="check" />
                <span>
                  <strong>Ships together</strong>
                  <small>Estimated arrival in 2–4 days</small>
                </span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {replaceId && (
        <div className="drawer-backdrop" onMouseDown={() => setReplaceId(null)}>
          <aside
            className="replace-drawer"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setReplaceId(null)}>
              <Icon name="close" />
            </button>
            <span className="eyebrow">
              <Icon name="spark" size={14} /> Compatible alternatives
            </span>
            <h2>
              {replaceId === "__add__"
                ? "Add to your setup"
                : "Choose a replacement"}
            </h2>
            <p>
              These products work with the rest of your bundle and are available
              now.
            </p>
            <div className="replacement-list">
              {replacementOptions.map((product) => (
                <button
                  key={product.id}
                  onClick={() =>
                    replaceId === "__add__"
                      ? (setIds((current) => [...current, product.id]),
                        setQuantities((current) => ({
                          ...current,
                          [product.id]: 1,
                        })),
                        setReplaceId(null))
                      : replace(product.id)
                  }
                >
                  <img src={product.image} alt="" />
                  <span>
                    <small>{product.category}</small>
                    <strong>{product.name}</strong>
                    <em>{currency.format(product.price)}</em>
                  </span>
                  <Icon name="plus" />
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

function OpsWorkspace({
  ids,
  setIds,
  quantities,
  setView,
}: {
  ids: string[]
  setIds: React.Dispatch<React.SetStateAction<string[]>>
  quantities: Record<string, number>
  setView: (view: View) => void
}) {
  const [status, setStatus] = useState<Status>("Draft")
  const [tab, setTab] = useState<"Proposal" | "Validation" | "Activity">(
    "Proposal",
  )
  const [showEdit, setShowEdit] = useState(false)
  const [toast, setToast] = useState("")
  const items = ids
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean) as Product[]
  const total = items.reduce(
    (sum, product) => sum + product.price * (quantities[product.id] ?? 1),
    0,
  )
  const margin = Math.round(total * 0.31)

  const decide = (next: Status) => {
    setStatus(next)
    setToast(
      next === "Approved"
        ? "Proposal approved for customer review"
        : "Proposal returned to draft",
    )
    window.setTimeout(() => setToast(""), 3200)
  }

  return (
    <div className="ops">
      <aside className="ops-sidebar">
        <Logo light />
        <nav>
          <button
            className={tab === "Activity" ? "active" : ""}
            onClick={() => setTab("Activity")}
          >
            <Icon name="grid" /> Work queue <span>8</span>
          </button>
          <button
            className={tab === "Proposal" ? "active" : ""}
            onClick={() => setTab("Proposal")}
          >
            <Icon name="spark" /> AI proposals <span>3</span>
          </button>
          <button
            className={tab === "Validation" ? "active" : ""}
            onClick={() => setTab("Validation")}
          >
            <Icon name="cube" /> Inventory
          </button>
          <button onClick={() => setView("owner")}>
            <Icon name="activity" /> Performance
          </button>
        </nav>
        <div className="side-bottom">
          <button onClick={() => setView("store")}>
            <Icon name="external" /> Open storefront
          </button>
          <button onClick={() => setView("owner")}>
            <Icon name="shield" /> Owner control
          </button>
          <div className="operator">
            <span>MC</span>
            <div>
              <strong>Maya Chen</strong>
              <small>Commercial ops</small>
            </div>
            <Icon name="chevron" />
          </div>
        </div>
      </aside>
      <div className="ops-shell">
        <header className="ops-header">
          <div>
            <span>Commercial operations</span>
            <strong>/</strong>
            <span>Proposal AP-1048</span>
          </div>
          <div className="ops-header-actions">
            <span className="live-dot">Systems operational</span>
            <button aria-label="Search">
              <Icon name="search" />
            </button>
            <span className="avatar">MC</span>
          </div>
        </header>
        <main className="ops-main">
          <div className="ops-title-row">
            <div>
              <div className="status-line">
                <span className={`status-badge ${status.toLowerCase()}`}>
                  {status}
                </span>
                <span>Created today at 09:42</span>
              </div>
              <h1>Beginner electric guitar setup</h1>
              <p>
                AI-assisted proposal · Customer request from Aperture storefront
              </p>
            </div>
            <div className="decision-actions">
              <button className="reject" onClick={() => decide("Rejected")}>
                Reject
              </button>
              <button className="approve" onClick={() => decide("Approved")}>
                <Icon name="check" size={17} /> Approve proposal
              </button>
            </div>
          </div>

          <div className="ops-metrics">
            <div>
              <span>Proposal value</span>
              <strong>{currency.format(total)}</strong>
              <small>Customer budget: $750</small>
            </div>
            <div>
              <span>Estimated margin</span>
              <strong>{currency.format(margin)}</strong>
              <small className="positive">31.0% · Healthy</small>
            </div>
            <div>
              <span>Inventory coverage</span>
              <strong>
                {items.length}/{items.length}
              </strong>
              <small className="positive">All items available</small>
            </div>
            <div>
              <span>Confidence</span>
              <strong>98%</strong>
              <small>12 checks passed</small>
            </div>
          </div>

          <div className="ops-content">
            <section className="proposal-panel">
              <div className="panel-tabs">
                {(["Proposal", "Validation", "Activity"] as const).map(
                  (item) => (
                    <button
                      className={tab === item ? "active" : ""}
                      key={item}
                      onClick={() => setTab(item)}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
              {tab === "Proposal" && (
                <>
                  <div className="panel-title">
                    <div>
                      <h2>Proposed bundle</h2>
                      <p>
                        {items.length} line items · prices locked for 24 hours
                      </p>
                    </div>
                    <button onClick={() => setShowEdit(true)}>
                      Edit proposal
                    </button>
                  </div>
                  <div className="ops-table">
                    <div className="table-head">
                      <span>Product</span>
                      <span>Inventory</span>
                      <span>Unit price</span>
                      <span>Margin</span>
                      <span />
                    </div>
                    {items.map((product) => (
                      <div className="table-row" key={product.id}>
                        <div className="table-product">
                          <img src={product.image} alt="" />
                          <span>
                            <strong>{product.name}</strong>
                            <small>
                              SKU · {product.id.toUpperCase()}-01 · Qty{" "}
                              {quantities[product.id] ?? 1}
                            </small>
                          </span>
                        </div>
                        <span
                          className={
                            product.stock < 7 ? "stock-low" : "stock-ok"
                          }
                        >
                          <i />
                          {product.stock} units
                        </span>
                        <strong>
                          {currency.format(
                            product.price * (quantities[product.id] ?? 1),
                          )}
                        </strong>
                        <span>
                          {product.id === "cable"
                            ? "42%"
                            : product.id === "guitar"
                              ? "28%"
                              : "32%"}
                        </span>
                        <button
                          onClick={() =>
                            setIds((current) =>
                              current.filter((id) => id !== product.id),
                            )
                          }
                        >
                          •••
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="table-total">
                    <span>Bundle total</span>
                    <strong>{currency.format(total)}</strong>
                  </div>
                </>
              )}
              {tab === "Validation" && (
                <div className="validation-view">
                  <div className="validation-summary">
                    <Icon name="shield" size={28} />
                    <div>
                      <h2>All commercial checks passed</h2>
                      <p>
                        Validated against live prototype rules at 09:43 today.
                      </p>
                    </div>
                    <strong>12/12</strong>
                  </div>
                  {[
                    [
                      "Product compatibility",
                      "Audio connections, power, and intended use align across all items.",
                    ],
                    [
                      "Inventory availability",
                      `${items.length} of ${items.length} products have sufficient available-to-promise stock.`,
                    ],
                    [
                      "Pricing integrity",
                      "Storefront prices match current catalog prices. No unauthorized discounts.",
                    ],
                    [
                      "Margin threshold",
                      "Estimated 31.0% margin exceeds the category floor of 24%.",
                    ],
                  ].map(([title, body]) => (
                    <div className="validation-row" key={title}>
                      <span>
                        <Icon name="check" />
                      </span>
                      <div>
                        <strong>{title}</strong>
                        <p>{body}</p>
                      </div>
                      <small>Passed</small>
                    </div>
                  ))}
                </div>
              )}
              {tab === "Activity" && (
                <div className="activity-view">
                  {[
                    [
                      "09:44",
                      status === "Draft"
                        ? "Awaiting operator decision"
                        : `Proposal ${status.toLowerCase()} by Maya Chen`,
                      status === "Draft" ? "Current state" : "Operator action",
                    ],
                    [
                      "09:43",
                      "Automated validation completed",
                      "12 policy and commercial checks passed",
                    ],
                    [
                      "09:42",
                      "Proposal AP-1048 generated",
                      "Aperture Intelligence",
                    ],
                    [
                      "09:41",
                      "Customer submitted bundle for review",
                      "Storefront session #82F1",
                    ],
                  ].map(([time, title, body], index) => (
                    <div className="activity-row" key={time}>
                      <time>{time}</time>
                      <span className={index === 0 ? "current" : ""} />
                      <div>
                        <strong>{title}</strong>
                        <p>{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <aside className="insight-panel">
              <div className="insight-title">
                <span>
                  <Icon name="spark" size={15} /> AI rationale
                </span>
                <small>High confidence</small>
              </div>
              <h3>Why this bundle works</h3>
              <p>
                This proposal prioritizes a low-friction first experience while
                preserving room for the customer to grow.
              </p>
              <div className="rationale-list">
                <div>
                  <span>01</span>
                  <p>
                    <strong>Right level of investment</strong>The guitar
                    receives most of the budget; accessories remain dependable
                    and replaceable.
                  </p>
                </div>
                <div>
                  <span>02</span>
                  <p>
                    <strong>No hidden dependencies</strong>Everything required
                    to start playing is included, with no adapters or extra
                    power supplies.
                  </p>
                </div>
                <div>
                  <span>03</span>
                  <p>
                    <strong>Low fulfillment risk</strong>All items can ship from
                    the same region with comfortable stock coverage.
                  </p>
                </div>
              </div>
              <button onClick={() => setTab("Validation")}>
                View all validations <Icon name="arrow" size={15} />
              </button>
              <div className="prototype-note">
                <strong>Prototype mode</strong>
                <p>
                  Actions update local interface state only. No orders,
                  inventory, or customer messages are created.
                </p>
              </div>
            </aside>
          </div>
        </main>
      </div>
      {toast && (
        <div className="toast">
          <Icon name="check" /> {toast}
        </div>
      )}
      {showEdit && (
        <div
          className="drawer-backdrop ops-drawer-backdrop"
          onMouseDown={() => setShowEdit(false)}
        >
          <aside
            className="replace-drawer ops-edit"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setShowEdit(false)}>
              <Icon name="close" />
            </button>
            <span className="eyebrow">Proposal editor</span>
            <h2>Edit line items</h2>
            <p>
              Changes remain in this prototype and immediately recalculate
              proposal totals.
            </p>
            <div className="edit-items">
              {products.map((product) => {
                const added = ids.includes(product.id)
                return (
                  <div key={product.id}>
                    <img src={product.image} alt="" />
                    <span>
                      <strong>{product.name}</strong>
                      <small>
                        {currency.format(product.price)} · {product.stock} in
                        stock
                      </small>
                    </span>
                    <button
                      className={added ? "added" : ""}
                      onClick={() =>
                        setIds((current) =>
                          added
                            ? current.filter((id) => id !== product.id)
                            : [...current, product.id],
                        )
                      }
                    >
                      {added ? "Remove" : "Add"}
                    </button>
                  </div>
                )
              })}
            </div>
            <button
              className="primary-action"
              onClick={() => setShowEdit(false)}
            >
              Save proposal · {currency.format(total)}
            </button>
          </aside>
        </div>
      )}
    </div>
  )
}

function OwnerWorkspace({ setView }: { setView: (view: View) => void }) {
  const [section, setSection] =
    useState<"Overview" | "Inventory" | "Policies" | "Activity">("Overview")
  const [policies, setPolicies] = useState({
    margin: true,
    stock: true,
    discount: false,
  })
  const [notice, setNotice] = useState("")

  const savePolicy = (key: keyof typeof policies) => {
    setPolicies((current) => ({ ...current, [key]: !current[key] }))
    setNotice("Sample policy updated locally")
    window.setTimeout(() => setNotice(""), 2500)
  }

  const risks = products
    .filter((product) => product.stock < 10)
    .sort((a, b) => a.stock - b.stock)

  return (
    <div className="ops owner-workspace">
      <aside className="ops-sidebar">
        <Logo light />
        <div className="role-label">Owner control</div>
        <nav>
          {(["Overview", "Inventory", "Policies", "Activity"] as const).map(
            (item) => (
              <button
                className={section === item ? "active" : ""}
                key={item}
                onClick={() => setSection(item)}
              >
                <Icon
                  name={
                    item === "Overview"
                      ? "grid"
                      : item === "Inventory"
                        ? "cube"
                        : item === "Policies"
                          ? "shield"
                          : "activity"
                  }
                />
                {item}
                {item === "Inventory" && <span>{risks.length}</span>}
              </button>
            ),
          )}
        </nav>
        <div className="side-bottom">
          <button onClick={() => setView("ops")}>
            <Icon name="arrow" /> Operator workspace
          </button>
          <button onClick={() => setView("store")}>
            <Icon name="external" /> Open storefront
          </button>
          <div className="operator">
            <span>AR</span>
            <div>
              <strong>Alex Rivera</strong>
              <small>Business owner</small>
            </div>
            <Icon name="chevron" />
          </div>
        </div>
      </aside>
      <div className="ops-shell">
        <header className="ops-header">
          <div>
            <span>Aperture control center</span>
            <strong>/</strong>
            <span>{section}</span>
          </div>
          <div className="ops-header-actions">
            <span className="sample-data-label">Sample business data</span>
            <span className="avatar">AR</span>
          </div>
        </header>
        <main className="ops-main owner-main">
          <div className="owner-heading">
            <div>
              <span className="eyebrow">Business owner / {section}</span>
              <h1>
                {section === "Overview"
                  ? "Commercial health"
                  : section === "Inventory"
                    ? "Inventory exposure"
                    : section === "Policies"
                      ? "Decision policies"
                      : "Operational record"}
              </h1>
              <p>
                {section === "Overview"
                  ? "A decision-focused view of growth, risk, and work requiring human attention."
                  : section === "Policies"
                    ? "Set the boundaries automation must respect. Sensitive actions still require explicit approval."
                    : "Synthetic demonstration data for interface evaluation only."}
              </p>
            </div>
            <button
              className="owner-period"
              onClick={() => {
                setNotice("Date-range selector previewed")
                setTimeout(() => setNotice(""), 2500)
              }}
            >
              Last 30 days <Icon name="chevron" size={14} />
            </button>
          </div>

          {section === "Overview" && (
            <>
              <div className="owner-kpis">
                <article>
                  <span>Gross merchandise value</span>
                  <strong>$84,620</strong>
                  <small>↑ 12.4% vs prior period</small>
                  <div className="micro-bars">
                    {[35, 48, 42, 61, 55, 72, 68, 83, 77, 91, 86, 96].map(
                      (height, index) => (
                        <i key={index} style={{ height: `${height}%` }} />
                      ),
                    )}
                  </div>
                </article>
                <article>
                  <span>AI-assisted revenue</span>
                  <strong>$31,480</strong>
                  <small>37.2% of total GMV</small>
                  <div className="progress-track">
                    <i />
                  </div>
                </article>
                <article>
                  <span>Contribution margin</span>
                  <strong>29.8%</strong>
                  <small className="positive">2.1 pts above floor</small>
                  <div className="margin-mark">
                    <i />
                    <span>24% floor</span>
                  </div>
                </article>
                <article className="attention-kpi">
                  <span>Needs attention</span>
                  <strong>7</strong>
                  <small>3 approvals · 4 stock risks</small>
                  <button onClick={() => setSection("Activity")}>
                    Review now <Icon name="arrow" size={14} />
                  </button>
                </article>
              </div>
              <div className="owner-grid">
                <section className="owner-panel">
                  <div className="owner-panel-title">
                    <div>
                      <h2>Decision queue</h2>
                      <p>Commercial actions waiting for accountable review</p>
                    </div>
                    <button onClick={() => setView("ops")}>
                      Open operator workspace
                    </button>
                  </div>
                  {[
                    [
                      "AP-1048",
                      "Beginner electric guitar setup",
                      "$691",
                      "Bundle approval",
                      "High confidence",
                    ],
                    [
                      "PR-2204",
                      "Weekend pricing exception",
                      "−8%",
                      "Policy exception",
                      "Review needed",
                    ],
                    [
                      "PO-0182",
                      "Linea Work Chair replenishment",
                      "24 units",
                      "Purchase suggestion",
                      "Stock risk",
                    ],
                  ].map((row) => (
                    <button
                      className="decision-row"
                      key={row[0]}
                      onClick={() =>
                        row[0] === "AP-1048"
                          ? setView("ops")
                          : setSection("Activity")
                      }
                    >
                      <span>
                        <small>{row[0]}</small>
                        <strong>{row[1]}</strong>
                      </span>
                      <strong>{row[2]}</strong>
                      <span>
                        <small>{row[3]}</small>
                        <em>{row[4]}</em>
                      </span>
                      <Icon name="arrow" size={15} />
                    </button>
                  ))}
                </section>
                <aside className="risk-panel">
                  <div className="owner-panel-title">
                    <div>
                      <h2>Inventory risk</h2>
                      <p>Coverage below 14 days</p>
                    </div>
                  </div>
                  {risks.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => setSection("Inventory")}
                    >
                      <img src={product.image} alt="" />
                      <span>
                        <strong>{product.name}</strong>
                        <small>
                          {product.stock} units ·{" "}
                          {product.stock < 5 ? "Critical" : "Watch"}
                        </small>
                      </span>
                      <div>
                        <i
                          style={{
                            width: `${Math.max(18, product.stock * 8)}%`,
                          }}
                        />
                      </div>
                    </button>
                  ))}
                </aside>
              </div>
            </>
          )}

          {section === "Inventory" && (
            <section className="owner-panel inventory-control">
              <div className="owner-panel-title">
                <div>
                  <h2>Catalog inventory</h2>
                  <p>Sample available-to-promise stock and risk thresholds</p>
                </div>
                <span>{products.length} active products</span>
              </div>
              <div className="inventory-head">
                <span>Product</span>
                <span>Available</span>
                <span>Coverage</span>
                <span>Risk</span>
                <span>Suggested action</span>
              </div>
              {products.map((product) => (
                <div className="inventory-line" key={product.id}>
                  <div>
                    <img src={product.image} alt="" />
                    <span>
                      <strong>{product.name}</strong>
                      <small>
                        {product.id.toUpperCase()}-01 · {product.category}
                      </small>
                    </span>
                  </div>
                  <strong>{product.stock}</strong>
                  <span>
                    {Math.max(4, Math.round(product.stock * 1.7))} days
                  </span>
                  <em
                    className={
                      product.stock < 5
                        ? "critical"
                        : product.stock < 10
                          ? "watch"
                          : "healthy"
                    }
                  >
                    {product.stock < 5
                      ? "Critical"
                      : product.stock < 10
                        ? "Watch"
                        : "Healthy"}
                  </em>
                  <button
                    onClick={() => {
                      setNotice("Replenishment suggestion opened in prototype")
                      setTimeout(() => setNotice(""), 2500)
                    }}
                  >
                    Review
                  </button>
                </div>
              ))}
            </section>
          )}

          {section === "Policies" && (
            <div className="policy-layout">
              <section className="owner-panel">
                <div className="owner-panel-title">
                  <div>
                    <h2>Commercial guardrails</h2>
                    <p>
                      Applied by deterministic sample rules before proposals
                      reach an operator
                    </p>
                  </div>
                </div>
                {[
                  [
                    "margin",
                    "Margin floor approval",
                    "Require owner review when estimated margin falls below 24%.",
                    "24%",
                  ],
                  [
                    "stock",
                    "Low-stock protection",
                    "Prevent recommendations that would leave fewer than 3 units available.",
                    "3 units",
                  ],
                  [
                    "discount",
                    "Autonomous bundle discount",
                    "Allow qualifying bundles to receive up to 5% without manual review.",
                    "5%",
                  ],
                ].map(([key, title, description, value]) => (
                  <div className="policy-row" key={key}>
                    <div>
                      <strong>{title}</strong>
                      <p>{description}</p>
                    </div>
                    <span>{value}</span>
                    <button
                      className={
                        policies[(key as keyof typeof policies)] ? "on" : ""
                      }
                      onClick={() => savePolicy(key as keyof typeof policies)}
                      aria-label={`Toggle ${title}`}
                    >
                      <i />
                    </button>
                  </div>
                ))}
              </section>
              <aside className="policy-note">
                <Icon name="shield" size={25} />
                <h3>Human authority remains explicit</h3>
                <p>
                  Policy changes in this prototype affect local interface state
                  only. Production policy APIs should require authentication,
                  audit logging, versioning, and approval permissions.
                </p>
                <button onClick={() => setSection("Activity")}>
                  View policy history
                </button>
              </aside>
            </div>
          )}

          {section === "Activity" && (
            <section className="owner-panel owner-activity">
              <div className="owner-panel-title">
                <div>
                  <h2>Business activity</h2>
                  <p>
                    Human decisions and automated recommendations shown together
                  </p>
                </div>
              </div>
              {[
                [
                  "Today, 09:44",
                  "Maya Chen approved proposal AP-1048",
                  "Human decision",
                  "Bundle value $691 · customer review unlocked",
                ],
                [
                  "Today, 09:43",
                  "Commercial validation completed",
                  "Automated check",
                  "12 deterministic rules passed",
                ],
                [
                  "Yesterday, 16:18",
                  "Alex Rivera changed margin floor",
                  "Owner policy",
                  "Threshold changed from 22% to 24%",
                ],
                [
                  "Yesterday, 14:02",
                  "Low-stock risk detected for Linea Work Chair",
                  "Automated signal",
                  "4 units available · 7 days coverage",
                ],
              ].map(([time, title, type, detail]) => (
                <div className="owner-activity-row" key={time + title}>
                  <time>{time}</time>
                  <span />
                  <div>
                    <strong>{title}</strong>
                    <p>{detail}</p>
                  </div>
                  <em>{type}</em>
                </div>
              ))}
            </section>
          )}
        </main>
      </div>
      {notice && (
        <div className="toast">
          <Icon name="check" /> {notice} · not persisted
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [view, setView] = useState<View>("store")
  const [bundleIds, setBundleIds] = useState(initialBundle)
  const [bundleQuantities, setBundleQuantities] =
    useState<Record<string, number>>({
      guitar: 1,
      amp: 1,
      headphones: 1,
      cable: 1,
    })
  const [cart, setCart] = useState<Record<string, number>>({})
  const [cartOpen, setCartOpen] = useState(false)
  const [search, setSearch] = useState("")
  const cartCount = Object.values(cart).reduce(
    (sum, quantity) => sum + quantity,
    0,
  )

  const addToBundle = (id: string) => {
    setBundleIds((current) =>
      current.includes(id) ? current : [...current, id],
    )
    setBundleQuantities((current) => ({ ...current, [id]: current[id] ?? 1 }))
  }

  const addToCart = (id: string) => {
    setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }))
  }

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [view])

  if (view === "bundle") {
    return (
      <>
        <BundleBuilder
          ids={bundleIds}
          setIds={setBundleIds}
          quantities={bundleQuantities}
          setQuantities={setBundleQuantities}
          setView={setView}
          search={search}
          setSearch={setSearch}
          cartCount={cartCount}
          openCart={() => setCartOpen(true)}
        />
        {cartOpen && (
          <CartDrawer
            cart={cart}
            setCart={setCart}
            onClose={() => setCartOpen(false)}
          />
        )}
      </>
    )
  }
  if (view === "ops") {
    return (
      <OpsWorkspace
        ids={bundleIds}
        setIds={setBundleIds}
        quantities={bundleQuantities}
        setView={setView}
      />
    )
  }
  if (view === "owner") return <OwnerWorkspace setView={setView} />
  return (
    <>
      <Storefront
        setView={setView}
        search={search}
        setSearch={setSearch}
        addToBundle={addToBundle}
        addToCart={addToCart}
        cartCount={cartCount}
        openCart={() => setCartOpen(true)}
      />
      {cartOpen && (
        <CartDrawer
          cart={cart}
          setCart={setCart}
          onClose={() => setCartOpen(false)}
        />
      )}
    </>
  )
}
