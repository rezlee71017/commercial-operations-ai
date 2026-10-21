import { describe, expect, it } from "vitest";
import { toPublicProduct } from "./public";
import type { Product } from "./types";

describe("toPublicProduct", () => {
  it("never exposes the purchase cost", () => {
    const p: Product = { id: "x", name: "X", category: "case", priceCents: 2000, costCents: 600, stock: 3, isSynthetic: true };
    const out = toPublicProduct(p) as Record<string, unknown>;
    expect(out).not.toHaveProperty("costCents");
    expect(out.priceCents).toBe(2000);
  });

  it("keeps compatibility and the synthetic flag", () => {
    const p: Product = { id: "c", name: "C", category: "case", priceCents: 1, costCents: 1, stock: 0, compatibleWith: ["phone-a1"], isSynthetic: true };
    const out = toPublicProduct(p);
    expect(out.compatibleWith).toEqual(["phone-a1"]);
    expect(out.isSynthetic).toBe(true);
  });
});
