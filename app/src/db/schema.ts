import { boolean, integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

// Money columns are integer cents. Every product row says whether it is synthetic demo data.

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

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
});

export const inventory = pgTable("inventory", {
  productId: text("product_id")
    .primaryKey()
    .references(() => products.id),
  onHand: integer("on_hand").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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
);

// Store-wide settings such as the business rules (key "rules")
export const policies = pgTable("policies", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
