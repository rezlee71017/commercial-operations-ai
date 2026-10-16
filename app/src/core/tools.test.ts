import { describe, expect, it } from "vitest";
import { executeTool } from "./tools";
import { catalog, rules } from "../data/catalog";

const ctx = { catalog, rules, owned: [] as string[] };
const ids = (r: ReturnType<typeof executeTool>) =>
  r.ok ? (r.result as { products: { id: string }[] }).products.map((p) => p.id) : [];

describe("tools", () => {
  it("search finds products by keyword and never shows cost", () => {
    const r = executeTool("search_products", { query: "charger" }, ctx);
    expect(ids(r)).toEqual(["charger-65"]);
    expect(JSON.stringify(r)).not.toContain("cost");
  });

  it("search ranks the best match first and respects the category filter", () => {
    expect(ids(executeTool("search_products", { query: "aria phone" }, ctx))[0]).toBe("phone-a1");
    expect(ids(executeTool("search_products", { query: "aria", category: "case" }, ctx))).toEqual(["case-a1"]);
    expect(ids(executeTool("search_products", { query: "zzz" }, ctx))).toEqual([]);
  });

  it("check_stock reports availability from the catalog", () => {
    const ok = executeTool("check_stock", { productId: "screen-a1", qty: 1 }, ctx);
    expect(ok.ok && (ok.result as { enough: boolean }).enough).toBe(false);
    const missing = executeTool("check_stock", { productId: "nope", qty: 1 }, ctx);
    expect(missing.ok && (missing.result as { exists: boolean }).exists).toBe(false);
  });

  it("check_bundle gives the same verdict as the policy engine", () => {
    const good = executeTool(
      "check_bundle",
      { items: [{ productId: "phone-a1", qty: 1 }, { productId: "case-a1", qty: 1 }], discountPct: 0 },
      ctx,
    );
    expect(good.ok && (good.result as { approvable: boolean }).approvable).toBe(true);
    const bad = executeTool("check_bundle", { items: [{ productId: "phone-a1", qty: 1 }], discountPct: 15 }, ctx);
    expect(bad.ok && (bad.result as { approvable: boolean }).approvable).toBe(false);
  });

  it("rejects invalid arguments and unknown tools instead of crashing", () => {
    const bad = executeTool("check_stock", { productId: 5 }, ctx);
    expect(bad.ok).toBe(false);
    expect(!bad.ok && bad.error).toContain("Invalid arguments");
    expect(executeTool("delete_everything", {}, ctx).ok).toBe(false);
  });

  it("submit_bundle returns the final proposal", () => {
    const r = executeTool(
      "submit_bundle",
      { items: [{ productId: "mouse-m1", qty: 1 }], discountPct: 0, explanation: "x" },
      ctx,
    );
    expect(r.ok && r.final?.items).toEqual([{ productId: "mouse-m1", qty: 1 }]);
  });
});
