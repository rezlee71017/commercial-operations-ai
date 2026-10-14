import type { Product, Rules } from "../core/types";

// DEMO DATA: every record is synthetic (isSynthetic: true).
const UNIVERSAL = ["phone-a1", "phone-b2", "laptop-l1"];

export const catalog: Product[] = [
  { id: "phone-a1", name: "Phone Aria 128GB", category: "phone", price: 600, cost: 450, stock: 10, isSynthetic: true },
  { id: "phone-b2", name: "Phone Bolt 256GB", category: "phone", price: 800, cost: 620, stock: 5, isSynthetic: true },
  { id: "laptop-l1", name: "Laptop Lume 14", category: "laptop", price: 1000, cost: 800, stock: 4, isSynthetic: true },
  { id: "case-a1", name: "Case for Aria", category: "case", price: 20, cost: 6, stock: 50, compatibleWith: ["phone-a1"], isSynthetic: true },
  { id: "case-b2", name: "Case for Bolt", category: "case", price: 22, cost: 7, stock: 3, compatibleWith: ["phone-b2"], isSynthetic: true },
  { id: "screen-a1", name: "Screen protector for Aria", category: "protector", price: 15, cost: 4, stock: 0, compatibleWith: ["phone-a1"], isSynthetic: true }, // out of stock on purpose
  { id: "charger-65", name: "USB-C Charger 65W", category: "charger", price: 35, cost: 15, stock: 40, compatibleWith: UNIVERSAL, isSynthetic: true },
  { id: "cable-c", name: "USB-C Cable 1m", category: "cable", price: 12, cost: 3, stock: 100, compatibleWith: UNIVERSAL, isSynthetic: true },
  { id: "earbuds-e1", name: "Earbuds Echo", category: "audio", price: 80, cost: 50, stock: 12, isSynthetic: true },
  { id: "sleeve-l1", name: "Laptop sleeve 14in", category: "sleeve", price: 30, cost: 12, stock: 20, compatibleWith: ["laptop-l1"], isSynthetic: true },
  { id: "dock-d1", name: "USB-C Dock 7-in-1", category: "dock", price: 90, cost: 70, stock: 6, compatibleWith: ["laptop-l1"], isSynthetic: true }, // low margin on purpose
  { id: "mouse-m1", name: "Wireless Mouse", category: "mouse", price: 25, cost: 10, stock: 30, isSynthetic: true },
];

export const rules: Rules = { minMarginPct: 20, maxDiscountPct: 15 };
