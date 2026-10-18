import { beforeAll, describe, expect, it } from "vitest";
import { evaluateProposal } from "../core/policy";
import { catalog as seedCatalog, rules as seedRules } from "../data/catalog";
import { createDb, type Db } from "./client";
import { loadCatalog, loadRules } from "./repo";
import { seedIfEmpty } from "./seed";

let db: Db;

beforeAll(async () => {
  db = await createDb(); // in memory
  await seedIfEmpty(db);
}, 60000);

const normalize = (list: typeof seedCatalog) =>
  list.map((p) => ({ ...p, compatibleWith: [...(p.compatibleWith ?? [])].sort() }));

describe("database", () => {
  it("reads back exactly the synthetic catalog that was seeded", async () => {
    const loaded = await loadCatalog(db);
    expect(loaded.length).toBe(seedCatalog.length);
    expect(loaded.length).toBeGreaterThanOrEqual(40);
    expect(normalize(loaded)).toEqual(normalize(seedCatalog));
    expect(loaded.every((p) => p.isSynthetic)).toBe(true);
  });

  it("stores money as integer cents and keeps compatibility links", async () => {
    const loaded = await loadCatalog(db);
    expect(loaded.every((p) => Number.isInteger(p.priceCents) && Number.isInteger(p.costCents))).toBe(true);
    expect(loaded.find((p) => p.id === "case-a1")?.compatibleWith).toEqual(["phone-a1"]);
    expect(loaded.find((p) => p.id === "phone-a1")?.compatibleWith).toBeUndefined();
  });

  it("is idempotent: seeding twice does not duplicate anything", async () => {
    expect(await seedIfEmpty(db)).toBe(false);
    expect((await loadCatalog(db)).length).toBe(seedCatalog.length);
  });

  it("loads the business rules", async () => {
    expect(await loadRules(db)).toEqual(seedRules);
  });

  it("the policy engine works on the catalog loaded from the database", async () => {
    const loaded = await loadCatalog(db);
    const rules = await loadRules(db);
    const ok = evaluateProposal(
      { items: [{ productId: "phone-a1", qty: 1 }, { productId: "case-a1", qty: 1 }], discountPct: 0 },
      loaded,
      rules,
    );
    expect(ok.approvable).toBe(true);
    const outOfStock = evaluateProposal({ items: [{ productId: "speaker-s2", qty: 1 }], discountPct: 0 }, loaded, rules);
    expect(outOfStock.approvable).toBe(false);
  });
});
