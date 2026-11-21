import type { MerchantProduct, Rules, Run } from "../types"

export const categories = [
  ["phone", "Phones"],
  ["laptop", "Laptops"],
  ["case", "Cases"],
  ["protector", "Screen protectors"],
  ["charger", "Chargers"],
  ["cable", "Cables"],
  ["power", "Power banks"],
  ["audio", "Audio"],
  ["mouse", "Mice"],
  ["keyboard", "Keyboards"],
  ["dock", "Docks and hubs"],
  ["sleeve", "Laptop sleeves"],
  ["stand", "Stands"],
  ["webcam", "Webcams"],
  ["wearable", "Wearables"],
] as const

const phones = ["phone-a1", "phone-b2", "phone-c3", "phone-d4"]
const laptops = ["laptop-l1", "laptop-l2", "laptop-n1"]
const allMain = [...phones, ...laptops]
type Row = [string, string, string, number, number, number, string[]?]

const rows: Row[] = [
  ["phone-a1", "Phone Aria 128GB", "phone", 60000, 45000, 10],
  ["phone-b2", "Phone Bolt 256GB", "phone", 80000, 62000, 5],
  ["phone-c3", "Phone Cinder 64GB", "phone", 35000, 28000, 14],
  ["phone-d4", "Phone Delta Pro 512GB", "phone", 120000, 96000, 3],
  ["laptop-l1", "Laptop Lume 14", "laptop", 100000, 80000, 4],
  ["laptop-l2", "Laptop Lume 16", "laptop", 140000, 115000, 2],
  ["laptop-n1", "Laptop Nimbus Air 13", "laptop", 90000, 72000, 7],
  ["case-a1", "Case for Aria", "case", 2000, 600, 50, ["phone-a1"]],
  ["case-b2", "Case for Bolt", "case", 2200, 700, 3, ["phone-b2"]],
  ["case-c3", "Case for Cinder", "case", 1800, 500, 25, ["phone-c3"]],
  ["case-d4", "Case for Delta", "case", 2800, 900, 9, ["phone-d4"]],
  [
    "screen-a1",
    "Screen protector for Aria",
    "protector",
    1500,
    400,
    0,
    ["phone-a1"],
  ],
  [
    "screen-b2",
    "Screen protector for Bolt",
    "protector",
    1500,
    400,
    30,
    ["phone-b2"],
  ],
  [
    "screen-c3",
    "Screen protector for Cinder",
    "protector",
    1200,
    350,
    22,
    ["phone-c3"],
  ],
  [
    "screen-d4",
    "Screen protector for Delta",
    "protector",
    1800,
    500,
    11,
    ["phone-d4"],
  ],
  ["charger-30", "USB-C Charger 30W", "charger", 2000, 700, 60, phones],
  ["charger-65", "USB-C Charger 65W", "charger", 3500, 1500, 40, allMain],
  ["charger-100", "USB-C Charger 100W", "charger", 5500, 2600, 12, laptops],
  ["cable-c", "USB-C Cable 1m", "cable", 1200, 300, 100, allMain],
  ["cable-l", "USB-C Cable 2m", "cable", 1600, 450, 80, allMain],
  ["power-10k", "Power bank 10000mAh", "power", 3000, 1400, 35],
  ["power-20k", "Power bank 20000mAh", "power", 5000, 2500, 22],
  ["earbuds-e1", "Earbuds Echo", "audio", 8000, 5000, 12],
  ["earbuds-e2", "Earbuds Echo Pro", "audio", 14000, 9500, 8],
  ["headphones-h1", "Headphones Halo", "audio", 12000, 7500, 10],
  ["headphones-h2", "Headphones Halo ANC", "audio", 22000, 15000, 4],
  ["speaker-s1", "Speaker Spark Mini", "audio", 6000, 3500, 25],
  ["speaker-s2", "Speaker Spark Max", "audio", 15000, 9000, 0],
  ["mouse-m1", "Wireless Mouse", "mouse", 2500, 1000, 30],
  ["mouse-m2", "Ergonomic Mouse", "mouse", 4500, 2000, 17],
  ["mouse-m3", "Gaming Mouse", "mouse", 6000, 3000, 12],
  ["keyboard-k1", "Wireless Keyboard", "keyboard", 4500, 2200, 20],
  ["keyboard-k2", "Mechanical Keyboard", "keyboard", 9000, 5000, 9],
  ["keyboard-k3", "Compact Keyboard", "keyboard", 3500, 1700, 6],
  ["dock-d1", "USB-C Dock 7-in-1", "dock", 9000, 7000, 6, ["laptop-l1"]],
  ["dock-d2", "USB-C Dock 12-in-1", "dock", 14000, 10500, 5, laptops],
  ["hub-h1", "USB-C Hub 4-port", "dock", 3500, 1800, 28, laptops],
  ["sleeve-l1", "Laptop sleeve 14in", "sleeve", 3000, 1200, 20, ["laptop-l1"]],
  ["sleeve-l2", "Laptop sleeve 16in", "sleeve", 3500, 1400, 8, ["laptop-l2"]],
  ["sleeve-n1", "Laptop sleeve 13in", "sleeve", 2800, 1100, 15, ["laptop-n1"]],
  ["stand-l1", "Aluminum laptop stand", "stand", 4500, 1800, 18, laptops],
  ["webcam-w1", "HD Webcam", "webcam", 5000, 2800, 14],
  ["webcam-w2", "4K Webcam", "webcam", 12000, 8000, 5],
  ["watch-w1", "Watch Wave", "wearable", 15000, 11000, 6],
  ["watch-w2", "Watch Wave Sport", "wearable", 20000, 15000, 4],
  [
    "band-w1",
    "Replacement band for Wave",
    "wearable",
    1800,
    500,
    40,
    ["watch-w1", "watch-w2"],
  ],
  ["fitband-f1", "Fitness band Fit", "wearable", 6000, 3600, 13],
]

