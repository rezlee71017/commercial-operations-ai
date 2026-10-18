import type { Product, Rules } from "../core/types";

// DEMO DATA: every record is synthetic (isSynthetic: true). Money is in integer cents.

export const seedCategories: { id: string; name: string }[] = [
  { id: "phone", name: "Phones" },
  { id: "laptop", name: "Laptops" },
  { id: "case", name: "Cases" },
  { id: "protector", name: "Screen protectors" },
  { id: "charger", name: "Chargers" },
  { id: "cable", name: "Cables" },
  { id: "power", name: "Power banks" },
  { id: "audio", name: "Audio" },
  { id: "mouse", name: "Mice" },
  { id: "keyboard", name: "Keyboards" },
  { id: "dock", name: "Docks and hubs" },
  { id: "sleeve", name: "Laptop sleeves" },
  { id: "stand", name: "Stands" },
  { id: "webcam", name: "Webcams" },
  { id: "wearable", name: "Wearables" },
];

const PHONES = ["phone-a1", "phone-b2", "phone-c3", "phone-d4"];
const LAPTOPS = ["laptop-l1", "laptop-l2", "laptop-n1"];
const ALL_MAIN = [...PHONES, ...LAPTOPS];

type Row = [id: string, name: string, category: string, priceCents: number, costCents: number, stock: number, compat?: string[]];

const rows: Row[] = [
  // Main products
  ["phone-a1", "Phone Aria 128GB", "phone", 60000, 45000, 10],
  ["phone-b2", "Phone Bolt 256GB", "phone", 80000, 62000, 5],
  ["phone-c3", "Phone Cinder 64GB", "phone", 35000, 28000, 14],
  ["phone-d4", "Phone Delta Pro 512GB", "phone", 120000, 96000, 3],
  ["laptop-l1", "Laptop Lume 14", "laptop", 100000, 80000, 4],
  ["laptop-l2", "Laptop Lume 16", "laptop", 140000, 115000, 2],
  ["laptop-n1", "Laptop Nimbus Air 13", "laptop", 90000, 72000, 7],
  // Cases and protectors (one out of stock on purpose)
  ["case-a1", "Case for Aria", "case", 2000, 600, 50, ["phone-a1"]],
  ["case-b2", "Case for Bolt", "case", 2200, 700, 3, ["phone-b2"]],
  ["case-c3", "Case for Cinder", "case", 1800, 500, 25, ["phone-c3"]],
  ["case-d4", "Case for Delta", "case", 2800, 900, 9, ["phone-d4"]],
  ["screen-a1", "Screen protector for Aria", "protector", 1500, 400, 0, ["phone-a1"]], // out of stock on purpose
  ["screen-b2", "Screen protector for Bolt", "protector", 1500, 400, 30, ["phone-b2"]],
  ["screen-c3", "Screen protector for Cinder", "protector", 1200, 350, 22, ["phone-c3"]],
  ["screen-d4", "Screen protector for Delta", "protector", 1800, 500, 11, ["phone-d4"]],
  // Power and cables
  ["charger-30", "USB-C Charger 30W", "charger", 2000, 700, 60, PHONES],
  ["charger-65", "USB-C Charger 65W", "charger", 3500, 1500, 40, ALL_MAIN],
  ["charger-100", "USB-C Charger 100W", "charger", 5500, 2600, 12, LAPTOPS],
  ["cable-c", "USB-C Cable 1m", "cable", 1200, 300, 100, ALL_MAIN],
  ["cable-l", "USB-C Cable 2m", "cable", 1600, 450, 80, ALL_MAIN],
  ["power-10k", "Power bank 10000mAh", "power", 3000, 1400, 35],
  ["power-20k", "Power bank 20000mAh", "power", 5000, 2500, 22],
  // Audio
  ["earbuds-e1", "Earbuds Echo", "audio", 8000, 5000, 12],
  ["earbuds-e2", "Earbuds Echo Pro", "audio", 14000, 9500, 8],
  ["headphones-h1", "Headphones Halo", "audio", 12000, 7500, 10],
  ["headphones-h2", "Headphones Halo ANC", "audio", 22000, 15000, 4],
  ["speaker-s1", "Speaker Spark Mini", "audio", 6000, 3500, 25],
  ["speaker-s2", "Speaker Spark Max", "audio", 15000, 9000, 0], // out of stock on purpose
  // Desk setup
  ["mouse-m1", "Wireless Mouse", "mouse", 2500, 1000, 30],
  ["mouse-m2", "Ergonomic Mouse", "mouse", 4500, 2000, 17],
  ["mouse-m3", "Gaming Mouse", "mouse", 6000, 3000, 12],
  ["keyboard-k1", "Wireless Keyboard", "keyboard", 4500, 2200, 20],
  ["keyboard-k2", "Mechanical Keyboard", "keyboard", 9000, 5000, 9],
  ["keyboard-k3", "Compact Keyboard", "keyboard", 3500, 1700, 6],
  ["dock-d1", "USB-C Dock 7-in-1", "dock", 9000, 7000, 6, ["laptop-l1"]], // low margin on purpose
  ["dock-d2", "USB-C Dock 12-in-1", "dock", 14000, 10500, 5, LAPTOPS],
  ["hub-h1", "USB-C Hub 4-port", "dock", 3500, 1800, 28, LAPTOPS],
  ["sleeve-l1", "Laptop sleeve 14in", "sleeve", 3000, 1200, 20, ["laptop-l1"]],
  ["sleeve-l2", "Laptop sleeve 16in", "sleeve", 3500, 1400, 8, ["laptop-l2"]],
  ["sleeve-n1", "Laptop sleeve 13in", "sleeve", 2800, 1100, 15, ["laptop-n1"]],
  ["stand-l1", "Aluminum laptop stand", "stand", 4500, 1800, 18, LAPTOPS],
  ["webcam-w1", "HD Webcam", "webcam", 5000, 2800, 14],
  ["webcam-w2", "4K Webcam", "webcam", 12000, 8000, 5],
  // Wearables
  ["watch-w1", "Watch Wave", "wearable", 15000, 11000, 6],
  ["watch-w2", "Watch Wave Sport", "wearable", 20000, 15000, 4],
  ["band-w1", "Replacement band for Wave", "wearable", 1800, 500, 40, ["watch-w1", "watch-w2"]],
  ["fitband-f1", "Fitness band Fit", "wearable", 6000, 3600, 13],
];

export const seedProducts: Product[] = rows.map(([id, name, category, priceCents, costCents, stock, compat]) => ({
  id,
  name,
  category,
  priceCents,
  costCents,
  stock,
  ...(compat ? { compatibleWith: compat } : {}),
  isSynthetic: true,
}));

export const defaultRules: Rules = { minMarginPct: 20, maxDiscountPct: 15 };
