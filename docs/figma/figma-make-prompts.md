# Figma Make prompt (new project)

**Decision (2026-11-21): start a NEW Figma Make project.** The 2026-11-19 export (abstract placeholder shapes, tool-like look,
tiny text) was rejected, and the earlier editorial, photography-led storefront felt more like a real shop. The old project and its
export stay in git history. Do not continue the old Figma project and do not paste the old Prompts 0 to 4 or Round 2.

How to use:
1. Create a new Figma Make project.
2. Attach 1 or 2 screenshots of the earlier storefront (the full-bleed hero with the large headline) as the visual reference.
3. Paste the prompt below once and let it build everything in one pass.
4. Then ask for ONE change at a time (for example "make the hero photo larger", "darken the merchant sidebar"), checking the preview after each.
5. Export, then follow the re-export checklist in `docs/figma-integration.md`.

```
Build "Aperture", a premium consumer-electronics store with an AI shopping assistant, plus a merchant workspace. Build everything in
one pass and do not ask me questions; make reasonable choices.

DESIGN DIRECTION (the most important part)
- Editorial and photography-led, like a high-end lifestyle electronics retailer. Not a dashboard look, not a template look.
- Full-bleed hero with a real photograph (desk setup, headphones, laptop, phone in a lifestyle scene), a very large confident
  headline with one italic serif accent word, generous whitespace.
- Palette: warm off-white (#f5f3ee), near-black (#141917), ONE accent (burnt orange #e45e37). Dark, calm merchant area.
- Typography: a refined sans (Manrope or Inter) plus an italic serif only for accent words. Body text 15 to 16px, small labels
  never below 12px.
- EVERY product shows a real photo (use Unsplash image URLs; keep the url in the data). No abstract placeholder shapes or glyphs.
- Product cards: photo, name, price, stock status, quiet hover motion. Rounded corners (12 to 16px), soft shadows.
- Purposeful motion only (hover, panel and view transitions, timeline steps appearing). Respect prefers-reduced-motion.
- Works at 375px and 1440px. Visible focus states, AA contrast.

CUSTOMER EXPERIENCE (light)
1. Home: hero, an AI assistant bar ("Tell me what you need. Budget? What will you use it for?") with 3 example chips, featured
   categories with photos, a "Complete your setup" bundle section.
2. Shop: category browse with filters, product detail (photo gallery, specs table, compatible accessories, in-stock alternatives).
3. Assistant panel (chat style) driven by a small deterministic mock function in src/data, clearly labeled "Simulated demo AI":
   - clear request with budget or product type -> result cards filtered by that budget;
   - vague request -> ONE clarification question with 2 to 3 quick-reply chips;
   - nothing matches -> "nothing found" plus in-stock alternatives;
   - a "Simulate provider failure" toggle -> friendly error with Retry.
4. Compare: 2 to 4 products side by side, price difference, short trade-off summary.
5. Bundle: items, "bought separately" vs "bundle price" with discount %, explanation, Add to cart. Never claim compatibility
   the data does not state ("Confirmed compatible" vs "Not confirmed").
6. Cart drawer with a clear note that checkout is a demo.
The customer side must NEVER show purchase cost or margin.

MERCHANT WORKSPACE (dark, behind a demo sign-in)
Left nav: Overview, Inventory, Copilot, Approvals, Rules, Activity.
- Overview: counts only from the data (runs by status, orders, low-stock products). No forecasts, no growth claims.
- Inventory: table with stock, price, cost and margin %, low-stock highlight, filter by category.
- Copilot ("Inventory-to-Bundle"): request box, workflow timeline of steps, then a proposal card with items, discount % and
  explanation, plus rule checks (margin >= min, discount <= max, stock, compatibility) shown as clear pass or fail.
- Approvals: Approve / Reject with a note (max 500 characters). Design every state: awaiting approval, executed, rejected,
  rejected by policy (approve disabled, reason shown), failed (Retry), needs input, already decided.
- Rules: edit minMarginPct (0 to 95) and maxDiscountPct (0 to 90) with validation and a confirmation step.
- Activity: audit list, newest first.

DATA AND CATALOG
About 36 fictional products across: Phones, Laptops, Cases, Screen protectors, Chargers, Cables, Power banks, Audio, Mice,
Keyboards, Docks and hubs, Laptop sleeves, Stands, Webcams, Wearables. Prices 500 to 250000 cents, stock 0 to 40 (a few at 0),
accessories list compatibleWith product ids. Default rules { minMarginPct: 20, maxDiscountPct: 15 }.
Show a small "Synthetic demo data" badge in both areas. Money is stored as integer cents and formatted only for display.

CODE STRUCTURE (needed so a real backend can be connected afterwards)
- React + TypeScript. Components in src/components/{shared,store,bundle,ops,owner}; no screen in one giant file.
- ALL demo data in src/data/demo.ts; components get data and callbacks via props (onSubmitRequest, onApprove, onReject, onRetry,
  onAddToCart, onCompare). No data literals inside components. Include loading, empty and error states on every screen.
- src/types.ts with NAMED, MULTI-LINE types (never one-line object types):
  PublicProduct { id, name, category, priceCents, stock, compatibleWith: string[], imageUrl, isSynthetic }
  RunStatus = "running" | "needs_input" | "awaiting_approval" | "rejected_by_policy" | "approved" | "executed" | "rejected" | "failed"
  RunEvent { step, status: "started" | "ok" | "failed", message, at }
  BundleItem { productId, qty }; Proposal { items, discountPct, explanation }
  RuleCheck { rule, passed, detail }; Rules { minMarginPct, maxDiscountPct }
- No localStorage or sessionStorage, no server-only code, no heavy new dependencies.
```
