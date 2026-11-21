# Figma Make prompts

**Decision: continue the existing Figma Make project in place. Do not start a new one.**
Why: the current export is already mounted at `/` (`app/src/design/figma/`), its four views
(store, bundle, ops, owner) are the right skeleton, and `docs/figma-integration.md` lists the only
mechanical fixes we re-apply after each export. A new project would throw that away without fixing
the real problems, which are (1) a single 2,085-line file with data hard-coded inside the JSX and
(2) demo content about guitars and amps while the backend catalog is consumer electronics.

How to use: open the existing project, paste **Prompt 0** once (it sets the rules for everything),
then paste Prompts 1 to 4 one at a time, checking the preview after each.

**Status (2026-11-19): Prompts 0 to 4 were already run once.** The result has the right structure (components, typed data,
electronics catalog) but real visual problems (tiny text, repeated product shapes, light merchant area, canned assistant).
Do not paste Prompts 0 to 4 again. Use the **Round 2** prompts at the end of this file, one at a time, and re-export after the last one
(see the re-export checklist in `docs/figma-integration.md`).

---

## Prompt 0: rules for the whole project (paste first)

```
Keep working in THIS project. Do not start over. Keep the existing four views (store, bundle, ops,
owner) and the existing navigation, and upgrade them step by step in the prompts that follow.

PRODUCT
A consumer-electronics store with two connected experiences that share one catalog and one design system:
1. Customer: an AI shopping assistant (find, compare, combine products; compatible accessories; bundles).
2. Merchant: a commercial operations copilot (inventory insight, bundle proposals, rule checks, human approval, audit history).
Product categories: Phones, Laptops, Cases, Screen protectors, Chargers, Cables, Power banks, Audio,
Mice, Keyboards, Docks and hubs, Laptop sleeves, Stands, Webcams, Wearables.
Remove every guitar, amp and music-store reference. Use plausible but clearly fictional product names
(for example "Phone Aria 128GB", "USB-C Charger 65W"). Show a small "Synthetic demo data" badge in both experiences.

DATA HONESTY
- Never invent sales forecasts, revenue growth, conversion rates or "AI accuracy" numbers. Show only values that
  appear in the data objects you define (price, stock, margin %, rule thresholds, counts of runs/orders).
- The customer experience must NEVER show purchase cost or margin. Only the merchant experience may.
- Money is stored as integer cents in data and formatted only at display time.

CODE STRUCTURE (required, so we can connect a real backend afterwards)
- Split the single App file into components: src/components/{shared,store,bundle,ops,owner}/*.tsx.
- Move ALL demo data out of JSX into one typed module src/data/demo.ts. Components receive data and callbacks
  through props; no data literals inside components.
- Define these named types in src/types.ts (use named types, not inline object type literals):
  PublicProduct = { id: string; name: string; category: string; priceCents: number; stock: number; compatibleWith: string[]; isSynthetic: boolean }
  RunStatus = "running" | "needs_input" | "awaiting_approval" | "rejected_by_policy" | "approved" | "executed" | "rejected" | "failed"
  RunEvent = { step: string; status: "started" | "ok" | "failed"; message: string; at: string }
  BundleItem = { productId: string; qty: number }
  Proposal = { items: BundleItem[]; discountPct: number; explanation: string }
  RuleCheck = { rule: string; passed: boolean; detail: string }
  Rules = { minMarginPct: number; maxDiscountPct: number }
- Every action is a callback prop (onSubmitRequest, onApprove, onReject, onRetry, onAddToCart, onCompare ...).
- Every screen must implement loading, empty, error and "no stock" states.
- No localStorage/sessionStorage, no server-only code, no new heavy dependencies.

QUALITY BAR
- Responsive: works at 375px width and desktop. Touch targets at least 44px.
- Accessible: visible focus, contrast AA, labels for icon buttons, respect prefers-reduced-motion.
- Motion is purposeful (state changes, workflow progress, panel transitions), never decorative loops.
- Visual direction: dynamic premium with controlled futuristic influence. Customer side light, clean, premium.
  Merchant side dark or neutral, operational and calm. Same typography, spacing, radii and component
  language across both so they feel like one product.
Reply only with "Understood" and wait for the next prompt.
```

## Prompt 1: structure and domain (no visual redesign yet)

```
Do the restructuring now without changing how the screens look more than necessary:
1. Split the App file into the component folders described above.
2. Create src/types.ts and src/data/demo.ts with about 30 fictional electronics products across the 15 categories
   (prices 500 to 250000 cents, stock between 0 and 40, a few out of stock, accessories listing compatibleWith ids),
   two example runs, and the default rules { minMarginPct: 20, maxDiscountPct: 15 }.
3. Replace all guitar/amp content with electronics. Keep the four views working with the same navigation.
4. Add a shared StatusBadge component that renders every RunStatus in a distinct, accessible style.
Do not add new features yet.
```

## Prompt 2: customer experience (AI shopping assistant)

