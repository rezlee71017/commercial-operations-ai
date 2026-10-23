import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { Evaluation, Proposal } from "../core/types";

// Money columns are integer cents. Every product row says whether it is synthetic demo data.
// Row Level Security is switched ON for every table with no policies: on Supabase this blocks
// the public REST API from reading or writing our tables. Our server connects with the
// database owner role, which is not affected.

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
}).enableRLS();

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  description: text("description").notNull().default(""),
  priceCents: integer("price_cents").notNull(),
  costCents: integer("cost_cents").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isSynthetic: boolean("is_synthetic").notNull().default(true),
  source: text("source").notNull().default("synthetic-demo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}).enableRLS();

export const inventory = pgTable("inventory", {
  productId: text("product_id")
    .primaryKey()
    .references(() => products.id),
  onHand: integer("on_hand").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}).enableRLS();

// "productId works with compatibleWithId" (for example a case works with one phone)
export const productCompat = pgTable(
  "product_compat",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    compatibleWithId: text("compatible_with_id")
      .notNull()
      .references(() => products.id),
  },
  (t) => [primaryKey({ columns: [t.productId, t.compatibleWithId] })],
).enableRLS();

// Store-wide settings such as the business rules (key "rules")
export const policies = pgTable("policies", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}).enableRLS();

// One row per workflow run. The proposal and its policy evaluation are stored so that a human
// decision later is made on exactly what was proposed.
export const workflowRuns = pgTable("workflow_runs", {
  id: text("id").primaryKey(),
  request: text("request").notNull(),
  owned: jsonb("owned").$type<string[]>().notNull(),
  mode: text("mode").notNull(), // for example "gemini-tools", "mock-tools"
  status: text("status").notNull(), // running | awaiting_approval | needs_input | rejected_by_policy | failed | executed | rejected | blocked
  proposal: jsonb("proposal").$type<Proposal | null>(),
  evaluation: jsonb("evaluation").$type<Evaluation | null>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
}).enableRLS();

// Every event the UI showed, in order (survives page refresh)
export const runEvents = pgTable(
  "run_events",
  {
    runId: text("run_id")
      .notNull()
      .references(() => workflowRuns.id),
    seq: integer("seq").notNull(),
    step: text("step").notNull(),
    status: text("status").notNull(),
    at: text("at").notNull(), // ISO time recorded by the workflow
    data: jsonb("data"),
  },
  (t) => [primaryKey({ columns: [t.runId, t.seq] })],
).enableRLS();

// At most one human decision per run
export const approvals = pgTable("approvals", {
  runId: text("run_id")
    .primaryKey()
    .references(() => workflowRuns.id),
  decision: text("decision").notNull(), // approved | rejected
  note: text("note"),
  decidedAt: timestamp("decided_at").notNull().defaultNow(),
}).enableRLS();

// At most one order per run (so approving twice can never create two orders)
export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  runId: text("run_id")
    .notNull()
    .unique()
    .references(() => workflowRuns.id),
  status: text("status").notNull(),
  subtotalCents: integer("subtotal_cents").notNull(),
  totalCents: integer("total_cents").notNull(),
  discountPct: doublePrecision("discount_pct").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}).enableRLS();

// Prices are copied into the order so later price changes do not rewrite history
export const orderItems = pgTable(
  "order_items",
  {
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    qty: integer("qty").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    unitCostCents: integer("unit_cost_cents").notNull(),
  },
  (t) => [primaryKey({ columns: [t.orderId, t.productId] })],
).enableRLS();

// Append-only history of what happened and who or what did it
export const auditLog = pgTable("audit_log", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  at: timestamp("at").notNull().defaultNow(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  data: jsonb("data"),
}).enableRLS();
