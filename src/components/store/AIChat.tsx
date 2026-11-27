import { useMemo, useState, useRef, useEffect } from "react"
import type { MerchantProduct } from "../../types"
import { sendMessage } from "../../data/chatAdapter"
import { trackEvent } from "../../data/events"
import { money } from "../../data/demo"
import { Wordmark, Photo, Button } from "../shared/UI"

type Msg = {
  id: string
  role: "assistant" | "user"
  text?: string
  productIds?: string[]
  reasons?: Record<string, string>
  noMatch?: boolean
  comparisonIds?: string[]
  answers?: string[]
}

const SUGGESTIONS = [
  "Find a phone under $700",
  "Build a portable work setup",
  "Compare headphones for commuting",
]

export default function AIChat({
  products,
  cartCount,
  onAddToCart,
  onCompare,
  onView,
  onShop,
  initialMessage = "",
  onInitialMessageHandled,
}: {
  products: MerchantProduct[]
  cartCount: number
  onAddToCart: (id: string) => void
  onCompare: (id: string) => void
  onView: (id: string) => void
  onShop: () => void
  initialMessage?: string
  onInitialMessageHandled?: () => void
}) {
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi, I'm REZLEE's shopping assistant. Tell me what you're trying to accomplish, your budget, or the products you're considering. I'll work from the current catalog and clearly distinguish confirmed compatibility from unknown details.",
    },
  ])
  const [project, setProject] = useState<string[]>([])
  const [dark, setDark] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const byId = useMemo(() => new Map(products.map(p => [p.id, p])), [products])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, busy])

  const send = async (value = input) => {
    if (!value.trim() || busy) return
    const text = value.trim()
    setInput("")
    setBusy(true)
    setError("")
    setMessages(m => [...m, { id: `u${Date.now()}`, role: "user", text }])
    try {
      const response = await sendMessage({ sessionId: "local-preview", message: text, context: { cartIds: [] } })
      const next: Msg[] = []
      for (const b of response.blocks) {
        if (b.type === "text") next.push({ id: `a${Date.now()}-${next.length}`, role: "assistant", text: b.text })
        if (b.type === "product_cards")
          next.push({ id: `p${Date.now()}`, role: "assistant", productIds: b.productIds, reasons: b.reasons })
        if (b.type === "comparison_table")
          next.push({ id: `c${Date.now()}`, role: "assistant", comparisonIds: b.productIds })
        if (b.type === "no_match")
          next.push({ id: `n${Date.now()}`, role: "assistant", text: b.text, productIds: b.alternativeIds, noMatch: true })
        if (b.type === "clarifying_question")
          next.push({ id: `q${Date.now()}`, role: "assistant", text: b.question, answers: b.answers })
      }
      setMessages(m => [...m, ...next])
    } catch {
      setError("The local catalog adapter could not complete this request. Retry in a moment.")
    } finally {
      setBusy(false)
    }
  }

  const handledInitialMessage = useRef("")

  useEffect(() => {
    const text = initialMessage.trim()

    if (!text) {
      handledInitialMessage.current = ""
      return
    }

    if (handledInitialMessage.current === text) return

    handledInitialMessage.current = text
    onInitialMessageHandled?.()
    void send(text)
  }, [initialMessage])

  const addProject = (id: string) => setProject(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]))

  return (
    <div data-theme={dark ? "dark" : "light"} className="min-h-screen bg-[var(--rz-bg)] text-[var(--rz-text)]">
      <header className="sticky top-0 z-20 border-b border-[var(--rz-border)] bg-[var(--rz-surface)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 px-3 py-1 text-xs font-semibold text-white">
              AI Mode
            </span>
            <span className="rounded-full border border-[var(--rz-border)] px-3 py-1 text-xs text-[var(--rz-muted)]">
              SYNTHETIC DEMO DATA
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onShop} className="min-h-10 px-3 text-sm font-medium hover:text-[var(--rz-orange)]">
              Shop
            </button>
            <button
              onClick={() => setDark(d => !d)}
              className="min-h-10 rounded-lg border border-[var(--rz-border)] px-3 text-xs"
              aria-label="Toggle theme"
            >
              {dark ? "Light" : "Dark"}
            </button>
            <span className="relative grid h-9 w-9 place-items-center rounded-full border border-[var(--rz-border)] text-sm">
              🛒
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-[var(--rz-orange)] text-[10px] text-white">
                  {cartCount}
                </span>
              )}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-36 pt-10">
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Let’s find the right fit.</h1>
          <p className="mt-3 text-sm text-[var(--rz-muted)]">
            Describe your goal. Explore options, compare trade-offs, and build a setup from one connected catalog.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-[var(--rz-border)] bg-[var(--rz-surface)] px-4 py-2 text-sm transition hover:border-[var(--rz-orange)] hover:text-[var(--rz-orange)]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div aria-live="polite" className="space-y-5">
          {messages.map(m => (
            <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--rz-green)] text-sm font-bold text-white">
                  R
                </div>
              )}
              <div
                className={`max-w-[min(100%,36rem)] rounded-2xl p-4 ${
                  m.role === "user"
                    ? "bg-[var(--rz-green)] text-white"
                    : "border border-[var(--rz-border)] bg-[var(--rz-surface)]"
                }`}
              >
                {m.role === "user" && <p className="mb-1 text-xs opacity-70">You</p>}
                {m.text && <p className="text-sm leading-relaxed">{m.text}</p>}

                {m.productIds && m.productIds.length > 0 && (
                  <div className={`mt-3 grid gap-3 ${m.productIds.length > 1 ? "sm:grid-cols-3" : ""}`}>
                    {m.productIds.map(id => {
                      const p = byId.get(id)
                      if (!p) return null
                      return (
                        <div
                          key={id}
                          className="overflow-hidden rounded-xl border border-[var(--rz-border)] bg-[var(--rz-bg)] transition hover:shadow-md"
                        >
                          <button onClick={() => onView(id)} className="block w-full text-left">
                            <div className="aspect-[4/3] bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                              <Photo src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="p-3">
                              <p className="text-xs text-[var(--rz-muted)]">
                                {p.kind} · {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                              </p>
                              <p className="mt-0.5 font-medium leading-snug">{p.name}</p>
                              <p className="mt-1 text-sm font-semibold">{money(p.priceCents)}</p>
                              {m.reasons?.[id] && (
                                <p className="mt-1 line-clamp-2 text-xs text-[var(--rz-muted)]">{m.reasons[id]}</p>
                              )}
                            </div>
                          </button>
                          <div className="flex gap-2 border-t border-[var(--rz-border)] p-2">
                            <button
                              onClick={() => {
                                onAddToCart(id)
                                trackEvent({ type: "add_to_cart", productId: id })
                              }}
                              disabled={p.stock < 1}
                              className="min-h-9 flex-1 rounded-lg bg-[var(--rz-green)] text-xs font-medium text-white disabled:opacity-40"
                            >
                              Add to cart
                            </button>
                            <button
                              onClick={() => addProject(id)}
                              className="min-h-9 rounded-lg border border-[var(--rz-border)] px-2 text-xs"
                              aria-label="Save to project"
                            >
                              {project.includes(id) ? "✓" : "+"}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {m.comparisonIds && m.comparisonIds.length > 1 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[28rem] text-left text-xs">
                      <thead>
                        <tr className="border-b border-[var(--rz-border)] text-[var(--rz-muted)]">
                          <th className="py-2 pr-3">Feature</th>
                          {m.comparisonIds.map(id => (
                            <th key={id} className="py-2 pr-3">
                              {byId.get(id)?.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {["price", "stock", "brand", "kind"].map(key => (
                          <tr key={key} className="border-b border-[var(--rz-border)]/60">
                            <td className="py-2 pr-3 capitalize text-[var(--rz-muted)]">{key}</td>
                            {m.comparisonIds!.map(id => {
                              const p = byId.get(id)
                              if (!p) return <td key={id} />
                              const val =
                                key === "price"
                                  ? money(p.priceCents)
                                  : key === "stock"
                                    ? `${p.stock}`
                                    : key === "brand"
                                      ? p.brand
                                      : p.kind
                              return (
                                <td key={id} className="py-2 pr-3">
                                  {val}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {m.answers && m.answers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.answers.map(a => (
                      <button
                        key={a}
                        onClick={() => send(a)}
                        className="rounded-full border border-[var(--rz-border)] px-3 py-1.5 text-xs hover:border-[var(--rz-orange)]"
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {m.role === "user" && (
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--rz-orange)] text-sm font-bold text-white">
                  You
                </div>
              )}
            </div>
          ))}

          {busy && (
            <div className="flex gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--rz-green)] text-sm font-bold text-white">
                R
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl border border-[var(--rz-border)] bg-[var(--rz-surface)] px-4 py-3">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--rz-orange)]" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--rz-orange)]" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--rz-orange)]" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          <div ref={bottomRef} />
        </div>

        {project.length > 0 && (
          <div className="mt-8 rounded-2xl border border-[var(--rz-border)] bg-[var(--rz-surface)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--rz-muted)]">Shopping project · Preview</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {project.map(id => {
                const p = byId.get(id)
                return p ? (
                  <span key={id} className="rounded-full bg-[var(--rz-green)]/10 px-3 py-1 text-xs">
                    {p.name}
                  </span>
                ) : null
              })}
            </div>
            <p className="mt-2 text-xs text-[var(--rz-muted)]">Demo only — not persisted. Real AI + checkout coming later.</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-[var(--rz-border)] bg-[var(--rz-surface)]/95 backdrop-blur">
        <form
          onSubmit={e => {
            e.preventDefault()
            send()
          }}
          className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3"
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask REZLEE about a product, setup, budget, or comparison…"
            className="min-h-11 flex-1 rounded-full border border-[var(--rz-border)] bg-[var(--rz-bg)] px-4 text-sm outline-none focus:border-[var(--rz-orange)]"
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="min-h-11 min-w-11 rounded-full bg-[var(--rz-orange)] px-4 text-sm font-medium text-white disabled:opacity-40"
          >
            Send
          </button>
        </form>
        <p className="pb-2 text-center text-[10px] text-[var(--rz-muted)]">
          Catalog demo · deterministic matching · no live AI provider or checkout is connected
        </p>
      </div>
    </div>
  )
}
