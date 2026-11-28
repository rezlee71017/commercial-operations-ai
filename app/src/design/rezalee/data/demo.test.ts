import { describe, expect, it } from "vitest"
import { categories, products, defaultRules, bundle, checkProposal } from "./demo"

describe("REZLEE demo catalog", () => {
  it("has unique ids and sane money/stock values", () => {
    const ids = new Set(products.map(p => p.id))
    expect(ids.size).toBe(products.length)
    for (const p of products) {
      expect(Number.isInteger(p.priceCents) && p.priceCents > 0, p.id).toBe(true)
      expect(Number.isInteger(p.costCents) && p.costCents > 0, p.id).toBe(true)
      expect(Number.isInteger(p.stock) && p.stock >= 0, p.id).toBe(true)
      expect(p.isSynthetic, p.id).toBe(true)
    }
  })

  it("only references products that exist", () => {
    const ids = new Set(products.map(p => p.id))
    for (const p of products) {
      for (const other of [...p.compatibleWith, ...p.complementaryWith, ...Object.keys(p.compatibility)]) {
        expect(ids.has(other), `${p.id} -> ${other}`).toBe(true)
      }
    }
  })

  it("covers every declared category and nothing else", () => {
    const declared = new Set<string>(categories)
    const used = new Set(products.map(p => p.category))
    for (const c of used) expect(declared.has(c), c).toBe(true)
    expect(used.size).toBeGreaterThanOrEqual(9)
  })

  it("the published bundle passes the default commercial policy", () => {
    expect(checkProposal(bundle, defaultRules, products).every(c => c.passed)).toBe(true)
  })
})