```
Redesign the customer store (view "store") and the bundle view as an AI shopping assistant, light and premium:
- Hero with one large goal-first input ("What do you need? Budget? What will you use it for?") plus 3 example chips.
- Assistant panel states: idle, thinking (with 3 to 4 plain step labels, no fake percentages), clarification question
  (one short question with quick-reply chips), results, provider failure (friendly message + Retry), nothing found.
- Result cards: image placeholder, name, price, stock status, "Why this" line, compatibility chips
  ("Confirmed compatible" / "Not confirmed"; never claim compatibility the data does not state).
- Comparison view for 2 to 4 products: side-by-side specs from the data, price difference, short trade-off summary.
- Bundle card: items, "Bought separately" vs "Bundle price" with discount %, an explanation, Add bundle to cart.
- Out-of-stock handling: show in-stock alternatives instead of a dead end.
- Cart drawer stays; show line items, totals, and a clear note that checkout is a demo.
Keep it fast to scan on a 375px screen.
```

## Prompt 3: merchant workspace (commercial operations copilot)

```
Redesign the ops and owner views as one dark, calm merchant workspace with a left nav: Overview, Inventory, Copilot,
Approvals, Rules, Activity.
- Overview: counts only from data (runs by status, orders, low-stock products). No forecasts or growth claims.
- Inventory: table with stock, price, cost and margin %, low-stock highlight, filter by category.
- Copilot ("Inventory-to-Bundle"): a request box, then a live workflow timeline fed by RunEvent[] (started, ok, failed),
  then the proposal card: items, discount %, explanation, and the RuleCheck list (margin >= min, discount <= max,
  stock, compatibility) with clear pass/fail.
- Approvals: proposals in status awaiting_approval with Approve / Reject (note field, max 500 chars). Also design the
  states executed, rejected, rejected_by_policy (approve button disabled with the reason), failed (Retry) and
  "already decided" (read-only).
- Rules: edit minMarginPct (0 to 95) and maxDiscountPct (0 to 90) with validation and a confirmation step.
- Activity: audit list, newest first.
Everything is driven by props and callbacks; show the Synthetic demo data badge.
```

## Prompt 4: motion, depth and polish

```
Add purposeful motion and polish without hurting performance or accessibility:
- Micro-interactions on buttons, cards, chips and toggles; smooth page and panel transitions.
- Workflow timeline animates only when a new RunEvent arrives (no looping fake progress).
- Product cards get subtle layered depth; the storefront hero may include ONE lightweight 3D or parallax product
  visual. Provide a static fallback and disable it under prefers-reduced-motion.
- Skeleton loaders for loading states.
- Final pass: spacing, typography scale, contrast, 375px layout, and consistent component naming.
Do not change data types or props.
```

---

## Round 2: small, specific fixes (paste one at a time, in this order)

### R2-1 Text size and rhythm
```
Fix readability everywhere. No text smaller than 12px, body text 14 to 16px, small labels (including monospace uppercase labels
and status badges) 12px with letter-spacing no wider than 0.06em. Status badges must never stretch to the height of their row.
Keep the layout otherwise unchanged and check 375px and 1440px widths.
```

### R2-2 Product visuals that are not repetitive
```
The shop grid shows 47 near-identical placeholder shapes. Create a small set of distinct, simple vector illustrations,
one per category (phone, laptop, case, screen protector, charger, cable, power bank, headphones, mouse, keyboard, dock/hub,
sleeve, stand, webcam, watch), drawn in the existing green, lime and orange palette. Vary color and size per product using
data (not randomness). Keep it light: inline SVG, no images, no new dependencies. Product cards should look intentional, with
name, price and stock status clearly readable.
```

### R2-3 Assistant states (clearly labeled mock)
```
Make the assistant demo react to what the user types, using a small deterministic function in src/data (no real AI):
- A request with a budget or a clear product type returns results from the demo catalog, filtered by that budget.
- A vague request (for example "something good") shows ONE clarification question with 2 to 3 quick-reply chips.
- A request with no matching product shows a "nothing found" state with in-stock alternatives.
- Add a small "Simulate provider failure" toggle in a footer note that shows a friendly error with a Retry button.
Keep the "Synthetic demo data" badge and never claim compatibility the data does not state.
```

### R2-4 Merchant workspace fully dark
```
Make the whole merchant workspace (Overview, Inventory, Copilot, Approvals, Rules, Activity) dark or neutral-dark, not only the
sidebar: dark page background, slightly lighter cards, high-contrast text (AA), clear pass/fail colors for rule checks.
The customer storefront stays light. Use the same fonts, radii and spacing so both feel like one product.
```

### R2-5 Motion and polish
```
Add purposeful motion: hover and press feedback on buttons, cards and chips; a smooth panel transition when switching views;
the workflow timeline animates only when a new step appears; skeleton loaders for loading states. Respect prefers-reduced-motion.
Do not change data types or props.
```
