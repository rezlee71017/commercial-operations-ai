import type { Product } from "./types";

// What customers may see. The purchase cost never leaves the server.
export type PublicProduct = Pick<Product, "id" | "name" | "category" | "priceCents" | "stock" | "compatibleWith" | "isSynthetic">;

export function toPublicProduct(p: Product): PublicProduct {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    priceCents: p.priceCents,
    stock: p.stock,
    compatibleWith: p.compatibleWith,
    isSynthetic: p.isSynthetic,
  };
}
