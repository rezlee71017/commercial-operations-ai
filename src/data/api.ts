import { products } from "./demo"
import type { MerchantProduct } from "../types"

export async function getProducts(): Promise<MerchantProduct[]> { return products.map(p => ({ ...p })) }
export async function getProduct(id: string): Promise<MerchantProduct | undefined> { return products.find(p => p.id === id) }
export async function searchProducts(query: string): Promise<MerchantProduct[]> {
  const q = query.trim().toLowerCase()
  if (!q) return getProducts()
  return products.filter(p => [p.name,p.brand,p.kind,p.category,...Object.values(p.specs)].join(" ").toLowerCase().includes(q))
}
export async function getInventorySummary() {
  return products.reduce((a,p) => { a.total += 1; a.units += p.stock; a[p.stock === 0 ? "out" : p.stock <= 5 ? "low" : "healthy"] += 1; return a }, { total:0, units:0, healthy:0, low:0, out:0 })
}