const descriptions: Record<string, string> = {
  phone:
    "A balanced everyday phone with a clear display and dependable battery.",
  laptop:
    "A portable computer for focused work, calls, and everyday creativity.",
  audio: "Personal audio designed for clear listening at home or on the move.",
  wearable: "A lightweight companion for notifications and everyday activity.",
}

export const products: MerchantProduct[] = rows.map(
  ([
    id,
    name,
    category,
    priceCents,
    costCents,
    stock,
    compatibleWith = [],
  ]) => ({
    id,
    name,
    category,
    priceCents,
    costCents,
    stock,
    compatibleWith,
    description:
      descriptions[category] ??
      "A practical accessory selected to complete a connected setup.",
    isSynthetic: true,
  }),
)

export const defaultRules: Rules = {
  minMarginPct: 20,
  maxDiscountPct: 15,
}

const runEvents = [
  {
    step: "Request received",
    status: "ok" as const,
    message: "Goal and budget captured.",
    at: "09:41",
  },
  {
    step: "Catalog checked",
    status: "ok" as const,
    message: "Price and available stock read from the synthetic catalog.",
    at: "09:42",
  },
  {
    step: "Rules evaluated",
    status: "ok" as const,
    message: "Margin, discount, stock, and compatibility checks completed.",
    at: "09:43",
  },
]

export const initialRuns: Run[] = [
  {
    id: "RUN-1048",
    request: "Build a mobile starter kit under $700",
    status: "awaiting_approval",
    createdAt: "Today, 09:41",
    events: runEvents,
    proposal: {
      items: [
        { productId: "phone-a1", qty: 1 },
        { productId: "case-a1", qty: 1 },
        { productId: "charger-30", qty: 1 },
        { productId: "cable-c", qty: 1 },
      ],
      discountPct: 5,
      explanation:
        "Pairs Phone Aria with catalog-confirmed charging and protection accessories.",
    },
    checks: [
      {
        rule: "Margin floor",
        passed: true,
        detail: "Estimated margin remains at or above 20%.",
      },
      {
        rule: "Discount limit",
        passed: true,
        detail: "5% is within the 15% maximum.",
      },
      {
        rule: "Available stock",
        passed: true,
        detail: "Every proposed quantity is available.",
      },
      {
        rule: "Compatibility",
        passed: true,
        detail: "Accessory compatibility is confirmed by catalog IDs.",
      },
    ],
    isSynthetic: true,
  },
  {
    id: "RUN-1047",
    request: "Pair Laptop Lume 14 with the 7-in-1 dock at 10% off",
    status: "rejected_by_policy",
    createdAt: "Yesterday, 16:18",
    events: runEvents,
    proposal: {
      items: [
        { productId: "laptop-l1", qty: 1 },
        { productId: "dock-d1", qty: 1 },
      ],
      discountPct: 10,
      explanation: "A portable workstation with a catalog-confirmed dock.",
    },
    checks: [
      {
        rule: "Margin floor",
        passed: false,
        detail: "The discounted proposal falls below the 20% floor.",
      },
      {
        rule: "Discount limit",
        passed: true,
        detail: "10% is within the 15% maximum.",
      },
      {
        rule: "Available stock",
        passed: true,
        detail: "Requested quantities are available.",
      },
      {
        rule: "Compatibility",
        passed: true,
        detail: "The dock lists Laptop Lume 14 as compatible.",
      },
    ],
    isSynthetic: true,
  },
]

export const activity = [
  {
    at: "Today, 09:43",
    title: "RUN-1048 moved to approval",
    detail: "Four deterministic checks completed.",
  },
  {
    at: "Today, 09:41",
    title: "Bundle request submitted",
    detail: "Mobile starter kit under $700.",
  },
  {
    at: "Yesterday, 16:18",
    title: "RUN-1047 rejected by policy",
    detail: "Margin floor check did not pass.",
  },
]

export const orders = [
  { id: "ORD-0201", status: "created", isSynthetic: true as const },
  { id: "ORD-0200", status: "created", isSynthetic: true as const },
]

export const formatMoney = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100)

export const categoryName = (id: string) =>
  categories.find(([key]) => key === id)?.[1] ?? id
