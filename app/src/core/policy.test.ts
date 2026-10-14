import { describe, expect, it } from "vitest";
import { evaluateProposal } from "./policy";
import { catalog, rules } from "../data/catalog";
import type { Product } from "./types";

const failed = (e: ReturnType<typeof evaluateProposal>) =>
  e.results.filter((r) => !r.passed).map((r) => r.rule);

describe("policy engine", () => {
  it("approves a valid bundle and computes the numbers itself", () => {
    const e = evaluateProposal(
      { items: [{ productId: "phone-a1", qty: 1 }, { productId: "case-a1", qty: 1 }, { productId: "charger-65", qty: 1 }], discountPct: 5 },
      catalog,
      rules,
    );
    expect(e.approvable).toBe(true);
    expect(e.subtotal).toBe(655);
    expect(e.total).toBe(622.25);
    expect(e.cost).toBe(471);
    expect(e.marginPct).toBe(24.31);
  });

  it("rejects an out-of-stock product", () => {
    const e = evaluateProposal(
      { items: [{ productId: "phone-a1", qty: 1 }, { productId: "screen-a1", qty: 1 }], discountPct: 0 },
      catalog,
      rules,
    );
    expect(failed(e)).toEqual(["stock_available"]);
  });

  it("rejects quantity above stock", () => {
    const e = evaluateProposal(
      { items: [{ productId: "phone-b2", qty: 1 }, { productId: "case-b2", qty: 5 }], discountPct: 0 },
      catalog,
      rules,
    );
    expect(failed(e)).toEqual(["stock_available"]);
  });

  it("counts duplicate lines of the same product together", () => {
    const e = evaluateProposal(
      { items: [{ productId: "phone-b2", qty: 1 }, { productId: "case-b2", qty: 2 }, { productId: "case-b2", qty: 2 }], discountPct: 0 },
      catalog,
      rules,
    );
    expect(failed(e)).toContain("stock_available");
  });

  it("rejects a discount above the maximum", () => {
    const e = evaluateProposal(
      { items: [{ productId: "case-a1", qty: 1 }, { productId: "phone-a1", qty: 1 }], discountPct: 20 },
      catalog,
      rules,
    );
    expect(failed(e)).toContain("discount_limit");
  });

  it("rejects a bundle whose margin falls below the minimum", () => {
    // Allowed discount (15%) but the phone alone then has margin ~11.8%
    const e = evaluateProposal({ items: [{ productId: "phone-a1", qty: 1 }], discountPct: 15 }, catalog, rules);
    expect(failed(e)).toEqual(["min_margin"]);
  });

  it("accepts a margin exactly equal to the minimum (boundary)", () => {
    const tiny: Product[] = [{ id: "x", name: "X", category: "t", price: 100, cost: 80, stock: 5, isSynthetic: true }];
    const e = evaluateProposal({ items: [{ productId: "x", qty: 1 }], discountPct: 0 }, tiny, rules);
    expect(e.marginPct).toBe(20);
    expect(e.approvable).toBe(true);
  });

  it("rejects incompatible accessories", () => {
    const e = evaluateProposal(
      { items: [{ productId: "phone-b2", qty: 1 }, { productId: "case-a1", qty: 1 }], discountPct: 0 },
      catalog,
      rules,
    );
    expect(failed(e)).toEqual(["compatibility"]);
  });

  it("accepts an accessory when the customer already owns the compatible product", () => {
    const e = evaluateProposal({ items: [{ productId: "case-a1", qty: 1 }], discountPct: 0 }, catalog, rules, ["phone-a1"]);
    expect(e.approvable).toBe(true);
  });

  it("rejects unknown product ids, empty bundles and bad quantities", () => {
    expect(failed(evaluateProposal({ items: [{ productId: "nope", qty: 1 }], discountPct: 0 }, catalog, rules))).toContain("products_exist");
    expect(evaluateProposal({ items: [], discountPct: 0 }, catalog, rules).approvable).toBe(false);
    expect(evaluateProposal({ items: [{ productId: "case-a1", qty: 1.5 }], discountPct: 0 }, catalog, rules).approvable).toBe(false);
    expect(evaluateProposal({ items: [{ productId: "case-a1", qty: -1 }], discountPct: 0 }, catalog, rules).approvable).toBe(false);
  });

  it("rejects a NaN discount", () => {
    const e = evaluateProposal({ items: [{ productId: "case-a1", qty: 1 }], discountPct: Number.NaN }, catalog, rules, ["phone-a1"]);
    expect(failed(e)).toContain("discount_limit");
  });
});
