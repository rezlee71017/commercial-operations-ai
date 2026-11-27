import { useMemo, useState } from "react"
import type { PublicProduct, View } from "../../types"
import { categoryName, formatMoney } from "../../data/demo"
import Brand from "../shared/Brand"
import Icon from "../shared/Icon"
import { DemoBadge } from "../shared/StatusBadge"

type Props = {
  products: PublicProduct[]
  cartCount: number
  onNavigate: (view: View) => void
  onAddToCart: (productId: string) => void
  onOpenCart: () => void
}

type Turn = { id: number; role: "assistant" | "user"; text: string; productIds?: string[] }

const suggestions = [
  "Find a phone under $700",
  "Build a portable work setup",
  "Compare headphones for commuting",
]

export default function AIChat({ products, cartCount, onNavigate, onAddToCart, onOpenCart }: Props) {
  const [input, setInput] = useState("")
  const [turns, setTurns] = useState<Turn[]>([
    { id: 1, role: "assistant", text: "Hi, I’m REZLEE’s shopping assistant. Tell me what you’re trying to accomplish, your budget, or the products you’re considering. I’ll work from the current catalog and clearly distinguish confirmed compatibility from unknown details." },
  ])
  const [nextId, setNextId] = useState(2)

  const productIndex = useMemo(() => new Map(products.map((product) => [product.id, product] as const)), [products])

  const send = (raw = input) => {
    const query = raw.trim()
    if (!query) return
    const normalized = query.toLowerCase()
    const budgetMatch = normalized.match(/(?:under|below|less than|budget(?: of)?|up to)\s*\$?([\d,]+)/)
    const budgetCents = budgetMatch ? Number(budgetMatch[1].replace(/,/g, "")) * 100 : Number.POSITIVE_INFINITY
    const terms = normalized.split(/[^a-z0-9]+/).filter((term) => term.length > 2 && !["under", "below", "with", "for", "the", "and", "setup", "find", "need", "want", "best", "build"].includes(term))
    const workIntent = /work|portable|desk/.test(normalized)
    const audioIntent = /audio|headphone|earbud|commut/.test(normalized)
    const matched = products.filter((product) => {
      const text = `${product.name} ${categoryName(product.category)}`.toLowerCase()
      const categoryHit = terms.some((term) => text.includes(term) || (term === "headphones" && text.includes("headphone")))
      const workRelated = workIntent && ["laptop", "dock", "sleeve", "stand", "webcam", "mouse", "keyboard"].includes(product.category)
      const audioRelated = audioIntent && product.category === "audio"
      const genericRequest = terms.length === 0 || /everyday/.test(normalized)
      return product.stock > 0 && product.priceCents <= budgetCents && (categoryHit || workRelated || audioRelated || genericRequest)
    }).slice(0, 3)
    const hasIntent = /phone|laptop|charger|cable|audio|headphone|earbud|keyboard|mouse|webcam|watch|power|work|desk|commut|portable|compare|setup/.test(normalized)
    const resultIds = matched.length ? matched.map((product) => product.id) : []
    const response = !hasIntent && terms.length <= 2
      ? "I can narrow this down. What matters most: portability, everyday use, work productivity, or staying within a strict budget?"
      : matched.length
        ? `I found ${matched.length} in-stock catalog option${matched.length === 1 ? "" : "s"} that fit the request and the stated budget. These are catalog-grounded suggestions, not live AI research. I’ll only mark compatibility as confirmed when the catalog explicitly records it.`
        : "I couldn’t find an exact in-stock match within those constraints. Try a broader product type or a higher budget. I haven’t assumed that any substitute is compatible."
    setTurns((current) => [...current, { id: nextId, role: "user", text: query }, { id: nextId + 1, role: "assistant", text: response, productIds: resultIds }])
    setNextId((current) => current + 2)
    setInput("")
  }

  return (
    <div className="ai-room">
      <header className="ai-room-header">
        <button className="brand-button" onClick={() => onNavigate("store")}><Brand /></button>
        <div className="ai-mode-pill"><Icon name="spark" size={15} /> AI Mode</div>
        <DemoBadge />
        <button className="text-button" onClick={() => onNavigate("store")}>Shop</button>
        <button className="icon-button cart-button" onClick={onOpenCart} aria-label={`Open cart with ${cartCount} items`}><Icon name="bag" /><span>{cartCount}</span></button>
      </header>
      <main className="ai-room-main">
        <section className="ai-room-intro">
          <span className="kicker"><Icon name="spark" size={15} /> Your shopping workspace</span>
          <h1>Let’s find the right fit.</h1>
          <p>Describe your goal. Explore options, compare trade-offs, and build a setup from one connected catalog.</p>
          <div className="ai-prompts">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => send(suggestion)}>{suggestion}</button>)}</div>
        </section>
        <section className="ai-thread" aria-live="polite">
          {turns.map((turn) => (
            <article className={`ai-message ${turn.role}`} key={turn.id}>
              <span className="ai-message-badge">{turn.role === "assistant" ? "R" : "You"}</span>
              <div className="ai-message-body">
                <p>{turn.text}</p>
                {turn.productIds?.length ? (
                  <div className="ai-results">
                    {turn.productIds.map((id) => {
                      const product = productIndex.get(id)
                      if (!product) return null
                      return <article className="ai-product-card" key={id}>
                        <div className="ai-product-visual"><Icon name="inventory" size={32} /></div>
                        <small>{categoryName(product.category)} · {product.stock} in stock</small>
                        <h3>{product.name}</h3>
                        <strong>{formatMoney(product.priceCents)}</strong>
                        <button onClick={() => onAddToCart(product.id)}>Add to cart</button>
                      </article>
                    })}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </section>
        <form className="ai-compose" onSubmit={(event) => { event.preventDefault(); send() }}>
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask REZLEE about a product, setup, budget, or comparison…" aria-label="Message REZLEE shopping assistant" />
          <button type="submit" aria-label="Send message"><Icon name="arrow" size={18} /> Send</button>
        </form>
        <p className="demo-note"><Icon name="shield" size={14} /> Catalog demo · deterministic matching · no live AI provider or checkout is connected</p>
      </main>
    </div>
  )
}
